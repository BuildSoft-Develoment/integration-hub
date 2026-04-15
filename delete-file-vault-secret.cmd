@echo off
setlocal

if "%~3"=="" goto :usage

set "KEYSTORE=%~1"
set "STOREPASS=%~2"
set "ALIAS=%~3"

if not defined JAVA_HOME goto :java_not_found
set "KEYTOOL=%JAVA_HOME%\bin\keytool.exe"
if not exist "%KEYTOOL%" goto :java_not_found

"%KEYTOOL%" -delete -alias "%ALIAS%" -keystore "%KEYSTORE%" -storepass "%STOREPASS%" -storetype PKCS12
if errorlevel 1 exit /b %errorlevel%

echo Secret alias "%ALIAS%" deleted from "%KEYSTORE%".
exit /b 0

:java_not_found
echo JAVA_HOME with keytool is required. Example: set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.2.10-hotspot
exit /b 1

:usage
echo Usage: delete-file-vault-secret.cmd ^<keystore.p12^> ^<storepass^> ^<alias^>
echo Example: delete-file-vault-secret.cmd C:\chatgtp\quarkus\secrets\dev-secrets.p12 change-me connections/db/conexion1
exit /b 1
