# Prototipo — 009 SBS SUCAVE

- **Archivo:** [`prototype-html5/index.html`](prototype-html5/index.html)
- **Decisiones:** [`prototype-html5/decisiones-ux.md`](prototype-html5/decisiones-ux.md)
- **Recorrido:** [`prototype-html5/flujo.md`](prototype-html5/flujo.md)
- **Journey de fase 2:** [`journey-reporteria-regulatoria.md`](../../docs/fase-2-ux-ui/journeys/journey-reporteria-regulatoria.md)

## Por qué existe

`009` es la **primera feature `origin: nueva`** del proyecto. Las ocho anteriores se documentaron sobre
código ya construido, así que la fase 2 no les aplicaba. Aquí el prototipo **precede** al código: su
trabajo es descubrir problemas de flujo, vocabulario y estados **antes** de que existan en Java y
Angular, cuando cambiarlos todavía es barato.

## Qué se puede recorrer

Siete secciones, con un cierre regulatorio de agosto 2026 como caso: siete archivos, cuatro sin generar,
uno bloqueado por dieciocho registros con reparo.

| Interacción | Qué demuestra |
|---|---|
| Navegar las siete secciones | Que la analista entiende dónde está sin explicación previa |
| Cambiar la carpeta de entrega | Que la elección se refleja **antes** de generar, no después |
| Recorrer los pasos del envío | Cuáles son propios de la SBS y cuáles del motor, y el ajuste de cada uno |
| Cambiar de anexo dentro del grupo | Que cada anexo tiene su propio diseño de registro — de 24 campos a 11 |
| Abrir «Revisar el conjunto» | Por qué revisar cada archivo no basta cuando el envío es en grupo |
| Fijar una versión del diseño de registro | Que el campo aparece solo al elegirlo, y avisa de la consecuencia |
| Generar un formato | Estado de carga con progreso sobre registros reales |
| Seleccionar un registro con reparo | Motivo con posición del archivo, valor esperado y recibido |
| Filtrar por "Valor fuera de rango" | Estado vacío alcanzable, con lenguaje del dominio |
| Ver la entrega fallida del 0301 | Error recuperable: el archivo se generó, falló el depósito |
| Regenerar un periodo cerrado | Confirmación que dice **con qué versión** de layout se hará |

## Alcance del prototipo

**Dentro:** el cierre por periodo, la preparación, **los ajustes de los cuatro pasos propios de la
SBS**, la revisión previa, el archivo generado y la consulta de periodos anteriores.

**Fuera a propósito:** el árbol de plantillas (SBS → SUCAVE → formato → anexo) vive dentro del editor
de procesos, que **ya existe** en el producto. Este prototipo cubre lo que todavía no existe; el árbol
se validará sobre el editor real cuando se construya la jerarquía.

**Fuera por alcance:** todo lo posterior a dejar el archivo listo. La presentación ante la SBS, su
reporte de validación, observaciones y rectificaciones quedan fuera mientras el envío sea manual.

## Condición de simulación

Sin backend. Los datos son verosímiles pero inventados: los códigos de formato, las cifras, los
motivos de reparo y las versiones de SUCAVE ilustran el comportamiento, **no** especifican un layout.

**La codificación aparece como «por confirmar» a propósito.** La SBS pide «ANSI», que no identifica
una code page concreta, y el prototipo no debe aparentar que ya se sabe cuál.

**Especialmente inventado: que el 0228 tenga dos anexos agrupados.** Se eligió para poder mostrar el
envío en grupo; no hay comprobación de que el 0228 real se remita así. Lo mismo vale para las
periodicidades, los plazos y la composición de los grupos de la vista de formatos.

Es un riesgo concreto: un dato ilustrativo que se repite acaba pareciendo un hecho. **Nada de esta
pantalla debe llegar a una migración.**

Antes de construir hay que leer el diseño de registro y el instructivo del formato elegido
directamente del portal de la SBS.
