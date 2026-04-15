@echo off
setlocal

set "ROOT=C:\chatgtp\quarkus"
set "RUN_SCRIPT=%ROOT%\run-platform-app-dev-jdk25.cmd"
set "HEALTH_URL=http://localhost:8080/q/health"

cd /d "%ROOT%"

echo [1/3] Levantando dependencias con Docker Compose...
docker compose up -d
if errorlevel 1 goto :fail

echo [2/3] Verificando Quarkus dev...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$listener = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue; if (-not $listener) { Start-Process -FilePath '%RUN_SCRIPT%' -WorkingDirectory '%ROOT%' | Out-Null; 'STARTED' } else { 'ALREADY_RUNNING' }"
if errorlevel 1 goto :fail

echo [3/3] Esperando health check...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$deadline = (Get-Date).AddMinutes(2); $ok = $false; while ((Get-Date) -lt $deadline) { try { $response = Invoke-WebRequest -Uri '%HEALTH_URL%' -UseBasicParsing -TimeoutSec 5; if ($response.StatusCode -eq 200) { $ok = $true; break } } catch { Start-Sleep -Seconds 2 } }; if (-not $ok) { exit 1 }"
if errorlevel 1 goto :health_fail

echo.
echo Stack lista:
echo - App: http://localhost:8080/
echo - Health: http://localhost:8080/q/health
echo - Keycloak: http://localhost:8180/
echo - Jaeger: http://localhost:16686/
exit /b 0

:health_fail
echo No se obtuvo health 200 en %HEALTH_URL% dentro del tiempo esperado.
echo Revisa: %ROOT%\platform-app-dev.out.log y %ROOT%\platform-app-dev.err.log
exit /b 1

:fail
echo Fallo el arranque del stack.
exit /b 1
