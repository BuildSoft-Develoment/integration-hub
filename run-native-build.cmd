@echo off
REM Build nativo REAL con compresion UPX (quarkus.native.compression.level=7).
REM container-build=true -> la compilacion native-image corre en el builder Mandrel (docker).
REM Requisitos (ver ops/fase-7-deploy/dist/NATIVE-STATUS.md): WSL2 >=12GB, contenedores pesados parados.
cd /d C:\chatgtp\quarkus
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.2.10-hotspot"
set "MAVEN_HOME=C:\sw\apache-maven-3.9.14"
set "PATH=%JAVA_HOME%\bin;%MAVEN_HOME%\bin;%PATH%"
set "NX_DAEMON=false"
echo start: %DATE% %TIME% > C:\chatgtp\quarkus\native-build.log
REM -Dmaven.test.skip=true: salta compilacion Y ejecucion de tests (build de empaquetado).
REM Nota: hay 2 tests stale en master que NO compilan (PluginDiagnosticsResourceTest,
REM SystemThemeSettingServiceTest); por eso no alcanza con -DskipTests aqui.
call "%MAVEN_HOME%\bin\mvn.cmd" -B -pl platform-app -am clean package -Dmaven.test.skip=true -Pnative -Dquarkus.native.container-build=true 1>>C:\chatgtp\quarkus\native-build.log 2>&1
echo EXIT=%ERRORLEVEL% end: %DATE% %TIME% >> C:\chatgtp\quarkus\native-build.log
