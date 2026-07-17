# Datos de prueba MT101 (10.000 registros) — para QA

Archivos listos para que el usuario de prueba procese el **money-path MT101 outbound** de punta a punta.
Todos traen el MISMO esquema de 8 columnas que lee el pipeline:

`dni , nombre , cuenta , moneda , monto , bic , concepto , cargos`

| Archivo | Formato | Filas | Para qué |
|---|---|---|---|
| **mt101-10k.csv** | CSV (coma) | 10.000 | **El principal**: se procesa con el reader CSV del flujo E2E |
| **mt101-10k.xlsx** | Excel | 10.000 | Abrir/inspeccionar la data; o probar el reader Excel |
| **mt101-10k.txt** | TXT ancho fijo | 10.000 | Probar el reader TXT (posiciones fijas) |
| **mt101-6.csv** | CSV | 6 | Humo rápido (idéntico al ejemplo del documento) |
| **mt101-1m.csv** | CSV | 1.000.000 | Escala (E2E‑22/NF‑01). **No se commitea** (~94 MB); se genera con `node gen-mt101-1m.cjs` (o `node gen-mt101-1m.cjs 100000` para 100k) |

> Los datos son sintéticos y válidos: `monto` siempre > 0 con 2 decimales; 80% PEN / 20% USD; `cargos` en OUR/SHA/BEN; `bic`, `concepto` y `nombre` en juego de caracteres SWIFT-X (sin acentos ni ñ). Con esta data las 10.000 filas deben terminar en **SENT** (camino feliz).

---

## 1) Dónde va el archivo (dejar en la fuente por docker)

Los puertos SFTP/FTP/MinIO **no están expuestos al host**, así que se copia dentro del contenedor:

```bash
# SFTP (recomendado) — la Fuente SFTP apunta a /upload/mt101-10k.csv (ruta COMPLETA al archivo)
docker cp mt101-10k.csv ih-int-sftp-source:/home/ihsource/upload/

# alternativas
docker cp mt101-10k.csv ih-int-ftp-source:/ftp/ihftp/          # FTP
docker cp mt101-10k.csv ih-int-minio:/tmp/ && \
  docker exec ih-int-minio mc cp /tmp/mt101-10k.csv local/ih-source-inbox/   # S3/MinIO
```

Luego: **menú Procesos → abrir el proceso MT101 outbound → Ejecutar** y verificar por la vista
**Ejecuciones → pestaña Tareas** (ver el documento de casos, módulo **E2E**).

---

## 2) Config del reader según el formato (menú Lectores / Readers)

### CSV — `mt101-10k.csv`  (usar este para el flujo E2E)
- Tipo = **CSV** · Delimiter = `,` · Encoding = `UTF-8` · Data starts at row = **2** (hay cabecera)
- Campos por **posición**: `dni`(1) `nombre`(2) `cuenta`(3) `moneda`(4) `monto`(5, Type=NUMBER) `bic`(6) `concepto`(7) `cargos`(8)

### Excel — `mt101-10k.xlsx`
- Tipo = **XLSX** · Sheet index = `0` · Data starts at row = `2` · Trim values = `ON`
- Mismos 8 campos por posición que el CSV

### TXT ancho fijo — `mt101-10k.txt`  (ancho total = 111)
- Tipo = **TXT** · Encoding = `UTF-8` · Campos por Start/End:

| Campo | Start | End | Ancho |
|---|---|---|---|
| dni | 1 | 8 | 8 |
| nombre | 9 | 38 | 30 |
| cuenta | 39 | 52 | 14 |
| moneda | 53 | 55 | 3 |
| monto | 56 | 67 | 12 |
| bic | 68 | 78 | 11 |
| concepto | 79 | 108 | 30 |
| cargos | 109 | 111 | 3 |

---

## 3) Mapeo BUILD (CSV → MT101) — referencia

`moneda`→currency · `monto`→amount · `cuenta`→beneficiary account · `nombre`+`dni`→beneficiary ·
`bic`→institution BIC · `concepto`→remittance · `cargos`→details of charges.
Envelope: `senderLt=SGOBFRPPAXXX` · `receiverLt=BCPLPEPLXXXX`.

Con `maxTransactionsPerFragment=2`, 10.000 transacciones → **5.000 fragmentos**.
Verificación esperada (pestaña Tareas): `FILE_READ` Escritos=10000 · `PAY` enviados=10000 aceptados=10000 · `STATUS` confirmados=10000.
