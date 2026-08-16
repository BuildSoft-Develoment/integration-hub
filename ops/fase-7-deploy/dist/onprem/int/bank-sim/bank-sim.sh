#!/bin/sh
# bank-sim: "cerebro" del banco simulado (DEV/TEST ONLY).
#
# QUE CAMBIO Y POR QUE
# Antes compartia el volumen del contenedor ih-int-sftp-bank y trabajaba sobre directorios locales.
# Ese contenedor ya no existe: un servidor SFTP es justo lo que si tiene equivalente gratuito
# gestionado, asi que el destino del money-path es ahora una cuenta SFTP en la nube. Lo que NO se
# puede contratar es el cerebro del banco, asi que bank-sim se queda — pero hablando SFTP por red.
#
# Vigila el inbox (donde MT101_PAY deja el FIN con upload-with-rename) y escribe un ACK/NAK en el
# outbox (lo que MT101_STATUS lee y clasifica por acceptedTokens=['ACK'] / rejectedTokens=['NAK']).
# Decision por :20: (nombre del archivo):
#   NACK*/*REJ*  -> NAK (rechazo del banco)
#   PDE*/DLY*    -> pendiente unos ciclos y luego ACK (simula pago diferido / demora del banco)
#   resto        -> ACK (aceptado)
#
# CREDENCIALES: por entorno, nunca en este fichero. SSHPASS lo lee sshpass del env, que evita que la
# clave aparezca en la linea de comandos (y por tanto en `ps` de cualquier proceso del contenedor).
set -eu

: "${BANK_SFTP_HOST:?falta BANK_SFTP_HOST}"
: "${BANK_SFTP_USER:?falta BANK_SFTP_USER}"
: "${SSHPASS:?falta SSHPASS (clave de la cuenta SFTP; se pasa por entorno, no por argumento)}"
BANK_SFTP_PORT="${BANK_SFTP_PORT:-22}"
IN="${BANK_SFTP_INBOX:-/inbox}"
OUT="${BANK_SFTP_OUTBOX:-/outbox}"
DONE="${BANK_SFTP_PROCESSED:-/processed}"
PDE_CYCLES="${BANK_SIM_PDE_CYCLES:-4}"
POLL_SECONDS="${BANK_SIM_POLL_SECONDS:-2}"
WORK="$(mktemp -d)"

# La huella del host de una cuenta gratuita cambia cuando la cuenta se recrea, asi que fijarla en
# known_hosts no se sostiene en integracion. Es una decision consciente y acotada a ESTE entorno: en
# produccion el destino es el banco de verdad, su huella es estable y esto NO debe viajar.
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR -P $BANK_SFTP_PORT"

# sshpass -e toma la clave de $SSHPASS; el batch va por stdin para no dejar rastro en argumentos.
#
# stdout y stderr NO se mezclan a proposito. Mezclarlos parecia comodo para loguear, pero el stdout de
# la variante `_listar` se recorre como si fueran nombres de fichero: un "Permission denied" o un
# "Connection closed" se convertiria en una entrada del bucle y acabaria publicando un ACK con el
# nombre de una palabra del error.
sftp_batch() {
  sshpass -e sftp $SSH_OPTS -b - "$BANK_SFTP_USER@$BANK_SFTP_HOST"
}

echo "[bank-sim] $BANK_SFTP_USER@$BANK_SFTP_HOST:$BANK_SFTP_PORT  $IN -> $OUT (procesados: $DONE)"
printf 'mkdir %s\nmkdir %s\nmkdir %s\nbye\n' "$IN" "$OUT" "$DONE" | sftp_batch >/dev/null 2>&1 || true

while true; do
  # ls -1 del inbox. Si la conexion falla, se reintenta en el siguiente ciclo en vez de morir: la
  # cuenta gratuita se recrea cada pocas horas y una caida no debe dejar el simulador muerto.
  # stdout se captura (son los nombres); stderr NO se silencia: fluye al log del contenedor. Mandarlo
  # a /dev/null dejaria una caida persistente de conexion invisible — el bucle giraria en vacio
  # pareciendo que el banco no tiene nada que procesar.
  listado=$(printf 'cd %s\nls -1\nbye\n' "$IN" | sftp_batch || true)

  for base in $listado; do
    # Lista BLANCA, no negra: solo se procesa lo que PAY deja de verdad (<sendersReference>.fin, ver
    # dropPathTemplate). Filtrar "lo que no parece fichero" obliga a adivinar cada formato de error y
    # cada eco del cliente sftp; exigir la forma esperada no deja hueco. De paso descarta los .part
    # (upload en progreso) sin una regla aparte.
    case "$base" in
      *.fin) ;;
      *) continue ;;
    esac

    ref="${base%.fin}"
    case "$ref" in
      NACK*|*REJ*) tok=NAK ;;
      PDE*|DLY*)   tok=PENDING ;;
      *)           tok=ACK ;;
    esac

    if [ "$tok" = "PENDING" ]; then
      c=$(cat "$WORK/$ref.cnt" 2>/dev/null || echo 0)
      c=$((c + 1)); echo "$c" > "$WORK/$ref.cnt"
      if [ "$c" -lt "$PDE_CYCLES" ]; then
        echo "[bank-sim] $ref PDE ciclo $c/$PDE_CYCLES (sin ACK aun -> STATUS vera PENDING)"
        continue
      fi
      tok=ACK
    fi

    # Contenido = TOKEN PELADO (ACK|NAK). NO incluir el :20:: un ref que dispara NAK (empieza con
    # "NACK") contiene la subcadena "ACK" y haria match con acceptedTokens=['ACK'] -> ambiguo.
    # STATUS-SFTP no extrae referenceField: la trazabilidad va por el nombre del archivo (<ref>.ack).
    printf '%s\n' "$tok" > "$WORK/$ref.ack"

    # El ACK se sube a un temporal y se renombra, igual que hace PAY al entregar. Sobre un volumen
    # compartido la escritura era casi instantanea; por red la ventana en la que STATUS podria leer
    # un .ack a medio escribir es real, y un ACK truncado se leeria como "ni ACK ni NAK".
    printf 'put %s %s/%s.ack.part\nrename %s/%s.ack.part %s/%s.ack\nrename %s/%s %s/%s\nbye\n' \
      "$WORK/$ref.ack" "$OUT" "$ref" \
      "$OUT" "$ref" "$OUT" "$ref" \
      "$IN" "$base" "$DONE" "$base" | sftp_batch >/dev/null || {
        echo "[bank-sim] WARN: no se pudo publicar el ACK de $ref; se reintenta en el proximo ciclo"
        continue
      }

    echo "[bank-sim] $ref -> $tok  (ack: $OUT/$ref.ack)"
  done

  sleep "$POLL_SECONDS"
done
