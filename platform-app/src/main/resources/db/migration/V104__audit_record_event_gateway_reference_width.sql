-- @trace ADR-010 (traza por registro: gatewayReference es obligatorio en toda trama de pago)
--
-- La columna nacio con varchar(120) pensando en una referencia devuelta por un gateway REST, que es corta.
-- Pero MT101_PAY por SFTP no recibe ninguna respuesta del banco y usa como referencia el DROP PATH remoto
-- completo (SftpPaymentTransport: `return TransportResult.accepted(dropPath, ...)`), al que la politica
-- RENAME_WITH_SUFFIX ademas le anade "." + epochMillis. Una ruta de deposito real con subdirectorios por
-- entidad y fecha supera los 120 caracteres con facilidad.
--
-- Hasta ahora eso no se notaba porque la trama por registro de MT101_PAY dejaba el slot a null y la columna
-- estaba SIEMPRE vacia. Al empezar a poblarla, un dropPath largo haria fallar el INSERT de auditoria
-- -PostgreSQL no trunca: responde "value too long for type character varying(120)"- y la trama caeria al
-- spool/dead-letter. Se ensancha ANTES de poblar.
--
-- No se trunca nunca: una referencia bancaria recortada es una referencia falsa, y en una disputa vale menos
-- que no tener ninguna.
alter table audit_record_event alter column gateway_reference type varchar(255);

-- Con la columna poblada, la referencia del banco pasa a ser un punto de entrada real para el lineage
-- ("que paso con el pago que el banco acuso como X"). Parcial porque la inmensa mayoria de tramas de
-- registro no son de pago y no la llevan.
create index if not exists ix_audit_record_event_gateway_reference
    on audit_record_event (gateway_reference)
    where gateway_reference is not null;
