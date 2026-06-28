@echo off
setlocal

set "ROOT=C:\chatgtp\quarkus"
set "RUN_SCRIPT=%ROOT%\run-platform-app-dev-jdk25.cmd"
set "HEALTH_URL=http://localhost:8080/q/health"
set "CONSUMER_HEALTH_URL=http://localhost:8082/q/health"
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.2.10-hotspot"
set "MAVEN_HOME=C:\sw\apache-maven-3.9.14"
set "PATH=%JAVA_HOME%\bin;%MAVEN_HOME%\bin;%PATH%"

cd /d "%ROOT%"

echo [0/4] Empaquetando audit-consumer (fast-jar) para el contenedor...
call "%MAVEN_HOME%\bin\mvn.cmd" -q -pl platform-contract,audit-consumer -am install -DskipTests
if errorlevel 1 goto :fail

echo [1/4] Levantando dependencias con Docker Compose (con build del consumer)...
docker compose up -d --build
if errorlevel 1 goto :fail

echo [2/4] Verificando Quarkus dev...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$listener = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue; if (-not $listener) { Start-Process -FilePath '%RUN_SCRIPT%' -WorkingDirectory '%ROOT%' | Out-Null; 'STARTED' } else { 'ALREADY_RUNNING' }"
if errorlevel 1 goto :fail

echo [3/4] Esperando health check de la app...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$deadline = (Get-Date).AddMinutes(5); $ok = $false; while ((Get-Date) -lt $deadline) { try { $response = Invoke-WebRequest -Uri '%HEALTH_URL%' -UseBasicParsing -TimeoutSec 5; if ($response.StatusCode -eq 200) { $ok = $true; break } } catch { Start-Sleep -Seconds 2 } }; if (-not $ok) { exit 1 }"
if errorlevel 1 goto :health_fail

echo [4/4] Esperando health check del audit-consumer...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$deadline = (Get-Date).AddMinutes(2); $ok = $false; while ((Get-Date) -lt $deadline) { try { $response = Invoke-WebRequest -Uri '%CONSUMER_HEALTH_URL%' -UseBasicParsing -TimeoutSec 5; if ($response.StatusCode -eq 200) { $ok = $true; break } } catch { Start-Sleep -Seconds 2 } }; if (-not $ok) { 'CONSUMER_NOT_READY' } else { 'CONSUMER_OK' }"

echo.
echo Stack lista:
echo - App:             http://localhost:8080/
echo - Health app:      http://localhost:8080/q/health
echo - Metricas:        http://localhost:8080/q/metrics
echo - Audit spool API: http://localhost:8080/api/query/audit-spool/summary
echo - Record lineage:  http://localhost:8080/audit/record-lineage
echo - Audit consumer:  http://localhost:8082/q/health
echo - Kafka UI:        http://localhost:8181/
echo - ClickHouse:      http://localhost:8123/
echo - Keycloak:        http://localhost:8180/
echo - Jaeger:          http://localhost:16686/
exit /b 0

:health_fail
echo No se obtuvo health 200 en %HEALTH_URL% dentro del tiempo esperado.
echo Revisa: %ROOT%\platform-app-dev.out.log y %ROOT%\platform-app-dev.err.log
exit /b 1

:fail
echo Fallo el arranque del stack.
exit /b 1
