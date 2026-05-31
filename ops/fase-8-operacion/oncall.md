# Guardia (on-call)

Define la rotacion de guardia y el flujo de respuesta a incidentes del
Integration Hub en operacion (fase 8).

## Rotacion
- Turno semanal, primario + secundario.
- Cobertura 24x7 para incidentes de severidad alta.

## Severidades
| Severidad | Descripcion | Respuesta objetivo |
|---|---|---|
| SEV1 | Plataforma caida / perdida de datos | 15 min |
| SEV2 | Degradacion de ejecuciones | 1 h |
| SEV3 | Defecto sin impacto operativo | Siguiente dia habil |

## Flujo de respuesta
1. Reconocer la alerta y declarar severidad.
2. Mitigar (ver runbook de operacion y rollback).
3. Comunicar estado a los interesados.
4. Postmortem sin culpa para SEV1/SEV2.
