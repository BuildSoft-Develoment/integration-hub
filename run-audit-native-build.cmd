@echo off
REM Build nativo del audit-consumer (container-build=true) + compresion UPX heredada.
cd /d C:\chatgtp\quarkus
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.2.10-hotspot"
set "MAVEN_HOME=C:\sw\apache-maven-3.9.14"
set "PATH=%JAVA_HOME%\bin;%MAVEN_HOME%\bin;%PATH%"
echo start: %DATE% %TIME% > C:\chatgtp\quarkus\audit-native-build.log
call "%MAVEN_HOME%\bin\mvn.cmd" -B -pl audit-consumer -am clean package -Dmaven.test.skip=true -Pnative -Dquarkus.native.container-build=true 1>>C:\chatgtp\quarkus\audit-native-build.log 2>&1
echo EXIT=%ERRORLEVEL% end: %DATE% %TIME% >> C:\chatgtp\quarkus\audit-native-build.log
