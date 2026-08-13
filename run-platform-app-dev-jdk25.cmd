@echo off
rem Arranca el dev de platform-app. Se ejecuta DENTRO del modulo, y tiene que ser asi: el prefijo
rem `quarkus:` solo se resuelve donde el pom declara quarkus-maven-plugin, y el pom padre no lo hace.
rem Lanzarlo desde la raiz con -pl/-am falla con "No plugin found for prefix 'quarkus'".
rem
rem La contrapartida es que, al ser un build de UN modulo, platform-spi y platform-contract se
rem resuelven del repositorio local (~/.m2). Si ahi hay un jar viejo, el dev compila contra el y falla
rem con "cannot find symbol" en clases que en el codigo estan perfectas — y como el fallo ocurre antes
rem de abrir el puerto, desde fuera solo se ve que localhost:8080 no levanta.
rem
rem Por eso start-platform-stack.cmd instala el reactor COMPLETO antes de llegar aqui. Si lanzas este
rem script suelto y falla por simbolos que si existen, corre primero: mvn -o install -DskipTests
cd /d C:\chatgtp\quarkus\platform-app
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.2.10-hotspot"
set "MAVEN_HOME=C:\sw\apache-maven-3.9.14"
set "PATH=%JAVA_HOME%\bin;%MAVEN_HOME%\bin;%PATH%"
"%MAVEN_HOME%\bin\mvn.cmd" quarkus:dev -DskipTests 1>C:\chatgtp\quarkus\platform-app-dev.out.log 2>C:\chatgtp\quarkus\platform-app-dev.err.log
