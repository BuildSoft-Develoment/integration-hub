@echo off
setlocal

if "%~5"=="" goto :usage

set "KEYSTORE=%~1"
set "STOREPASS=%~2"
set "CONNECTION_TYPE=%~3"
set "CONNECTION_NAME=%~4"
set "SECRET_VALUE=%~5"

set "ALIAS=connections/%CONNECTION_TYPE%/%CONNECTION_NAME%"

call "C:\chatgtp\quarkus\create-file-vault-secret.cmd" "%KEYSTORE%" "%STOREPASS%" "%ALIAS%" "%SECRET_VALUE%"
if errorlevel 1 exit /b %errorlevel%

echo Logical secret key ready: ${secret:%ALIAS%/password}
exit /b 0

:usage
echo Usage: set-connection-secret.cmd ^<keystore.p12^> ^<storepass^> ^<type^> ^<name^> ^<secretValue^>
echo Example DB: set-connection-secret.cmd C:\chatgtp\quarkus\secrets\dev-secrets.p12 change-me db conexion1 admin
echo Example REST: set-connection-secret.cmd C:\chatgtp\quarkus\secrets\dev-secrets.p12 change-me rest erp token-demo-erp
echo Example SFTP: set-connection-secret.cmd C:\chatgtp\quarkus\secrets\dev-secrets.p12 change-me sftp proveedor1 sftp-demo-pass
exit /b 1
