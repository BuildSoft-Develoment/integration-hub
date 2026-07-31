# Diseño — ISO 20022 (pain.001)
> ## ⚠️ `MT101_BUILD` ya no existe
>
> Este documento configura y prescribe el task type `MT101_BUILD`. **Se des-registro** por no
> escalar a alto volumen: la clase sobrevive como colaborador interno pero no implementa
> `TaskProvider`, asi que el registry no la expone y no es seleccionable. La unica ruta de
> construccion es `MT101_BUILD_FROM_TABLE`, que pagina desde `staging_record`.
>
> Catalogo vigente, generado desde el codigo:
> [90.17-catalogo-de-tipos](../../docs/transversal/90.17-catalogo-de-tipos.md).
>
> Este diseno ademas cita `provider/task/payments/iso20022/format/Pain001XmlFormatter.java`, ruta que
> ya no existe: el vertical ISO 20022 vive en `vertical-iso20022/`.
> **Estado**: **bootstrap activo** (formatter implementado + tests). Documenta
> cómo se integra ISO 20022 `pain.001` a la vertical 008 sin romper
> compatibilidad con el sub-catálogo `swift/`.
>
> Cubre la tarea **T-027** de [spec-tareas.md](spec-tareas.md).
>
> **Implementado en `Pain001XmlFormatter`** (commit del slice 4.3):
> - `provider/task/payments/iso20022/format/Pain001XmlFormatter.java`
> - 10 tests cubriendo grupo header, payment info, debtor/creditor, ChrgBr,
>   escapado XML, namespace.
>
> Para usarlo: configurar `MT101_BUILD` con `configuration.format = "PAIN001_XML"`.
> No requiere task type nuevo (confirma la estrategia de un solo modelo).

## Contexto

SWIFT migra la mensajería de pagos del formato FIN (MT101/MT103) al formato MX
basado en ISO 20022 XML (`pain.001.001.xx`). Los bancos del sistema CBPR+
ya operan ISO 20022 nativo desde 2023; los reguladores (BIS, SBS PE, BCRA,
BdF) lo exigen progresivamente.

**Equivalencia funcional**:

| MT101 (FIN)            | pain.001 (ISO 20022)               |
|------------------------|------------------------------------|
| Block 4 + tags         | `CstmrCdtTrfInitn` XML element     |
| `:20:` Sender's Ref    | `GrpHdr/MsgId`                     |
| `:28D:` Index/Total    | Implícito en `NbOfTxs` + msg split |
| `:30:` Execution Date  | `PmtInfo/ReqdExctnDt`              |
| `:50a:` Ordering       | `Dbtr` + `DbtrAcct`                |
| Sequence B (txs)       | `PmtInf/CdtTrfTxInf[]`             |
| `:32B:` Amount         | `CdtTrfTxInf/Amt/InstdAmt`         |
| `:59a:` Beneficiary    | `Cdtr` + `CdtrAcct`                |
| `:70:` Remittance      | `RmtInf/Ustrd` o `Strd`            |
| `:71A:` Charges        | `ChrgBr` (`DEBT/CRED/SHAR`)        |

Las semánticas son **isomorfas en ~95%**; las diferencias son sintácticas
(XML vs FIN tags) y de granularidad (ISO 20022 permite más sub-estructura).

## Estrategia de integración

### 1. Reutilizar el modelo de dominio existente

`Mt101Message` ya captura las nuevas estructuras requeridas:
- `Envelope` → mapea a `GrpHdr`
- `SequenceA` → mapea a `PmtInf` (Payment Information)
- `Transaction` → mapea a `CdtTrfTxInf`
- `Party` → mapea a `PartyIdentification`/`CashAccount`
- `Amount` → mapea a `ActiveOrHistoricCurrencyAndAmount`

**Decisión**: NO crear `Pain001Message` paralelo. El mismo `Mt101Message` se
formatea como FIN o como ISO 20022 según el `format` de configuración. Esto
preserva una sola fuente de verdad y permite que `MT101_VALIDATE`,
`MT101_ARCHIVE`, `MT101_PAY`, `MT101_ROUTE`, `MT101_SPLIT` y `MT101_REPAIR`
funcionen sin cambios para ambos estándares.

### 2. Nuevo formato `PAIN001_XML` en `PaymentMessageFormatter`

```java
@ApplicationScoped
public class Pain001XmlFormatter implements PaymentMessageFormatter {
    public static final String FORMAT_ID = "PAIN001_XML";
    @Override public String format() { return FORMAT_ID; }
    @Override public String format(Mt101Message message) {
        // Mapea Mt101Message → CstmrCdtTrfInitn XML siguiendo el schema
        // pain.001.001.09.xsd (versión SWIFT CBPR+ 2024).
    }
}
```

**Sin task type nuevo**: `MT101_BUILD` con `configuration.format = "PAIN001_XML"`
emite ISO 20022. El SPI ya soporta extensión por nombre de formato.

> Decisión opcional (renombrado): si se prefiere nombre más genérico, renombrar
> el task type a `PAYMENT_BUILD` con `messageType: "MT101"|"PAIN001"|"PACS008"`.
> Migración: alias el viejo `MT101_BUILD` a `PAYMENT_BUILD` en
> `TaskTypeRegistry` cuando M-1a (T-015 spec 003) lande.

### 3. Schema validation contra XSD oficiales

ISO 20022 distribuye los schemas oficiales en
`https://www.iso20022.org/iso20022-message-definitions`. Las versiones
relevantes:

- `pain.001.001.09` (CBPR+ 2024, vigente en SWIFT)
- `pain.001.001.11` (2025+, opcional según calendario del banco)

La validación XSD se hace en `MT101_VALIDATE` añadiendo un nuevo
`ValidationPredicate` que llame al `XmlValidator` JAXP nativo (sin nuevas
dependencias). El XSD se carga desde recursos versionados:

```
src/main/resources/payments/iso20022/pain.001.001.09.xsd
src/main/resources/payments/iso20022/CommonTypes.xsd
src/main/resources/payments/iso20022/SwiftCommonTypes.xsd
```

**No incluir los XSD en el repo público** sin verificar licencia ISO 20022
(distribución gratuita pero con términos). Cargar desde un módulo privado o
artifact privado.

### 4. Transporte sin cambios

`RestPaymentTransport` y `SftpPaymentTransport` envían el `rawPayload` opaco
(string/bytes); no necesitan saber el formato. Solo el `Content-Type` del
REST se ajusta:

| Formato      | Content-Type                            |
|--------------|-----------------------------------------|
| `JSON`       | `application/json`                      |
| `XML`        | `application/xml`                       |
| `FIN`        | `application/x-swift-mt`                |
| `PAIN001_XML`| `application/xml; charset=utf-8`        |

La extensión del `MT101_PAY` `rest.contentType` actual ya cubre este caso.

### 5. Inbound: reader y parser

**Estado: implementado** (junio 2026). Tres componentes simétricos al outbound:

- **`Pain001XmlReaderProvider`** (`provider/reader/`, registrado en catálogo
  002 con `READER_TYPE = "PAIN001_XML"`). Parsea el XML usando JAXP nativo del
  JDK (sin nuevas dependencias) con XXE deshabilitado (`disallow-doctype-decl`,
  entidades externas off, `FEATURE_SECURE_PROCESSING`). Emite **un `ReadRecord`
  por mensaje** con shape estructurado: `messageId`, `creationDateTime`,
  `numberOfTransactions`, `controlSum`, `initiatingPartyName`,
  `paymentInformation` (`paymentInfoId`, `paymentMethod`,
  `requestedExecutionDate`, `debtorName/Account/AgentBic`, `transactions[]`).

- **`Pain001ToMt101Mapper`** (`provider/task/payments/iso20022/mapper/`). Mapper
  puro shape XML → `Mt101Message`. Cargos inversos (simetría exacta con
  `Pain001XmlFormatter.translateCharges`):
  `DEBT→OUR`, `CRED→BEN`, `SHAR→SHA`, `SLEV`/desconocidos→`SHA`.
  Agrega `controlTotals` por moneda durante el mapping; numera transacciones
  desde 1.

- **`Pain001ParseTaskProvider`** (task type `PAIN001_PARSE`). Análogo a
  `MT101_PARSE` pero consumiendo el shape pain.001. Soporta dos formas de input
  (reader directo via `readResult` o embebido via `configuration.input.sourceTaskRef`).
  Publica outputs multi-nominados M-3: `records`, `envelopes`, `headers`,
  `transactions`, `summary`, `errors`. Errores per-record se capturan sin
  abortar el batch.

**Pipeline reusado sin cambios**: la salida `records` es `List<Mt101Message>`
con `format = "PAIN001_XML"`, consumible por `MT101_VALIDATE`, `MT101_ARCHIVE`,
`MT101_PAY`, `MT101_STATUS`, `MT101_ROUTE`, `MT101_SPLIT` y `MT101_REPAIR` sin
modificaciones. El nombre `MT101_*` permanece por compatibilidad — su renombrado
a `PAYMENT_*` queda como decisión arquitectónica ligada a M-1a.

**Cobertura de tests**:
- `Pain001XmlReaderProviderTest` (7 tests): GrpHdr+PmtInf+1 tx, múltiples txs
  preservando orden, campos opcionales omitidos, XXE rechazado, XML mal formado,
  documento sin `CstmrCdtTrfInitn`.
- `Pain001ToMt101MapperTest` (10 tests): mapping completo, charge codes
  inversos, `ChrgBr` ausente, agregación de `controlTotals`, numeración
  secuencial, fallback `paymentInfoId`, validación de `amount`/`date`, shape
  null/sin `paymentInformation`.
- `Pain001ParseTaskProviderTest` (6 tests): mapeo desde reader, fallback a
  `taskOutputs`, conversión de `Map` a `ReadRecord`, captura de errores
  per-record, skip si batch vacío.

**Conciliación de confirmaciones MX** (`pacs.002`, `camt.054`) sigue siendo un
placeholder separado — se activa cuando aparezca el caso de uso (al igual que
en SWIFT FIN, donde `MT101_STATUS` ya cubre el equivalente).

## Trabajo concreto futuro (cuando se priorice)

| Item                                  | Esfuerzo | Bloqueado por |
|---------------------------------------|----------|---------------|
| `Pain001XmlFormatter`                 | M (2-3d) | XSDs licencia |
| `ValidationPredicate` XSD-based       | M (2d)   | Pain001Formatter |
| Testcases golden para `pain.001.001.09` | M (3d) | XSDs + ejemplos |
| Renombrar enum a `PAYMENT_*`          | L (5d)   | M-1a backend  |
| ~~Reader `iso20022-xml` para inbound~~ | ~~M (3d)~~ | **DONE** (junio 2026) |
| Schema validation contra CBPR+ rules  | L (5d+)  | guía bancaria |

## Open questions

1. **¿Solo outbound o también inbound?** Si solo outbound, el alcance baja a
   formatter + validator (1 sprint).
2. **¿Reusar `MT101_*` o renombrar a `PAYMENT_*`?** Decisión arquitectónica
   ligada a M-1a; recomendable diferirla hasta que pase el backend.
3. **¿Distribución de XSDs?** Si licencia permite, incluir en repo. Si no,
   requiere artifact privado o carga desde URL en runtime con cache.
4. **Versionado**: ¿soportar múltiples versiones de `pain.001` simultáneamente
   (e.g., `.09` y `.11`)? El `PaymentMessageFormatter.format()` permite
   diferenciarlas (`PAIN001_XML_009`, `PAIN001_XML_011`).

## Decisión de no-acción inmediata

Para 2025 SWIFT FIN (MT101) sigue siendo el formato dominante en LatAm
(Perú, Argentina, Chile, México). El sub-catálogo `swift/` cubre el caso
real. ISO 20022 se activa cuando:
- Un cliente concreto pida pain.001
- SWIFT obligue migración (cutoff actual: noviembre 2025 para CBPR+ full)
- Apareza un caso regulatorio nuevo

Mientras tanto, **mantener este doc como compromiso técnico** y revisar
trimestralmente.

## Referencias

- [ISO 20022 Message Definitions](https://www.iso20022.org/iso20022-message-definitions)
- [SWIFT CBPR+ Guidelines](https://www.swift.com/standards/iso-20022)
- [ADR-009 vertical de mensajería de pagos](../../docs/fase-3-arquitectura/adr/ADR-009-vertical-mensajeria-pagos.md)
- [spec-tecnica.md sección "Componentes esperados"](spec-tecnica.md)
