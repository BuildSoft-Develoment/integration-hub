-- Locking optimista para la correccion de filas en cuarentena (PATCH staging-row).
-- Evita lost-update cuando dos operadores corrigen la misma fila: el cliente lee la
-- version (estilo ETag), la reenvia en If-Match y el UPDATE solo aplica si coincide.
alter table staging_record
    add column if not exists version bigint not null default 0;
