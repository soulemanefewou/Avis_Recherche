# ============================================================
# Deploiement automatisé du FRONTEND sur Vercel (CLI)
#
# Usage :
#   .\scripts\deploy-frontend.ps1 -VercelToken "xxx" `
#       -ApiBaseUrl "https://avis-recherche-api.onrender.com"
#
# Lit la config Firebase depuis frontend\.env.local, configure
# les variables d'environnement puis deploie en production.
# ============================================================
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$VercelToken,
    [Parameter(Mandatory = $true)][string]$ApiBaseUrl,
    [string]$ProjectName = "avis-recherche",
    [string]$FrontendDir = ""
)

$ErrorActionPreference = "Stop"

if (-not $FrontendDir) {
    # $PSScriptRoot est vide dans les valeurs par defaut de param() sous PS 5.1
    $FrontendDir = Join-Path (Split-Path $PSScriptRoot -Parent) "frontend"
}

if (-not (Test-Path (Join-Path $FrontendDir ".env.local"))) {
    throw "frontend\.env.local introuvable (config Firebase necessaire)"
}

# URL sans slash final
$api = $ApiBaseUrl.TrimEnd("/")

function Invoke-Vercel {
    param([string[]]$ArgumentList, [string]$Stdin)
    Push-Location $FrontendDir
    try {
        # Passage par cmd /c : sous PS 5.1, 2>&1 sur un natif transforme
        # stderr en erreurs fatales quand ErrorActionPreference = Stop.
        $cmdLine = "npx.cmd vercel " + (($ArgumentList | ForEach-Object { '"' + $_ + '"' }) -join " ") + " --token $VercelToken 2>&1"
        if ($PSBoundParameters.ContainsKey("Stdin")) {
            return ($Stdin | cmd /c $cmdLine | Out-String)
        }
        return (cmd /c $cmdLine | Out-String)
    } finally { Pop-Location }
}

# ---------- 1. Creation / liaison du projet ----------
Write-Host ">> Creation/liaison du projet '$ProjectName'..."
try {
    $null = Invoke-Vercel -ArgumentList @("project", "add", $ProjectName) 
} catch {}
$out = Invoke-Vercel -ArgumentList @("link", "--yes", "--project", $ProjectName)
if ($out -match "error|Error") { throw "Echec du link Vercel :`n$out" }

# ---------- 2. Variables d'environnement ----------
# API_PROXY_TARGET : cible du proxy Next.js (/api, /uploads -> Render)
$vars = [ordered]@{
    "API_PROXY_TARGET"     = $api
}
# Toutes les variables NEXT_PUBLIC_* de .env.local (Firebase, etc.)
# sauf NEXT_PUBLIC_API_URL qui est recalculee ci-dessous
Get-Content (Join-Path $FrontendDir ".env.local") | ForEach-Object {
    if ($_ -match "^NEXT_PUBLIC_[A-Z_]+=(.*)$") {
        $k = ($_ -split "=", 2)[0].Trim()
        $v = ($_ -split "=", 2)[1].Trim()
        if ($v -and $k -ne "NEXT_PUBLIC_API_URL") { $vars[$k] = $v }
    }
}

Write-Host ">> Configuration des variables d'environnement..."
foreach ($key in $vars.Keys) {
    foreach ($envName in @("production")) {
        try {
            $null = Invoke-Vercel -ArgumentList @("env", "rm", $key, $envName, "--yes")
        } catch {}
        $null = Invoke-Vercel -ArgumentList @("env", "add", $key, $envName) -Stdin $vars[$key]
        Write-Host ("   + {0} ({1})" -f $key, $envName)
    }
}

# NEXT_PUBLIC_API_URL : utilisee par le composant serveur OG (fetch direct Render)
try { $null = Invoke-Vercel -ArgumentList @("env", "rm", "NEXT_PUBLIC_API_URL", "production", "--yes") } catch {}
$null = Invoke-Vercel -ArgumentList @("env", "add", "NEXT_PUBLIC_API_URL", "production") -Stdin $api
Write-Host ("   + NEXT_PUBLIC_API_URL = {0}" -f $api)

# ---------- 3. Deploiement production ----------
Write-Host ">> Build et deploiement production (5-10 min)..."
$out = Invoke-Vercel -ArgumentList @("deploy", "--prod", "--yes")
# On ne garde que les URLs *.vercel.app (la sortie inclut un bloc JSON)
$url = @([regex]::Matches($out, "https://[A-Za-z0-9.\-]+\.vercel\.app")).Value | Select-Object -Last 1
if (-not $url) { throw "Deploiement sans URL retournee. Sortie :`n$out" }

Write-Host ""
Write-Host "=============================================="
Write-Host " FRONTEND DISPONIBLE : $url"
Write-Host " API proxifiee       : $url/api -> $api"
Write-Host "=============================================="