# ADR

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a arquitectura](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Checklist de arquitectura](../03.04-checklist-arquitectura.md)
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

## Regla

Cada cambio que altere arquitectura, stack, seguridad, despliegue o modelo de extensibilidad debe registrarse aqui.
