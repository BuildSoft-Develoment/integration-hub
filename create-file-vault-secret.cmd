@echo off
setlocal

if "%~4"=="" goto :usage

set "KEYSTORE=%~1"
set "STOREPASS=%~2"
set "ALIAS=%~3"
set "SECRET_VALUE=%~4"

if not defined JAVA_HOME goto :java_not_found
set "KEYTOOL=%JAVA_HOME%\bin\keytool.exe"
if not exist "%KEYTOOL%" goto :java_not_found

for %%I in ("%KEYSTORE%") do set "KEYSTORE_DIR=%%~dpI"
if not "%KEYSTORE_DIR%"=="" if not exist "%KEYSTORE_DIR%" mkdir "%KEYSTORE_DIR%"

powershell -NoProfile -Command "$secret = $env:SECRET_VALUE; $secret | & $env:KEYTOOL -importpass -alias $env:ALIAS -keystore $env:KEYSTORE -storepass $env:STOREPASS -storetype PKCS12 -noprompt" 
if errorlevel 1 exit /b %errorlevel%

echo Secret alias "%ALIAS%" updated in "%KEYSTORE%".
exit /b 0

:java_not_found
echo JAVA_HOME with keytool is required. Example: set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.2.10-hotspot
exit /b 1

:usage
echo Usage: create-file-vault-secret.cmd ^<keystore.p12^> ^<storepass^> ^<alias^> ^<secretValue^>
echo Example: create-file-vault-secret.cmd C:\chatgtp\quarkus\secrets\dev-secrets.p12 change-me db1 admin
exit /b 1
