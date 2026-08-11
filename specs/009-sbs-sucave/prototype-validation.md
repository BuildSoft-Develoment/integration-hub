# Validación del prototipo — 009 SBS SUCAVE

- **Estado:** pendiente de validación con stakeholder
- **Fecha de construcción:** 2026-08-10
- **Nivel de rúbrica autoevaluado:** 3 — Producto real (`ci/scripts/check-html5-prototype-quality.mjs`)

## Verificación automática

| Comprobación | Resultado |
|---|---|
| `check-html5-prototype-quality.mjs` | ✅ nivel 3, sin observaciones |
| `check-prototype-hub.mjs` | ✅ 9 spec-cards / 9 specs |
| Estados: loading, empty, error, success | ✅ los cuatro alcanzables por interacción |
| Consola del navegador | ✅ sin errores |
| Responsive 375 px | ✅ sin desbordamiento horizontal del cuerpo |

## Verificación contra la rúbrica, a mano

El validador automático **no comprueba todos los criterios** de
[`02.16-rubrica-calidad-prototipo-html5.md`](../../docs/fase-2-ux-ui/02.16-rubrica-calidad-prototipo-html5.md).
Se recorrió su tabla de decisión una por una:

| Pregunta de la rúbrica | Respuesta | Evidencia |
|---|---|---|
| ¿El primer viewport comunica el producto sin explicación? | Sí | Abre con las obligaciones del periodo y su vencimiento |
| ¿Tarea principal navegable de inicio a fin? | Sí | Obligaciones → preparar → revisar → archivo en destino |
| ¿Estados UI como comportamiento natural, no checklist? | Sí | Progreso al generar, lista vacía al filtrar, entrega fallida con motivo |
| ¿Sin etiquetas metodológicas visibles? | Sí | Sin `RF-`, `gate-` ni nombres de tipos de tarea en pantalla |
| ¿Datos mock del dominio real? | Sí | Formatos, catálogos, posiciones del registro y la regla `Ñ` → `#` |
| ¿Feedback para acciones importantes? | Sí | Toast y diálogo de confirmación al regenerar |
| ¿Patrón visual del dominio, no shell genérica? | Sí | Mesa de cierre por periodo, no lista + drawer |
| **¿Diferencias por rol/perfil visibles?** | **Sí — corregido** | Analista vs responsable de cumplimiento (ver abajo) |
| ¿Responsive? | Sí | 375 px sin desbordamiento del cuerpo |

**Sobre el criterio de rol.** Las dos primeras versiones tenían un solo actor, lo que según la tabla
**limitaba el prototipo a nivel 2** — y el validador automático no lo detecta, así que reportaba 3 sin
haberse ganado. Se añadió la segregación de funciones: quien prepara no autoriza. No es relleno para
la rúbrica: una presentación regulatoria pide un segundo par de ojos, y este producto ya lo hace así
con los conflictos de pago.

## Verificación manual hecha

Recorrido en navegador con las siete secciones: cambio de vista, selección de reparo con actualización
del panel de detalle, filtro hasta lista vacía y vuelta, diálogo de regeneración con la versión
correcta en el texto, y toast tras confirmar.

## Lo que este prototipo tiene que responder

Preguntas abiertas que sólo un stakeholder puede cerrar. Cada una tiene una decisión de diseño
detrás que es cara de cambiar después.

1. **¿La portada es la correcta?** Se apostó por obligaciones-con-vencimiento en vez de un catálogo de
   procesos. Si la analista no razona por calendario, la estructura entera está mal orientada.
2. **¿El detalle del reparo basta para corregir?** Se muestra posición, valor esperado y recibido. Si
   en la práctica hace falta más contexto de la fila de origen, el panel se queda corto.
3. **¿Se entiende que el flujo propuesto es editable?** Se enuncia con un aviso pero no se deja tocar.
   Si el stakeholder no lo deduce, hay que hacerlo visible de otro modo.
4. **¿El vocabulario evita prometer conformidad?** *Revisión previa*, no *validación*. Hay que
   comprobar que nadie lo lee como "la SBS ya lo aceptó".
5. **¿Qué formato se ataca primero y desde qué origen?** El prototipo usa 0228 y 0224 como ejemplo.
   Sin esta respuesta no se puede escribir la tarea del layout.
6. **¿Existe de verdad la figura del responsable de cumplimiento?** El prototipo asume que quien
   prepara no autoriza. Si en la entidad lo hace la misma persona, sobra el segundo perfil — y si lo
   hace un comité, se queda corto. Esta respuesta cambia el modelo de permisos.

## Riesgos que el prototipo deja a la vista

**El error de entrega es el escenario más probable en producción.** Se modeló a propósito: el archivo
se genera bien y falla el depósito por una credencial caducada. Es la forma exacta del defecto que
costó siete corridas de QA en el money-path este mes — un destino que falla y un motivo que no llegaba
a ninguna pantalla. Aquí el motivo se ve, con el intento y la hora, y el archivo no se regenera.

**Regenerar un periodo cerrado es la acción con más riesgo silencioso.** Su resultado depende de algo
invisible —qué diseño de registro regía entonces— y equivocarse produce un archivo que parece bien y
no lo está. Por eso es la única acción con confirmación, y la confirmación nombra la versión.

## Bloqueantes conocidos

Dos cosas que **no** dependen del stakeholder ni del prototipo, y que hay que resolver antes de dar
por bueno un archivo generado:

| Bloqueante | Qué impide |
|---|---|
| **Codificación sin confirmar** | La SBS pide «ANSI», que no identifica una code page concreta. Bloquea **homologación**, no desarrollo: se construye y se prueba con Windows-1252 e ISO-8859-1, pero no se produce un archivo oficial hasta saber cuál |
| **Sustitución silenciosa de caracteres** | Los escritores del motor usan el reemplazo por defecto: un carácter fuera del charset se convierte en `?` sin error. Un archivo con las posiciones perfectas y un `?` donde iba una letra pasa todas las comprobaciones |

El segundo no es de SUCAVE — afecta a cualquier archivo que escriba el motor.

## Pendiente antes de construir

- [ ] Recorrido con un analista regulatorio real, sin guía.
- [ ] Responder las seis preguntas de arriba.
- [ ] Leer el diseño de registro y el instructivo del formato elegido, del portal de la SBS.
- [ ] Confirmar la code page exacta que SUCAVE acepta, por documentación o prueba controlada.
- [ ] Validar el árbol de plantillas sobre el editor de procesos real (fuera de este prototipo).
