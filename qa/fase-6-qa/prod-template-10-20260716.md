# #10 — prod-template: controles bancarios activos en producción — 2026-07-16

Cierra el ítem #10 / B.4 (config/entrega, **cero cambio de lógica**): el perfil productivo ahora **enciende los
controles bancarios** que en dev/UAT están apagados por default, en vez de heredarlos.

## Problema (verificado en el código)

Los flags de MT101 están **comentados** en `platform-app/.../application.properties`, así que en prod caían al
**default de código**, que es el de dev:

| Flag | Default de código | Riesgo en prod |
|---|---|---|
| `mt101.pay.direct-list.enabled` | `true` (`Mt101PayTaskProvider.java` `.orElse(true)`) | PAY por lista **en memoria** habilitado (garantía anti-doble-pago más débil, sin `build_fragment` persistido) |
| `mt101.pay.conflict.acknowledge.maker-checker.enabled` | `false` | una **sola persona** puede cerrar un PAY_CONFLICT (sin four-eyes) |
| `mt101.build.insert-batch-max-bytes` | default interno | sin el umbral evidenciado (200KB) que evita el deadlock H7 a escala |

`application-prod.properties` (común a todas las nubes) **no** los fijaba → prod habría salido con el atajo por
lista ON y el maker-checker OFF: lo contrario de lo que exige la homologación bancaria.

## Cambios

1. **`ops/fase-7-deploy/dist/config/application-prod.properties`** — sección "Controles bancarios MT101",
   explícita y overridable por env-var con **default seguro**:
   ```properties
   mt101.pay.conflict.acknowledge.maker-checker.enabled=${MT101_MAKER_CHECKER_ENABLED:true}
   mt101.pay.direct-list.enabled=${MT101_DIRECT_LIST_ENABLED:false}
   mt101.build.insert-batch-max-bytes=${MT101_INSERT_BATCH_MAX_BYTES:200000}
   mt101.pay.require-normal-pay-resolver=${MT101_REQUIRE_NORMAL_PAY_RESOLVER:false}
   ```
   Aplica a **aws/azure/gcp/oracle/onprem** (el perfil `prod` carga antes que el de nube; los perfiles de nube
   **no** pisan estos flags — verificado).
2. **`ops/fase-7-deploy/dist/onprem/.env.example`** — documenta los 4 overrides (comentados; los defaults ya son
   los correctos para banca).
3. **`ops/fase-7-deploy/dist/onprem/README.md`** — tabla de controles bancarios + **frontera demo↔prod**: prod usa
   `.env.example` sin secretos; `int/.env` es el lab DEMO con credenciales en claro (nunca reusar en prod, rotar
   si se expuso).

## Notas de diseño

- `require-normal-pay-resolver` queda en **false** por default (condicional al diseño del proceso: `true` solo si
  la conciliación PAY es inline; con scheduler, false). Explícito y documentado, no forzado.
- Nombres de propiedad verificados 1:1 contra el código (`Mt101PayTaskProvider`, `Mt101BuildFromTableTaskProvider`,
  `Mt101PayConflictAcknowledgeService`, `Mt101PayResolutionValidator`).
- Sin impacto en build: son config de **runtime** en `ops/` (no en `src/main/resources`), resueltas al arrancar el
  contenedor con `QUARKUS_PROFILE=prod,<nube>`. La sintaxis `${ENV:default}` replica la ya usada (`${DB_POOL_MAX_SIZE:20}`).

## Pendiente de B.4 (no en este cambio)
- Revertir la config de test del **lab** (directAccessGrants, cert self-signed, usuarios fixture) — vive en el
  int-lab demo, aislado de prod; se documentó la frontera. La **rotación** de credenciales demo es una acción
  operativa sobre los servicios vivos, no un cambio de repo.
