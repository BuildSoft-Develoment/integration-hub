$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

function Write-Banner([string]$Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Find-CommandPath([string[]]$Candidates) {
  foreach ($Candidate in $Candidates) {
    $Command = Get-Command $Candidate -ErrorAction SilentlyContinue
    if ($null -ne $Command) {
      return $Command.Source
    }
  }
  return $null
}

Write-Banner "Verificando herramientas"
$Tools = @(
  @{ Name = "docker"; Candidates = @("docker") },
  @{ Name = "node"; Candidates = @("node") },
  @{ Name = "npm"; Candidates = @("npm.cmd", "npm") },
  @{ Name = "java"; Candidates = @("java") },
  @{ Name = "mvn"; Candidates = @("mvn") }
)

foreach ($Tool in $Tools) {
  $Path = Find-CommandPath $Tool.Candidates
  if ($null -ne $Path) {
    Write-Host ("  ok   {0} ({1})" -f $Tool.Name, $Path)
  } else {
    Write-Host ("  warn {0} no encontrado (se requiere para algunos flujos)" -f $Tool.Name)
  }
}

Write-Banner "Instalando hooks pre-commit"
$PreCommit = Find-CommandPath @("pre-commit")
if ($null -ne $PreCommit) {
  Push-Location $RootDir
  try {
    & $PreCommit install --install-hooks
  } finally {
    Pop-Location
  }
} else {
  Write-Host "  warn pre-commit no esta instalado; instalar con 'pip install pre-commit' y reintentar."
}

Write-Banner "Validando documentacion"
& node (Join-Path $RootDir "ci/scripts/check-docs.mjs") $RootDir

Write-Banner "Validando instanciacion del template"
& node (Join-Path $RootDir "ci/scripts/check-template-instantiation.mjs") --mode template --root $RootDir

Write-Banner "Levantando servicios de infraestructura local"
$Docker = Find-CommandPath @("docker")
if ($null -ne $Docker) {
  & $Docker compose -f (Join-Path $RootDir "ops/docker/docker-compose.yml") up -d
} else {
  Write-Host "  warn Docker no esta disponible; omitiendo docker-compose."
}

Write-Banner "Listo"
@"
Siguientes pasos sugeridos:
  node scripts/init-project.mjs --config template.config.example.json --dry-run
  node ci/scripts/check-template-instantiation.mjs --mode template
  make check-docs
"@ | Write-Host
