@echo off
setlocal

rem =====================================================================================
rem seed-dev-connections.cmd - deja el entorno de DESARROLLO listo para ejecutar procesos.
rem
rem POR QUE EXISTE
rem La conexion `ih-internal` -la que apunta a la propia plataforma, y de la que cuelgan las
rem tareas que leen de tabla- NO la crea nadie: no hay seed, y las migraciones de
rem connection_definition son solo DDL. Quien montaba el entorno de cero se encontraba la
rem tabla vacia y tenia que adivinar el nombre exacto. Era conocimiento que vivia en la
rem cabeza de quien ya lo habia hecho.
rem
rem LA CONTRASENA NO SE GUARDA EN LA BASE
rem Se siembra en OpenBao y la conexion la referencia con ${vaultkv:...}. Nace bien desde el
rem primer dia, en vez de nacer en claro y migrarse despues.
rem
rem POR QUE NO ES UNA MIGRACION FLYWAY
rem Una migracion se aplica en TODOS los entornos. Esto son datos de desarrollo: meterlos en
rem Flyway los llevaria a integracion y a produccion, con la clave del postgres local dentro.
rem
rem Idempotente: se puede ejecutar las veces que haga falta.
rem =====================================================================================

set "OPENBAO=integration-hub-openbao"
set "POSTGRES=integration-hub-postgres"
set "BAO_TOKEN=dev-root-token"
set "SECRET_PATH=secret/connections/db/ih-internal"
rem Clave del postgres de desarrollo: la misma que ya esta en docker-compose.yml. No es un
rem secreto real, y por eso puede estar aqui; el punto del ejercicio es la RUTA, no el valor.
set "DEV_DB_PASSWORD=admin"

echo [1/4] Comprobando que OpenBao esta arriba...
docker exec %OPENBAO% bao status -address=http://127.0.0.1:8200 >nul 2>&1
if errorlevel 1 goto :no_openbao

echo [2/4] Sembrando el secreto en OpenBao (%SECRET_PATH%)...
docker exec -e BAO_ADDR=http://127.0.0.1:8200 -e BAO_TOKEN=%BAO_TOKEN% %OPENBAO% ^
  bao kv put %SECRET_PATH% password=%DEV_DB_PASSWORD% >nul
if errorlevel 1 goto :fail

echo [3/4] Creando/actualizando la conexion ih-internal...
docker exec %POSTGRES% psql -U postgres -d integration_hub -v ON_ERROR_STOP=1 -c ^
 "insert into connection_definition (name, connection_type, active, configuration_json) values ('ih-internal','POSTGRESQL',true,'{\"jdbcUrl\":\"jdbc:postgresql://localhost:5433/integration_hub\",\"username\":\"postgres\",\"password\":\"${vaultkv:connections/db/ih-internal/password}\"}') on conflict (name) do update set connection_type=excluded.connection_type, active=excluded.active, configuration_json=excluded.configuration_json;" >nul
if errorlevel 1 goto :fail

echo [4/4] Verificando que la contrasena NO quedo en claro...
docker exec %POSTGRES% psql -U postgres -d integration_hub -t -A -c ^
 "select configuration_json from connection_definition where name='ih-internal';"

echo.
echo Listo. La conexion resuelve su clave desde OpenBao.
echo.
echo OJO: el OpenBao de desarrollo guarda EN MEMORIA. Si reinicias su contenedor, el secreto
echo desaparece y la conexion fallara con "Missing vaultkv value" -que es el mismo mensaje
echo que veras si el token no vale o si OpenBao esta caido-. Vuelve a correr este script.
exit /b 0

:no_openbao
echo.
echo ERROR: el contenedor %OPENBAO% no responde.
echo Levantalo antes:  docker compose up -d openbao
echo.
echo Se para aqui a proposito: sembrar la conexion sin el secreto dejaria una referencia que
echo falla al ejecutar, y el error no distingue "no existe" de "OpenBao caido".
exit /b 1

:fail
echo.
echo ERROR: fallo el seed. Revisa que %POSTGRES% este arriba y con la base migrada.
exit /b 1
