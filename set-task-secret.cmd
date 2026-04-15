@echo off
setlocal

if "%~5"=="" goto :usage

set "KEYSTORE=%~1"
set "STOREPASS=%~2"
set "TASK_TYPE=%~3"
set "TASK_NAME=%~4"
set "SECRET_VALUE=%~5"

set "ALIAS=tasks/%TASK_TYPE%/%TASK_NAME%"

call "C:\chatgtp\quarkus\create-file-vault-secret.cmd" "%KEYSTORE%" "%STOREPASS%" "%ALIAS%" "%SECRET_VALUE%"
if errorlevel 1 exit /b %errorlevel%

echo Logical secret key ready: ${secret:%ALIAS%/password}
exit /b 0

:usage
echo Usage: set-task-secret.cmd ^<keystore.p12^> ^<storepass^> ^<type^> ^<name^> ^<secretValue^>
echo Example REST task: set-task-secret.cmd C:\chatgtp\quarkus\secrets\dev-secrets.p12 change-me rest notificacion1 token-demo
echo Example webhook task: set-task-secret.cmd C:\chatgtp\quarkus\secrets\dev-secrets.p12 change-me webhook alerta1 secret-webhook
exit /b 1

