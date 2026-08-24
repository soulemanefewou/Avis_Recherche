# ============================================================
# Déploiement automatisé du BACKEND sur Render (API v1)
#
# Usage :
#   .\scripts\deploy-backend.ps1 -RenderApiKey "rnd_xxx" `
#       -DatabaseUrl "postgresql://user:pass@host/db?sslmode=require" `
#       [-AdminEmail "admin@avis.cm"] [-AdminPassword "..."]
#
# Lit les secrets LOCAUX (clés JWT, Firebase, passphrase) et crée
# le web service Docker avec toutes les variables d'environnement.
# ============================================================
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$RenderApiKey,
    [Parameter(Mandatory = $true)][string]$DatabaseUrl,
    [string]$RepoUrl = "https://github.com/soulemanefewou/Avis_Recherche",
    [string]$Branch = "main",
    [string]$ServiceName = "avis-recherche-api",
    [ValidateSet("oregon", "ohio", "virginia", "frankfurt", "singapore")]
    [string]$Region = "frankfurt",
    # Optionnel : crée le compte Fondateur après le déploiement (One-Off Job)
    [string]$AdminEmail,
    [string]$AdminPassword,
    [string]$AdminNom = "Fondateur",
    [string]$AdminPrenom = "Avis",
    [string]$AdminTelephone = "+237600000000",
    # Force la creation/sync du schema au demarrage du conteneur (plans gratuits :
    # ni jobs one-off ni preDeploy). A re-passer a false (ou omettre) apres usage.
    [switch]$BootstrapSchema
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent
$BackendDir = Join-Path $ProjectRoot "backend"

function Invoke-Render {
    param([string]$Method, [string]$Uri, $Body)
    $headers = @{ Authorization = "Bearer $RenderApiKey"; Accept = "application/json" }
    $params = @{ Method = $Method; Uri = $Uri; Headers = $headers; ContentType = "application/json"; ErrorAction = "Stop" }
    if ($Body) {
        $json = $Body | ConvertTo-Json -Depth 6
        $params.Body = $json
        $dump = Join-Path ([IO.Path]::GetTempPath()) "opencode\render-last-body.json"
        [IO.File]::WriteAllText($dump, $json)
    }
    try { Invoke-RestMethod @params }
    catch {
        $detail = $_.ErrorDetails.Message
        if (-not $detail -and $_.Exception.Response) {
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                if ($stream.CanSeek) { $stream.Position = 0 }
                $reader = New-Object IO.StreamReader($stream)
                $detail = $reader.ReadToEnd()
            } catch {}
        }
        throw "Appel Render $Method $Uri a echoue : $($_.Exception.Message)`n$detail"
    }
}

function Read-DotEnvValue {
    param([string]$File, [string]$Key)
    $line = Select-String -Path $File -Pattern ("^" + [regex]::Escape($Key) + "=(.*)$") | Select-Object -First 1
    if ($line) { return $line.Matches[0].Groups[1].Value.Trim() }
    return $null
}

# ---------- 1. Verifications locales ----------
foreach ($f in @("config\jwt\private.pem", "config\jwt\public.pem")) {
    if (-not (Test-Path (Join-Path $BackendDir $f))) { throw "Fichier manquant : backend\$f" }
}
$firebaseJson = Get-ChildItem (Join-Path $BackendDir "var\secrets") -Filter "*.json" -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $firebaseJson) { throw "Credentials Firebase introuvables dans backend\var\secrets\" }

$jwtPassphrase = Read-DotEnvValue -File (Join-Path $BackendDir ".env") -Key "JWT_PASSPHRASE"
if (-not $jwtPassphrase) { throw "JWT_PASSPHRASE introuvable dans backend\.env" }

# ---------- 2. Normalisation de l'URL de la base ----------
$dbUrl = $DatabaseUrl.Trim()
if ($dbUrl.StartsWith("postgres://")) { $dbUrl = "postgresql://" + $dbUrl.Substring("postgres://".Length) }
$dbUrl = $dbUrl -replace "&?channel_binding=\w+", ""
if ($dbUrl.StartsWith("postgresql://")) {
    if ($dbUrl -notmatch "\?") { $dbUrl += "?" }
    elseif ($dbUrl -notmatch "\?$") { $dbUrl += "&" }
    if ($dbUrl -notmatch "sslmode=") { $dbUrl += "sslmode=require&" }
    if ($dbUrl -notmatch "serverVersion=") { $dbUrl += "serverVersion=16&" }
    $dbUrl = $dbUrl.TrimEnd("&")
}

# ---------- 3. Secrets ----------
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$bytes = New-Object byte[] 32; $rng.GetBytes($bytes)
$appSecret = [BitConverter]::ToString($bytes).Replace("-", "").ToLower()

$envVars = @(
    @{ key = "DATABASE_URL"; value = $dbUrl },
    @{ key = "APP_ENV"; value = "prod" },
    @{ key = "APP_DEBUG"; value = "0" },
    @{ key = "APP_SECRET"; value = $appSecret },
    @{ key = "TRUSTED_PROXIES"; value = "*" },
    @{ key = "JWT_PASSPHRASE"; value = $jwtPassphrase },
    @{ key = "JWT_SECRET_KEY_B64"; value = [Convert]::ToBase64String([IO.File]::ReadAllBytes((Join-Path $BackendDir "config\jwt\private.pem"))) },
    @{ key = "JWT_PUBLIC_KEY_B64"; value = [Convert]::ToBase64String([IO.File]::ReadAllBytes((Join-Path $BackendDir "config\jwt\public.pem"))) },
    @{ key = "FIREBASE_CREDENTIALS_JSON_B64"; value = [Convert]::ToBase64String([IO.File]::ReadAllBytes($firebaseJson.FullName)) }
)
foreach ($k in @("FIREBASE_PROJECT_ID", "FIREBASE_API_KEY", "FIREBASE_AUTH_DOMAIN", "FIREBASE_STORAGE_BUCKET", "FIREBASE_MESSAGING_SENDER_ID", "FIREBASE_APP_ID")) {
    $v = Read-DotEnvValue -File (Join-Path $BackendDir ".env") -Key $k
    if ($v) { $envVars += @{ key = $k; value = $v } }
}

# Bootstrap (plan gratuit) : schema + compte Fondateur au demarrage du conteneur.
if ($BootstrapSchema) { $envVars += @{ key = "BOOTSTRAP_SCHEMA"; value = "1" } }
if ($AdminEmail -and $AdminPassword) {
    $envVars += @(
        @{ key = "ADMIN_EMAIL"; value = $AdminEmail },
        @{ key = "ADMIN_PASSWORD"; value = $AdminPassword },
        @{ key = "ADMIN_NOM"; value = $AdminNom },
        @{ key = "ADMIN_PRENOM"; value = $AdminPrenom },
        @{ key = "ADMIN_TELEPHONE"; value = $AdminTelephone }
    )
}

function Invoke-JobAndWait {
    param([string]$ServiceId, [string]$Command, [string]$Label)
    $job = Invoke-Render -Method POST -Uri "https://api.render.com/v1/services/$ServiceId/jobs" -Body @{ startCommand = $Command }
    if (-not $job.id) { throw "Reponse inattendue a la creation du job : $($job | ConvertTo-Json -Depth 3)" }
    Write-Host ">> Job '$Label' lance ($($job.id))"
    $deadline = (Get-Date).AddMinutes(10)
    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Seconds 15
        $j = Invoke-Render -Method GET -Uri "https://api.render.com/v1/services/$ServiceId/jobs/$($job.id)"
        if ($j.job) { $j = $j.job }
        Write-Host ("   [{0}] {1} : {2}" -f (Get-Date -Format HH:mm:ss), $Label, $j.status)
        if ($j.status -in @("succeeded")) { return }
        if ($j.status -in @("failed", "canceled")) { throw "Job '$Label' echoue ($($j.status)). Logs : dashboard Render > Jobs." }
    }
    throw "Timeout du job '$Label'."
}

# ---------- 4. Workspace Render ----------
$ownersResp = Invoke-Render -Method GET -Uri "https://api.render.com/v1/owners"
if ($ownersResp.owner) { $owner = $ownersResp.owner } else { $owner = @($ownersResp)[0] }
if (-not $owner -or -not $owner.id) { throw "Impossible de determiner l'identifiant workspace Render." }
$ownerId = $owner.id
Write-Host ">> Workspace Render : $($owner.name) ($ownerId)"

# ---------- 5. Creation / mise a jour du service ----------
# Schema actuel de l'API : autoDeploy="yes"/"no", details dans serviceDetails,
# plan par defaut "starter" -> on force "free".
# NOTE : preDeployCommand et healthCheckPath ne sont PAS supportes sur le plan
# gratuit -> le schema est cree apres le depot via un job one-off (section 7).
$serviceDetails = @{
    runtime = "docker"
    plan    = "free"
    region  = $Region
}

$existing = Invoke-Render -Method GET -Uri "https://api.render.com/v1/services?limit=100"
$service = @($existing) | ForEach-Object { if ($_.service) { $_.service } else { $_ } } | Where-Object { $_.name -eq $ServiceName } | Select-Object -First 1

if ($service) {
    Write-Host ">> Le service '$ServiceName' existe deja -> mise a jour des variables..."
    $body = @{
        autoDeploy     = "yes"
        branch         = $Branch
        rootDir        = "backend"
        serviceDetails = $serviceDetails
    }
    $null = Invoke-Render -Method PATCH -Uri "https://api.render.com/v1/services/$($service.id)" -Body $body
    # NB : PATCH /services/{id} ignore les envVars -> endpoint dedie obligatoire.
    $null = Invoke-Render -Method PUT -Uri "https://api.render.com/v1/services/$($service.id)/env-vars" -Body $envVars
    $serviceId = $service.id
    Write-Host ">> Declenchement d'un nouveau deploiement..."
    $null = Invoke-Render -Method POST -Uri "https://api.render.com/v1/services/$serviceId/deploys" -Body @{}
} else {
    Write-Host ">> Creation du service '$ServiceName'..."
    $body = @{
        type           = "web_service"
        name           = $ServiceName
        ownerId        = $ownerId
        repo           = $RepoUrl
        branch         = $Branch
        rootDir        = "backend"
        autoDeploy     = "yes"
        envVars        = $envVars
        serviceDetails = $serviceDetails
    }
    $resp = Invoke-Render -Method POST -Uri "https://api.render.com/v1/services" -Body $body
    if ($resp.service -and $resp.service.id) { $serviceId = $resp.service.id }
    elseif ($resp.id) { $serviceId = $resp.id }
    else { throw "Creation OK mais identifiant introuvable dans la reponse." }
}
Write-Host ">> Service ID : $serviceId"

# ---------- 6. Attente du deploiement ----------
Write-Host ">> Deploiement en cours (premier build Docker : 10-20 min)..."
$deadline = (Get-Date).AddMinutes(30)
$status = $null
while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 20
    $deploys = Invoke-Render -Method GET -Uri "https://api.render.com/v1/services/$serviceId/deploys?limit=1"
    $d = @($deploys)[0]
    if ($d -and $d.deploy) { $d = $d.deploy }
    $status = $d.status
    Write-Host ("   [{0}] statut = {1}" -f (Get-Date -Format HH:mm:ss), $status)
    if ($status -in @("live", "deactivated")) { break }
    if ($status -in @("build_failed", "canceled", "pre_deploy_failed", "deploy_failed")) { throw "Deploiement echoue (statut: $status). Consultez les logs sur le dashboard Render." }
}
if ($status -ne "live") { throw "Timeout : le deploiement n'est pas passe en 'live'." }

# ---------- 7. URL finale ----------
# NOTE : les jobs one-off Render exigent un plan payant. Le schema et le compte
# Fondateur sont donc crees au demarrage du conteneur via start.sh
# (variables BOOTSTRAP_SCHEMA / ADMIN_* - voir sections 3bis et DEPLOYMENT.md).
$svc = Invoke-Render -Method GET -Uri "https://api.render.com/v1/services/$serviceId"
$apiUrl = $svc.serviceDetails.url
if (-not $apiUrl) { $apiUrl = "https://$ServiceName.onrender.com" }

Write-Host ""
Write-Host "=============================================="
Write-Host " BACKEND DISPONIBLE : $apiUrl"
Write-Host " Health check       : $apiUrl/api/regions"
Write-Host "=============================================="