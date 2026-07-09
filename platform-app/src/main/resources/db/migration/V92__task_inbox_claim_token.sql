-- #4 (fencing por token de claim, concurrency-safe): hoy el claim del inbox re-toma un CLAIMED vivo si
-- inbox_owner = excluded.inbox_owner (para el retry in-app del mismo nodo). Ese clause es seguro SOLO bajo
-- @Blocking(ordered=true) + max-concurrency=1 (serializado por nodo): con ordered=false, dos entregas del mismo
-- idempotency_key en el mismo nodo (mismo owner) re-clamarían AMBAS y ejecutarían el efecto DOS veces.
--
-- inbox_claim_token es un UUID por ENTREGA (no por-consume): el retry in-app de una entrega reusa su token y
-- re-clama; una entrega CONCURRENTE distinta trae otro token y, con el lease vivo, NO re-clama (hace skip). Reemplaza
-- a inbox_owner como clave de fencing en claim/renew/finalize (owner queda como dato informativo/observabilidad).
-- Así la correctitud deja de depender de ordered=true/max-concurrency=1.
alter table task_inbox
    add column if not exists inbox_claim_token varchar(40);
