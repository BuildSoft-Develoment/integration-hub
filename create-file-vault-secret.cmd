@echo off
setlocal enabledelayedexpansion

if "%~4"=="" goto :usage

set "KEYSTORE=%~1"
set "STOREPASS=%~2"
set "ALIAS=%~3"
set "SECRET_VALUE=%~4"

if not defined JAVA_HOME goto :java_not_found
set "KEYTOOL=%JAVA_HOME%\bin\keytool.exe"
set "JAVA=%JAVA_HOME%\bin\java.exe"
if not exist "%KEYTOOL%" goto :java_not_found

for %%I in ("%KEYSTORE%") do set "KEYSTORE_DIR=%%~dpI"
if not "%KEYSTORE_DIR%"=="" if not exist "%KEYSTORE_DIR%" mkdir "%KEYSTORE_DIR%"

REM Si el alias ya existe, borrarlo primero (importpass falla sobre un alias duplicado). Se ignora el error
REM cuando no existe todavia.
"%KEYTOOL%" -delete -alias "%ALIAS%" -keystore "%KEYSTORE%" -storepass "%STOREPASS%" -storetype PKCS12 >nul 2>&1

REM keytool -importpass lee el valor del STDIN dos veces (entrada + confirmacion). El bug anterior era el
REM pipe de PowerShell ($secret | keytool), que manglaba el valor (guardaba p.ej. "C/B;B?bank" por "bank").
REM Se alimenta por un archivo temporal con DOS lineas (el valor repetido), sin PowerShell de por medio.
set "PWFILE=%TEMP%\ihvault_%RANDOM%.txt"
>"%PWFILE%" echo %SECRET_VALUE%
>>"%PWFILE%" echo %SECRET_VALUE%
"%KEYTOOL%" -importpass -alias "%ALIAS%" -keystore "%KEYSTORE%" -storepass "%STOREPASS%" -storetype PKCS12 <"%PWFILE%" >nul 2>&1
set "IMPORT_RC=!ERRORLEVEL!"
del "%PWFILE%" >nul 2>&1
if not "!IMPORT_RC!"=="0" (
    echo ERROR: keytool -importpass failed for alias "%ALIAS%" ^(rc=!IMPORT_RC!^).
    exit /b !IMPORT_RC!
)

REM Verificacion OBLIGATORIA: releer el alias y comparar el valor. Un secreto corrupto solo se ve luego
REM como "Auth fail" en el destino, asi que se falla aqui, ruidosamente, si el valor no hace round-trip.
"%JAVA%" "%~dp0tools\VerifyVaultSecret.java" "%KEYSTORE%" "%STOREPASS%" "%ALIAS%" "%SECRET_VALUE%"
if errorlevel 1 (
    echo ERROR: el valor almacenado NO coincide con el esperado; el secreto quedaria corrupto. Abortado.
    exit /b 1
)

echo Secret alias "%ALIAS%" updated and verified in "%KEYSTORE%".
exit /b 0

:java_not_found
echo JAVA_HOME with keytool/java is required. Example: set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.2.10-hotspot
exit /b 1

:usage
echo Usage: create-file-vault-secret.cmd ^<keystore.p12^> ^<storepass^> ^<alias^> ^<secretValue^>
echo Example: create-file-vault-secret.cmd C:\chatgtp\quarkus\secrets\dev-secrets.p12 change-me db1 admin
exit /b 1
