# ADR-011 Patron repository para el acceso a datos

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

## Estado

Aceptado e implementado.

## Contexto

El acceso a datos (SQL/JDBC) debe vivir separado de la logica de negocio para
mantener SRP, testabilidad y consistencia. En la plataforma conviven tres formas
de acceso a datos:

1. **Esquema fijo** sobre entidades propias (`audit_spool`, `audit_event`,
   `staging_record`, `mt101_*`).
2. **Tabla/conexion dinamica** resuelta en runtime por `connectionRef`
   (DB_WRITE a tablas destino arbitrarias, lectura de inputs de tarea, archivo de
   pagos sobre tablas configurables).
3. **Ejecucion por dialecto de motor** (funciones de BD y stored procedures con
   sintaxis distinta por engine: PostgreSQL/MySQL/Oracle/SQL Server).

Historicamente parte del SQL vivia embebido en los task providers, mezclando
orquestacion con acceso a datos.

## Decision

**Todo el SQL/JDBC vive en una clase de acceso a datos dedicada; los
providers/services solo orquestan y gestionan la conexion.**

Capas:

- **Repository / DAO** (`com.integrationhub.platform.repository.*` y los `*ColdStore`
  / `*Writer` del `audit-consumer`): contienen el SQL y el JDBC, incluido el
  **dinamico** (insert/update/upsert sobre tabla configurable) y el batcheado.
  Reciben `Connection`/`DataSource` + parametros; no conocen reglas de negocio.
- **Provider / Service**: orquestan, resuelven el `DataSource` por `connectionRef`
  via `ConnectionPoolManager`, manejan la transaccion y delegan el acceso a datos.
  No contienen literales SQL.
- **Dialect** (`*Dialect` de `dbfunction`/`storedprocedure`): es la forma del DAO
  para ejecucion **por motor**; encapsula construccion de SQL + ejecucion
  especifica del engine. Recibe una `Connection` del provider.

Excepciones legitimas (no son acceso a datos de negocio):

- **`ConnectionPoolManager`**: ciclo de vida de datasources (infra).
- **`ConnectionMetadataService`**: introspeccion de metadata JDBC
  (schemas/tablas) para la UI de conexiones.

### Ejemplos en el codigo

| Concern | Repository/DAO | Orquestador |
|---|---|---|
| Escritura masiva | `DbWriteRepository` (staging + insert/update/upsert dinamico) | `DbWriteTaskProvider` |
| Lectura de input de tarea | `TaskInputRepository` (keyset + dialecto de limite) | `TaskInputResolver` |
| Outbox de auditoria | `AuditSpoolRepository` (claim `FOR UPDATE SKIP LOCKED`, retry/dead, cleanup) | `OutboxRelay`, `AuditSpoolWriter` |
| Store frio de registro | `PostgresColdStore` / `ClickHouseColdStore` | `AuditEventHandler` |
| Archivo/estado/conciliacion MT101 | `Mt101*Repository` (`repository/payments/swift`) | `Mt101Archive/Status/Reconcile/BuildFromTable*TaskProvider` |
| Rebuild/correccion/PAY correctivo MT101 | `Mt101RebuildRepository` (`mt101_rebuild_*`, `mt101_corrective_pay_fragment`) | `Mt101RebuildService`, `Mt101CorrectiveLifecycleService`, `Mt101StagingCorrectionService` |
| Funcion de BD / stored procedure | `*DatabaseFunctionDialect` / `*StoredProcedureDialect` | `DatabaseFunctionTaskProvider` / `StoredProcedureTaskProvider` |

## Consecuencias

- Los providers quedan sin SQL embebido (verificado: 0 literales SQL en los task
  providers de pagos; DB_WRITE y TaskInputResolver migrados a repositorio).
- El SQL es testeable de forma aislada (repos con Testcontainers) y el provider con
  dobles/fakes del repositorio.
- El acceso a tabla/conexion dinamica sigue siendo dinamico, pero centralizado en el
  repositorio (no disperso en la logica de negocio).
- Constructores de conveniencia en los providers (`new XxxRepository()`) mantienen
  los tests unitarios sin contenedor CDI.

## Regla operativa

Cualquier SQL/JDBC nuevo va en un `*Repository`/`*Dao`/`*Dialect`. Si un provider
necesita `prepareStatement`/`createNativeQuery`, es senal de que falta extraer el
acceso a datos.
