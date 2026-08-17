# =====================================================================================
# Lanzador de setup-oidc.sh desde Windows.
#
#   powershell -ExecutionPolicy Bypass -File int\openbao\setup-oidc.ps1
#
# Existe por dos motivos concretos, los dos aprendidos a golpes en este entorno:
#
# 1. EL TOKEN RAIZ NO DEBE QUEDAR EN EL HISTORIAL. Escribirlo en la linea de comandos lo deja en el
#    historial del shell y, si se pasa como `-e VAR=valor`, tambien en `docker inspect`. Aqui se pide
#    con Read-Host -AsSecureString (no se ve al teclear), se pasa por el ENTORNO del proceso y se
#    borra al terminar.
#
# 2. LAS RUTAS. En Git Bash, `docker exec ... /openbao/setup/...` se convierte sola en una ruta de
#    Windows y falla con "can't open 'C:/Program Files/Git/openbao/...'". En cmd.exe, los `<` y `>`
#    de un marcador de posicion se interpretan como redireccion. PowerShell no sufre ninguna de las
#    dos, y ademas puede leer int/.env para no tener que copiar el secreto a mano.
# =====================================================================================
$ErrorActionPreference = 'Stop'

$raiz = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)   # .../dist/onprem
$envFile = Join-Path $raiz 'int\.env'

if (-not (Test-Path $envFile)) {
    throw "No encuentro $envFile. Ejecutar desde el paquete de deploy (dist/onprem)."
}

# Lee una clave de int/.env. El fichero no se versiona: es donde viven los valores reales.
function Get-EnvValor([string]$clave) {
    $linea = Select-String -Path $envFile -Pattern "^$clave=" | Select-Object -First 1
    if ($null -eq $linea) { return $null }
    return $linea.Line.Substring($clave.Length + 1).Trim()
}

$publicBaseUrl = Get-EnvValor 'PUBLIC_BASE_URL'
$clientSecret  = Get-EnvValor 'OPENBAO_OIDC_CLIENT_SECRET'

if ([string]::IsNullOrWhiteSpace($publicBaseUrl)) { throw "Falta PUBLIC_BASE_URL en int\.env." }
if ([string]::IsNullOrWhiteSpace($clientSecret)) {
    throw "Falta OPENBAO_OIDC_CLIENT_SECRET en int\.env. Es el MISMO valor que recibio Keycloak; generar uno con: openssl rand -hex 32"
}

Write-Host "OpenBao SSO -> $publicBaseUrl" -ForegroundColor Cyan
Write-Host "El token raiz es el de 'bao operator init'. No se muestra al teclear ni queda en el historial."

$tokenSeguro = Read-Host -Prompt 'Token raiz de OpenBao' -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($tokenSeguro)
try {
    $token = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}
if ([string]::IsNullOrWhiteSpace($token)) { throw "Token vacio." }

# `-e VAR` sin `=valor` toma el valor del entorno de ESTE proceso: no viaja en la linea de comandos.
$env:BAO_TOKEN = $token
$env:PUBLIC_BASE_URL = $publicBaseUrl
$env:OPENBAO_OIDC_CLIENT_SECRET = $clientSecret
try {
    docker exec -e BAO_TOKEN -e PUBLIC_BASE_URL -e OPENBAO_OIDC_CLIENT_SECRET `
        ih-int-openbao sh /openbao/setup/setup-oidc.sh
    $codigo = $LASTEXITCODE
} finally {
    # Que no sobrevivan a la sesion ni acaben en un volcado de entorno.
    Remove-Item Env:BAO_TOKEN -ErrorAction SilentlyContinue
    Remove-Item Env:OPENBAO_OIDC_CLIENT_SECRET -ErrorAction SilentlyContinue
    $token = $null
}

if ($codigo -ne 0) {
    throw "setup-oidc.sh fallo con codigo $codigo. El mensaje de arriba dice la causa."
}
