-- La densidad (comfortable/compact) no tenia efecto visible: el token --ih-density-gap
-- que seteaba no era consumido por ningun componente. El modo de sidebar (expanded/compact)
-- se reemplazo por un colapso/expansion on-demand del nav, que es estado efimero de UI y no
-- se persiste. Ambas columnas quedan sin consumidor -> se eliminan (sin fallback).
ALTER TABLE system_theme_setting
DROP COLUMN IF EXISTS density;

ALTER TABLE system_theme_setting
DROP COLUMN IF EXISTS sidebar_mode;
