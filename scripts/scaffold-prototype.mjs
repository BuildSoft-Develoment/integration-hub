#!/usr/bin/env node
/**
 * scaffold-prototype.mjs (v12.61)
 *
 * v12.61: nuevo --mode portfolio-spa que enlaza la infraestructura compartida
 * specs/_shared/ (tokens.css + mock-api.js + app-state.js + ui.js). El default
 * sigue siendo standalone (prototipo autocontenido con tokens inline).
 *
 * Copia el golden HTML5 del dominio mas cercano al `prototype-html5/index.html`
 * de una feature, y aplica los reemplazos canonicos (titulo, marca, breadcrumb
 * al hub). Cierra la causa raiz de prototipos pobres: los agentes "leen el
 * golden" pero generan desde cero con Tailwind CDN. Este script FUERZA el
 * copy + adapt y deja un piso de nivel 2-3 garantizado.
 *
 * Mapeo dominio -> golden:
 *   streaming   -> streaming-catalogo-player
 *   operativo   -> saas-operativo-bandeja
 *   ecommerce   -> ecommerce-checkout
 *   educacion   -> educacion-leccion
 *   dashboard   -> dashboard-analytics-kpi
 *   analytics   -> dashboard-analytics
 *   mobile      -> mobile-first-app
 *   wizard      -> formulario-complejo
 *
 * Uso:
 *   node scripts/scaffold-prototype.mjs --feature 002-mi-feature --domain streaming
 *   node scripts/scaffold-prototype.mjs --feature 002-mi-feature --domain operativo --titulo "Bandeja editorial" --marca "AcmeOps"
 *   node scripts/scaffold-prototype.mjs --list-domains
 *
 * Despues de correr, el agente:
 *   1. Adapta mock data en el HTML al dominio real.
 *   2. Adapta roles visibles a los del proyecto.
 *   3. Completa decisiones-ux.md con citas reales al golden usado.
 *   4. Corre `node ci/scripts/check-html5-prototype-quality.mjs --spec specs/<slug>`.
 *
 * Exit codes:
 *   0 - prototipo copiado y adaptado
 *   1 - argumentos invalidos
 *   2 - feature no existe / golden no existe
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync, readdirSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import process from "node:process";

const GOLDEN_MAP = {
  streaming: "streaming-catalogo-player",
  operativo: "saas-operativo-bandeja",
  backoffice: "saas-operativo-bandeja",
  ecommerce: "ecommerce-checkout",
  educacion: "educacion-leccion",
  dashboard: "dashboard-analytics-kpi",
  kpi: "dashboard-analytics-kpi",
  analytics: "dashboard-analytics",
  funnel: "dashboard-analytics",
  mobile: "mobile-first-app",
  banca: "mobile-first-app",
  wizard: "formulario-complejo",
  cotizacion: "formulario-complejo",
  formulario: "formulario-complejo",
  // v12.51 — nuevos dominios verticales.
  salud: "salud-hipaa-clinico",
  hipaa: "salud-hipaa-clinico",
  clinico: "salud-hipaa-clinico",
  ehr: "salud-hipaa-clinico",
  erp: "erp-multimodulo-financiero",
  financiero: "erp-multimodulo-financiero",
  contable: "erp-multimodulo-financiero",
  multimodulo: "erp-multimodulo-financiero",
  logistica: "logistica-tracking-flota",
  flota: "logistica-tracking-flota",
  tracking: "logistica-tracking-flota",
  envios: "logistica-tracking-flota",
  fleet: "logistica-tracking-flota",
  // v12.52 — dominios educacion + retail + iot + insurtech.
  colegio: "educacion-colegio-sis",
  escuela: "educacion-colegio-sis",
  sis: "educacion-colegio-sis",
  matricula: "educacion-colegio-sis",
  notas: "educacion-colegio-sis",
  apoderados: "educacion-colegio-sis",
  primaria: "educacion-colegio-sis",
  secundaria: "educacion-colegio-sis",
  universidad: "educacion-superior-lms",
  lms: "educacion-superior-lms",
  gradebook: "educacion-superior-lms",
  evaluaciones: "educacion-superior-lms",
  cursos: "educacion-superior-lms",
  pos: "retail-pos-terminal",
  retail: "retail-pos-terminal",
  caja: "retail-pos-terminal",
  punto_venta: "retail-pos-terminal",
  tienda: "retail-pos-terminal",
  iot: "iot-industrial-sensores",
  industrial: "iot-industrial-sensores",
  sensores: "iot-industrial-sensores",
  alarmas: "iot-industrial-sensores",
  scada: "iot-industrial-sensores",
  insurtech: "insurtech-polizas-claims",
  seguros: "insurtech-polizas-claims",
  polizas: "insurtech-polizas-claims",
  claims: "insurtech-polizas-claims",
  suscripcion: "insurtech-polizas-claims",
};

const args = parseArgs(process.argv.slice(2));

if (args["list-domains"]) {
  console.log("Dominios disponibles -> golden (REFERENCIA de nivel, copy+adapt):");
  for (const [k, v] of Object.entries(GOLDEN_MAP)) {
    console.log(`  ${k.padEnd(14)} -> ejemplos/fase-2-ux-ui/prototype-html5-golden/${v}/index.html`);
  }
  console.log("");
  console.log("Alternativa: --freeform  -> starter neutro (sin layout dictado; el agente diseña el dominio).");
  process.exit(0);
}

if (args.help || !args.feature) {
  console.log(`scaffold-prototype.mjs (v12.116) — prototipo HTML5: DEFAULT freeform (starter neutro)

Uso:
  node scripts/scaffold-prototype.mjs --feature NNN-slug [opciones]            (default: --freeform)
  node scripts/scaffold-prototype.mjs --feature NNN-slug --domain <dominio>    (opt-in: copia golden — desaconsejado)

Argumentos:
  --feature <NNN-slug>   (obligatorio) slug de la feature destino.
  --freeform             (DEFAULT v12.116+) genera un STARTER NEUTRO sin layout de dominio
                         dictado: tokens de diseno, estados naturales, una vista lista con
                         datos de mock-data.json, responsive y link al hub. El agente disena
                         libremente las vistas del dominio real DESDE los RF. Debe alcanzar
                         el rubric (check:prototype-html5) por riqueza real, no por copiar.
                         Coherente con CONSTITUTION.md Principio 7 (identidad por feature) y
                         Principio 5 (prototipo = producto real, no metodologia).
  --domain <dominio>     OPT-IN (desaconsejado en v12.116+) — copia un golden como punto de
                         partida. Uno de: streaming, operativo, ecommerce, educacion,
                         dashboard, analytics, mobile, wizard (--list-domains). Bloqueado por
                         check:prototype-diversity (golden-skeleton) si no adaptas la
                         estructura. Preferible: deja el default freeform y CONSULTA los
                         goldens en ejemplos/fase-2-ux-ui/prototype-html5-golden/ como
                         REFERENCIA visual sin copiarlos.
  --titulo "<titulo>"    titulo del producto en el prototipo. Default: derivado del slug.
  --marca "<marca>"      nombre de marca en el topbar. Default: "MiProducto".
  --brand-hue <n|auto>   color de marca (hue 0-360) COMPARTIDO por el proyecto, para
                         coherencia visual entre features. Default: template.config.json
                         (prototype.brand_hue) o 222. "auto" = hue distinto por slug
                         (variedad). La diversidad es estructural, no de color.
  --mode <modo>          standalone (default) | portfolio-spa.
  --root <path>          directorio raiz del proyecto. Default: cwd.
  --force                sobrescribir si existe prototipo previo.
  --list-domains         imprimir mapeo dominio -> golden y salir.

Ejemplos:
  node scripts/scaffold-prototype.mjs --feature 002-catalogo --titulo "Catalogo" --marca "Acme"
  node scripts/scaffold-prototype.mjs --feature 002-catalogo --domain streaming --marca "Acme"   (opt-in)
`);
  process.exit(args.help ? 0 : 1);
}

// v12.116: si no se especifico --domain ni --freeform, default a --freeform. Antes
// (v12.90-v12.115) el comando requeria uno explicito; ahora el default refleja el
// flujo recomendado por la metodologia (no copiar golden).
if (!args.domain && !args.freeform) {
  args.freeform = true;
  console.log(`scaffold-prototype: usando --freeform por default (v12.116+). Si necesitas explicitamente copiar un golden como referencia, pasa --domain <dominio>.`);
}

const root = resolve(args.root || ".");
const feature = String(args.feature).trim();
const freeform = !!args.freeform;
const domain = freeform ? "freeform" : String(args.domain).toLowerCase().trim();
// v12.61: modo de infraestructura. "standalone" (default) = prototipo autocontenido
// con tokens inline. "portfolio-spa" = enlaza specs/_shared/ (tokens.css + mock-api.js
// + app-state.js + ui.js) para un portafolio multi-spec con sistema de diseño comun.
const mode = String(args.mode || "standalone").toLowerCase().trim();
const VALID_MODES = ["standalone", "portfolio-spa"];
if (!VALID_MODES.includes(mode)) {
  console.error(`Error: --mode "${mode}" invalido. Validos: ${VALID_MODES.join(", ")}.`);
  process.exit(1);
}
const portfolioSpa = mode === "portfolio-spa";
const titulo = args.titulo || feature.replace(/^\d+-/, "").split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join(" ");
const marca = args.marca || "MiProducto";

if (!freeform && !GOLDEN_MAP[domain]) {
  console.error(`Error: dominio "${domain}" no reconocido. Dominios validos: ${Object.keys(GOLDEN_MAP).join(", ")}`);
  console.error(`Tip: corre con --list-domains para ver el mapeo, o usa --freeform para un starter neutro.`);
  process.exit(1);
}

const goldenName = freeform ? "freeform" : GOLDEN_MAP[domain];
const goldenPath = freeform ? null : join(root, "ejemplos", "fase-2-ux-ui", "prototype-html5-golden", goldenName, "index.html");
const featureDir = join(root, "specs", feature);
const targetPath = join(featureDir, "prototype-html5", "index.html");

if (!freeform && !existsSync(goldenPath)) {
  console.error(`Error: golden no encontrado en ${goldenPath}`);
  console.error(`Verifica que el repo tenga ejemplos/fase-2-ux-ui/prototype-html5-golden/${goldenName}/index.html`);
  process.exit(2);
}
if (!existsSync(featureDir)) {
  console.error(`Error: feature "${feature}" no existe en specs/. Crea la feature primero con: npm run scaffold:feature -- --slug ${feature} --titulo "${titulo}"`);
  process.exit(2);
}
const replaceMock = !!args["replace-mock"];

if (portfolioSpa) {
  const sharedTokens = join(root, "specs", "_shared", "tokens.css");
  if (!existsSync(sharedTokens)) {
    console.error(`Error: --mode portfolio-spa requiere specs/_shared/ (tokens.css, mock-api.js, app-state.js, ui.js).`);
    console.error(`No se encontro ${sharedTokens.replace(root, "<root>")}.`);
    console.error(`Sincroniza la infraestructura compartida desde la plantilla: npm run template:upgrade:apply`);
    process.exit(2);
  }
}

if (existsSync(targetPath) && !args.force) {
  const stat = statSync(targetPath);
  console.error(`Error: ${targetPath} ya existe (${stat.size} bytes). Usa --force para sobrescribir.`);
  console.error(`Tip: si tu prototipo actual esta pobre (Tailwind CDN, minificado, <250 lineas), borra con: rm ${targetPath} && reintentar.`);
  process.exit(2);
}

mkdirSync(dirname(targetPath), { recursive: true });

// v12.50: leer spec-funcional.md de la feature para inyectar contexto diferenciado.
// Cierra el patron de codex donde 8 features tenian prototipos identicos (392 lineas exactas)
// con mismo mock data porque el agente NO leyo specs de cada feature.
const featureContext = readFeatureContext(featureDir);
if (featureContext.warnings.length > 0) {
  for (const w of featureContext.warnings) console.error(`  ⚠ ${w}`);
}

// v12.98: marca COMPARTIDA por proyecto (coherencia de producto). La diversidad
// es ESTRUCTURAL (check:prototype-diversity, ciego al color), asi que el color ya
// NO necesita variar por feature. Resolucion: --brand-hue > template.config.json
// (prototype.brand_hue/brand_saturation) > default compartido. --brand-hue auto
// restaura el hue por slug (variedad) para quien la quiera.
const brand = resolveBrand(args, root, feature);
const brandHue = brand.hue;

// 1. Punto de partida: golden (copy+adapt) o starter neutro (--freeform).
const goldenHtml = freeform ? buildFreeformStarter({ titulo, marca, feature, brandHue, brandSat: brand.sat, portfolioSpa }) : readFileSync(goldenPath, "utf8");
let html = goldenHtml;
const goldenLines = goldenHtml.split(/\r?\n/).length;
const goldenTokens = (goldenHtml.match(/^\s*--[a-z][a-z0-9-]*:/gm) || []).length;
const goldenMediaQueries = (goldenHtml.match(/@media/g) || []).length;

// 2. Reemplazos canonicos. Solo aplican al golden (el starter ya trae titulo/marca/hub).
const replacements = [];

// 2a. <title> (solo golden; el starter ya lo trae)
if (!freeform) html = html.replace(/<title>[\s\S]*?<\/title>/i, () => {
  replacements.push("<title>");
  return `<title>${escapeHtml(marca)} — ${escapeHtml(titulo)}</title>`;
});

// 2b. Topbar brand. Hay variaciones: <div class="brand">XXX</div>, <span class="brand-name">XXX</span>, etc.
// Reemplaza solo la primera ocurrencia visible.
const brandPatterns = [
  /(<[^>]+class=["'][^"']*\bbrand-name\b[^"']*["'][^>]*>)([^<]+)(<\/[^>]+>)/i,
  /(<[^>]+class=["'][^"']*\bbrand\b[^"']*["'][^>]*>)([^<]+)(<\/[^>]+>)/i,
  /(<header[^>]*>[\s\S]*?<[^>]*>)\s*([A-Z][A-Za-z][A-Za-z0-9 ]{2,30})\s*(<)/i,
];
let brandReplaced = false;
if (!freeform) for (const re of brandPatterns) {
  if (brandReplaced) break;
  html = html.replace(re, (full, pre, oldName, post) => {
    brandReplaced = true;
    replacements.push(`brand: "${oldName.trim()}" -> "${marca}"`);
    return `${pre}${escapeHtml(marca)}${post}`;
  });
}

// 2c. Inyectar link al hub si no existe (despues del topbar).
if (!/href=["'][^"']*prototype\/index\.html/i.test(html) && !/data-hub-link/.test(html)) {
  // Agrega data-hub-link al final del header sin romper estructura.
  html = html.replace(/(<\/header>)/i, () => {
    replacements.push("link al hub");
    return `<a href="../../../prototype/index.html" data-hub-link style="position:fixed;top:8px;right:12px;font-size:11px;color:#6B7280;text-decoration:none;background:rgba(255,255,255,0.95);padding:4px 10px;border-radius:6px;border:1px solid #E5E7EB;z-index:99;">← Hub</a>$1`;
  });
}

// v12.98: 2d. Unificar color de marca por proyecto.
// Inserta un override del token --brand en el primer :root encontrado. El golden
// puede traer su paleta original; este override lo alinea con la marca del proyecto.
const brandOverride = `--brand: hsl(${brand.hue} ${brand.sat}% 38%); --brand-light: hsl(${brand.hue} ${brand.sat}% 92%); --brand-dark: hsl(${brand.hue} ${brand.sat}% 28%);`;
if (!freeform) html = html.replace(/(:root\s*\{)/, (m) => {
  replacements.push(`brand hue=${brandHue}`);
  return `${m}\n  /* scaffold-prototype v12.98: marca compartida del proyecto */\n  ${brandOverride}`;
});

// v12.50: 2e. Inyectar contexto del spec-funcional como comentario HTML visible para el agente.
// Esto deja huella explicita en el archivo de QUE mock data debe adaptar para esta feature.
if (featureContext.contextBlock) {
  html = html.replace(/(<body[^>]*>)/i, `$1\n<!-- ${featureContext.contextBlock} -->\n`);
}

// v12.52: inyectar shared-prototype-helpers inline antes de </body>. Si el golden ya
// tenia la version inline (la incluimos en los goldens v12.52+), este replace solo
// agrega una segunda copia idempotente — el helper se auto-protege con __protoHelpers.
const HELPER_INLINE = `\n<script>
/* shared-prototype-helpers v12.52 (auto-inyectado por scaffold-prototype) */
(function(){if(window.__protoHelpers)return;function getCtx(){var p=new URLSearchParams(location.search);return Object.freeze({from:p.get('from'),role:p.get('role'),id:p.get('id'),demoMode:p.get('demo-mode')==='true'||p.get('from')==='hub',specOrigin:p.get('spec')});}function apply(c){var h=document.querySelector('[data-hub-link]');if(h&&c.demoMode)h.style.display='';if(c.role){document.body.setAttribute('data-active-role',c.role);var sw=document.querySelector('[data-role-switch][data-role="'+c.role+'"]');if(sw)sw.click();}if(c.id){var r=document.querySelector('[data-resource-id="'+c.id+'"]');if(r){r.classList.add('row--linked-context');r.scrollIntoView({block:'center'});}}}function openSpec(n,p){var ctx=getCtx();var q=new URLSearchParams();q.set('from','spec-'+(ctx.specOrigin||'unknown'));if(p&&p.role||ctx.role)q.set('role',(p&&p.role)||ctx.role);if(p&&p.id)q.set('id',p.id);if(ctx.demoMode)q.set('demo-mode','true');window.open('../../../specs/'+String(n).padStart(3,'0')+'-*/prototype-html5/index.html?'+q,'_blank');}
window.__protoHelpers={getCtx,apply,openSpec};window.getPrototypeContext=getCtx;window.applyContextualUI=apply;window.openPrototypeBySpec=openSpec;apply(getCtx());
})();
</script>`;
if (!html.includes('__protoHelpers')) {
  html = html.replace(/<\/body>/i, HELPER_INLINE + '\n</body>');
}

// 2f. Marcador de scaffold para validador (no visible al usuario, util para checks).
// v12.59: --replace-mock reemplaza textos visibles del golden por <<PLACEHOLDER>>
// para forzar al agente a adaptar al dominio real. Cierra el patron codex (002/003)
// donde el agente dejaba mock data del golden sin tocar.
let placeholdersInserted = 0;
if (replaceMock) {
  const result = applyMockPlaceholders(html, goldenName);
  html = result.html;
  placeholdersInserted = result.count;
}

// v12.61: en modo portfolio-spa, enlaza la infraestructura compartida specs/_shared/.
// v12.84: ademas cablea el sidebar compartido (_shared/nav.js) y registra la feature
// en el manifiesto unico _shared/nav-items.js (cross-link entre prototipos).
// v12.86: flags para el resumen — los setea injectSharedInfra (auto-strip vs fallback).
let sidebarAutoReplaced = false;
let sidebarFallback = false;
let navRegistered = false;
if (portfolioSpa) {
  html = injectSharedInfra(html);
  navRegistered = upsertNavItem(root, feature, titulo);
}

// v12.86 (Mejora 2): cablea datos declarativos (mock-data.json) en ambos modos.
const mockData = injectMockData(html, featureDir, portfolioSpa);
html = mockData.html;

// Marcador de scaffold. En freeform NO se emite golden= (no hubo golden que adaptar,
// asi check-prototype-domain-mismatch no aplica).
const markerOrigin = freeform ? `mode=freeform` : `domain=${domain} golden=${goldenName}`;
html = html.replace(/<!DOCTYPE html>/i, `<!DOCTYPE html>\n<!-- scaffold-prototype: ${markerOrigin} feature=${feature} brandHue=${brandHue} mode=${mode} replaceMock=${replaceMock} generated=${new Date().toISOString().slice(0, 10)} -->`);

writeFileSync(targetPath, html, "utf8");
if (replaceMock) {
  console.log(`Placeholders insertados (--replace-mock): ${placeholdersInserted}`);
  console.log(`  Estos placeholders FUERZAN al agente a adaptar el mock al dominio real.`);
  console.log(`  Busca '<<' en el HTML y reemplaza cada placeholder por valores reales.`);
}

const targetLines = html.split(/\r?\n/).length;
console.log(`OK. Prototipo ${freeform ? "starter (freeform) generado" : "copiado y adaptado"}: ${targetPath.replace(root, "<root>")}`);
if (freeform) {
  console.log(`Origen:        --freeform (ANDAMIAJE neutro minimo; el golden es solo REFERENCIA, no se copio)`);
  console.log(`IMPORTANTE:    es un punto de partida, NO el producto. Diseña la UI real del dominio (layout/`);
  console.log(`               componentes propios), consume FEATURE_DATA y BORRA el comentario centinela`);
  console.log(`               'spdd:freeform-starter'. check:prototype-diversity BLOQUEA mientras siga presente.`);
} else console.log(`Golden usado:  ejemplos/fase-2-ux-ui/prototype-html5-golden/${goldenName}/index.html (referencia de nivel)`);
console.log(`Dominio:       ${domain}`);
console.log(`Marca:         ${marca}`);
console.log(`Titulo:        ${titulo}`);
console.log(`Modo:          ${mode}${portfolioSpa ? " (enlaza specs/_shared/ tokens + mock-api + app-state + ui + nav)" : ""}`);
if (portfolioSpa) {
  console.log(`Sidebar compartido: _shared/nav.js cableado (mount #spdd-nav).${navRegistered ? " Feature registrada en _shared/nav-items.js." : " (ya estaba en nav-items.js)"}`);
  if (sidebarAutoReplaced) console.log(`Auto-strip: el <aside> del golden fue REEMPLAZADO por el sidebar compartido (sin paso manual).`);
  if (sidebarFallback) console.log(`AVISO: este golden no tiene sidebar; el nav compartido se monto como barra. Integra <div id="spdd-nav"> en el layout.`);
}
if (mockData.generated > 0) console.log(`Datos: mock-data.json ${mockData.seeded ? "sembrado del spec e " : ""}cableado -> window.FEATURE_DATA (${mockData.generated} entidad/es${mockData.shared ? `, ${mockData.shared} compartida/s en SharedSeed` : ""}). Refina a datos reales del dominio.`);
// v12.91 (V2) / v12.98: aviso de diversidad estructural — si otras features ya
// usan este mismo origen (golden o freeform), el skeleton sera similar y
// check:prototype-diversity (ciego al color) puede bloquear. El agente DEBE
// variar layout/componentes/jerarquia sin cambiar la marca del producto.
const sameOrigin = countSiblingsSameOrigin(root, feature, freeform ? "freeform" : goldenName);
if (sameOrigin > 0) {
  console.log("");
  console.log(`⚠ DIVERSIDAD ESTRUCTURAL: ya hay ${sameOrigin} feature(s) con el mismo origen (${freeform ? "freeform" : "golden " + goldenName}).`);
  console.log(`  Recolorear o cambiar paleta NO basta — check:prototype-diversity es ciego al color y bloquea esqueletos iguales.`);
  console.log(`  Mantén la misma marca del producto y cambia layout/componentes/jerarquia,`);
  console.log(`  o usa un golden distinto / --freeform. Declara el sistema en prototype.md (## Sistema visual e identidad).`);
}
console.log(`Metricas heredadas del golden:`);
console.log(`  lineas:        ${goldenLines}`);
console.log(`  tokens CSS:    ${goldenTokens}`);
console.log(`  media queries: ${goldenMediaQueries}`);
console.log(`Reemplazos aplicados: ${replacements.length === 0 ? "(ninguno — verifica manualmente)" : replacements.join(", ")}`);
console.log("");
console.log("Proximos pasos OBLIGATORIOS:");
console.log(`  1. Declarar datos REALES en mock-data.json (entidades + rows del dominio):`);
console.log(`     specs/${feature}/prototype-html5/mock-data.json  (re-corre scaffold para cablearlos)`);
console.log(`  2. Consumir los datos en la UI: MockApi.resource(FEATURE_DATA.<entidad>) con estados loading/empty/error.`);
console.log(`  3. Adaptar roles visibles a los del proyecto. Mantener la paleta --brand compartida salvo decision explicita de marca.`);
console.log(`  4. Completar decisiones-ux.md citando el golden usado:`);
console.log(`     specs/${feature}/prototype-html5/decisiones-ux.md`);
console.log(`  5. Validar calidad + datos:`);
console.log(`     node ci/scripts/check-html5-prototype-quality.mjs --spec specs/${feature}`);
console.log(`     node ci/scripts/check-prototype-mock-data.mjs --feature ${feature}`);
if (portfolioSpa) {
  console.log(`  6. [portfolio-spa] El sidebar compartido ya esta montado (${sidebarAutoReplaced ? "auto-strip del <aside> aplicado" : "fallback: integra #spdd-nav en el layout"}). Verifica:`);
  console.log(`     - entidades compartidas entre features -> marca "shared": true en mock-data.json (se registran en SharedSeed)`);
  console.log(`     - cross-spec con contexto: SharedNav.go('<slug destino>',{focus,entity,label}) en origen; SharedNav.context() en destino`);
  console.log(`     - valida coherencia: node ci/scripts/check-prototype-spa-coherence.mjs`);
}
process.exit(0);

// ─────────────────────────────────────────────────────────────────────────
function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      if (argv[i + 1] && !argv[i + 1].startsWith("--")) {
        out[key] = argv[++i];
      } else {
        out[key] = true;
      }
    }
  }
  return out;
}

/**
 * v12.59: aplica placeholders a strings caracteristicos del mock data del golden.
 * Cierra el patron real visto en codex (002/003) donde el agente dejaba mock del
 * golden sin adaptar. Con --replace-mock, los strings se vuelven imposibles de
 * ignorar (literalmente '<<NOMBRE-PACIENTE-REAL>>' en pantalla).
 *
 * Reglas conservadoras (no rompemos estructura, solo nombres propios y IDs):
 *   - Nombres tipo "Roberto Gomez", "Maria Vega" -> '<<NOMBRE_PERSONA>>'
 *   - IDs tipo "EXP-2026-001", "MRN-44218", "POL-AUT-..." -> '<<ID_RECURSO>>'
 *   - Marca del golden ("FaithStream", "MedRecord", etc.) -> '<<MARCA>>'
 *   - Strings de dominio especifico por golden.
 *
 * NO toca: tokens CSS, comentarios HTML, JavaScript funcional, atributos.
 */
function applyMockPlaceholders(html, goldenName) {
  let result = html;
  let count = 0;
  // Patrones genericos aplicables a cualquier golden.
  const GENERIC_PATTERNS = [
    // IDs tipo PREFIX-NNNN o PREFIX-2026-NNNN
    { re: /\b[A-Z]{2,5}-(?:\d{4}-)?\d{3,5}\b/g, replacement: '<<ID_RECURSO>>' },
    // Telefonos +51 999••2341, +51 998••3412, etc.
    { re: /\+\d{1,3}\s+\d{3}[•\.\s]+\d{3,4}/g, replacement: '<<TELEFONO>>' },
    // Emails de prueba (mantener formato pero placeholder)
    { re: /\b[a-zA-Z]+\.[a-zA-Z]\s*@\s*[a-zA-Z]+\.com\b/g, replacement: '<<EMAIL>>' },
  ];
  // Patrones especificos por golden.
  const FINGERPRINTS_TO_PLACEHOLDER = {
    "saas-operativo-bandeja": [
      { fp: "WorkDesk", pl: '<<MARCA>>' },
      { fp: "Maria Vega", pl: '<<NOMBRE_USUARIO_ACTUAL>>' },
      { fp: "Roberto Gomez", pl: '<<NOMBRE_CLIENTE>>' },
    ],
    "streaming-catalogo-player": [
      { fp: "FaithStream", pl: '<<MARCA>>' },
      { fp: "Marcos", pl: '<<NOMBRE_PERFIL>>' },
      { fp: "Genesis Kids", pl: '<<TITULO_CONTENIDO>>' },
    ],
    "salud-hipaa-clinico": [
      { fp: "MedRecord", pl: '<<MARCA>>' },
      { fp: "Dra. Maria Vega", pl: '<<NOMBRE_MEDICO>>' },
      { fp: "Gomez, Roberto", pl: '<<NOMBRE_PACIENTE>>' },
      { fp: "Sanchez, Ana Maria", pl: '<<NOMBRE_PACIENTE_2>>' },
    ],
    "erp-multimodulo-financiero": [
      { fp: "OmniERP", pl: '<<MARCA>>' },
      { fp: "Acme Holdings", pl: '<<RAZON_SOCIAL>>' },
      { fp: "Luis Vargas", pl: '<<NOMBRE_USUARIO>>' },
    ],
    "logistica-tracking-flota": [
      { fp: "FleetOps", pl: '<<MARCA>>' },
      { fp: "Carlos Gutierrez", pl: '<<NOMBRE_DISPATCHER>>' },
      { fp: "Jose Pérez", pl: '<<NOMBRE_CONDUCTOR>>' },
      { fp: "Almacen Lurin", pl: '<<NOMBRE_ALMACEN>>' },
    ],
    "educacion-colegio-sis": [
      { fp: "EduCol", pl: '<<MARCA>>' },
      { fp: "Colegio San Pedro", pl: '<<NOMBRE_INSTITUCION>>' },
      { fp: "Aguirre Lopez, Ana Sofia", pl: '<<NOMBRE_ESTUDIANTE>>' },
      { fp: "Carmen Lopez Vasquez", pl: '<<NOMBRE_APODERADO>>' },
    ],
    "educacion-superior-lms": [
      { fp: "UniLearn", pl: '<<MARCA>>' },
      { fp: "Dr. Andres Torres", pl: '<<NOMBRE_DOCENTE>>' },
      { fp: "Castaneda, Ana", pl: '<<NOMBRE_ESTUDIANTE>>' },
      { fp: "Algoritmos y Estructuras de Datos", pl: '<<NOMBRE_CURSO>>' },
    ],
    "retail-pos-terminal": [
      { fp: "ShopPOS", pl: '<<MARCA>>' },
      { fp: "Inca Kola", pl: '<<NOMBRE_PRODUCTO>>' },
      { fp: "Arroz Costeno", pl: '<<NOMBRE_PRODUCTO_2>>' },
      { fp: "Luis Ramirez", pl: '<<NOMBRE_CAJERO>>' },
    ],
    "iot-industrial-sensores": [
      { fp: "FactoryIQ", pl: '<<MARCA>>' },
      { fp: "Ing. Roberto Mendoza", pl: '<<NOMBRE_INGENIERO>>' },
      { fp: "Planta Lurin", pl: '<<NOMBRE_PLANTA>>' },
      { fp: "Reactor R-1", pl: '<<NOMBRE_EQUIPO>>' },
    ],
    "insurtech-polizas-claims": [
      { fp: "InsureNow", pl: '<<MARCA>>' },
      { fp: "Sandra Vargas", pl: '<<NOMBRE_SUSCRIPTORA>>' },
      { fp: "Familia Vasquez Lopez", pl: '<<NOMBRE_FAMILIA>>' },
      { fp: "Clinica San Pablo", pl: '<<RED_PROVEEDOR>>' },
    ],
  };
  // Aplicar fingerprints especificos.
  const specific = FINGERPRINTS_TO_PLACEHOLDER[goldenName] || [];
  for (const { fp, pl } of specific) {
    const re = new RegExp(escapeReg(fp), "g");
    const matches = result.match(re);
    if (matches) {
      count += matches.length;
      result = result.replace(re, pl);
    }
  }
  // Aplicar patrones genericos.
  for (const { re, replacement } of GENERIC_PATTERNS) {
    const matches = result.match(re);
    if (matches) {
      count += matches.length;
      result = result.replace(re, replacement);
    }
  }
  return { html: result, count };
}

function escapeReg(s) {
  return s.replace(/[.+^${}()|[\]\\]/g, "\\$&");
}

/**
 * v12.61: inyecta la infraestructura compartida specs/_shared/ en modo portfolio-spa.
 * Enlaza tokens.css (sistema de diseño comun) + seed.js + mock-api.js + app-state.js
 * (sesion en localStorage, sobrevive target=_blank) + ui.js + nav-items.js + nav.js.
 * Ruta relativa desde specs/NNN-feature/prototype-html5/index.html -> ../../_shared/.
 * Idempotente: si ya estan enlazados, no duplica.
 *
 * v12.86 (Mejora 1): AUTO-STRIP del sidebar del golden. Reemplaza in-place el
 * <aside data-spdd-sidebar> (o <aside class="...sidebar...">) por <div id="spdd-nav">,
 * conservando el slot del layout (los goldens usan un shell flex, asi que el mount
 * queda como columna izquierda). Neutraliza el shim `margin-left: var(--sidebar-w)`
 * (golden con sidebar fixed) para que no quede hueco. Si el golden NO tiene sidebar
 * (mobile/streaming/kpi/pos), cae al fallback: inserta el mount como topbar tras <body>.
 */
function injectSharedInfra(html) {
  if (/_shared\/tokens\.css/.test(html)) return html; // ya inyectado
  const linkTag = '<link rel="stylesheet" href="../../_shared/tokens.css">';
  const scriptTags = [
    '<script src="../../_shared/seed.js"></script>',
    '<script src="../../_shared/mock-api.js"></script>',
    '<script src="../../_shared/app-state.js"></script>',
    '<script src="../../_shared/ui.js"></script>',
    '<script src="../../_shared/nav-items.js"></script>',
    '<script src="../../_shared/nav.js"></script>',
  ].join("\n  ");
  const block = `  <!-- scaffold-prototype --mode portfolio-spa: infraestructura compartida specs/_shared/ -->\n  ${linkTag}\n  ${scriptTags}\n`;
  const hubExists = existsSync(join(root, "prototype", "index.html"));
  const mountScript = `<script>if(window.SharedNav)SharedNav.mount('#spdd-nav',{active:${JSON.stringify(feature)},brand:${JSON.stringify(marca)},hub:${hubExists ? "true" : "false"}});</script>`;
  let out = html;
  if (/<\/head>/i.test(out)) out = out.replace(/<\/head>/i, block + "</head>");
  else if (/<\/title>/i.test(out)) out = out.replace(/<\/title>/i, "</title>\n" + block);
  else out = out.replace(/(<body[^>]*>)/i, block + "$1");

  // AUTO-STRIP: reemplaza el sidebar del golden in-place por el mount compartido.
  const sidebarRe = /<aside\b[^>]*\bdata-spdd-sidebar\b[\s\S]*?<\/aside>/i;
  const sidebarReClass = /<aside\b[^>]*class="[^"]*\bsidebar\b[^"]*"[\s\S]*?<\/aside>/i;
  const mountDiv = `<!-- portfolio-spa: sidebar COMPARTIDO (_shared/nav.js) — reemplaza al <aside> del golden -->\n<div id="spdd-nav"></div>`;
  if (sidebarRe.test(out)) {
    out = out.replace(sidebarRe, mountDiv);
    sidebarAutoReplaced = true;
  } else if (sidebarReClass.test(out)) {
    out = out.replace(sidebarReClass, mountDiv);
    sidebarAutoReplaced = true;
  }
  if (sidebarAutoReplaced) {
    // Neutraliza el shim de offset del contenido (golden con sidebar position:fixed).
    out = out.replace(/margin-left:\s*var\(--sidebar-w\)/g, "margin-left: 0");
    // Inyecta el mount script antes de </body>.
    if (/<\/body>/i.test(out)) out = out.replace(/<\/body>/i, mountScript + "\n</body>");
    else out += "\n" + mountScript;
  } else {
    // Fallback: golden sin sidebar. Inserta el mount como barra superior tras <body>.
    sidebarFallback = true;
    const navMount = `\n<!-- portfolio-spa: este golden NO tiene sidebar. El nav compartido se monta como barra.\n     Integra <div id="spdd-nav"></div> donde corresponda en el layout. -->\n<div id="spdd-nav"></div>\n${mountScript}\n`;
    if (/<body[^>]*>/i.test(out)) out = out.replace(/(<body[^>]*>)/i, "$1" + navMount);
  }
  return out;
}

/**
 * v12.86 (Mejora 2): cablea datos declarativos del prototipo.
 * Lee specs/<feature>/prototype-html5/mock-data.json (si existe) y genera un
 * <script> que expone window.FEATURE_DATA = { entidad: [filas] } y, en modo
 * portfolio-spa, registra las entidades `shared:true` en SharedSeed (cross-spec).
 * El agente consume esos datos: MockApi.resource(FEATURE_DATA.x) / SharedSeed.resource("y").
 * Si no existe el archivo, lo CREA con un esqueleto para que el agente lo complete.
 */
function injectMockData(html, featureDir, isSpa) {
  const dataPath = join(featureDir, "prototype-html5", "mock-data.json");
  let seeded = false;
  if (!existsSync(dataPath)) {
    // v12.90 (P3): siembra mock-data.json INFERIDO del spec (entidad + columnas + RFs)
    // y CONTINUA para inyectarlo (antes requeria una 2da corrida del scaffold).
    seedMockDataFromSpec(featureDir, dataPath);
    seeded = true;
  }
  let parsed;
  try { parsed = JSON.parse(readFileSync(dataPath, "utf8")); } catch { return { html, generated: 0, error: true }; }
  const entities = parsed && parsed.entities && typeof parsed.entities === "object" ? parsed.entities : {};
  const names = Object.keys(entities);
  if (names.length === 0) return { html, generated: 0, empty: true };
  const flat = {};
  const sharedRegs = [];
  for (const name of names) {
    const def = entities[name] || {};
    const rows = Array.isArray(def.rows) ? def.rows : (Array.isArray(def) ? def : []);
    flat[name] = rows;
    if (isSpa && def.shared) sharedRegs.push(name);
  }
  const json = JSON.stringify(flat, null, 2);
  const regLines = sharedRegs
    .map((n) => `  if (window.SharedSeed) SharedSeed.register(${JSON.stringify(n)}, window.FEATURE_DATA[${JSON.stringify(n)}]);`)
    .join("\n");
  const script = `\n<!-- scaffold-prototype: datos declarativos (mock-data.json). El agente los consume con MockApi.resource(FEATURE_DATA.x)${isSpa ? " / SharedSeed.resource(\"y\")" : ""}. -->\n<script>\nwindow.FEATURE_DATA = ${json};\n${regLines}\n</script>\n`;
  let out = html;
  if (/<\/body>/i.test(out)) out = out.replace(/<\/body>/i, script + "</body>");
  else out += script;
  return { html: out, generated: names.length, shared: sharedRegs.length, seeded };
}

// v12.90 (P3): siembra mock-data.json INFERIDO del spec de la feature.
// Lee spec-tecnica.md (Tabla `<entidad>` + columnas) y spec-funcional.md (RFs) para
// derivar la entidad principal y sus campos; genera 6 filas de ejemplo (valores
// genericos, sin <<placeholder>>, para que el prototipo renderice de una). El agente
// luego refina a datos reales del dominio. NO inventa datos realistas (eso es del agente).
function seedMockDataFromSpec(featureDir, dataPath) {
  const slug = featureDir.replace(/[\\/]+$/, "").split(/[\\/]/).pop();
  let entidad = (slug || "registro").replace(/^\d+-/, "").replace(/-/g, "_");
  let fields = ["nombre", "estado"];
  let rfs = [];
  try {
    const st = readFileSync(join(featureDir, "spec-tecnica.md"), "utf8");
    const mt = st.match(/Tabla\s*`([a-z0-9_]+)`/i);
    if (mt) entidad = mt[1];
    // columnas de la primera tabla markdown: | col | tipo | notas |
    const cols = [...st.matchAll(/^\|\s*([a-z][a-z0-9_]*)\s*\|/gim)]
      .map((m) => m[1].toLowerCase())
      .filter((c) => !["columna", "id", "created_at", "updated_at"].includes(c));
    const picked = [...new Set(cols)].slice(0, 4);
    if (picked.length > 0) fields = picked;
  } catch { /* sin spec-tecnica: defaults */ }
  try {
    const sf = readFileSync(join(featureDir, "spec-funcional.md"), "utf8");
    rfs = [...new Set((sf.match(/\bRF-\d+/gi) || []).map((s) => s.toUpperCase()))].slice(0, 6);
  } catch { /* sin spec-funcional */ }
  const estados = ["activo", "pendiente", "inactivo"];
  const rows = [];
  for (let i = 1; i <= 6; i += 1) {
    const row = { id: i };
    for (const f of fields) {
      if (/estado|status/.test(f)) row[f] = estados[i % estados.length];
      else if (/fecha|date/.test(f)) row[f] = `2026-0${(i % 9) + 1}-15`;
      else if (/monto|precio|price|amount|total|cantidad|qty/.test(f)) row[f] = i * 100;
      else row[f] = `${entidad} ${i}`;
    }
    rows.push(row);
  }
  const seed = {
    _doc: `Datos del prototipo INFERIDOS del spec (entidad "${entidad}"${rfs.length ? `, RFs: ${rfs.join(", ")}` : ""}). Valores genericos: refinalos a datos REALES del dominio. scaffold-prototype los cablea en window.FEATURE_DATA.`,
    entities: { [entidad]: { shared: false, rows } },
  };
  try { writeFileSync(dataPath, JSON.stringify(seed, null, 2) + "\n", "utf8"); } catch { /* best-effort */ }
}

// v12.84: registra la feature en el manifiesto unico _shared/nav-items.js (si no existe).
function upsertNavItem(rootDir, slug, label) {
  const p = join(rootDir, "specs", "_shared", "nav-items.js");
  if (!existsSync(p)) return false;
  let txt = readFileSync(p, "utf8");
  // Detecta el slug solo en lineas NO comentadas (evita falsos positivos del ejemplo).
  const codeOnly = txt.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
  if (new RegExp(`slug:\\s*["']${slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`).test(codeOnly)) return false;
  // Greedy hasta el `];` FINAL del array (ignora los `]` dentro de comentarios de ejemplo).
  const m = txt.match(/(window\.SPDD_NAV_ITEMS\s*=\s*\[)([\s\S]*)(\]\s*;)/);
  if (!m) return false;
  const entry = `  { slug: "${slug}", label: ${JSON.stringify(label)}, icon: "📄" },`;
  const inner = m[2].replace(/\s+$/, "") + "\n" + entry + "\n";
  txt = txt.replace(m[0], m[1] + inner + m[3]);
  writeFileSync(p, txt, "utf8");
  return true;
}

/**
 * v12.101 (limpieza): ANDAMIAJE NEUTRO MINIMO de --freeform. La GUIA metodologica vive
 * en COMENTARIOS HTML (invisible), NO como texto visible. Antes (v12.99) renderizaba
 * "Andamiaje neutro" / "Estados UI reutilizables" / "Ejemplo de lista (reemplazar...)"
 * como UI -> ensuciaba el producto ("UI metodologica"). Ahora lo VISIBLE es UI neutra
 * minima (una lista que consume FEATURE_DATA). El agente diseña la UI real del dominio.
 * Centinela spdd:freeform-starter -> check:prototype-diversity bloquea hasta rediseñar.
 */
function buildFreeformStarter({ titulo, marca, feature, brandHue, brandSat = 55 }) {
  const T = escapeHtml(titulo);
  const M = escapeHtml(marca);
  const rows = [];
  for (let i = 1; i <= 4; i += 1) {
    const estado = ["activo", "pendiente", "inactivo"][i % 3];
    rows.push(`      <li class="ff-item"><span>Registro ${i}</span><span class="ff-badge ff-badge--${estado}">${estado}</span></li>`);
  }
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${M} — ${T}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
:root{
  --brand:hsl(${brandHue} ${brandSat}% 38%); --brand-light:hsl(${brandHue} ${brandSat}% 92%); --brand-dark:hsl(${brandHue} ${brandSat}% 28%);
  --success:#10B981; --warning:#F59E0B; --danger:#DC2626; --info:#06B6D4;
  --neutral-50:#F9FAFB; --neutral-100:#F3F4F6; --neutral-200:#E5E7EB; --neutral-500:#6B7280; --neutral-700:#374151; --neutral-900:#111827;
  --surface:#fff; --border:#E5E7EB; --radius:8px; --shadow-sm:0 1px 3px rgba(0,0,0,.08); --transition:.18s ease; --font:'Segoe UI',system-ui,sans-serif;
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--font);color:var(--neutral-900);background:var(--neutral-50)}
.topbar{display:flex;align-items:center;gap:12px;height:56px;padding:0 20px;background:var(--surface);border-bottom:1px solid var(--border)}
.brand{font-weight:800;color:var(--brand)} .sub{color:var(--neutral-500);font-size:14px}
.main{max-width:900px;margin:0 auto;padding:24px}
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow-sm);padding:20px;margin-bottom:16px}
.ff-list{list-style:none;display:flex;flex-direction:column;gap:8px}
.ff-item{display:flex;justify-content:space-between;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius)}
.ff-badge{font-size:12px;padding:2px 8px;border-radius:999px;background:var(--brand-light);color:var(--brand-dark)}
@media (max-width:720px){.main{padding:16px}}
</style>
</head>
<body>
<!-- ===================================================================
     spdd:freeform-starter — ANDAMIAJE NEUTRO (este comentario NO es visible al usuario).
     INSTRUCCIONES PARA EL AGENTE (no las dejes como texto en pantalla):
       1. Diseña la UI REAL del dominio "${T}": layout, componentes y jerarquia propios.
       2. Usa los tokens de marca (compartidos por el proyecto) y consume FEATURE_DATA
          (de mock-data.json) para los datos.
       3. Implementa los estados UI cuando apliquen: loading, empty, error, success y
          permission denied — con el vocabulario del dominio, no etiquetas tecnicas.
       4. BORRA este comentario al terminar. Mientras exista, check:prototype-diversity
          BLOQUEA (es un punto de partida, NO el producto).
==================================================================== -->
<header class="topbar">
  <span class="brand">${M}</span><span class="sub">${T}</span>
  <a href="../../../prototype/index.html" data-hub-link style="margin-left:auto;font-size:12px;color:var(--neutral-500);text-decoration:none">← Hub</a>
</header>
<main class="main">
  <section class="card">
    <h2 style="margin-bottom:12px">${T}</h2>
    <ul class="ff-list" id="ff-list">
${rows.join("\n")}
    </ul>
  </section>
</main>
<script>
// Consume los datos declarados en mock-data.json (window.FEATURE_DATA).
window.addEventListener('DOMContentLoaded', function(){
  var data = window.FEATURE_DATA || {}; var key = Object.keys(data)[0];
  var rows = key ? data[key] : null; if (!rows || !rows.length) return;
  var ul = document.getElementById('ff-list'); if (!ul) return;
  ul.innerHTML = rows.map(function(r){
    var est = r.estado || 'activo';
    var label = r.nombre || r.titulo || r.name || ('Registro ' + r.id);
    return '<li class="ff-item"><span>' + label + '</span><span class="ff-badge ff-badge--' + est + '">' + est + '</span></li>';
  }).join('');
});
</script>
</body>
</html>
`;
}

// v12.91 (V2) / re-agregada v12.103: cuenta otras features cuyo prototipo comparte el
// mismo origen (mismo golden, o freeform), leyendo el marker scaffold-prototype de cada
// index.html. Sirve para advertir riesgo de esqueleto repetido (diversity es ciego al
// color). NOTA: el splice de buildFreeformStarter (v12.99/101) la habia borrado por error
// -> scaffold-prototype crasheaba (ReferenceError) tras escribir el archivo.
function countSiblingsSameOrigin(rootDir, currentFeature, origin) {
  const specsDir = join(rootDir, "specs");
  if (!existsSync(specsDir)) return 0;
  let count = 0;
  let entries;
  try { entries = readdirSync(specsDir, { withFileTypes: true }); } catch { return 0; }
  for (const e of entries) {
    if (!e.isDirectory() || e.name === currentFeature || !/^\d{3,}-/.test(e.name)) continue;
    const p = join(specsDir, e.name, "prototype-html5", "index.html");
    if (!existsSync(p)) continue;
    let html;
    try { html = readFileSync(p, "utf8"); } catch { continue; }
    const m = html.match(/<!--\s*scaffold-prototype:[^>]*-->/i);
    if (!m) continue;
    const sib = /mode=freeform/.test(m[0]) ? "freeform" : (m[0].match(/golden=([a-z0-9-]+)/i) || [])[1];
    if (sib && sib === origin) count += 1;
  }
  return count;
}

function deriveHueFromSlug(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i += 1) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

// v12.98: resuelve la MARCA del prototipo (hue + saturacion) — compartida por
// proyecto para coherencia de producto. Precedencia:
//   --brand-hue <n|auto> > template.config.json (prototype.brand_hue/brand_saturation)
//   > default compartido (hue 222, sat 55). "auto" => hue por slug (variedad opt-in).
// La diversidad sigue siendo estructural (check:prototype-diversity ignora el color),
// asi que compartir la marca NO reabre el patron de clones.
function resolveBrand(a, rootDir, feature) {
  const DEFAULT_HUE = 222;
  const DEFAULT_SAT = 55;
  const norm = (n) => (((Number(n) % 360) + 360) % 360);
  let hue = null;
  let sat = null;
  let auto = false;
  // 1. flag --brand-hue
  if (a["brand-hue"] != null && a["brand-hue"] !== true) {
    if (String(a["brand-hue"]).toLowerCase() === "auto") auto = true;
    else if (!Number.isNaN(Number(a["brand-hue"]))) hue = norm(a["brand-hue"]);
  }
  // 2. template.config.json > prototype.brand_hue / brand_saturation
  let cfg = null;
  try { cfg = JSON.parse(readFileSync(join(rootDir, "template.config.json"), "utf8")); } catch { /* sin config */ }
  const p = (cfg && cfg.prototype) || {};
  if (hue == null && !auto) {
    if (String(p.brand_hue).toLowerCase() === "auto") auto = true;
    else if (typeof p.brand_hue === "number") hue = norm(p.brand_hue);
  }
  if (typeof p.brand_saturation === "number") sat = Math.max(0, Math.min(100, p.brand_saturation));
  // 3. auto => variedad por slug (comportamiento previo a v12.98).
  if (auto) hue = deriveHueFromSlug(feature);
  if (hue == null) hue = DEFAULT_HUE;
  if (sat == null) sat = DEFAULT_SAT;
  return { hue, sat, auto };
}

/**
 * v12.50: lee spec-funcional.md de la feature y extrae bloque de contexto util
 * para que el agente sepa que adaptar (RFs declarados, actores, mock esperado).
 * Si no existe, deja warning. No es bloqueante (el scaffold puede correr antes
 * de que spec-funcional.md tenga contenido real).
 */
function readFeatureContext(featureDir) {
  const ctx = { warnings: [], contextBlock: null };
  const specPath = join(featureDir, "spec-funcional.md");
  if (!existsSync(specPath)) {
    ctx.warnings.push(`spec-funcional.md no existe en ${featureDir}. Corre 'npm run scaffold:feature' primero para generar la estructura canonica.`);
    return ctx;
  }
  const text = readFileSync(specPath, "utf8");
  const rfs = [...text.matchAll(/\*\*\s*(RF-\d+|RNF-\d+|HU-\d+)\s*\*\*\s*:\s*([^\n]+)/g)]
    .map((m) => `${m[1]}: ${m[2].trim().slice(0, 80)}`)
    .slice(0, 8);
  const actores = text.match(/##\s*Actores[\s\S]*?(?=^##|\Z)/m);
  const actoresLines = actores ? actores[0].split(/\r?\n/).filter((l) => /\|\s*<?\w/.test(l) && !/^[\s|-]+$/.test(l)).slice(0, 4) : [];
  const lines = [
    "scaffold-prototype: contexto del spec-funcional.md para adaptar mock data.",
    ...(rfs.length > 0 ? ["", "Requerimientos a representar visualmente en este prototipo:"] : []),
    ...rfs.map((r) => `  - ${r}`),
    ...(actoresLines.length > 0 ? ["", "Actores/roles a representar:"] : []),
    ...actoresLines.map((l) => `  ${l.trim()}`),
    "",
    "NO copies el mock data del golden literal — adapta nombres, IDs, registros al dominio de esta feature.",
  ];
  ctx.contextBlock = lines.join("\n     ");
  return ctx;
}
