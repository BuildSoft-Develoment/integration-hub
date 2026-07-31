#!/usr/bin/env node
/**
 * gen-catalogo-tipos.mjs
 *
 * Genera la zona <!-- auto:start name=catalogo-tipos --> del documento canonico de catalogos, leyendo
 * los providers REALES del codigo: fuentes, readers y task types.
 *
 * POR QUE EXISTE
 * La auditoria de las 9 fases encontro el mismo error repetido en seis documentos: enumeraban "4
 * fuentes" cuando hay 8, "6 tipos de tarea" cuando hay mas de 20, y readers que ya no viven en el
 * motor. No es que estuvieran mal escritos: es que una lista escrita a mano caduca el dia que alguien
 * registra el noveno provider, y nadie vuelve a los seis sitios.
 *
 * La solucion no es corregir las seis listas -volverian a caducar-, es que dejen de existir: las fases
 * declaran el MECANISMO y enlazan aqui, y aqui el contenido lo pone el codigo.
 *
 * Uso:
 *   node ci/scripts/gen-catalogo-tipos.mjs            # reescribe la zona
 *   node ci/scripts/gen-catalogo-tipos.mjs --check    # falla si esta desactualizada (para el CI)
 */

import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import process from 'node:process';
import { JAVA_MODULES } from './_lib/source-roots.mjs';

const argv = process.argv.slice(2);
const root = resolve(argv.includes('--root') ? argv[argv.indexOf('--root') + 1] : '.');
const check = argv.includes('--check');

const TARGET = join(root, 'docs', 'transversal', '90.08-catalogo-de-tipos.md');
const ZONE = 'catalogo-tipos';

/** Recorre un directorio devolviendo todos los .java. */
function javaFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) javaFiles(full, out);
    else if (e.isFile() && e.name.endsWith('.java')) out.push(full);
  }
  return out;
}

/**
 * Extrae el identificador que un provider declara.
 *
 * Se busca el valor devuelto por el metodo declarado (type() / sourceType() / readerType()) y, si el
 * provider lo expone como constante, tambien esa. Deliberadamente NO se intenta interpretar codigo
 * dinamico: un provider que calcule su tipo en runtime se reporta como "dinamico" en vez de inventar
 * un valor. Es preferible un hueco visible a un catalogo que miente.
 */
function declaredTypes(file, methodNames) {
  const text = readFileSync(file, 'utf8');
  const found = new Set();
  for (const m of methodNames) {
    const re = new RegExp('public\\s+String\\s+' + m + '\\s*\\([^)]*\\)\\s*\\{[^}]*?return\\s+"([^"]+)"', 's');
    const hit = text.match(re);
    if (hit) found.add(hit[1]);
    // Variante: `return CONSTANTE;` con la constante declarada en el propio fichero.
    const viaConst = text.match(new RegExp('public\\s+String\\s+' + m + '\\s*\\([^)]*\\)\\s*\\{[^}]*?return\\s+([A-Z0-9_]+)\\s*;', 's'));
    if (viaConst) {
      const decl = text.match(new RegExp('String\\s+' + viaConst[1] + '\\s*=\\s*"([^"]+)"'));
      if (decl) found.add(decl[1]);
      else found.add('(dinamico)');
    }
  }
  return [...found];
}

function collect(suffix, methodNames) {
  const rows = [];
  for (const mod of JAVA_MODULES) {
    for (const f of javaFiles(join(root, mod, 'src', 'main', 'java'))) {
      const name = basename(f, '.java');
      if (!name.endsWith(suffix) || name.startsWith('Abstract')) continue;
      const types = declaredTypes(f, methodNames);
      if (!types.length) continue;
      for (const t of types) rows.push({ tipo: t, clase: name, modulo: mod });
    }
  }
  return rows.sort((a, b) => a.tipo.localeCompare(b.tipo));
}

function table(rows, titulo) {
  if (!rows.length) return `### ${titulo}\n\n_(ninguno detectado)_\n`;
  const lines = [
    `### ${titulo} (${rows.length})`,
    '',
    '| Tipo | Clase | Modulo |',
    '|---|---|---|',
    ...rows.map((r) => `| \`${r.tipo}\` | \`${r.clase}\` | \`${r.modulo}\` |`),
    '',
  ];
  return lines.join('\n');
}

const fuentes = collect('SourceProvider', ['sourceType', 'type']);
const readers = collect('ReaderProvider', ['readerType', 'type']);
const tareas = collect('TaskProvider', ['type']);

/**
 * No todo tipo de tarea tiene una clase `*TaskProvider`. `FILE_READ` es una constante de
 * `TaskType` que el motor atiende por un fast-path dedicado (`FileReadTaskFastPath`), sin pasar por
 * el registry. Un catalogo que solo mirase providers lo omitiria, y omitir el tipo mas usado del
 * producto es exactamente el fallo que este generador viene a evitar. Se leen tambien las constantes
 * declaradas en TaskType y se marca cuando no hay provider detras: esa distincion es informativa,
 * porque explica por que ese tipo no es extensible por un plugin.
 */
const taskTypeFile = join(root, 'platform-app', 'src', 'main', 'java', 'com', 'integrationhub',
  'platform', 'domain', 'TaskType.java');
if (existsSync(taskTypeFile)) {
  const text = readFileSync(taskTypeFile, 'utf8');
  const declared = [...text.matchAll(/public\s+static\s+final\s+String\s+[A-Z0-9_]+\s*=\s*"([^"]+)"/g)]
    .map((m) => m[1]);
  const yaListados = new Set(tareas.map((t) => t.tipo));
  for (const t of declared) {
    if (yaListados.has(t)) continue;
    tareas.push({ tipo: t, clase: '(fast-path del motor, sin provider)', modulo: 'platform-app' });
  }
  tareas.sort((a, b) => a.tipo.localeCompare(b.tipo));
}

const body = [
  '',
  `_Generado por \`ci/scripts/gen-catalogo-tipos.mjs\` leyendo los providers del codigo._`,
  `_No editar a mano: se regenera con \`npm run gen:catalogo\`._`,
  '',
  table(fuentes, 'Fuentes'),
  table(readers, 'Readers'),
  table(tareas, 'Tipos de tarea'),
].join('\n');

if (!existsSync(TARGET)) {
  console.error(`gen-catalogo-tipos: no existe el documento destino ${TARGET}`);
  process.exit(1);
}

const doc = readFileSync(TARGET, 'utf8');
const re = new RegExp(`(<!--\\s*auto:start\\s+name=${ZONE}\\s*-->)([\\s\\S]*?)(<!--\\s*auto:end\\s*-->)`);
if (!re.test(doc)) {
  console.error(`gen-catalogo-tipos: el documento no declara la zona auto:start name=${ZONE}`);
  process.exit(1);
}

const updated = doc.replace(re, (_, open, prev, close) => `${open}\n${body}\n${close}`);

if (check) {
  if (updated !== doc) {
    console.error('gen-catalogo-tipos: el catalogo esta DESACTUALIZADO respecto al codigo.');
    console.error('  Corre `npm run gen:catalogo` y commitea el resultado.');
    process.exit(1);
  }
  console.log(`gen-catalogo-tipos: al dia (${fuentes.length} fuentes, ${readers.length} readers, ${tareas.length} tipos de tarea).`);
  process.exit(0);
}

writeFileSync(TARGET, updated);
console.log(`gen-catalogo-tipos: ${fuentes.length} fuentes, ${readers.length} readers, ${tareas.length} tipos de tarea -> ${TARGET}`);
