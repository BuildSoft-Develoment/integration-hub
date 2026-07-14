@echo off
REM Build nativo con el subpath /appih horneado (perfil Maven -Pappih: root-path /appih +
REM Quinoa build 'build:appih' con base-href /appih/) + compresion UPX. container-build=true.
cd /d C:\chatgtp\quarkus
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.2.10-hotspot"
set "MAVEN_HOME=C:\sw\apache-maven-3.9.14"
set "PATH=%JAVA_HOME%\bin;%MAVEN_HOME%\bin;%PATH%"
set "NX_DAEMON=false"
echo start: %DATE% %TIME% > C:\chatgtp\quarkus\native-build-appih.log
call "%MAVEN_HOME%\bin\mvn.cmd" -B -pl platform-app -am clean package -Dmaven.test.skip=true -Pnative,appih -Dquarkus.native.container-build=true 1>>C:\chatgtp\quarkus\native-build-appih.log 2>&1
echo EXIT=%ERRORLEVEL% end: %DATE% %TIME% >> C:\chatgtp\quarkus\native-build-appih.log
