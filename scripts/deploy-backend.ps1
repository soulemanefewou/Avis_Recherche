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
    [string]$AdminTelephone = "+237600000000"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent
$BackendDir = Join-Path $ProjectRoot "backend"

function Invoke-Render {
    param([string]$Method, [string]$Uri, $Body)
    $headers = @{ Authorization = "Bearer $RenderApiKey"; Accept = "application/json" }
    $params = @{ Method = $Method; Uri = $Uri; Headers = $headers; ContentType = "application/json"; ErrorAction = "Stop" }
    if ($Body) { $params.Body = ($Body | ConvertTo-Json -Depth 6) }
    try { Invoke-RestMethod @params }
    catch {
        $detail = ""
        if ($_.Exception.Response) {
            try {
                $reader = New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())
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
if ($dbUrl.StartsWith("postgresql://") -and $dbUrl -notmatch "\?") { $dbUrl += "?sslmode=require" }

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

# ---------- 4. Workspace Render ----------
$owners = Invoke-Render -Method GET -Uri "https://api.render.com/v1/owners"
$ownerId = $owners[0].id
Write-Host ">> Workspace Render : $($owners[0].name) ($ownerId)"

# ---------- 5. Creation du service ----------
$existing = Invoke-Render -Method GET -Uri "https://api.render.com/v1/services?limit=100"
$service = $existing | Where-Object { $_.name -eq $ServiceName } | Select-Object -First 1

if ($service) {
    Write-Host ">> Le service '$ServiceName' existe deja (mise a jour des variables)..."
    $body = @{
        autoDeploy        = $true
        branch            = $Branch
        rootDir           = "backend"
        runtime           = "docker"
        plan              = "free"
        region            = $Region
        healthCheckPath   = "/api/regions"
        preDeployCommand  = "php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration"
        envVars           = $envVars
    }
    $service = Invoke-Render -Method PATCH -Uri "https://api.render.com/v1/services/$($service.id)" -Body $body
} else {
    Write-Host ">> Creation du service '$ServiceName'..."
    $body = @{
        autoDeploy        = $true
        branch            = $Branch
        name              = $ServiceName
        ownerId           = $ownerId
        repo              = $RepoUrl
        rootDir           = "backend"
        runtime           = "docker"
        plan              = "free"
        region            = $Region
        healthCheckPath   = "/api/regions"
        preDeployCommand  = "php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration"
        envVars           = $envVars
    }
    $service = Invoke-Render -Method POST -Uri "https://api.render.com/v1/services" -Body $body
}
$serviceId = $service.id
Write-Host ">> Service ID : $serviceId"

# ---------- 6. Attente du deploiement ----------
Write-Host ">> Deploiement en cours (premier build Docker : 10-20 min)..."
$deadline = (Get-Date).AddMinutes(30)
$status = $null
while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 20
    $deploys = Invoke-Render -Method GET -Uri "https://api.render.com/v1/services/$serviceId/deploys?limit=1"
    $status = $deploys[0].status
    Write-Host ("   [{0}] statut = {1}" -f (Get-Date -Format HH:mm:ss), $status)
    if ($status -in @("live", "deactivated")) { break }
    if ($status -in @("build_failed", "canceled")) { throw "Deploiement echoue (statut: $status). Consultez les logs sur le dashboard Render." }
}
if ($status -ne "live") { throw "Timeout : le deploiement n'est pas passe en 'live'." }

# ---------- 7. URL finale ----------
$svc = Invoke-Render -Method GET -Uri "https://api.render.com/v1/services/$serviceId"
$apiUrl = $svc.serviceDetails.url
if (-not $apiUrl) { $apiUrl = "https://$ServiceName.onrender.com" }

# ---------- 8. Compte Fondateur (optionnel) ----------
if ($AdminEmail -and $AdminPassword) {
    Write-Host ">> Creation du compte Fondateur (job one-off)..."
    $cmd = "php bin/console app:create-admin FONDATEUR $AdminEmail '$AdminNom' '$AdminPrenom' '$AdminTelephone' '$AdminPassword'"
    $null = Invoke-Render -Method POST -Uri "https://api.render.com/v1/services/$serviceId/jobs" -Body @{ command = $cmd }
    Write-Host ">> Job lance - verifiez l'onglet Jobs du dashboard Render."
}

Write-Host ""
Write-Host "=============================================="
Write-Host " BACKEND DISPONIBLE : $apiUrl"
Write-Host " Health check       : $apiUrl/api/regions"
Write-Host "=============================================="