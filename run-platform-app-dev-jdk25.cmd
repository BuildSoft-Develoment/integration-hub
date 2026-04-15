@echo off
cd /d C:\chatgtp\quarkus\platform-app
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.2.10-hotspot"
set "MAVEN_HOME=C:\sw\apache-maven-3.9.14"
set "PATH=%JAVA_HOME%\bin;%MAVEN_HOME%\bin;%PATH%"
"%MAVEN_HOME%\bin\mvn.cmd" quarkus:dev -DskipTests 1>C:\chatgtp\quarkus\platform-app-dev.out.log 2>C:\chatgtp\quarkus\platform-app-dev.err.log
