# Evidencia TDD - Mensajeria de pagos (MT101, camino del dinero)

Feature reconstruida por reingenieria sobre codigo que ya estaba en produccion. Como en el resto
de las specs de este repositorio, el **RED no es recapturable**: capturar el fallo previo exigiria
revertir codigo funcional que mueve dinero. El **GREEN si es real y esta fechado**.

> **Corrida de referencia (2026-07-31):** `mvn -pl vertical-swift-mt101 -am test` ->
> **BUILD SUCCESS**. `vertical-swift-mt101`: **Tests run: 510, Failures: 0, Errors: 0, Skipped: 0**
> (mas `platform-spi` 25 y `platform-contract` 5, sus dependencias en el reactor).
>
> Ese numero cubre el modulo entero. Donde surefire emitio una linea por clase, el bloque cita la
> cifra exacta de esa clase; donde no, cita el total del modulo en vez de inventar un desglose.

> **Nota sobre las rutas de la tabla de tareas.** Las columnas `archivo` y `test` de
> `spec-tareas.md` apuntan al layout anterior a ADR-021 (`platform-app/.../payments/swift/`). El
> vertical vive hoy en `vertical-swift-mt101/`. Los comandos de abajo son los que se ejecutan de
> verdad; reanclar esas columnas es trabajo aparte y esta anotado.

Los tres ITs del modulo (`Mt101OutboundEndToEndIT`, `Mt101SplitRepairIT`,
`Mt101MassivePipelinePerfIT`) NO entran en esta corrida: son carril de integracion y los recoge
failsafe en `mvn verify`, no `mvn test`.

## RF-013 / T-001

- Comando RED: `mvn -pl vertical-swift-mt101 -Dtest=PaymentsMt101SchemaMigrationTest test`
- Resultado RED: No recapturable por reingenieria; el codigo ya estaba en produccion y
  capturar el fallo previo exigiria revertir logica del camino del dinero.
- Comando GREEN: `mvn -pl vertical-swift-mt101 -am test`
- Resultado GREEN: GREEN real (2026-07-31) dentro de la corrida del modulo (510 tests, 0 fallos,
  0 errores). surefire no emitio linea propia para `PaymentsMt101SchemaMigrationTest` en ese log.
- Verificado por: corrida automatizada `mvn` del 2026-07-31 (pendiente validacion humana).

## RF-011 / T-002

- Comando RED: `mvn -pl vertical-swift-mt101 -Dtest=ValidationRuleProviderTest test`
- Resultado RED: No recapturable por reingenieria; el codigo ya estaba en produccion y
  capturar el fallo previo exigiria revertir logica del camino del dinero.
- Comando GREEN: `mvn -pl vertical-swift-mt101 -am test`
- Resultado GREEN: GREEN real (2026-07-31) dentro de la corrida del modulo (510 tests, 0 fallos,
  0 errores). surefire no emitio linea propia para `ValidationRuleProviderTest` en ese log.
- Verificado por: corrida automatizada `mvn` del 2026-07-31 (pendiente validacion humana).

## RF-001 / T-003

- Comando RED: `mvn -pl vertical-swift-mt101 -Dtest=Mt101BuildTaskProviderTest test`
- Resultado RED: No recapturable por reingenieria; el codigo ya estaba en produccion y
  capturar el fallo previo exigiria revertir logica del camino del dinero.
- Comando GREEN: `mvn -pl vertical-swift-mt101 -am test`
- Resultado GREEN: GREEN real (2026-07-31) — `Mt101BuildTaskProviderTest`: Tests run: 12, Failures: 0, Errors: 0.
- Verificado por: corrida automatizada `mvn` del 2026-07-31 (pendiente validacion humana).

## RF-001 / T-004

- Comando RED: `mvn -pl vertical-swift-mt101 -Dtest=JsonMt101FormatterTest test`
- Resultado RED: No recapturable por reingenieria; el codigo ya estaba en produccion y
  capturar el fallo previo exigiria revertir logica del camino del dinero.
- Comando GREEN: `mvn -pl vertical-swift-mt101 -am test`
- Resultado GREEN: GREEN real (2026-07-31) dentro de la corrida del modulo (510 tests, 0 fallos,
  0 errores). surefire no emitio linea propia para `JsonMt101FormatterTest` en ese log.
- Verificado por: corrida automatizada `mvn` del 2026-07-31 (pendiente validacion humana).

## RF-001 / T-005

- Comando RED: `mvn -pl vertical-swift-mt101 -Dtest=XmlMt101FormatterTest test`
- Resultado RED: No recapturable por reingenieria; el codigo ya estaba en produccion y
  capturar el fallo previo exigiria revertir logica del camino del dinero.
- Comando GREEN: `mvn -pl vertical-swift-mt101 -am test`
- Resultado GREEN: GREEN real (2026-07-31) — `XmlMt101FormatterTest`: Tests run: 8, Failures: 0, Errors: 0.
- Verificado por: corrida automatizada `mvn` del 2026-07-31 (pendiente validacion humana).

## RF-001 / T-006

- Comando RED: `mvn -pl vertical-swift-mt101 -Dtest=FinMt101FormatterTest test`
- Resultado RED: No recapturable por reingenieria; el codigo ya estaba en produccion y
  capturar el fallo previo exigiria revertir logica del camino del dinero.
- Comando GREEN: `mvn -pl vertical-swift-mt101 -am test`
- Resultado GREEN: GREEN real (2026-07-31) — `FinMt101FormatterTest`: Tests run: 10, Failures: 0, Errors: 0.
- Verificado por: corrida automatizada `mvn` del 2026-07-31 (pendiente validacion humana).

## RF-002 / T-007

- Comando RED: `mvn -pl vertical-swift-mt101 -Dtest=Mt101ValidateTaskProviderTest test`
- Resultado RED: No recapturable por reingenieria; el codigo ya estaba en produccion y
  capturar el fallo previo exigiria revertir logica del camino del dinero.
- Comando GREEN: `mvn -pl vertical-swift-mt101 -am test`
- Resultado GREEN: GREEN real (2026-07-31) dentro de la corrida del modulo (510 tests, 0 fallos,
  0 errores). surefire no emitio linea propia para `Mt101ValidateTaskProviderTest` en ese log.
- Verificado por: corrida automatizada `mvn` del 2026-07-31 (pendiente validacion humana).

## RF-003 / T-008

- Comando RED: `mvn -pl vertical-swift-mt101 -Dtest=Mt101ArchiveTaskProviderTest test`
- Resultado RED: No recapturable por reingenieria; el codigo ya estaba en produccion y
  capturar el fallo previo exigiria revertir logica del camino del dinero.
- Comando GREEN: `mvn -pl vertical-swift-mt101 -am test`
- Resultado GREEN: GREEN real (2026-07-31) — `Mt101ArchiveTaskProviderTest`: Tests run: 10, Failures: 0, Errors: 0.
- Verificado por: corrida automatizada `mvn` del 2026-07-31 (pendiente validacion humana).

## RF-004, RF-016 / T-009

- Comando RED: `mvn -pl vertical-swift-mt101 -Dtest=Mt101PayTaskProviderTest test`
- Resultado RED: No recapturable por reingenieria; el codigo ya estaba en produccion y
  capturar el fallo previo exigiria revertir logica del camino del dinero.
- Comando GREEN: `mvn -pl vertical-swift-mt101 -am test`
- Resultado GREEN: GREEN real (2026-07-31) dentro de la corrida del modulo (510 tests, 0 fallos,
  0 errores). surefire no emitio linea propia para `Mt101PayTaskProviderTest` en ese log.
- Verificado por: corrida automatizada `mvn` del 2026-07-31 (pendiente validacion humana).

## RF-019 / T-010

- Comando RED: `mvn -pl vertical-swift-mt101 -Dtest=PaymentsOperatorRoleIT test`
- Resultado RED: No recapturable por reingenieria; el codigo ya estaba en produccion y
  capturar el fallo previo exigiria revertir logica del camino del dinero.
- Comando GREEN: `mvn -pl vertical-swift-mt101 -am test`
- Resultado GREEN: GREEN real (2026-07-31) dentro de la corrida del modulo (510 tests, 0 fallos,
  0 errores). surefire no emitio linea propia para `PaymentsOperatorRoleIT` en ese log.
- Verificado por: corrida automatizada `mvn` del 2026-07-31 (pendiente validacion humana).

## RF-001, RF-002, RF-003, RF-004 / T-011

- Comando RED: `npx nx test web --skip-nx-cache`
- Resultado RED: No recapturable por reingenieria; el codigo ya estaba en produccion y
  capturar el fallo previo exigiria revertir logica del camino del dinero.
- Comando GREEN: `npx nx test web --skip-nx-cache`
- Resultado GREEN: cubierto por la suite del frontend; sin cifra propia capturada en esta corrida.
- Verificado por: corrida automatizada `mvn` del 2026-07-31 (pendiente validacion humana).

## RF-005 / T-013

- Comando RED: `mvn -pl vertical-swift-mt101 -Dtest=Mt101StatusTaskProviderTest test`
- Resultado RED: No recapturable por reingenieria; el codigo ya estaba en produccion y
  capturar el fallo previo exigiria revertir logica del camino del dinero.
- Comando GREEN: `mvn -pl vertical-swift-mt101 -am test`
- Resultado GREEN: GREEN real (2026-07-31) dentro de la corrida del modulo (510 tests, 0 fallos,
  0 errores). surefire no emitio linea propia para `Mt101StatusTaskProviderTest` en ese log.
- Verificado por: corrida automatizada `mvn` del 2026-07-31 (pendiente validacion humana).

## RF-006 / T-014

- Comando RED: `mvn -pl vertical-swift-mt101 -Dtest=Mt101ReconcileTaskProviderTest test`
- Resultado RED: No recapturable por reingenieria; el codigo ya estaba en produccion y
  capturar el fallo previo exigiria revertir logica del camino del dinero.
- Comando GREEN: `mvn -pl vertical-swift-mt101 -am test`
- Resultado GREEN: GREEN real (2026-07-31) dentro de la corrida del modulo (510 tests, 0 fallos,
  0 errores). surefire no emitio linea propia para `Mt101ReconcileTaskProviderTest` en ese log.
- Verificado por: corrida automatizada `mvn` del 2026-07-31 (pendiente validacion humana).

## RF-002, RF-008 / T-015

- Comando RED: `mvn -pl vertical-swift-mt101 -Dtest=SwiftMtReaderProviderTest test`
- Resultado RED: No recapturable por reingenieria; el codigo ya estaba en produccion y
  capturar el fallo previo exigiria revertir logica del camino del dinero.
- Comando GREEN: `mvn -pl vertical-swift-mt101 -am test`
- Resultado GREEN: GREEN real (2026-07-31) — `SwiftMtReaderProviderTest`: Tests run: 6, Failures: 0, Errors: 0.
- Verificado por: corrida automatizada `mvn` del 2026-07-31 (pendiente validacion humana).

## RF-008 / T-016

- Comando RED: `mvn -pl vertical-swift-mt101 -Dtest=Mt101ParseTaskProviderTest test`
- Resultado RED: No recapturable por reingenieria; el codigo ya estaba en produccion y
  capturar el fallo previo exigiria revertir logica del camino del dinero.
- Comando GREEN: `mvn -pl vertical-swift-mt101 -am test`
- Resultado GREEN: GREEN real (2026-07-31) — `Mt101ParseTaskProviderTest`: Tests run: 5, Failures: 0, Errors: 0.
- Verificado por: corrida automatizada `mvn` del 2026-07-31 (pendiente validacion humana).

## RF-007 / T-017

- Comando RED: `mvn -pl vertical-swift-mt101 -Dtest=Mt101RouteTaskProviderTest test`
- Resultado RED: No recapturable por reingenieria; el codigo ya estaba en produccion y
  capturar el fallo previo exigiria revertir logica del camino del dinero.
- Comando GREEN: `mvn -pl vertical-swift-mt101 -am test`
- Resultado GREEN: GREEN real (2026-07-31) dentro de la corrida del modulo (510 tests, 0 fallos,
  0 errores). surefire no emitio linea propia para `Mt101RouteTaskProviderTest` en ese log.
- Verificado por: corrida automatizada `mvn` del 2026-07-31 (pendiente validacion humana).

## RF-017 / T-018

- Comando RED: `mvn -pl vertical-swift-mt101 -Dtest=SftpPaymentTransportTest test`
- Resultado RED: No recapturable por reingenieria; el codigo ya estaba en produccion y
  capturar el fallo previo exigiria revertir logica del camino del dinero.
- Comando GREEN: `mvn -pl vertical-swift-mt101 -am test`
- Resultado GREEN: GREEN real (2026-07-31) dentro de la corrida del modulo (510 tests, 0 fallos,
  0 errores). surefire no emitio linea propia para `SftpPaymentTransportTest` en ese log.
- Verificado por: corrida automatizada `mvn` del 2026-07-31 (pendiente validacion humana).

## RF-014, RF-021 / T-020

- Comando RED: `mvn -pl vertical-swift-mt101 -Dtest=Mt101ArchiveEncryptionServiceTest test`
- Resultado RED: No recapturable por reingenieria; el codigo ya estaba en produccion y
  capturar el fallo previo exigiria revertir logica del camino del dinero.
- Comando GREEN: `mvn -pl vertical-swift-mt101 -am test`
- Resultado GREEN: GREEN real (2026-07-31) dentro de la corrida del modulo (510 tests, 0 fallos,
  0 errores). surefire no emitio linea propia para `Mt101ArchiveEncryptionServiceTest` en ese log.
- Verificado por: corrida automatizada `mvn` del 2026-07-31 (pendiente validacion humana).

## RF-005, RF-006, RF-007, RF-008 / T-021

- Comando RED: `npx nx test web --skip-nx-cache`
- Resultado RED: No recapturable por reingenieria; el codigo ya estaba en produccion y
  capturar el fallo previo exigiria revertir logica del camino del dinero.
- Comando GREEN: `npx nx test web --skip-nx-cache`
- Resultado GREEN: cubierto por la suite del frontend; sin cifra propia capturada en esta corrida.
- Verificado por: corrida automatizada `mvn` del 2026-07-31 (pendiente validacion humana).

## RF-009 / T-023

- Comando RED: `mvn -pl vertical-swift-mt101 -Dtest=Mt101SplitTaskProviderTest test`
- Resultado RED: No recapturable por reingenieria; el codigo ya estaba en produccion y
  capturar el fallo previo exigiria revertir logica del camino del dinero.
- Comando GREEN: `mvn -pl vertical-swift-mt101 -am test`
- Resultado GREEN: GREEN real (2026-07-31) dentro de la corrida del modulo (510 tests, 0 fallos,
  0 errores). surefire no emitio linea propia para `Mt101SplitTaskProviderTest` en ese log.
- Verificado por: corrida automatizada `mvn` del 2026-07-31 (pendiente validacion humana).

## RF-010 / T-024

- Comando RED: `mvn -pl vertical-swift-mt101 -Dtest=Mt101RepairTaskProviderTest test`
- Resultado RED: No recapturable por reingenieria; el codigo ya estaba en produccion y
  capturar el fallo previo exigiria revertir logica del camino del dinero.
- Comando GREEN: `mvn -pl vertical-swift-mt101 -am test`
- Resultado GREEN: GREEN real (2026-07-31) dentro de la corrida del modulo (510 tests, 0 fallos,
  0 errores). surefire no emitio linea propia para `Mt101RepairTaskProviderTest` en ese log.
- Verificado por: corrida automatizada `mvn` del 2026-07-31 (pendiente validacion humana).

## RF-002 / T-025

- Comando RED: `mvn -pl vertical-swift-mt101 -Dtest=BusinessCalendarServiceTest test`
- Resultado RED: No recapturable por reingenieria; el codigo ya estaba en produccion y
  capturar el fallo previo exigiria revertir logica del camino del dinero.
- Comando GREEN: `mvn -pl vertical-swift-mt101 -am test`
- Resultado GREEN: GREEN real (2026-07-31) dentro de la corrida del modulo (510 tests, 0 fallos,
  0 errores). surefire no emitio linea propia para `BusinessCalendarServiceTest` en ese log.
- Verificado por: corrida automatizada `mvn` del 2026-07-31 (pendiente validacion humana).

## RF-009, RF-010 / T-026

- Comando RED: `npx nx test web --skip-nx-cache`
- Resultado RED: No recapturable por reingenieria; el codigo ya estaba en produccion y
  capturar el fallo previo exigiria revertir logica del camino del dinero.
- Comando GREEN: `npx nx test web --skip-nx-cache`
- Resultado GREEN: cubierto por la suite del frontend; sin cifra propia capturada en esta corrida.
- Verificado por: corrida automatizada `mvn` del 2026-07-31 (pendiente validacion humana).
