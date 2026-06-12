# Perfiles de validación por banco

> **Estado**: infraestructura implementada (junio 2026). Las reglas reales por
> banco son **datos del ambiente**, no del repositorio — misma política que las
> NVR licenciadas (ADR-009).
>
> Cubre RF-011 de [spec-funcional.md](spec-funcional.md).

## Concepto

El estándar MT101 es la base, pero cada banco impone restricciones propias en su
guía H2H: campos no soportados, opciones limitadas, monedas/montos permitidos,
longitudes. Un **perfil** es el conjunto de esas restricciones expresado como
filas de la tabla `payment_validation_rule` (V12) con `rule_set = 'bank:XXX'`.

**Separación código/datos**:

- El repositorio enumera **mecanismos** (`predicate_kind` genéricos) y un perfil
  sintético `bank:TEST` para tests.
- Las reglas de un banco concreto se cargan **por ambiente** (dev →
  homologación → prod) desde su guía H2H, vía catálogo/API/import. Nunca se
  commitean a este repo.

## Componentes

| Componente | Responsabilidad |
|---|---|
| `DbValidationRuleProvider` | Lee `payment_validation_rule` y sintetiza predicados. Convive con `CdiValidationRuleProvider` (reglas estructurales); el `ruleSet` los separa. Sin caché: editar una regla aplica en la siguiente ejecución. |
| `DbValidationPredicateFactory` | Un `ValidationPredicate` por fila según `predicate_kind`. |
| `Mt101MessagePathResolver` | Navega paths declarativos sobre `Mt101Message` por reflexión (agregar un campo al modelo lo hace navegable sin código nuevo). |
| `PaymentValidationRuleResource` | API REST `/api/payment-validation-rules` para listar, crear, editar, activar/desactivar, importar y exportar perfiles. Edicion restringida a `platform-admin`/`integration-admin`; lectura permitida a `auditor`. |
| Frontend `payment-rules` | Pantalla admin para gestionar perfiles, importar/exportar JSON y promover ruleSets entre ambientes. |

## Uso en el pipeline

```json
// Tarea 1: validación estructural (siempre)
{ "taskType": "MT101_VALIDATE", "configuration": { "ruleSet": "structural-mvp" } }

// Tarea 2: perfil del banco destino
{ "taskType": "MT101_VALIDATE", "configuration": { "ruleSet": "bank:BCP" } }
```

En flujo masivo (fragment source), cada `MT101_VALIDATE` marca los fragmentos
`VALIDATED`/`REJECTED` individualmente; el gate de `MT101_PAY` (solo `ARCHIVED`)
garantiza que ningún mensaje fuera de perfil llegue al banco.

Para persistir incidencias sin retenerlas completas en memoria, `MT101_VALIDATE`
acepta:

```json
{
  "publishIssuesTo": "table:mt101_validation_issue",
  "maxIssuesInOutput": 1000
}
```

`publishIssuesTo` tambien acepta forma objeto:
`{"connectionRef":"pagos-prod","table":"mt101_validation_issue"}`. La tarea
persiste todos los issues y solo deja una muestra configurable en el output
`errors`, junto con contadores completos (`issueCount`, `issuesBySeverity`).

## API de catalogo

```http
GET  /api/payment-validation-rules?ruleSet=bank:BCP&q=AMOUNT&status=active
POST /api/payment-validation-rules
PUT  /api/payment-validation-rules/{ruleId}
POST /api/payment-validation-rules/{ruleId}/activation/{active}
GET  /api/payment-validation-rules/export?ruleSet=bank:BCP
POST /api/payment-validation-rules/import
```

Payload de import:

```json
{
  "ruleSet": "bank:BCP",
  "replaceExisting": true,
  "rules": [
    {
      "code": "BCP.CURRENCY",
      "standard": "SWIFT",
      "appliesTo": "MT101",
      "severity": "E",
      "predicateKind": "CURRENCY_ALLOWED",
      "predicateBody": "{\"allowed\":[\"PEN\",\"USD\"]}",
      "active": true
    }
  ]
}
```

## Formato de `predicate_body` por `predicate_kind`

| Kind | Body (JSON) | Semántica |
|---|---|---|
| `FIELD_REQUIRED` | `{"path": "sequenceA.requestedExecutionDate"}` | Issue si el valor está ausente/vacío. |
| `FIELD_FORBIDDEN` | `{"path": "transactions[].regulatoryReporting"}` | Issue si el valor está presente. |
| `OPTION_ALLOWED` | `{"path": "transactions[].beneficiary.option", "allowed": ["", "F"]}` | Issue si el valor (no nulo) no está en la lista. Case-insensitive. |
| `MAX_LENGTH` | `{"path": "transactions[].remittanceInformation", "max": 105}` | Issue si el String excede `max`. |
| `CURRENCY_ALLOWED` | `{"allowed": ["PEN", "USD"]}` | Issue por transacción con moneda fuera de la lista. |
| `AMOUNT_MAX` | `{"max": "420000.00", "currency": "PEN"}` | Issue por transacción que excede `max`. `currency` opcional (sin ella aplica a todas). |
| `CHARGES_ALLOWED` | `{"allowed": ["SHA"]}` | Issue por transacción con `:71A:` fuera de la lista. |
| `JEXL` | `{"expression": "message.transactions().size() <= 50"}` | Invariante a nivel mensaje; `false` produce issue. Escape hatch para reglas no expresables con los kinds anteriores. |

**Paths**: segmentos = nombres de los record components del modelo
(`sequenceA`, `envelope`, `transactions[]`, `beneficiary`, `amount`, ...).
El prefijo `transactions[].` itera y produce un issue por transacción afectada
(con su `:21:` como referencia). Un eslabón `null` evalúa a valor ausente, no a
error.

**JEXL**: el modelo son records Java — los accessors van con paréntesis
(`message.transactions()`, no `message.transactions`). Las expresiones las
autora un `platform-admin` (config confiable, mismo nivel que MT101_ROUTE).

**Severidad** (`severity` char): `E` → ERROR, `W` → WARNING, `I` → INFO. La
política `failOn` de `MT101_VALIDATE` decide qué severidad bloquea.

## Onboarding de un banco

```
Guía H2H del banco (PDF/Excel)
        │  analista de integración traduce restricciones a filas
        ▼
Carga en DEV (catálogo/API/SQL) → golden files contra MT101_VALIDATE
        │
        ▼
HOMOLOGACIÓN: certificación con el banco (ajustes de reglas aquí)
        │
        ▼
Export/import a PROD + proceso configurado con ruleSet del banco
```

Sin desarrolladores ni deploys: un banco nuevo es carga de datos +
certificación.

## Dimensiones fuera de la validación

Las preferencias de **canal** (contentType, nombres de archivo SFTP, headers,
cut-off) y de **acuse** (formato del ACK) ya son configuración por tarea de
`MT101_PAY`/`MT101_STATUS` — un "perfil" ahí es una plantilla de configuración
del catálogo de procesos, no requiere motor nuevo.

## Homologación simulada (pre-producción)

Para asegurar el pase a producción sin esperar las guías reales, el repo
incluye perfiles **ficticios** en
[`qa/fase-6-qa/perfiles-simulados/`](../../qa/fase-6-qa/perfiles-simulados/README.md)
(`bank:SIM-ESTRICTO`, `bank:SIM-FLEXIBLE`) listos para importar por la vía
real (`POST /api/payment-validation-rules/import`).

`BankProfileHomologationIT` automatiza el ciclo completo: import vía API →
golden conforme pasa → cada regla detecta su violación con el código esperado
→ en flujo masivo el gate marca `VALIDATED`/`REJECTED` por fragmento con el
motivo auditado en `error_message`. Es la plantilla a replicar como golden
files cuando llegue la guía real de cada banco: se reemplaza el JSON simulado
por las filas traducidas de la guía y se ajustan los goldens.

## Pendiente

- Cargar perfiles reales de cada banco desde sus guias H2H licenciadas en el
  repositorio privado/configuracion del cliente, no en este template
  (la mecanica ya esta validada con los perfiles simulados).
- Certificacion formal con cada banco en homologacion.
