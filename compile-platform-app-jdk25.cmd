@echo off
cd /d C:\chatgtp\quarkus\platform-app
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.2.10-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"
mvn -q -DskipTests compile