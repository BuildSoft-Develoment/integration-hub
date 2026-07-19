-- ADR-016: /sources bidireccional (Entrada/Salida). direction = INPUT (default) | OUTPUT | BOTH.
-- FILE_READ exige INPUT|BOTH; FILE_DELIVER exige OUTPUT|BOTH. Las filas existentes quedan INPUT,
-- asi ningun source actual cambia de comportamiento.
alter table source_definition add column if not exists direction varchar(10) not null default 'INPUT';
