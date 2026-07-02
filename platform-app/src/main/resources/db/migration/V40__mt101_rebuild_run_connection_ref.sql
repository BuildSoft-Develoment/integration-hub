-- R-d: persistir el connectionRef con el que se creo el rebuild para que el scheduler de
-- lifecycle resuelva el datasource correcto. Sin esto, un rebuild creado contra un
-- connectionRef no se sincronizaba automaticamente (solo el datasource por defecto).
alter table mt101_rebuild_run
    add column if not exists connection_ref varchar(120);
