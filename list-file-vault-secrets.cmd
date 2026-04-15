@echo off
setlocal

if "%~2"=="" goto :usage

set "KEYSTORE=%~1"
set "STOREPASS=%~2"

if not defined JAVA_HOME goto :java_not_found
set "KEYTOOL=%JAVA_HOME%\bin\keytool.exe"
if not exist "%KEYTOOL%" goto :java_not_found

"%KEYTOOL%" -list -keystore "%KEYSTORE%" -storepass "%STOREPASS%" -storetype PKCS12
exit /b %errorlevel%

:java_not_found
echo JAVA_HOME with keytool is required. Example: set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.2.10-hotspot
exit /b 1

:usage
echo Usage: list-file-vault-secrets.cmd ^<keystore.p12^> ^<storepass^>
echo Example: list-file-vault-secrets.cmd C:\chatgtp\quarkus\secrets\dev-secrets.p12 change-me
exit /b 1
