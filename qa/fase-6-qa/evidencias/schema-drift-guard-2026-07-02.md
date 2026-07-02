# Evidencia #4: guard anti drift entidad↔schema en dev/CI - 2026-07-02

Cierra el punto ciego detectado en el doble check del fix `bodyJson`: un desajuste
entidad↔columna vivía oculto (los tests con repo mockeado no lo cazan) y solo se logueaba
como `ERROR` en el arranque, sin fallar. Ahora **falla el arranque en dev y CI**.

## Cambio

- `application.properties`:
  ```properties
  %dev.quarkus.hibernate-orm.database.generation=validate
  %test.quarkus.hibernate-orm.database.generation=validate
  ```
  Prod mantiene `none` (sin riesgo de fallo de arranque en prod por drift benigno).

## Cómo actúa el guard

- **Dev**: el stack local valida el mapeo JPA contra el schema Flyway al arrancar; cualquier
  drift (p.ej. un campo camelCase sin `@Column(name)`) **tumba el arranque** en vez de solo
  loguear. El desarrollador lo ve de inmediato.
- **CI**: los `@QuarkusTest` de integración (`*IT.java`, con `@QuarkusTestResource(PostgresTestResource)`)
  arrancan la app con Postgres real + Flyway bajo el perfil `test` → si hay drift, el IT no
  arranca y **falla el build**. Este es el guard automatizado que faltaba.

## Verificación

- Con `bodyJson` ya corregido, el dev **arranca limpio con `validate`**: nuevo boot
  (post-cambio) a las 10:03:37, **health 200**, sin `missing column` ni `Schema validation`
  en el log → no hay drift y el guard pasa.
- (Antes del fix, el mismo `validate` habría tumbado el arranque señalando `bodyJson`.)

## Efecto

- El bug-class "entidad camelCase sin `@Column(name)` / columna renombrada / tabla faltante"
  ya no puede pasar silencioso: rompe dev y CI. Prod queda protegido de fallos por drift
  benigno manteniendo `none`.
