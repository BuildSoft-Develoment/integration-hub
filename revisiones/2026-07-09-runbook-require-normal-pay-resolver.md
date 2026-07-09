# Runbook — activar `mt101.pay.require-normal-pay-resolver` por ambiente

**Fecha:** 2026-07-09
**Tipo:** gate de despliegue (config, no código). Documenta cuándo y cómo activar el flag #1.

## Qué es

Propiedad **MicroProfile Config** leída **al arranque** (no dinámica; cambiarla exige **reiniciar**; **no** editable
desde la UI). Documentada (comentada, default `false`) en `platform-app/src/main/resources/application.properties`.

Cuando `=true`, al **publicar/activar** un proceso RUNNABLE, cada `MT101_PAY` debe tener un
`MT101_STATUS(resolveNormalPay=true)` **posterior**; si no → **400**. Afecta **solo** la validación de definición (no el
runtime ni procesos ya activos).

## Criterio de decisión (depende SOLO de la topología de confirmación)

| Ambiente | Valor | Razón |
|---|---|---|
| Confirmación **async / ejecución separada** (dominante) | **`false`** (default) | Encenderlo obliga a un resolutor in-line que corre **antes** de la respuesta del banco → `NEEDS_RECONCILIATION` en casi toda corrida. |
| Confirmación **in-line / lazo cerrado** en el mismo proceso (UAT/prod cerrado) | **`true`** | Garantiza que ningún proceso con `MT101_PAY` se publique sin su etapa de auto-reconciliación cableada. |

## Cadena de requisitos que activa (importante)

Con el flag en `true`, publicar un proceso con `MT101_PAY` exige el **money-path completo**:
1. **#1** — existe `MT101_STATUS(resolveNormalPay=true)` posterior.
2. **G2** — ese `MT101_PAY` tiene `continueOnFailure=true`.
3. **#2-ext** — ese STATUS usa el **mismo `connectionRef`** que el `MT101_PAY`.

No es "agregá un STATUS": es "cableá bien el money-path o no publicás".

## Cómo activarlo (por ambiente)

Elegir UNA (precedencia MicroProfile: env var > -D > application.properties):

```
# 1) Variable de entorno (recomendado para contenedores/deploy)
MT101_PAY_REQUIRE_NORMAL_PAY_RESOLVER=true

# 2) Flag de arranque
-Dmt101.pay.require-normal-pay-resolver=true

# 3) application.properties del deploy (descomentar y poner true)
mt101.pay.require-normal-pay-resolver=true
```

Como se lee al arranque, **planificar el flip en una ventana de despliegue/reinicio**.

## Verificación post-activación

1. Reiniciar la app y confirmar health 200.
2. **Prueba negativa:** publicar un proceso RUNNABLE con `MT101_PAY` **sin** `MT101_STATUS(resolveNormalPay=true)`
   posterior → debe dar **400** con el mensaje `require-normal-pay-resolver=true`.
3. **Prueba positiva:** con el resolutor + `continueOnFailure=true` + mismo `connectionRef` → **200**.
4. Revisar que los procesos productivos existentes (ya activos) **no** se ven afectados (el flag solo valida al
   publicar/activar).

## Rollback

Volver el flag a `false` (o quitar la env var/-D) y reiniciar. Los procesos ya publicados siguen igual.
