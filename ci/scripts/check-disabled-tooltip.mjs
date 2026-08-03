#!/usr/bin/env node
/**
 * check-disabled-tooltip.mjs (v12.151)
 *
 * Prohibe explicar en un TOOLTIP por que un boton esta deshabilitado.
 *
 * POR QUE EXISTE. En `@angular/material` 21.2.14, `MatButtonBase`:
 *
 *     _getDisabledAttribute() { return this.disabledInteractive || !this.disabled ? null : true; }
 *
 * Sin `disabledInteractive`, un boton deshabilitado lleva el atributo `disabled` NATIVO. Un boton
 * nativamente deshabilitado no emite eventos de raton, asi que un `matTooltip` (o un `title`)
 * colgado de el NO SE DISPARA JAMAS. El texto existe en el codigo, se traduce, pasa la prueba de
 * paridad i18n... y ningun usuario lo lee nunca.
 *
 * Paso de verdad, y en el money-path: el cuatro-ojos del PAY correctivo deshabilitaba el boton
 * "Aprobar y enviar" para quien habia solicitado el envio y ponia el motivo en un `matTooltip`.
 * El control funcionaba; la EXPLICACION no llegaba. El operador veia un boton gris sin saber por
 * que, que es justo lo que el mensaje venia a evitar. El gemelo estaba en mt101-pay-conflicts.
 *
 * Y el arreglo aparente es peor que el defecto: anadir `disabledInteractive` quita el `disabled`
 * nativo, y el UNICO sitio donde Material corta el click (`_setupAsAnchor`) solo corre si
 * `tagName === 'A'`. En un <button> el click pasaria al handler. Por eso este gate NO acepta
 * `disabledInteractive` como remedio en un boton gobernado: el remedio es texto VISIBLE, que
 * ademas llega a teclado y a lector de pantalla, donde un tooltip de hover nunca llego.
 *
 * QUE MIRA, exactamente. Un tooltip constante que solo ETIQUETA la accion ("Deshacer") no es este
 * defecto: se pierde cuando el boton esta gris y no pasa nada. El defecto es el tooltip que
 * INTENTA EXPLICAR EL BLOQUEO. Se detecta sin ambiguedad: la expresion del tooltip ramifica sobre
 * un identificador que TAMBIEN aparece en la expresion de [disabled]. Si el tooltip depende de la
 * condicion que apaga el boton, esta hablando del bloqueo, y no se leera.
 *
 * Modos: --strict (exit 1, default segun CHECK_STRICT) · --warn · --root <path>
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const VERSION = "v12.151";
const IGNORAR = new Set(["node_modules", "dist", ".angular", ".nx", "coverage"]);

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args);

console.log(`check-disabled-tooltip (${VERSION})`);

const frontend = join(root, "frontend");
if (!existsSync(frontend)) {
  console.error("\nNo existe frontend/. Este gate mira plantillas de Angular: sin ellas no puede afirmar nada.");
  process.exit(strict ? 1 : 0);
}

const plantillas = walk(frontend).filter((f) => f.endsWith(".html"));
if (plantillas.length === 0) {
  console.error("\nCero plantillas .html bajo frontend/. Un gate que no mira nada no puede dar OK.");
  process.exit(strict ? 1 : 0);
}

const hallazgos = [];
for (const file of plantillas) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(/<button\b[^>]*>/gs)) {
    const tag = m[0];
    const disabled = atributo(tag, "disabled");
    if (!disabled) continue;
    const tooltip =
      atributo(tag, "matTooltip") || atributo(tag, "title") || atributo(tag, "attr.title");
    if (!tooltip) continue;

    // El tooltip habla del bloqueo si depende de algo que tambien apaga el boton.
    const compartidos = [...identificadores(tooltip)].filter((id) => identificadores(disabled).has(id));
    if (compartidos.length === 0) continue;

    hallazgos.push({
      file: relative(root, file).replace(/\\/g, "/"),
      line: src.slice(0, m.index).split("\n").length,
      compartidos,
      tag: tag.replace(/\s+/g, " ").slice(0, 120),
    });
  }
}

console.log(`Plantillas revisadas: ${plantillas.length}`);

if (hallazgos.length === 0) {
  console.log("OK. Ningun boton explica su bloqueo en un tooltip que nadie puede llegar a ver.");
  process.exit(0);
}

console.error(`\nMOTIVO DE BLOQUEO INVISIBLE: ${hallazgos.length} boton(es).`);
for (const h of hallazgos) {
  console.error(`  ✗ ${h.file}:${h.line}`);
  console.error(`      el tooltip ramifica sobre ${h.compartidos.map((c) => `\`${c}\``).join(", ")}, que tambien esta en [disabled]`);
  console.error(`      ${h.tag}`);
}
console.error(`\nUn <button> con \`disabled\` nativo no emite eventos de raton: ese tooltip NO se muestra nunca.`);
console.error(`Remedio: dejar en el tooltip solo la etiqueta de la accion (si la hay) y sacar el motivo`);
console.error(`del bloqueo a texto VISIBLE junto al boton — la clase global \`.ih-governance-note\`.`);
console.error(`NO uses \`disabledInteractive\`: quita el \`disabled\` nativo y Material solo corta el click`);
console.error(`en anchors (\`_setupAsAnchor\`), asi que en un <button> el handler se ejecutaria.`);

process.exit(strict ? 1 : 0);

/** Valor de `attr=".."`, `[attr]=".."` o `[attr]='..'`; null si el atributo no esta. */
function atributo(tag, nombre) {
  const esc = nombre.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\[?${esc}\\]?\\s*=\\s*("([^"]*)"|'([^']*)')`, "s");
  const m = tag.match(re);
  if (!m) return null;
  return m[2] ?? m[3] ?? "";
}

/** Identificadores llamables/leibles de una expresion de plantilla, sin literales ni palabras clave. */
function identificadores(expr) {
  const fuera = new Set(["true", "false", "null", "undefined", "i18n", "t"]);
  const out = new Set();
  // Fuera los literales de cadena: 'audit.quarantine.x' no es un identificador compartido.
  for (const id of expr.replace(/'[^']*'|"[^"]*"/g, " ").matchAll(/[A-Za-z_$][\w$]*/g)) {
    if (!fuera.has(id[0])) out.add(id[0]);
  }
  return out;
}

function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    if (IGNORAR.has(entry)) return [];
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      if (argv[i + 1] && !argv[i + 1].startsWith("--")) out[key] = argv[++i];
      else out[key] = true;
    }
  }
  return out;
}
