// ci/scripts/_lib/feature-filter.mjs (v12.56)
//
// Modulo compartido: filtra features bajo specs/ para excluir features-ejemplo
// que distorsionan metricas del roadmap.
//
// Reglas de exclusion:
//   1. Slug matchea glob de exclusion en template.config.json > roadmap.exclude_feature_globs.
//      Default: ["000-*"]
//   2. spec-funcional.md tiene frontmatter:
//        ---
//        roadmap: ignore
//        ---
//      o:
//        ---
//        example: true
//        ---

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export const DEFAULT_EXCLUDE_GLOBS = ["000-*"];

/**
 * Lee template.config.json para detectar globs de exclusion.
 * Si no hay config, usa defaults.
 */
export function loadFeatureFilterConfig(rootDir) {
  const result = { excludeGlobs: [...DEFAULT_EXCLUDE_GLOBS] };
  const configCandidates = ["template.config.json", "template.config.example.json"];
  for (const name of configCandidates) {
    const p = join(rootDir, name);
    if (!existsSync(p)) continue;
    try {
      const cfg = JSON.parse(readFileSync(p, "utf8"));
      const overrideGlobs = cfg?.roadmap?.exclude_feature_globs;
      if (Array.isArray(overrideGlobs)) {
        result.excludeGlobs = overrideGlobs;
      }
      break;
    } catch { /* ignore */ }
  }
  return result;
}

/**
 * Predicado: dado un slug de feature, devuelve true si debe ignorarse del roadmap.
 * Combina exclusion por glob + exclusion por frontmatter.
 */
export function isFeatureExcluded(slug, specsRoot, config) {
  const cfg = config || loadFeatureFilterConfig(".");
  // 1. Match contra globs.
  for (const glob of cfg.excludeGlobs) {
    if (globMatch(slug, glob)) return true;
  }
  // 2. Frontmatter en spec-funcional.md.
  if (specsRoot) {
    const specPath = join(specsRoot, slug, "spec-funcional.md");
    if (existsSync(specPath)) {
      try {
        const text = readFileSync(specPath, "utf8");
        const fm = parseFrontmatter(text);
        if (fm && (fm.roadmap === "ignore" || fm.example === true || fm.example === "true")) {
          return true;
        }
      } catch { /* ignore */ }
    }
  }
  return false;
}

/**
 * Lista features incluidas (no excluidas) bajo specs/.
 * Helper que reemplaza el filtrado custom en cada validador.
 */
export function listIncludedFeatures(rootDir) {
  const specsRoot = join(rootDir, "specs");
  if (!existsSync(specsRoot)) return [];
  const config = loadFeatureFilterConfig(rootDir);
  let entries;
  try { entries = readdirSync(specsRoot, { withFileTypes: true }); } catch { return []; }
  return entries
    .filter((e) => e.isDirectory() && /^\d{3,}-[a-z0-9-]+/i.test(e.name))
    .filter((e) => !isFeatureExcluded(e.name, specsRoot, config))
    .map((e) => e.name);
}

/**
 * Lista TODAS las features (incluidas + excluidas) — util para reportes que
 * distinguen ambos casos.
 */
export function listAllFeatures(rootDir) {
  const specsRoot = join(rootDir, "specs");
  if (!existsSync(specsRoot)) return [];
  let entries;
  try { entries = readdirSync(specsRoot, { withFileTypes: true }); } catch { return []; }
  const config = loadFeatureFilterConfig(rootDir);
  return entries
    .filter((e) => e.isDirectory() && /^\d{3,}-[a-z0-9-]+/i.test(e.name))
    .map((e) => ({
      slug: e.name,
      excluded: isFeatureExcluded(e.name, specsRoot, config),
    }));
}

// Valores de `origin` (frontmatter de spec-funcional.md) que marcan una feature
// como reingenieria sobre codigo existente. Default (ausente/desconocido) = "nuevo".
const REENGINEERING_ORIGINS = new Set([
  "reingenieria", "reingeniería", "brownfield", "existing-code", "existing_code",
]);

/**
 * Devuelve el origen declarado de una feature: "reingenieria" | "nuevo".
 * Lee el frontmatter `origin:` de specs/<slug>/spec-funcional.md.
 * Default seguro: "nuevo" (rigor metodologico completo) si no se declara o el
 * valor es desconocido — asi ningun feature nuevo se exenta por olvido.
 */
export function getFeatureOrigin(slug, specsRoot) {
  if (!slug || !specsRoot) return "nuevo";
  const specPath = join(specsRoot, slug, "spec-funcional.md");
  if (!existsSync(specPath)) return "nuevo";
  try {
    const fm = parseFrontmatter(readFileSync(specPath, "utf8"));
    const raw = fm && fm.origin != null ? String(fm.origin).trim().toLowerCase() : "";
    return REENGINEERING_ORIGINS.has(raw) ? "reingenieria" : "nuevo";
  } catch {
    return "nuevo";
  }
}

/**
 * Predicado: true si la feature es de reingenieria (codigo ya construido).
 * Una feature de reingenieria queda exenta SOLO de la Fase 2 (prototipo/SPDD);
 * el resto de la metodologia se mantiene exigible.
 */
export function isReengineering(slug, specsRoot) {
  return getFeatureOrigin(slug, specsRoot) === "reingenieria";
}

/**
 * Parser minimalista de frontmatter YAML.
 * Soporta scalars (string, number, boolean) — no listas ni objetos anidados.
 *
 * NORMALIZA CRLF ANTES DE NADA, y no es cosmetico. Sin esto, en un checkout Windows la
 * ULTIMA clave del bloque se pierde SIEMPRE, en silencio:
 *
 *   - la captura `([\s\S]*?)\n---` deja el `\r` final dentro del grupo ("origin: reingenieria\r")
 *   - `split(/\r?\n/)` solo limpia el `\r` de las lineas que van SEGUIDAS de `\n`; la ultima no lo esta
 *   - la regex de clave/valor termina en `(.+)$`, y en JS `.` no matchea `\r` (es terminador de
 *     linea) ni `$` -sin flag `m`- matchea antes de el => el match da null y la clave desaparece
 *
 * Medido antes del arreglo: 8 de 8 ficheros con frontmatter en specs/ perdian su unica clave.
 * `origin: reingenieria` estaba declarado en 7 features y `getFeatureOrigin` devolvia "nuevo"
 * para todas, de modo que el roadmap les exigia los 4 artefactos de Fase 2 de los que la
 * reingenieria esta exenta: 8 bloqueadores fantasma. El gate no fallaba, no miraba.
 */
export function parseFrontmatter(text) {
  const normalized = String(text).replace(/\r\n?/g, "\n");
  const m = normalized.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)\s*:\s*(.+)$/);
    if (!kv) continue;
    let value = kv[2].trim();
    if (/^["'].*["']$/.test(value)) value = value.slice(1, -1);
    if (value === "true") value = true;
    else if (value === "false") value = false;
    else if (/^-?\d+$/.test(value)) value = Number(value);
    fm[kv[1]] = value;
  }
  return fm;
}

/**
 * Glob matching simple: soporta * y ?.
 * No soporta ** ni clases [abc].
 */
function globMatch(str, glob) {
  const re = new RegExp("^" + glob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$");
  return re.test(str);
}
