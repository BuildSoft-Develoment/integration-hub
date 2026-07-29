-- ADR-021 (bloque E): la ejecucion de tarea registra SI MOVIO DINERO, decidido al arrancar.
--
-- Antes la recuperacion de ejecuciones huerfanas preguntaba `taskDefinition.taskType in (tipos que
-- declaran movesMoney)`. Dos problemas:
--
--   1. la capacidad se declara por TIPO de provider, pero "mueve dinero" es propiedad de la TAREA
--      CONFIGURADA: FILE_DELIVER apuntando al sink del banco mueve dinero y declara false, con razon;
--   2. la consulta lee la definicion ACTUAL, no lo que se ejecuto. Editar el proceso entre la caida y
--      el barrido cambiaba la respuesta.
--
-- Con la columna, la decision queda registrada tal como fue en el momento en que se tomo, y la
-- consulta de recuperacion se simplifica en vez de complicarse.
alter table process_task_execution
    add column moves_money boolean not null default false;

-- Backfill de lo historico. OJO: se apoya en el task_type de la definicion ACTUAL, que es justo la
-- fragilidad que esta columna viene a eliminar. Es aceptable SOLO aca: para lo que ya paso no existe
-- otra fuente de verdad, y el criterio vigente es el mejor disponible. Las filas nuevas ya no dependen
-- de esto.
update process_task_execution pte
   set moves_money = true
  from process_task_definition ptd
 where ptd.id = pte.task_definition_id
   and ptd.task_type = 'MT101_PAY';

-- El barrido de huerfanas filtra por esta columna dentro de una ejecucion, asi que el indice va por
-- (process_execution_id) con la condicion: solo interesan las filas que SI movieron dinero, que son
-- una minoria del total.
create index if not exists ix_task_execution_moves_money
    on process_task_execution (process_execution_id)
 where moves_money;
