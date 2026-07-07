# Registra los 4 plugins del ejemplo en la plataforma local (Windows / PowerShell).
# Requiere un bearer token de un usuario con rol PLATFORM_ADMIN o INTEGRATION_ADMIN.
#
# Uso:
#   .\install\register.ps1 -Token "<JWT>" [-Platform "http://localhost:8080"]
param(
  [Parameter(Mandatory = $true)][string]$Token,
  [string]$Platform = "http://localhost:8080"
)

$ErrorActionPreference = "Stop"
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$headers = @{ Authorization = "Bearer $Token"; "Content-Type" = "application/json" }

Write-Host "== Backends gRPC (POST $Platform/api/plugins/install) =="
foreach ($f in @("backend-java", "backend-node", "backend-python")) {
  Write-Host "-- $f"
  $body = Get-Content -Raw -Path (Join-Path $dir "$f.json")
  Invoke-RestMethod -Method Post -Uri "$Platform/api/plugins/install" -Headers $headers -Body $body | Out-Null
  Write-Host "   OK"
}

Write-Host "== Front widget (POST $Platform/api/plugins/ui-catalog) =="
# Firma el remoteEntry.json y pega integrity+signature reales en frontend-widget/manifest.json
# ANTES de esto (ver README). La clave publica debe estar en APP_PLUGIN_REMOTE_TRUSTED_KEYS.
$manifest = Get-Content -Raw -Path (Join-Path $dir "..\frontend-widget\manifest.json")
Invoke-RestMethod -Method Post -Uri "$Platform/api/plugins/ui-catalog" -Headers $headers -Body $manifest | Out-Null
Write-Host "   OK"

Write-Host "== Diagnostico (GET $Platform/api/plugins) =="
Invoke-RestMethod -Method Get -Uri "$Platform/api/plugins" -Headers $headers | ConvertTo-Json -Depth 4
Write-Host "Listo. DEMO_TRANSFORM_JAVA/NODE/PY quedan disponibles en el catalogo."
