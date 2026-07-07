-- Seed QA/dev para perfiles bancarios simulados de spec 008.
-- No contiene reglas reales de bancos. Las reglas reales bank:* se cargan
-- por ambiente desde guias H2H licenciadas.
--
-- Requisitos:
-- - La migracion V12 debe haber creado public.payment_validation_rule.
-- - La migracion V14 debe haber ampliado payment_validation_rule.code a 80.
--
-- Uso local:
-- psql -h localhost -p 5432 -U postgres -d integration_hub -f qa/fase-6-qa/perfiles-simulados/payment-validation-rule-seed.sql

insert into public.payment_validation_rule
    (rule_set, code, standard, applies_to, severity, predicate_kind, predicate_body, active)
values
    ('bank:SIM-ESTRICTO', 'SIM.DATE_REQUIRED', 'SWIFT', 'MT101', 'E', 'FIELD_REQUIRED', '{"path": "sequenceA.requestedExecutionDate"}', true),
    ('bank:SIM-ESTRICTO', 'SIM.NO_REGULATORY', 'SWIFT', 'MT101', 'E', 'FIELD_FORBIDDEN', '{"path": "transactions[].regulatoryReporting"}', true),
    ('bank:SIM-ESTRICTO', 'SIM.BENE_OPTION', 'SWIFT', 'MT101', 'E', 'OPTION_ALLOWED', '{"path": "transactions[].beneficiary.option", "allowed": ["", "F"]}', true),
    ('bank:SIM-ESTRICTO', 'SIM.REMITTANCE_LEN', 'SWIFT', 'MT101', 'W', 'MAX_LENGTH', '{"path": "transactions[].remittanceInformation", "max": 70}', true),
    ('bank:SIM-ESTRICTO', 'SIM.CURRENCY', 'SWIFT', 'MT101', 'E', 'CURRENCY_ALLOWED', '{"allowed": ["PEN"]}', true),
    ('bank:SIM-ESTRICTO', 'SIM.AMOUNT_CAP', 'SWIFT', 'MT101', 'E', 'AMOUNT_MAX', '{"max": "50000.00", "currency": "PEN"}', true),
    ('bank:SIM-ESTRICTO', 'SIM.CHARGES_SHA', 'SWIFT', 'MT101', 'E', 'CHARGES_ALLOWED', '{"allowed": ["SHA"]}', true),
    ('bank:SIM-ESTRICTO', 'SIM.MAX_TXS', 'SWIFT', 'MT101', 'E', 'JEXL', '{"expression": "message.transactions().size() <= 50"}', true),
    ('bank:SIM-FLEXIBLE', 'SIMFLEX.DATE_REQUIRED', 'SWIFT', 'MT101', 'E', 'FIELD_REQUIRED', '{"path": "sequenceA.requestedExecutionDate"}', true),
    ('bank:SIM-FLEXIBLE', 'SIMFLEX.CURRENCY', 'SWIFT', 'MT101', 'E', 'CURRENCY_ALLOWED', '{"allowed": ["PEN", "USD", "EUR"]}', true),
    ('bank:SIM-FLEXIBLE', 'SIMFLEX.AMOUNT_CAP_PEN', 'SWIFT', 'MT101', 'W', 'AMOUNT_MAX', '{"max": "500000.00", "currency": "PEN"}', true),
    ('bank:SIM-FLEXIBLE', 'SIMFLEX.CHARGES', 'SWIFT', 'MT101', 'E', 'CHARGES_ALLOWED', '{"allowed": ["SHA", "OUR"]}', true),
    ('bank:SIM-FLEXIBLE', 'SIMFLEX.REMITTANCE_LEN', 'SWIFT', 'MT101', 'W', 'MAX_LENGTH', '{"path": "transactions[].remittanceInformation", "max": 140}', true)
on conflict (rule_set, code, applies_to) do update set
    standard = excluded.standard,
    severity = excluded.severity,
    predicate_kind = excluded.predicate_kind,
    predicate_body = excluded.predicate_body,
    active = excluded.active;

select rule_set, count(*) as rules
from public.payment_validation_rule
where rule_set in ('bank:SIM-ESTRICTO', 'bank:SIM-FLEXIBLE')
group by rule_set
order by rule_set;
