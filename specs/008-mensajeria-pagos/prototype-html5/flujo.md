# Recorrido de la mesa de pagos

El operador no entra a explorar. Entra porque algo quedo abierto y hay que decidir.

## El recorrido de la manana

1. **Panel del dia.** Lo primero que se lee es cuanto dinero esta sin resolver — no un menu ni
   un saludo. Si esa cifra es cero, el turno empieza tranquilo.
2. **Despacho.** Los pagos que se intentaron y no cerraron. Un "sin confirmar" no se reintenta:
   el dinero pudo haber salido, asi que primero se concilia con el banco.
3. **Conflictos.** Nuestro registro dice una cosa y el banco la contraria. Cerrarlo exige que
   alguien lo reconozca, y no puede ser quien lo pidio.
4. **Cuarentena.** Las filas que nunca llegaron a ser mensaje. Se corrigen fuera y vuelven como
   un lote nuevo, que tambien se aprueba a cuatro ojos.
5. **Linaje.** Cuando alguien pregunta "que paso con este pago", esta pantalla lo cuenta entero,
   con horas.
6. **Archivo.** Consulta de lo ya cerrado. Es lenta a proposito: son millones de registros.

## Las tres bifurcaciones que importan

**Un pago sin confirmar no se reenvia.** Es la regla mas cara del sistema. El boton de reenvio
no aparece hasta que la conciliacion cierra la duda; si apareciera, alguien acabaria pagando dos
veces un dia de prisa.

**Quien pide no aprueba.** En el reconocimiento de conflictos y en el envio del lote correctivo,
el boton se apaga para el solicitante y el motivo se lee **debajo**, no al pasar el raton: un
boton apagado no recibe el raton, y con teclado no habria forma de enterarse.

**El archivo puede no responder.** Es solo lectura, asi que su caida no toca los pagos — y la
pantalla lo dice con esas palabras, para que nadie active un plan de contingencia por una
consulta lenta.

## Lo que el recorrido deja fuera

Editar un importe ya archivado. Un archivo con huella que cambia despues de enviarse deja de
servir como prueba, asi que la correccion siempre crea un lote nuevo con su propia aprobacion.
