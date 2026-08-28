# ADR

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a arquitectura](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Vertical SBS-SUCAVE: analisis contra el codigo real](../analisis-sbs-sucave-vertical-20260810.md)
- Siguiente: [ADR-001 Platform Architecture](ADR-001-platform-architecture.md)
<!-- nav-guided:end -->

[Arquitectura](../README.md)

## ADR disponibles

- [ADR-001 Platform Architecture](ADR-001-platform-architecture.md)
- [ADR-002 Principios de diseno (SOLID)](ADR-002-principios-diseno.md)
- [ADR-003 RBAC endpoint x rol](ADR-003-rbac-endpoint-rol.md)
- [ADR-004 Motor de tareas con inputs y outputs tipados](ADR-004-motor-input-output-tareas.md)
- [ADR-005 Unificacion de la peticion HTTP (REST_CALL + webhook)](ADR-005-unificacion-peticion-http.md)
- [ADR-006 Fuentes de almacenamiento cloud (S3, GCS, Azure Blob)](ADR-006-fuentes-almacenamiento-cloud.md)
- [ADR-009 Vertical de mensajeria de pagos](ADR-009-vertical-mensajeria-pagos.md)
- [ADR-010 Auditoria asincrona multi-broker y lineage por registro](ADR-010-auditoria-asincrona-multi-broker-lineage-registro.md)
- [ADR-011 Patron repository para el acceso a datos](ADR-011-patron-repository-acceso-datos.md)
- [ADR-012 Frontend modular extensible por contribuciones](ADR-012-frontend-modular-extensible-plugins.md)
- [ADR-013 Frontend Module Federation para plugins remotos con codigo](ADR-013-frontend-module-federation-remote-plugins.md)
- [ADR-014 Backend modular extensible por plugins instalables](ADR-014-backend-modular-extensible-plugins.md)
- [ADR-015 Ejecucion de tareas asincrona por broker (Kafka por defecto)](ADR-015-backend-task-async-broker-execution.md)
- [ADR-016 Salida generica: escritura de archivos y entrega por transporte](ADR-016-salida-generica-escritura-archivo-y-entrega.md)
- [ADR-017 Conexion de salida unificada: fuente OUTPUT reutilizada por FILE_DELIVER y MT101_PAY/STATUS (SFTP)](ADR-017-conexion-salida-unificada-file-deliver-mt101-pay.md)
- [ADR-018 FILE_WRITE: binding de origenes y expresiones de detalle (paridad DB_WRITE + evaluador JEXL money-safe)](ADR-018-file-write-binding-origenes-y-expresiones-detalle.md)
- [ADR-019 Auditoria por dominio: standard packs (limite plataforma <-> estandar)](ADR-019-auditoria-standard-packs-agrupacion-por-dominio.md)
- [ADR-020 Correccion masiva de cuarentena MT101: agrupacion por causa + planilla de correccion](ADR-020-correccion-masiva-cuarentena-mt101-agrupacion-y-planilla.md)
- [ADR-021 Limite motor <-> verticales: camino de extension para nuevos estandares y ubicacion de MT101](ADR-021-limite-motor-verticales-camino-de-extension.md)
- [ADR-022 Upsert de DB_WRITE por dialecto de motor](ADR-022-upsert-db-write-por-motor.md)
- [ADR-023 Cada modulo es dueno de su esquema de base de datos](ADR-023-separacion-schemas-motor-vertical.md)
- [ADR-024 Despliegue nativo bajo un subpath, horneado en build-time](ADR-024-despliegue-nativo-bajo-subpath.md)
- [ADR-025 Credenciales de fuente: el control vive en el servidor y lo declara el provider](ADR-025-credenciales-de-fuente-control-en-el-servidor.md)
- [ADR-026 Vertical SBS SUCAVE, y toda fuente de entrada debe tener su salida](ADR-026-vertical-sbs-sucave-y-paridad-entrada-salida.md) *(propuesto)*
- ADR-027 Salida `REST` y `OCI_OBJECT_STORAGE`: publicar no es el espejo de leer *(reservado, sin redactar — ver ADR-026)*
- [ADR-028 Llamar a otro proceso como una tarea más](ADR-028-llamada-a-otro-proceso-como-tarea.md) *(propuesto)*
- [ADR-029 Entrega continua con promocion de artefacto; el despliegue lo dispara una persona](ADR-029-entrega-continua-promocion-de-artefacto.md) *(propuesto)*
- [ADR-030 Despliegue automatizado a la VM: modelo pull con aprobacion, y rollback clasificado por migracion](ADR-030-despliegue-automatizado-vm-pull-aprobacion-rollback.md) *(propuesto)*
- [ADR-031 La interfaz ofrece las referencias de secreto que este despliegue resuelve](ADR-031-seleccion-de-referencias-de-secreto-en-la-interfaz.md) *(propuesto)*

## Regla

Cada cambio que altere arquitectura, stack, seguridad, despliegue o modelo de extensibilidad debe registrarse aqui.
