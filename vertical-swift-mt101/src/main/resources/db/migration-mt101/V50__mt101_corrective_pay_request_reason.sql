-- v22 (auditoria del maker-checker): la SOLICITUD de PAY (paso del maker) hoy registra quien y
-- cuando (pay_requested_by/at) pero NO el motivo ni el ticket de negocio que justifica el envio
-- correctivo. Se agrega evidencia durable del porque de la solicitud, simetrica a la auditoria de
-- resolucion (V49). Sin fallback: la solicitud de PAY deja rastro de motivo/ticket.
alter table vertical_mt101.mt101_rebuild_run
    add column if not exists pay_request_reason text,
    add column if not exists pay_request_ticket varchar(120);
