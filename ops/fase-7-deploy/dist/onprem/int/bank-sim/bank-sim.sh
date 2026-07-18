#!/bin/sh
# bank-sim: "cerebro" del banco simulado. Comparte el volumen del ih-int-sftp-bank.
# Vigila el inbox (donde MT101_PAY deja el FIN por SFTP con upload-with-rename) y escribe
# un ACK/NAK en el outbox (lo que MT101_STATUS lee por SFTP y clasifica por acceptedTokens=['ACK']
# / rejectedTokens=['NAK']). Decision por :20: (nombre del archivo):
#   NACK*/*REJ*  -> NAK (rechazo del banco)
#   PDE*/DLY*    -> pendiente unos ciclos y luego ACK (simula pago diferido / demora del banco)
#   resto        -> ACK (aceptado)
IN=/home/bank/inbox
OUT=/home/bank/outbox
DONE=/home/bank/processed
PDE_CYCLES=4
mkdir -p "$OUT" "$DONE"
echo "[bank-sim] watching $IN ; ACK/NACK -> $OUT ; procesados -> $DONE"
while true; do
  for f in "$IN"/*; do
    [ -e "$f" ] || continue
    base=$(basename "$f")
    # nunca tocar un upload en progreso (patron .part de upload-with-rename)
    case "$base" in *.part) continue ;; esac
    ref="${base%.*}"
    case "$ref" in
      NACK*|*REJ*) tok=NAK ;;
      PDE*|DLY*)   tok=PENDING ;;
      *)           tok=ACK ;;
    esac
    if [ "$tok" = "PENDING" ]; then
      c=$(cat "$DONE/$ref.cnt" 2>/dev/null || echo 0)
      c=$((c + 1)); echo "$c" > "$DONE/$ref.cnt"
      if [ "$c" -lt "$PDE_CYCLES" ]; then
        echo "[bank-sim] $ref PDE ciclo $c/$PDE_CYCLES (sin ACK aun -> STATUS vera PENDING)"
        continue
      fi
      tok=ACK
    fi
    # Contenido = TOKEN PELADO (ACK|NAK). NO incluir el :20: en el contenido: un ref que dispara NAK
    # (empieza con "NACK") contiene la subcadena "ACK" y haria match con acceptedTokens=['ACK'] -> ambiguo.
    # STATUS-SFTP no extrae referenceField, asi que la trazabilidad va por el nombre del archivo (<ref>.ack).
    printf '%s\n' "$tok" > "$OUT/$ref.ack"
    mv "$f" "$DONE/$base" 2>/dev/null || rm -f "$f"
    echo "[bank-sim] $ref -> $tok  (ack: $OUT/$ref.ack)"
  done
  sleep 2
done
