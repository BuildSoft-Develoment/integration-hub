# SPDD Frontend - Mensajeria de pagos (SWIFT MT101)

## Componentes principales

| Componente | Que resuelve |
|---|---|
| `mt101-quarantine` | filas retenidas, correccion y lote correctivo con cuatro ojos |
| `mt101-pay-conflicts` | contradicciones entre nuestro registro y el banco, con reconocimiento gobernado |
| `mt101-pay-dispatch` | ledger de intentos de envio y conciliacion de los atascados |
| `mt101-fragment-*` | fragmentos construidos, su detalle y su linaje |
| `shared/audit-kit` | navegacion de auditoria, recorrido de un registro y riesgos de operacion |

Todos viven en `frontend/libs/features/swift-mt101` y se cargan de forma perezosa: el vertical
nunca entra al bundle inicial.

## Estados UI

| Estado | Como se ve | Por que asi |
|---|---|---|
| Cargando | esqueleto, nunca cifras a medias | un importe incompleto se lee como cierto |
| Vacio | dice el periodo consultado | distinguir "no existe" de "no se busco donde era" |
| Error | dice si afecta a los pagos o solo a la consulta | evita parar procesos sanos por una consulta lenta |
| Exito | confirmacion nombrando la referencia afectada | permite comprobar que se actuo sobre lo correcto |
| Sin confirmar | ambar, con clase propia | separa "no sabemos" de "salio mal"; bloquea reenvios |
| Bloqueado por cuatro ojos | boton apagado + motivo VISIBLE debajo | un `disabled` nativo no emite eventos de raton: un tooltip ahi no se dispara jamas |

## Permisos visibles

- **Sin capacidad de aprobacion**: el boton de aprobar no se renderiza. Mostrar apagado algo que
  esa persona nunca podra usar solo genera ruido.
- **Con capacidad pero siendo el solicitante**: se muestra apagado **con el motivo**. Aqui si hace
  falta entender por que no se puede, porque manana con otro envio si podra.
- **Auditor**: ve todo, no ve ninguna accion.

La diferencia entre los dos primeros casos es deliberada: no es lo mismo "esto no es para ti" que
"esto no es para ti ahora".

## Feedback UX

- Toda accion que mueve dinero exige **motivo escrito** antes de habilitar el boton.
- Los avisos de resultado nombran la referencia, no dicen solo "correcto".
- Las listas acotadas avisan de cuantos elementos no se muestran. Dar por revisada una lista
  truncada es peor que no listarla: el operador cree haber terminado.

## Accesibilidad

- El motivo de un bloqueo va en **texto visible**, que llega a teclado y a lector de pantalla. Un
  tooltip de hover no llega a ninguno de los dos.
- Los estados llevan color **y** texto: el color nunca es el unico portador de significado.
- Las animaciones de carga respetan `prefers-reduced-motion`.
- Importes y referencias en cifras tabulares, para que las columnas se comparen sin errores.
- Los botones tienen estado de foco visible.

## Responsive

- Raíl lateral que pasa a barra horizontal por debajo de 900 px.
- Tablas densas con desplazamiento horizontal propio; el cuerpo de la pagina nunca se desplaza
  en horizontal.
- Cifras de panel con tamano fluido (`clamp`): un importe largo no se recorta ni se come el pie
  de la tarjeta.

## Trazabilidad hacia codigo

| Requisito | Superficie de interfaz |
|---|---|
| RF-001 a RF-010 | estados de cada pago a lo largo de las cuatro consolas |
| RF-019 | rol `payments-operator` y visibilidad condicionada de acciones |
| RF-022 | construccion paginada, visible en el lote de 10.000 registros |
| RF-023 | pantalla de administracion de reglas de pago |
| RF-024 | reproceso correctivo con identidad estricta, en cuarentena |

**RF-011 a RF-018, RF-020 y RF-021 no tienen superficie de interfaz**: son comportamiento del
motor (catalogos cargables, modelo de datos, cifrado por columna, transportes, enmascarado en
logs y retencion). Declararlos aqui como cubiertos por pantalla seria falso.

**RF-015** (linaje por UETR) aparece en el recorrido como paso pendiente, que es su estado real:
aun no implementado.
