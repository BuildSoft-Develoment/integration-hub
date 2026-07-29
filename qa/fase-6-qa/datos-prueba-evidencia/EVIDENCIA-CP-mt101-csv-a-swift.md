# CP — CSV → SWIFT MT101 → evidencia

**Objetivo:** un solo **CSV** de pagos entra al money-path MT101 outbound; el proceso **configura y
genera los mensajes SWIFT MT101** (persistidos en BD) y de ahí se **extraen como evidencia** los archivos.

- **Entorno:** stack de integración nativo, `https://localhost:8443/appih/`.
- **Proceso:** `proc-mt101-qa` (id 1). **Ejecución:** id **23** (disparada por scheduler).
- **Resultado:** **3 archivos SWIFT MT101** (por fragmentación), completos, validados y archivados.

---

## 1. Entrada — `cp-mt101.csv` (60 registros)

Un único CSV de **60 pagos**, esquema de 8 columnas: `dni, nombre, cuenta, moneda, monto, bic, concepto, cargos`.
Muestra (primeras filas):

```
dni,nombre,cuenta,moneda,monto,bic,concepto,cargos
10000001,BENEFICIARIO 001 SAC,000000000001,PEN,237.50,BCPLPEPLXXX,PAGO PROVEEDOR 001,OUR
10000002,BENEFICIARIO 002 SAC,000000000002,PEN,375.00,BCPLPEPLXXX,PAGO PROVEEDOR 002,BEN
10000003,BENEFICIARIO 003 SAC,000000000003,PEN,512.50,BCPLPEPLXXX,PAGO PROVEEDOR 003,SHA
...  (60 filas; 80% PEN / 20% USD; cargos cíclicos SHA/OUR/BEN)
```

Entró al proceso **por SFTP** (`ih-int-sftp-source:/home/ihsource/upload/cp-mt101.csv`).

---

## 2. Proceso — cadena de tareas y resultado (ejecución 23)

| # | Tarea | Estado | Resultado |
|---|---|---|---|
| 1 | FILE_READ (SFTP + reader CSV) | ✅ COMPLETED | **60** registros válidos, 0 descartados |
| 2 | DB_WRITE (staging_record) | ✅ COMPLETED | 60 registros staged |
| 3 | **MT101_BUILD_FROM_TABLE** | ✅ COMPLETED | **3 fragmentos** para 60 filas |
| 4 | MT101_VALIDATE (structural-mvp) | ✅ COMPLETED | messages=3, **invalid=0**, issues=0 |
| 5 | MT101_ARCHIVE | ✅ COMPLETED | 3 mensajes archivados (8244 bytes) |
| 6 | MT101_PAY (envío al banco, REST) | ⚠️ FAILED | mock gateway no desplegado — *ver nota* |

> **Por qué 3 archivos SWIFT (fragmentación):** el build parte el lote en mensajes de a
> `maxTransactionsPerMessage=20`. **60 transacciones ÷ 20 = 3 fragmentos**, y cada fragmento es un
> mensaje MT101 independiente (un `.fin`).

> **Nota MT101_PAY (paso 6):** el *envío* al banco está configurado por REST contra
> `http://ih-mock-gw/pay`, un **gateway mock que no está desplegado** en este stack → invalida los 3.
> Esto es la **entrega al banco**, NO la generación del SWIFT: los 3 mensajes se **construyeron,
> validaron y archivaron** OK (pasos 3-5), así que la evidencia SWIFT es completa y válida.
> Para el envío real: repuntar el PAY a `transport=SFTP` contra `ih-int-sftp-bank` (que sí está arriba).

---

## 3. Salida — los 3 archivos SWIFT MT101 (evidencia)

| Archivo | `:20:` | `:28D:` | Transacciones | Bytes |
|---|---|---|---|---|
| `mt101-archivo-1-P23-1.fin` | P23-1 | 1/3 | 20 (T1–T20) | 2739 |
| `mt101-archivo-2-P23-2.fin` | P23-2 | 2/3 | 20 (T21–T40) | 2754 |
| `mt101-archivo-3-P23-3.fin` | P23-3 | 3/3 | 20 (T41–T60) | 2754 |
| `mt101-swift-completo.fin` | — | — | 60 (los 3 juntos) | 8247 |

Cada archivo es un MT101 completo (bloques `{1:}{2:}{3:}{4:...}{5:}`). Estructura del archivo 1:

```
{1:F01SGOBFRPPAXXX0000000000}{2:I101BCPLPEPLXXXXN}{3:{121:<uetr>}}{4:
:20:P23-1                <- sender's reference (único por corrida)
:28D:1/3                 <- fragmento 1 de 3
:50H:/001-10200200       <- ordering customer (EMPRESA QA SAC / LIMA PE)
EMPRESA QA SAC
LIMA PE
:30:260718               <- requested execution date
:21:T1                   <- transaction reference (1ra de 20)
:32B:PEN237,5            <- currency + amount
:57A:BCPLPEPLXXX         <- account with institution (bic)
:59:/000000000001        <- beneficiary account
BENEFICIARIO 001 SAC     <- beneficiary name
10000001
:70:PAGO PROVEEDOR 001   <- remittance info (concepto)
:71A:OUR                 <- details of charges (cargos)
...                      <- T2 .. T20 (mismo patrón)
-}{5:{CHK:000000000000}}
```

### Mapeo CSV → MT101

| Columna CSV | Campo MT101 | Tag FIN |
|---|---|---|
| `moneda` + `monto` | monto de la transacción | `:32B:` |
| `cuenta` | cuenta del beneficiario | `:59:` |
| `nombre` + `dni` | nombre del beneficiario | `:59:` |
| `bic` | institución del beneficiario | `:57A:` |
| `concepto` | información de remesa | `:70:` |
| `cargos` | detalle de cargos | `:71A:` |
| (config) ordering customer | ordenante | `:50H:` |
| (config) `P${execId}-${msgIndex}` | referencia del emisor | `:20:` |

---

## 4. Cómo reproducirlo

1. Dejar el CSV en la fuente: `docker cp cp-mt101.csv ih-int-sftp-source:/home/ihsource/upload/`.
2. Disparar `proc-mt101-qa` (id 1): UI (Procesos → Ejecutar) o scheduler
   (`update process_definition set scheduled=true, schedule_every='30s', next_run_at='2020-01-01' where id=1;`
   y desactivar tras la corrida).
3. Extraer los `.fin`: `select raw_payload from mt101_build_fragment where fragment_set_id='QA-<execId>' order by fragment_index`.

> **Ajustes aplicados a `proc-mt101-qa` en la BD del stack para este CP:**
> - Fuente SFTP (id 1) → `/upload/cp-mt101.csv`.
> - `MT101_BUILD_FROM_TABLE`: `maxTransactionsPerMessage=20` (60÷20 = 3 archivos) y
>   `sendersReferenceTemplate=P${_processExecutionId}-${messageIndex}` (`:20:` único por corrida →
>   re-ejecutable sin chocar con el guard de idempotencia del archive).
> - Para más/menos archivos: cambiar la cantidad de filas del CSV o `maxTransactionsPerMessage`
>   (p. ej. 100 filas ÷ 20 = 5 archivos).
