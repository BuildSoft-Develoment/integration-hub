# Politica de retencion de datos

Define cuanto tiempo conserva el Integration Hub cada categoria de datos y como
se purgan, alineado con privacidad y cumplimiento (fase transversal).

| Categoria | Retencion | Purga | Responsable |
|---|---|---|---|
| Registros de auditoria | 365 dias | Job programado mensual | auditor |
| Historico de ejecuciones | 180 dias | Job programado semanal | operator |
| Archivos staging de sources | 7 dias | Limpieza diaria | scheduler |
| Notificaciones emitidas | 90 dias | Job programado semanal | operator |
| Secretos / credenciales | Vigencia activa | Rotacion en Vault | platform-admin |

## Principios
- Minimizacion: no se conserva dato sensible mas alla de su proposito.
- Trazabilidad: toda purga queda registrada en auditoria.
- Reversibilidad controlada: backups cifrados segun el plan de continuidad.
