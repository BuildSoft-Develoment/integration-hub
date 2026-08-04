# Decisiones UX — Programacion de procesos

Cuando corre cada cosa. Quien entra aqui quiere saber que va a pasar esta noche, no que paso
ayer — para eso esta auditoria.

## Ficha

- **Dominio**: planificacion de ejecuciones automaticas. Herramienta interna de operacion.
- **Actor principal**: el operador que reparte la ventana nocturna, y quien a media manana
  descubre que un proceso lleva cuatro dias sin correr y nadie se entero.
- **Tarea principal navegable**: mirar lo que viene → detectar dos procesos que se pisan →
  abrir la pauta y moverlos → comprobar en solapes que ya no coinciden.
- **Golden de referencia**: `logistica-tracking-flota`, del que se toma la agenda cronologica.
  El calendario mensual y la tabla de solapes son propios.
- **Patron visual**: agenda vertical de citas con hora grande y borde de color, mas una vista de
  mes en rejilla. Sin maestro-detalle ni tablas como forma principal.
- **Por que no una shell generica**: porque el tiempo se entiende en dos escalas distintas y
  ninguna es una tabla. "¿Que pasa en las proximas horas?" es una agenda; "¿que dias del mes
  estan vacios?" es una rejilla. Una lista ordenable no responde ninguna de las dos sin que el
  lector haga el trabajo.
- **Interacciones**: navegar entre las 6 secciones; recorrer la agenda de lo que viene; moverse
  por meses; definir la pauta con su prevision calculada antes de guardar; calcular solapes, que
  recorre sus desenlaces — calculando, con datos, y con el servicio caido; revisar las saltadas.

## Contrato del prototipo

- Estados: Activa, Pausa, Corriendo, Encola, Fallo ayer, Sin estrenar, Sin coincidencias
- Roles: Operador, Administrador
- Entidades: Pauta, Ejecucion, Ventana, Solape
- RF / HU: RF-001, RF-002, RF-003, RF-004

## Por que esta pantalla se ve asi

**La hora va grande y en cifras tabulares.** Es el dato por el que se busca. Todo lo demas de la
cita es contexto.

**La prevision se ensena ANTES de guardar.** "Manana a las 03:00, y despues cada dia" convierte
una expresion horaria en algo comprobable. Una pauta mal escrita no falla: simplemente no corre
nada, y eso tarda una semana en notarse.

**El calendario se mira por los huecos.** El 15 es festivo y ninguna pauta lo contempla: los cinco
procesos intentaran leer archivos que nadie va a depositar. Se ve aqui, no en la incidencia del 16.

**Las saltadas se separan por causa.** Un fin de semana sin correr es lo previsto; cuatro dias sin
correr por una clave caducada no lo es. Mezclarlas en una lista hace que la segunda se pierda
entre las primeras.

**"Encola" dice cuanto se retrasa.** No basta con decir que no se pierde: si alguien espera el
resultado a las 03:30 y va a llegar a las 03:38, eso es lo que necesita saber.

## Lo que esta pantalla NO hace

No cancela una ejecucion en curso. Pausar afecta a las proximas; lo que ya esta corriendo se
detiene desde el proceso, donde se ve por que tarea va.
