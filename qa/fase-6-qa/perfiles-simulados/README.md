# Perfiles bancarios SIMULADOS — homologación interna

> **IMPORTANTE**: estos perfiles son **ficticios**. No representan las reglas
> reales de ningún banco. Su propósito es ejercitar el flujo completo de
> onboarding/homologación (import → validación → gates) en ambientes de prueba,
> para asegurar el pase a producción **antes** de contar con las guías H2H
> reales. Las reglas reales se cargan por ambiente desde las guías licenciadas
> del banco (ver [perfiles-banco.md](../../../specs/008-mensajeria-pagos/perfiles-banco.md)).

## Perfiles incluidos

| Archivo | ruleSet | Simula |
|---|---|---|
| `bank-sim-estricto.json` | `bank:SIM-ESTRICTO` | Banco conservador: solo PEN, tope 50.000 PEN/tx, solo SHA, sin `:77B:`, beneficiario opción `""`/`F`, remittance ≤ 70, máx 50 txs/mensaje. |
| `bank-sim-flexible.json` | `bank:SIM-FLEXIBLE` | Banco permisivo: PEN/USD/EUR, tope 500.000 PEN (warning), SHA/OUR, remittance ≤ 140. |

## Cómo cargarlos (la misma vía que producción)

```bash
curl -X POST https://<ambiente>/api/payment-validation-rules/import \
  -H "Authorization: Bearer <token-platform-admin>" \
  -H "Content-Type: application/json" \
  -d @bank-sim-estricto.json
```

Para bases locales/dev donde se requiere dejar filas visibles directamente en
`public.payment_validation_rule`, usar el seed idempotente:

```bash
psql -h localhost -p 5432 -U postgres -d bdtrama \
  -f qa/fase-6-qa/perfiles-simulados/payment-validation-rule-seed.sql
```

El resultado esperado son 13 reglas activas: 8 para `bank:SIM-ESTRICTO` y 5
para `bank:SIM-FLEXIBLE`. Si la tabla no existe, primero debe levantarse la app
o aplicar migraciones hasta V14.

Y configurar el proceso de prueba con la segunda pasada de validación:

```jsonc
{ "taskType": "MT101_VALIDATE", "configuration": { "ruleSet": "structural-mvp" } }
{ "taskType": "MT101_VALIDATE", "configuration": { "ruleSet": "bank:SIM-ESTRICTO" } }
```

## Cobertura automatizada

`BankProfileHomologationIT` importa `bank:SIM-ESTRICTO` vía el endpoint real y
verifica: mensaje conforme pasa sin issues; cada regla detecta su violación con
el código esperado; y en flujo masivo el gate de fragmentos marca
`VALIDATED`/`REJECTED` individualmente. Es la plantilla a replicar como golden
files cuando llegue la guía real de cada banco.
