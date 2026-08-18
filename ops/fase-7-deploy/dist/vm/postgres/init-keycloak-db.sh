#!/bin/sh
# Crea la base de datos de Keycloak.
#
# POR QUE HACE FALTA
# Keycloak en modo produccion NO crea su base: espera encontrarla. Si no esta, arranca, falla
# al conectar y muere con un error de conexion que parece de red o de credenciales — nunca
# dice "la base no existe". Es de los arranques mas confusos de diagnosticar.
#
# CUANDO SE EJECUTA
# Solo al INICIALIZAR el volumen de datos, la primerisima vez. Postgres ignora este directorio
# si el volumen ya tiene datos, asi que reiniciar no lo vuelve a lanzar y no hay riesgo de
# pisar nada. Como contrapartida: si el volumen ya existia SIN la base de Keycloak, este script
# no la creara nunca. En ese caso, crearla a mano:
#
#   docker exec -it ih-postgres psql -U postgres -c "CREATE DATABASE keycloak"
#
# Comparte servidor con la base de la plataforma pero NO tabla ni esquema: son dos productos
# con migraciones propias, y mezclarlos hace que la actualizacion de uno bloquee al otro.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE keycloak;
EOSQL

echo "base de datos 'keycloak' creada"
