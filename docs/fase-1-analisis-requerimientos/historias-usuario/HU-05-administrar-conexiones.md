# HU-05 Administrar conexiones

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [HU-04 Auditar y reprocesar](HU-04-auditar-y-reprocesar.md)
- Siguiente: [HU-06 Programar procesos](HU-06-programar-procesos.md)
<!-- nav-guided:end -->

## Como

`Integration Admin`

## Quiero

configurar conexiones a motores de datos y reutilizar su metadata

## Para

que las tareas de proceso (DB_WRITE / DB_EXECUTE_SP / DB_EXECUTE_FN) escriban o invoquen
rutinas sobre destinos validados y trazables

## Criterios de aceptacion

- permite crear conexiones `ORACLE`, `POSTGRESQL`, `SQLSERVER`, `MYSQL` y `MONGODB`
- permite probar la conectividad antes de activar
- introspecciona esquemas, tablas y columnas (mapeo de `DB_WRITE`)
- introspecciona procedimientos y funciones con parametros (para `DB_EXECUTE_SP`/`DB_EXECUTE_FN`), salvo `MONGODB`
- deja la conexion activa disponible para tareas DB

## Reglas de negocio

- solo perfiles administrativos crean o editan conexiones
- el `name` de la conexion es unico
- los secretos se referencian con `${secret:...}` y nunca se exponen en claro
- `MONGODB` no expone rutinas: la introspeccion de procedimientos/funciones no aplica

## Trazabilidad

- RF global `RF-08` · Modulo: catalogo y conectividad · Feature: `specs/005-catalogo-conexiones` · UC: `casos-de-uso/UC-05-configurar-conexion.md`
