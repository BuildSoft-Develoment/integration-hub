-- §5 (exactly-once práctico): claim ATÓMICO del inbox antes de ejecutar el efecto externo en el camino
-- once. La secuencia previa (isProcessed pre-check -> execute -> recordProcessed ON CONFLICT) era
-- check-then-act: una re-entrega tras ejecutar pero antes de registrar re-ejecutaba el efecto (at-least-once).
-- Con un estado CLAIMED + owner + lease, dos entregas de la misma trama NO ejecutan las dos: la primera
-- inserta CLAIMED y ejecuta; la segunda ve CLAIMED (ajeno y vivo) y hace skip. El lease permite re-tomar un
-- claim de un nodo caído (misma semántica que el claim distribuido de process_execution, v53-fix #8).
alter table task_inbox
    add column if not exists inbox_owner varchar(120),
    add column if not exists claimed_until timestamp;

-- Índice para el barrido de recuperación de claims estancados (CLAIMED con lease vencido) y para el claim
-- por estado.
create index if not exists ix_task_inbox_status_claim
    on task_inbox (status, claimed_until);
