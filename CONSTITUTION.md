# Constitucion del framework AI-first empresarial

> **Que es esto.** Los principios NO negociables de este framework AI-first empresarial
> para agentes IA, que gobierna el ciclo completo de un proyecto (fases 0-8). Engloba
> varias metodologias (entre ellas SPDD = Spec + Prototype Driven Development, aplicable
> a la fase 2 de UX/UI). Todo agente IA (Claude, Codex, OpenCode, Gemini, Copilot, Cursor)
> y todo humano que trabaje sobre un proyecto instanciado desde el framework ESTA SUJETO
> a estos principios. No son recomendaciones: cada uno esta respaldado por un gate humano
> o un validador ejecutable (`npm run check:*`). Si un principio y una "optimizacion"
> entran en conflicto, gana el principio.

> **Archivo template-owned.** Lo refresca `npm run template:upgrade -- --apply --force-framework`.
> No lo edites en un proyecto instanciado para "relajar" una regla; las reglas viven aqui
> precisamente para que no se relajen feature a feature.

## Como leer cada principio
Cada principio declara:
- **Regla**: el invariante.
- **Por que**: el fallo real que previene (visto en instanciaciones reales).
- **Lo hace cumplir**: el gate humano o el validador que lo verifica (su "diente").

---

## Principio 1 - Gate humano y anti-auto-aprobacion
**Regla.** Un agente IA puede SOLICITAR un gate, nunca APROBARLO. Toda transicion de fase
y toda aprobacion (prototipo, SPDD, release) requiere firma humana explicita registrada
en `traceability.md`. Los gates quedan en `pending` hasta esa firma.

**Por que.** Un agente que se auto-aprueba elimina el unico control de calidad real y
declara "listo" lo que no lo esta.

**Lo hace cumplir.** `gate-spdd-approved`, `gate-prototype-ready`, `gate-prototype-human-visual-review`;
`npm run check:gate-status-format`, `npm run roadmap:audit` (detecta gate auto-aprobado).

## Principio 2 - El markdown vivo es la fuente de verdad
**Regla.** Los artefactos markdown canonicos son la fuente. La memoria del agente
(`ai/memory/framework-agent.db`), las auto-zonas (`<!-- auto:start ... -->`) y las capas
de compatibilidad con otros tooling (p.ej. `specs/<feature>/.specify/{spec,plan,tasks}.md`
para spec-kit) se DERIVAN de los canonicos via `npm run memory:sync` /
`npm run specify:compat`; nunca al reves. No se edita una auto-zona ni un alias `.specify/`
a mano. La fuente de verdad de una feature son SIEMPRE: `spec-funcional.md`,
`spec-tecnica.md`, `spec-tareas.md`, `traceability.md`, `prototype.md`, etc.

**Por que.** Dos fuentes de verdad divergen. La BD es un indice; las capas compat son
vistas. Si un agente edita el alias dentro de `.specify/` (p.ej. el archivo `spec.md`
de la capa compat), los validadores del framework NO verifican esos cambios —
`check:project` se mide contra el canonico.

**Lo hace cumplir.** `npm run check:auto-zones`, `npm run check:status-coherence`,
`npm run specify:compat:check` (drift de la capa compat opt-in),
`node scripts/ai-framework-agent.mjs status --fail-on-drift`.

## Principio 3 - Trazabilidad obligatoria de extremo a extremo
**Regla.** Cada requerimiento (RF/RNF/HU) se conecta con su diseno, prototipo, API, datos,
codigo, prueba, estado y evidencia en la matriz de 10 columnas de `traceability.md`.
Lo que no existe aun se marca `-` (planned), no se inventa.

**Por que.** Sin trazabilidad no hay forma de saber que esta hecho, probado ni por que.

**Lo hace cumplir.** `npm run check:trace-drift`, `npm run check:trace-coverage`,
`npm run check:validation-coverage`.

## Principio 4 - UX validada antes de construir lo visual
**Regla.** Para features con experiencia visual: Product Design -> SPDD -> prototipo HTML5
validado -> `gate-spdd-approved` ANTES de iniciar construccion productiva. No se cierra
`spec-funcional.md` ni `spec-tecnica.md` de una feature visual sin prototipo validado.

**Por que.** Construir sin validar la UX produce retrabajo caro y producto que nadie aprobo.

**Lo hace cumplir.** `npm run check:prototype-coverage`, `npm run check:phase-contract`,
`npm run check:prototype-contract`.

## Principio 5 - El prototipo parece producto real, no metodologia
**Regla.** Un prototipo HTML5 debe parecer una porcion navegable del producto real. NO debe
mostrar etiquetas metodologicas como texto visible (RF-, gate-, "Contrato mock", "Estados UI",
"Recorrido simulado"). Los estados loading/empty/error/success/permission-denied se provocan
con acciones reales del producto, no como tabs de checklist.

**Por que.** Un "prototipo" que es un documento exportado a HTML no valida nada de la UX.

**Lo hace cumplir.** `npm run check:prototype-html5`, `npm run check:prototype-visible-product`,
`gate-html5-product-quality` (rubrica nivel 0-3, minimo nivel 2).

## Principio 6 - Ubicacion canonica del prototipo
**Regla.** El prototipo de una feature vive SIEMPRE en `specs/<slug>/prototype-html5/index.html`.
No se crea `prototype/<feature>/` ni se improvisa la ubicacion.

**Por que.** Una ubicacion errante rompe el hub, los links bidireccionales y la cobertura.

**Lo hace cumplir.** `npm run check:prototype-location`, `npm run check:prototype-bidirectional-links`,
`npm run check:prototype-hub`.

## Principio 7 - Identidad por feature dentro de una marca compartida
**Regla.** Todas las features pertenecen al MISMO producto y comparten marca, tokens y
componentes. Lo que cambia por feature es la ESTRUCTURA (layout, jerarquia, flujo). Recolorear
o clonar el esqueleto de un golden NO es una feature nueva. El golden es REFERENCIA de nivel,
no plantilla a copiar.

**Por que.** Siete features que son el mismo esqueleto recoloreado no son un producto.

**Lo hace cumplir.** `npm run check:prototype-diversity` (ciego al color, estructural, strict por default).

## Principio 8 - Fuente unica, sin duplicar
**Regla.** Los artefactos por feature se generan desde una fuente unica
(`scripts/_lib/feature-templates.mjs` via `npm run scaffold:feature`). Las plantillas en
`plantillas/fase-4-sdd/` se DERIVAN de esa fuente con `npm run plantillas:sync`; no se editan a mano.

**Por que.** Una copia paralela a mano driftea y desvia a los agentes.

**Lo hace cumplir.** `npm run check:plantillas`, `npm run check:phase-validator-sync`.

## Principio 9 - Fases secuenciales con contrato explicito
**Regla.** El ciclo del framework AI-first empresarial tiene fases 0-8. Cada fase declara que puede y que no puede tocar
(`touch_policy`), su definition-of-done y su gate de transicion. El agente respeta el contrato
de la fase activa; no salta de fase ni toca rutas prohibidas.

**Por que.** Saltarse fases mezcla decisiones inmaduras con construccion y rompe la trazabilidad.

**Lo hace cumplir.** `npm run check:phase-contract`, `npm run roadmap:next`, `npm run roadmap:audit`.

## Principio 10 - Disciplina de alcance: declarar supuestos, no inventar
**Regla.** Al instanciar o construir, el agente lee, extrae, propone y declara supuestos.
No inventa decisiones tecnologicas sin un ADR justificado. No copia el dominio-ejemplo del
template (expedientes/bandeja) como si fuera la feature real.

**Por que.** Inventar decisiones sin registro produce arquitectura no auditable y residuos del template.

**Lo hace cumplir.** `node ci/scripts/check-template-instantiation.mjs --mode instantiated`,
`npm run check:architecture-baseline`.

---

## Cumplimiento
La constitucion no es decorativa: su cumplimiento es el agregado de toda la red de validadores.

- Verificacion completa: `npm run check:all` (debe terminar en EXIT 0).
- Pre-flight antes de cerrar: ver el checklist OBLIGATORIO en [AGENTS.md](AGENTS.md).
- Contrato de la siguiente tarea segura: `npm run roadmap:prompt`.
- Auditoria de lo que un agente toco vs lo permitido: `npm run roadmap:audit`.

## Enmiendas
Estos principios cambian solo en el template canonico (no en un proyecto instanciado), con su
correspondiente entrada en [CHANGELOG.md](CHANGELOG.md) y bump de version. Un proyecto recibe las
enmiendas con `npm run template:upgrade -- --apply --force-framework`.
