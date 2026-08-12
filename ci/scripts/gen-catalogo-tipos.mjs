#!/usr/bin/env node
/**
 * gen-catalogo-tipos.mjs
 *
 * Genera la zona <!-- auto:start name=catalogo-tipos --> del documento canonico de catalogos, leyendo
 * los providers REALES del codigo: fuentes, readers, task types y destinos de salida (sinks).
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

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
// El recorrido de modulos y la lectura de `type()` viven en _lib porque los comparte
// `check-likec4-sources.mjs`. Estaban aqui, y la segunda copia nacio mas ciega que esta.
import { collectProviders } from './_lib/java-provider-types.mjs';

const argv = process.argv.slice(2);
const root = resolve(argv.includes('--root') ? argv[argv.indexOf('--root') + 1] : '.');
const check = argv.includes('--check');

const TARGET = join(root, 'docs', 'transversal', '90.17-catalogo-de-tipos.md');
const ZONE = 'catalogo-tipos';

const collect = (suffix, methodNames) => collectProviders(root, suffix, methodNames).tipos;

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
// Las clases de salida no se llaman `*Provider`: implementan `OutputSink` y se llaman `*Sink`
// (`FilesystemSink`, `SftpSink`). El sufijo captura tambien la interfaz del SPI, que `collectProviders`
// descarta por ser interfaz -no declara un tipo, declara el contrato para declararlo-.
const sinks = collect('Sink', ['type']);

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

/**
 * Cruce entrada/salida (RF-011).
 *
 * El catalogo de `/sources` admite 8 tipos de ENTRADA y la salida sabe escribir en 2. Esa asimetria es
 * real y esta decidida (ADR-026; REST y OCI como destino quedan pendientes de ADR-027), pero era
 * INVISIBLE: habia que leer dos tablas distintas y restarlas mentalmente para verla, y nadie lo hacia.
 *
 * Esto NO falla: un hueco aceptado a proposito no es una rotura. Lo que hace es que el hueco no se
 * pueda no ver, y que la lista se mueva sola. `--check` ya falla si el documento no coincide con el
 * codigo, asi que el dia que alguien registre la novena FUENTE, el CI le obliga a regenerar y el
 * agujero nuevo aparece aqui firmado en el commit — en vez de descubrirse en una ejecucion.
 */
function paridad(fuentes, sinks) {
  const norm = (t) => t.toUpperCase();
  const entrada = new Set(fuentes.map((f) => norm(f.tipo)));
  // El registry resuelve el sink case-insensitive, asi que el cruce se hace igual.
  const salida = new Set(sinks.map((s) => norm(s.tipo)));
  const tipos = [...new Set([...entrada, ...salida])].sort();
  const conAmbas = tipos.filter((t) => entrada.has(t) && salida.has(t)).length;
  return [
    `### Paridad entrada/salida (${conAmbas}/${tipos.length})`,
    '',
    '| Tipo | Entrada (`/sources`) | Salida (`FILE_DELIVER`) |',
    '|---|---|---|',
    ...tipos.map((t) => `| \`${t}\` | ${entrada.has(t) ? 'si' : '—'} | ${salida.has(t) ? 'si' : '—'} |`),
    '',
    'Un tipo sin salida se puede definir como fuente y **no** se puede elegir como destino de una',
    'entrega: el selector no lo ofrece y publicar el proceso lo rechaza nombrando los que si',
    '(`FileDeliverSinkValidator`). Antes se aceptaba y fallaba en la primera ejecucion.',
    '',
  ].join('\n');
}

const body = [
  '',
  `_Generado por \`ci/scripts/gen-catalogo-tipos.mjs\` leyendo los providers del codigo._`,
  `_No editar a mano: se regenera con \`npm run gen:catalogo\`._`,
  '',
  table(fuentes, 'Fuentes'),
  table(readers, 'Readers'),
  table(tareas, 'Tipos de tarea'),
  table(sinks, 'Destinos de salida (sinks)'),
  paridad(fuentes, sinks),
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
  console.log(`gen-catalogo-tipos: al dia (${fuentes.length} fuentes, ${readers.length} readers, ${tareas.length} tipos de tarea, ${sinks.length} sinks).`);
  process.exit(0);
}

writeFileSync(TARGET, updated);
console.log(`gen-catalogo-tipos: ${fuentes.length} fuentes, ${readers.length} readers, ${tareas.length} tipos de tarea, ${sinks.length} sinks -> ${TARGET}`);
