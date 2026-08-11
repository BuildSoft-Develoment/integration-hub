# Recorrido del cierre regulatorio

La analista no entra a explorar. Entra porque el mes cierra y hay siete formatos que presentar.

## El recorrido del cierre

1. **Obligaciones.** Lo primero que se lee es cuanto falta y cuando vence — no un menu. Siete
   formatos, cuatro listos, tres sin generar, y uno bloqueado por dieciocho registros con reparo.
2. **Preparar envio.** Elige formato, periodo, de donde salen los datos y donde se deja el archivo.
   Lo demas ya viene resuelto y se ve resuelto: la version del diseño de registro, las 24 columnas,
   las 180 posiciones, el encoding. No tiene que saber que existe una tarea de escritura.
3. **Revision previa.** Los registros que no cumplen, uno a uno, con la posicion exacta del archivo
   donde fallan. Se corrigen en el origen, no aqui: este sistema no edita los datos de la entidad.
4. **Archivo generado.** El archivo, su contenido real, donde quedo depositado y con que version se
   escribio. Con el recordatorio de que presentarlo sigue siendo cosa de una persona.
5. **Periodos anteriores.** Lo ya presentado, cada uno con la version que regia entonces. Desde aqui
   se regenera un periodo cerrado sin que cambie de forma.

## Que hay que poder hacer sin ayuda

- Saber si se llega a la fecha limite, en la primera pantalla y sin un clic.
- Entender por que una fila no pasa, con detalle suficiente para corregirla en la tabla de origen.
- Cambiar el destino del paquete y ver el cambio reflejado antes de generar.
- Descubrir que el flujo propuesto se puede modificar, sin que nadie lo explique.
- Regenerar julio en septiembre y que salga como salio en julio.

## Estados que el recorrido atraviesa

| Estado | Donde aparece |
|---|---|
| Trabajo pendiente con vencimiento | Portada: tres formatos sin generar, seis dias habiles |
| Bloqueo por datos | El 0228 no se puede cerrar con dieciocho reparos abiertos |
| Detalle de un fallo | Panel con posicion, valor esperado y valor recibido |
| Lista vacia tras filtrar | Filtrar por "Valor fuera de rango": este periodo no tiene ninguno |
| Trabajo en curso | Aviso al generar: se avisara al terminar |
| Confirmacion con consecuencia | Regenerar un periodo cerrado dice con que version lo hara |
| Entregado pero no presentado | El paquete esta en el destino; la presentacion es manual |
| Envio en grupo | En el prototipo, el 0228 manda dos anexos juntos —**composicion inventada** para poder mostrar el caso—; cada uno tiene su cadena y comparten paquete |
| Paquete incompleto | Si falta un anexo obligatorio, no se empaqueta: un envio al que le falta algo parece completo |

## Lo que este recorrido NO cubre

El arbol de plantillas (SBS → SUCAVE → formato → anexo) vive dentro del editor de procesos, que ya
existe en el producto. Aqui se prototipa lo que todavia no existe. El arbol se valida sobre el editor
real cuando se construya la jerarquia.

Tampoco cubre nada posterior a dejar el paquete: presentacion, reporte de la SBS, observaciones ni
rectificaciones. Queda fuera del alcance mientras el envio sea manual.
