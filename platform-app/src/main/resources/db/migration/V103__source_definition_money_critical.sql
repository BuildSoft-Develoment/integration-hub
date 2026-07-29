-- ADR-021 (bloque E): una fuente de SALIDA puede declararse critica de dinero.
--
-- Es la contraparte de V102. `movesMoney()` cubre a la tarea que se sabe de pago por su tipo; esta
-- marca cubre a la tarea GENERICA que entrega a un banco: FILE_DELIVER acepta cualquier sinkRef con
-- direction OUTPUT/BOTH —el mismo mecanismo con el que MT101_PAY deja el archivo— asi que un operador
-- puede armar una entrega de pagos con el.
--
-- Es una DECLARACION del operador sobre que es esa conexion, no algo derivado del uso. Marcarla segun
-- que tareas la referencian hoy la desmarcaria al quitar el PAY; que la conexion sea un banco no
-- cambia porque cambie el proceso que la usa.
alter table source_definition
    add column money_critical boolean not null default false;

comment on column source_definition.money_critical is
    'La entrega a esta fuente mueve dinero hacia afuera. El motor la usa para marcar la ejecucion de '
    'tarea (process_task_execution.moves_money) y NO re-encolarla a ciegas tras una caida de nodo. '
    'Solo tiene sentido con direction OUTPUT/BOTH.';
