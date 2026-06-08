# ADR-009 Vertical de mensajeria de pagos como spec separada del motor

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR-006 Fuentes de almacenamiento cloud](ADR-006-fuentes-almacenamiento-cloud.md)
- Siguiente: [Indice docs](../../README.md)
<!-- nav-guided:end -->

## Estado

Propuesto.

## Contexto

La plataforma necesita soportar mensajeria financiera (MT101 SWIFT en sprint 1, con
extension prevista a MT103/MT202/MT940 y, en paralelo, ISO 20022 `pain.001`/`pacs.008` y
APIs Open Banking). El analisis inicial considero anadir los task types
`MT101_BUILD`, `MT101_VALIDATE`, `MT101_PAY`, etc. como evolucion del spec
[003-diseno-y-ejecucion-procesos](../../../specs/003-diseno-y-ejecucion-procesos/spec-funcional.md).

Tres revisiones independientes coincidieron en que esa via viola los principios
arquitectonicos que el propio repo ya impone:

- **SRP**: spec 003 es el motor generico de pipelines; conocer Sequence A/B, NVR,
  `:50H:`, `:32B:`, ACK/NACK lo convierte en motor + dominio.
- **OCP**: el SPI `TaskProvider` esta abierto a extension, pero el enum `TaskType` y
  el frontend `process-form-factory` son cerrados; verticales nuevas obligan a editar
  el modulo central.
- **DIP**: el motor (bajo nivel, estable) y el dominio SWIFT (alto nivel, regulado)
  deben tener direccion de dependencia clara: dominio depende del motor, no al reves.
- **Bounded context (DDD)**: orquestacion y mensajeria de pagos son contextos
  distintos con vocabulario distinto.

El propio repo ya establece el patron: catalogos verticales
([001-catalogo-fuentes](../../../specs/001-catalogo-fuentes/spec-funcional.md),
[002-catalogo-readers](../../../specs/002-catalogo-readers/spec-funcional.md),
[005-catalogo-conexiones](../../../specs/005-catalogo-conexiones/spec-funcional.md))
+ orquestador horizontal (003) + preocupaciones transversales (004 observabilidad,
006 scheduling).

## Decision

Crear una **spec vertical nueva** dedicada a la mensajeria de pagos:

```
specs/008-mensajeria-pagos/
├── spec-funcional.md
├── spec-tecnica.md
└── spec-tareas.md
```

El alcance del spec 008 es **broad** desde el inicio (mensajeria de pagos en general),
con sub-catalogos internos por estandar:

```
008-mensajeria-pagos/
  └── (conceptualmente)
      ├── swift/        ← MT101, MT103, MT202, MT900/MT910, MT940/MT942
      ├── iso20022/     ← pain.001, pain.002, pacs.008, camt.053, camt.054
      └── openbanking/  ← PSD2/Open Banking APIs (UK OBIE, BdF DSP2, etc.)
```

Cada sub-catalogo aporta task types con prefijo del estandar: `MT101_*`,
`PAIN001_*`, `OB_*`. Los task types comparten el contrato del motor
(`taskRef`, `executionMode`, `input/inputs`, `outputs`) y se registran via SPI.

### Direccion de dependencias

```
008-mensajeria-pagos  ──depends─►  003-diseno-y-ejecucion-procesos   (SPI TaskProvider)
                      ──depends─►  002-catalogo-readers              (reader swift-mt, etc.)
                      ──depends─►  005-catalogo-conexiones           (gateway REST, SFTP, MQ)
                      ──depends─►  004-observabilidad-y-auditoria    (atributos OTel de dominio)
```

El motor 003 **no importa nada** de 008. Si se elimina 008, el motor sigue compilando
y corriendo procesos no-pagos.

### Lo que cambia en spec 003

Solo cierre de deuda del motor (no conocimiento de dominio):

- **M-1a** `TaskTypeRegistry` backend: abrir el enum `TaskType` a extension via SPI.
- **M-1b** Mecanismo de descubrimiento de formularios en el frontend Nx: permitir que
  features verticales (`features/payments-swift/`, `features/payments-iso20022/`,
  `features/payments-openbanking/`) registren sus formularios sin tocar
  `process-form-factory.service.ts`.
- **M-2** Tareas long-running con suspend/resume cross-restart (necesario para
  `MT101_STATUS` poll, callbacks ISO 20022, polling Open Banking).
- **M-3** Outputs multi-nominados (una tarea publica `<ref>.header`, `<ref>.envelope`,
  `<ref>.transactions` como outputs distintos del mismo tipo `summary`/`records`).

### Reglas de validacion de estandares (NVR SWIFT, ISO 20022 schemas)

No se enumeran codigos especificos (C1/C3/T26/...) en el spec funcional o tecnico:

- Las reglas SWIFT NVR son propiedad intelectual de SWIFT (FIN UG licenciado).
- Las reglas ISO 20022 viven en XSD distribuidos por iso20022.org.
- Las reglas Open Banking dependen del regulador (OBIE UK, BdF, BCRA, SBS PE, etc.).

El spec 008 define un **catalogo de reglas parametrizable** y el SPI para cargarlas
desde fuente licenciada o configuracion del cliente. La implementacion concreta de las
reglas es responsabilidad del despliegue, no del SDD.

## Consecuencias

### Positivas

- Cada vertical (SWIFT/ISO20022/Open Banking) evoluciona sin tocar el motor.
- Auditoria regulatoria acotada: el auditor lee solo 008 + sub-catalogo correspondiente.
- Ownership por equipo (Plataforma vs Pagos) sin disputas de PRs cruzados.
- Bundle frontend modular: feature lazy-loaded por sub-catalogo.
- Test pyramid limpia: tests de dominio fuera del build del motor.
- Reutilizacion para futuras verticales financieras (ACH local, conciliacion, AML, etc.).

### Negativas / costos

- Refactor `TaskType` enum → `TaskTypeRegistry` (M-1a) es trabajo del motor, paga deuda real.
- Mecanismo de extension del frontend (M-1b) es trabajo del motor, paga deuda real.
- Sub-modulo Maven opcional para 008 (decision diferida; aceptable un solo modulo
  con separacion logica al inicio).
- Mayor numero de archivos a mantener (3 docs por spec, 3 sub-catalogos en 008).

### Riesgos

- Sin M-1b el frontend queda acoplado y la separacion SOLID se queda a medias.
- Sin M-2 las tareas async (`MT101_STATUS`, callbacks Open Banking) no son
  productivas; se cae a scheduler externo.
- Sin politica clara de NVR/schema license, el equipo de dominio puede pegar codigos
  oficiales en el repo y crear riesgo legal.

## Alternativas consideradas

1. **Extender spec 003** con todos los task types MT101_*. Rechazada por las tres
   revisiones SOLID; mezcla motor con dominio.
2. **Spec 008 estricto solo SWIFT FIN** (`008-mensajeria-swift`). Rechazada porque
   ISO 20022 y Open Banking ya estan en roadmap; el nombre estricto fuerza un
   `009-mensajeria-iso20022` paralelo con duplicacion.
3. **Spec por estandar** (`008-swift`, `009-iso20022`, `010-openbanking` separados).
   Rechazada porque comparten el mismo SPI y las mismas tablas de auditoria/conciliacion
   a nivel pagos; separarlos fuerza duplicacion.

## Plantilla para futuras verticales

Cualquier vertical financiera adicional (ACH local, AML, conciliacion contable, tax
filing) sigue el mismo patron: spec NNN propio, depende de 003 via SPI, dependencias
explicitas a 001/002/005 segun necesidad, sin importar nada de otras verticales.

## Referencias

- [ADR-004 Motor de tareas con inputs y outputs tipados](ADR-004-motor-input-output-tareas.md)
- [ADR-005 Unificacion de peticion HTTP](ADR-005-unificacion-peticion-http.md)
- [spec 003 diseno y ejecucion de procesos](../../../specs/003-diseno-y-ejecucion-procesos/spec-funcional.md)
- [spec 008 mensajeria de pagos](../../../specs/008-mensajeria-pagos/spec-funcional.md)
- Notas de analisis MT101: `.tmp/mt101/00-...20-task-types-mt101.txt` (notas de
  desarrollo, no parte formal del spec).
