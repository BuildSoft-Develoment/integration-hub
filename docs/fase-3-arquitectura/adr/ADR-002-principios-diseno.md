# ADR-002 Principios de diseno (SOLID)

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR](README.md)
- Siguiente: [Indice docs](../../README.md)
<!-- nav-guided:end -->

## Estado

Aceptado

## Contexto

El motor de la plataforma debe soportar nuevas fuentes, formatos y tareas sin acoplar
flujos ni reescribir el orquestador. Para sostener esa extensibilidad de forma segura se
fija un baseline de principios de diseno (SOLID) que toda contribucion debe respetar.

## Decision

Se adoptan los principios SOLID como contrato de diseno del motor, materializados en el
patron de providers + registries ya presente en el codigo:

- Responsabilidad unica (SRP): cada provider resuelve una sola preocupacion. Los
  `Source Providers` solo obtienen contenido, los `Reader Providers` solo interpretan y los
  `Task Providers` solo procesan. La adquisicion, el parsing y el procesamiento nunca se
  mezclan en una misma clase.
- Abierto/cerrado (OCP): agregar un nuevo tipo de fuente, formato o tarea se hace creando
  un nuevo provider que se registra en su `Registry`, sin modificar el orquestador ni los
  providers existentes.
- Sustitucion de Liskov (LSP): todo provider concreto cumple el contrato de su interfaz de
  provider y es intercambiable por el registry sin que el motor conozca la implementacion.
- Segregacion de interfaces (ISP): se prefieren interfaces de provider especificas
  (`SourceProvider`, `ReaderProvider`, `TaskProvider`) en lugar de una interfaz monolitica.
- Inversion de dependencia (DIP): el motor depende de abstracciones (las interfaces de
  provider) y la inyeccion de dependencias de CDI/Quarkus resuelve las implementaciones en
  tiempo de arranque, evitando carga dinamica incompatible con GraalVM.

Se complementa con practicas de clean code: nombres por dominio, funciones acotadas y
validacion de configuracion separada de la ejecucion.

## Consecuencias

### Positivas

- extensibilidad por composicion: nuevos providers sin tocar el nucleo
- pruebas unitarias por provider de forma aislada (ver `tdd-evidence.md` por feature)
- bajo acoplamiento entre adquisicion, parsing y procesamiento

### Negativas

- agregar un tipo de provider requiere recompilar la distribucion nativa
- la disciplina de interfaces exige revision de diseno en cada nuevo provider

## Relacionado

- [ADR-001 Platform Architecture](ADR-001-platform-architecture.md)
- [Checklist de arquitectura](../03.04-checklist-arquitectura.md)
