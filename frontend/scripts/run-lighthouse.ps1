# Lighthouse CI audit script for the Integration Hub frontend.
# Prerequisites:
#   - Dev server running: npx nx serve web
#   - Lighthouse CLI installed: npm install -g @lhci/cli
#
# Usage:
#   .\run-lighthouse.ps1
#
# Output:
#   lighthouse-report/ directory with HTML and JSON reports per URL.

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$reportDir = Join-Path $projectRoot 'lighthouse-report'

if (Test-Path $reportDir) {
  Remove-Item -Recurse -Force $reportDir
}
New-Item -ItemType Directory -Path $reportDir | Out-Null

Write-Host '=== Lighthouse CI Audit ===' -ForegroundColor Cyan
Write-Host "Project root: $projectRoot"
Write-Host "Report dir:   $reportDir"
Write-Host ''

$urls = @(
  'http://localhost:4200',
  'http://localhost:4200/overview',
  'http://localhost:4200/connections',
  'http://localhost:4200/sources',
  'http://localhost:4200/readers',
  'http://localhost:4200/processes',
  'http://localhost:4200/schedules',
  'http://localhost:4200/executions',
  'http://localhost:4200/audit',
  'http://localhost:4200/payment-rules'
)

$results = @()

foreach ($url in $urls) {
  $slug = ($url -replace 'http://localhost:4200', '' -replace '/', '_').Trim('_')
  if ([string]::IsNullOrWhiteSpace($slug)) { $slug = 'home' }

  $outputPath = Join-Path $reportDir "$slug.html"
  $jsonPath = Join-Path $reportDir "$slug.report.json"

  Write-Host "Auditing: $url" -ForegroundColor Yellow

  $args = @(
    'lighthouse',
    $url,
    '--output=html',
    "--output-path=$outputPath",
    '--output=json',
    "--output-path=$jsonPath",
    '--preset=desktop',
    '--quiet',
    '--chrome-flags=--headless --no-sandbox --disable-gpu'
  )

  & npx @args 2>&1 | Out-Null

  if (Test-Path $jsonPath) {
    $report = Get-Content $jsonPath -Raw | ConvertFrom-Json
    $scores = [PSCustomObject]@{
      URL         = $url
      Performance = [math]::Round($report.categories.performance.score * 100)
      A11y        = [math]::Round($report.categories.accessibility.score * 100)
      BestPrac    = [math]::Round($report.categories.'best-practices'.score * 100)
      SEO         = [math]::Round($report.categories.seo.score * 100)
    }
    $results += $scores
    Write-Host ("  Performance={0}  A11y={1}  BestPractices={2}  SEO={3}" -f $scores.Performance, $scores.A11y, $scores.BestPrac, $scores.SEO) -ForegroundColor Green
  } else {
    Write-Host "  FAILED — no report generated" -ForegroundColor Red
  }
}

Write-Host ''
Write-Host '=== Summary ===' -ForegroundColor Cyan
$results | Format-Table -AutoSize
Write-Host ''
Write-Host "Reports saved to: $reportDir" -ForegroundColor Cyan
