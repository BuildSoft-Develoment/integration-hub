-- @trace spec 008-mensajeria-pagos RF-013 (modelo de datos sub-catalogo swift/)
-- @trace spec 008-mensajeria-pagos T-001 (tabla ejecutable de tareas)
-- ADR-009 vertical de mensajeria de pagos

create schema if not exists vertical_mt101;

-- El comentario del esquema es metadata cosmetica, pero `comment on schema` exige ser DUENO DEL
-- ESQUEMA (verificado: un rol con USAGE+CREATE recibe "must be owner of schema vertical_mt101",
-- aunque en ese mismo esquema si puede crear tablas). Eso ocurre justo en el patron de minimo
-- privilegio que un banco impone: el DBA precrea `vertical_mt101` y concede USAGE/CREATE al rol de
-- la aplicacion. Sin esta guarda, la instalacion se caia por una linea decorativa.
do $$
begin
    if pg_catalog.pg_has_role(current_user,
                              (select nspowner from pg_catalog.pg_namespace where nspname = 'vertical_mt101'),
                              'USAGE') then
        execute 'comment on schema vertical_mt101 is '
                || quote_literal('ADR-023: objetos del vertical SWIFT MT101. El motor no escribe aqui.');
    end if;
end
$$;

-- ---------------------------------------------------------------------------------------------------
-- ADR-023: search_path A NIVEL DE BASE DE DATOS, no solo del datasource de la aplicacion.
--
-- El DDL de aqui en adelante cualifica el schema, pero el SQL del vertical en Java NO: sus ~231
-- sentencias nombran las tablas a secas. Eso funciona porque `vertical_mt101` esta en el search_path.
--
-- Y no basta con declararlo en application.properties: la mayoria de las tareas MT101 llega a la base
-- por una `connection_definition` que apunta a la propia plataforma, y esos pools los construye
-- ConnectionPoolManager.createJdbcDataSource() solo con lo que trae esa fila (url, credenciales,
-- initialSql, jdbcProperties). NO heredan el `currentSchema` del datasource por defecto. Fijarlo en la
-- base lo hereda toda sesion nueva: aplicacion, pools por connectionRef, scripts que entran por psql y
-- consultas manuales de operacion.
--
-- `public` va primero: ahi viven el motor, staging_record y flyway_schema_history.
--
-- Fijar el search_path en la BASE exige ser su DUENO (un rol no-dueno responde "must be owner of
-- database"). No se degrada a `alter role current_user`, que solo cubriria a este usuario y dejaria
-- fuera precisamente los pools configurados con otras credenciales.
--
-- LO QUE SE COMPRUEBA ES EL ESTADO ALCANZADO, NO EL PRIVILEGIO.
--
-- La version anterior preguntaba solo "¿soy dueno?" y, si no, fallaba con un hint que decia
-- "ejecutalo como administrador y reintenta". Ese hint era un CALLEJON SIN SALIDA: el administrador
-- ejecutaba el ALTER DATABASE, se reintentaba la migracion, y volvia a fallar exactamente igual,
-- porque el rol de la aplicacion seguia sin ser dueno y el guard nunca miraba si el search_path ya
-- estaba puesto. En una instalacion bancaria real -donde el banco no concede la propiedad de la
-- base, que es justo el escenario para el que se escribio el hint- el arranque quedaba en un bucle
-- del que no se sale sin editar esta migracion.
--
-- Ahora: si el search_path de la base ya incluye el esquema del vertical, la migracion sigue sin
-- pedir ningun privilegio (el DBA ya hizo su parte). Solo se exige ser dueno cuando hay que fijarlo.
-- ---------------------------------------------------------------------------------------------------
do $$
declare
    v_config text;
begin
    -- Ajustes fijados a nivel de BASE (setrole = 0 => aplican a toda sesion, no a un rol concreto).
    select coalesce(array_to_string(s.setconfig, ','), '')
      into v_config
      from pg_catalog.pg_db_role_setting s
     where s.setdatabase = (select oid from pg_catalog.pg_database where datname = current_database())
       and s.setrole = 0;

    if coalesce(v_config, '') like '%vertical_mt101%' then
        -- Ya esta puesto por un administrador. No hace falta ser dueno.
        return;
    end if;

    if not pg_catalog.pg_has_role(current_user, (select datdba from pg_database
                                                 where datname = current_database()), 'USAGE') then
        raise exception using
            message = 'ADR-023: se necesita ser dueno de la base para fijar el search_path',
            detail  = format('El usuario %I no es dueno de %I y la base no tiene el search_path fijado.',
                             current_user, current_database()),
            hint    = format('Un administrador debe ejecutar UNA de estas dos, y despues se reintenta '
                             'la migracion sin mas cambios: '
                             '(1) ALTER DATABASE %I SET search_path = public, vertical_mt101;  '
                             '-- esta migracion detecta que ya esta puesto y no vuelve a pedir el privilegio.  '
                             '(2) GRANT <rol_dueno_de_la_base> TO %I;  -- concede la propiedad efectiva al rol de la aplicacion.',
                             current_database(), current_user);
    end if;

    execute format('alter database %I set search_path = public, vertical_mt101', current_database());
end
$$;

-- Envelope SWIFT (multi-MT: 101, 103, 202, 900, 910, 940, 942)
create table if not exists vertical_mt101.swift_message_envelope (
    id bigserial primary key,
    message_type char(3) not null,
    sender_lt char(12),
    receiver_lt char(12),
    session bigint,
    sequence bigint,
    uetr varchar(36),
    priority char(1),
    raw_payload text,
    payload_hash char(64),
    parsed_at timestamp not null default current_timestamp,
    source_file_name varchar(255),
    process_execution_id bigint references process_execution(id) on delete set null
);

create unique index if not exists ux_swift_envelope_uetr
    on vertical_mt101.swift_message_envelope (sender_lt, uetr)
    where uetr is not null;

create index if not exists ix_swift_envelope_type_parsed
    on vertical_mt101.swift_message_envelope (message_type, parsed_at);

-- Archivo inmutable MT101 (sec A)
create table if not exists vertical_mt101.mt101_archive (
    id bigserial primary key,
    envelope_id bigint references vertical_mt101.swift_message_envelope(id) on delete set null,
    senders_reference varchar(16) not null,
    customer_specified_reference varchar(16),
    message_index integer,
    message_total integer,
    requested_execution_date date,
    instructing_party_kind char(1),
    instructing_party_value text,
    ordering_customer_kind char(1),
    ordering_customer_account varchar(34),
    ordering_customer_name_addr text,
    account_servicing_kind char(1),
    account_servicing_value text,
    status varchar(20) not null default 'PENDING',
    format char(4),
    created_at timestamp not null default current_timestamp,
    retention_until date
);

create unique index if not exists ux_mt101_archive_idempotency
    on vertical_mt101.mt101_archive (senders_reference, requested_execution_date);

create index if not exists ix_mt101_archive_status
    on vertical_mt101.mt101_archive (status, created_at);

-- Transacciones MT101 (sec B, repetitiva)
create table if not exists vertical_mt101.mt101_transaction (
    id bigserial primary key,
    archive_id bigint not null references vertical_mt101.mt101_archive(id) on delete cascade,
    sequence_number integer not null,
    transaction_reference varchar(16) not null,
    fx_deal_reference varchar(16),
    instruction_code varchar(35),
    amount_currency char(3) not null,
    amount_value numeric(18,3) not null,
    ordering_customer_kind char(1),
    ordering_customer_account varchar(34),
    ordering_customer_name_addr text,
    account_servicing_kind char(1),
    account_servicing_value text,
    intermediary text,
    account_with_institution text,
    beneficiary_kind char(1),
    beneficiary_account varchar(34),
    beneficiary_name_addr text,
    remittance_information text,
    regulatory_reporting text,
    original_amount_currency char(3),
    original_amount_value numeric(18,3),
    details_of_charges char(3) not null,
    charges_account varchar(34),
    exchange_rate numeric(15,8)
);

create unique index if not exists ux_mt101_transaction_ref
    on vertical_mt101.mt101_transaction (archive_id, transaction_reference);

create index if not exists ix_mt101_transaction_currency
    on vertical_mt101.mt101_transaction (amount_currency);

-- Issues de validacion (NVR y otras reglas del catalogo)
create table if not exists vertical_mt101.mt101_validation_issue (
    id bigserial primary key,
    archive_id bigint references vertical_mt101.mt101_archive(id) on delete cascade,
    transaction_id bigint references vertical_mt101.mt101_transaction(id) on delete cascade,
    rule_code varchar(20) not null,
    rule_set varchar(50) not null,
    severity char(1) not null,
    message text,
    detected_at timestamp not null default current_timestamp
);

create index if not exists ix_mt101_validation_archive
    on vertical_mt101.mt101_validation_issue (archive_id);

create index if not exists ix_mt101_validation_rule
    on vertical_mt101.mt101_validation_issue (rule_set, rule_code);

-- Confirmaciones recibidas (MT900/MT910/STATUS_API)
create table if not exists vertical_mt101.mt101_confirmation (
    id bigserial primary key,
    archive_id bigint references vertical_mt101.mt101_archive(id) on delete cascade,
    confirmation_type varchar(10) not null,
    gateway_reference varchar(35),
    confirmed_status varchar(20),
    raw_payload text,
    received_at timestamp not null default current_timestamp
);

create index if not exists ix_mt101_confirmation_archive
    on vertical_mt101.mt101_confirmation (archive_id);

-- Excepciones de conciliacion (cruce N:N enviados vs confirmados)
create table if not exists vertical_mt101.mt101_reconciliation_exception (
    id bigserial primary key,
    as_of_date date not null,
    archive_id bigint references vertical_mt101.mt101_archive(id) on delete set null,
    confirmation_id bigint references vertical_mt101.mt101_confirmation(id) on delete set null,
    exception_type varchar(30) not null,
    details text,
    resolved_at timestamp
);

create index if not exists ix_mt101_recon_asof
    on vertical_mt101.mt101_reconciliation_exception (as_of_date, exception_type);

-- Catalogo de reglas de validacion (parametrizable, sin enumerar codigos en spec)
create table if not exists vertical_mt101.payment_validation_rule (
    id bigserial primary key,
    rule_set varchar(50) not null,
    code varchar(20) not null,
    standard varchar(20) not null,
    applies_to varchar(50) not null,
    severity char(1) not null,
    predicate_kind varchar(20) not null,
    predicate_body text not null,
    active boolean not null default true
);

create unique index if not exists ux_payment_rule
    on vertical_mt101.payment_validation_rule (rule_set, code, applies_to);
