-- payment_validation_rule.severity se creo como char(1) (V12), reportado por Postgres
-- como bpchar. La entidad JPA PaymentValidationRule lo mapea como varchar(1), lo que
-- dispara el ERROR de validacion de esquema de Hibernate que quedaba oculto detras del
-- mismatch de hashes (corregido en V27). Se alinea a varchar(1) para un arranque limpio.
-- Es la unica columna char restante en tablas con entidad JPA (las char(n) de las tablas
-- mt101_* son campos de ancho fijo del estandar SWIFT y se acceden por JDBC nativo, sin
-- entidad que las valide; se dejan como estan).
alter table vertical_mt101.payment_validation_rule alter column severity type varchar(1);
