# Presets y extensiones (v12.113)

Esta carpeta materializa los puntos de **extension** del framework AI-first empresarial sin que el
usuario tenga que tocar codigo del framework. Hay dos tipos de presets, y un conjunto
de "extensiones" documentadas (ya soportadas por el framework, aqui solo se nombran
para descubrirlas).

## Tipos de presets

### 1. `presets/projects/*.json` — perfiles de proyecto
Conjunto de defaults usados al instanciar un proyecto real:

| Campo | Significado |
|---|---|
| `name` | identificador del preset (kebab-case) |
| `description` | una frase para el catalogo |
| `stack.frontend` | framework frontend recomendado (Angular, React, etc.) |
| `stack.backend` | backend (Spring Boot, NestJS, etc.) |
| `stack.bd` | motor de BD (PostgreSQL, MySQL, etc.) |
| `default_brand` | nombre de un preset bajo `presets/brands/` |
| `default_features` | features iniciales a crear con `scaffold:feature` |

Sirven como "starter pack" coherente para que el agente no invente el stack ni los
defaults de UX. Se consultan con `node scripts/preset.mjs list projects`.

### 2. `presets/brands/*.json` — identidad visual del producto
Marca compartida que TODOS los prototipos de un proyecto usan (Principio 7 de
[CONSTITUTION.md](../CONSTITUTION.md)).

| Campo | Significado |
|---|---|
| `name` | identificador del preset |
| `brand_hue` | hue HSL (0-360) — 222 es el default |
| `brand_saturation` | saturacion HSL (0-100) — 55 default |
| `description` | que tipo de producto representa visualmente |

Se consultan con `node scripts/preset.mjs list brands`. Para aplicarlos al proyecto,
copia los campos a `template.config.json > prototype.{brand_hue, brand_saturation}`.

## Extensiones (puntos de personalizacion ya soportados)

Estos NO viven bajo `presets/` — son convenciones del framework ya activas:

1. **Validadores custom.** Cualquier archivo `ci/scripts/check-*.mjs` se detecta
   automaticamente por `check:validation-coverage`. Si lo agregas al pipeline en
   `package.json > scripts > check:project`, se ejecuta con `npm run check:all`.
2. **Prompts custom.** Cualquier `ai/prompts/*.md` queda indexado por la memoria
   (`memory:index` / `memory:embed`) y disponible para el agente.
3. **Skills custom.** `ai/skills/*.skill.md` se exponen al agente como capacidades.
4. **Slash-commands custom.** Crea `ai/commands/<name>-command.md` y reinstala con
   `npm run install:agent -- --agent claude` (o el agente que corresponda).
5. **Auto-zones custom.** Agrega tu propia `<!-- auto:start name=X -->...<!-- auto:end -->`
   y un generador en `ai-framework-agent.mjs` (lee `scripts/ai-framework-agent.mjs`).
6. **Plantillas por feature.** El builder unico
   `scripts/_lib/feature-templates.mjs` agrega o modifica artefactos sin tocar
   `scaffold-feature.mjs`. Tras editar, `npm run plantillas:sync` para regenerar las
   plantillas.

## Como agregar un preset propio

1. Decide tipo: `projects/` o `brands/`.
2. Copia un preset existente como base.
3. Cambia los campos.
4. Verifica con `node scripts/preset.mjs show <name>` que el JSON es valido.
5. (Opcional) si es un brand, ejecuta `npm run scaffold:prototype -- --feature <slug>
   --domain <dominio>` despues de aplicar el brand a `template.config.json` y revisa
   visualmente.

Los presets son archivos JSON simples — cero codigo. El agente los descubre
listandolos. Es el patron mas barato de extensibilidad: agrega un archivo, no editas
nada del framework.
