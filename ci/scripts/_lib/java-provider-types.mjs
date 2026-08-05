/**
 * Lectura de los tipos que declaran los providers del codigo Java.
 *
 * POR QUE EXISTE ESTE FICHERO
 * Esta logica vivia dentro de `gen-catalogo-tipos.mjs`. Al escribir `check-likec4-sources.mjs` se
 * volvio a implementar desde cero, peor: escaneando UN directorio plano con `readdirSync` en vez de
 * los siete modulos del reactor en profundidad. El gate nuevo daba verde con un provider en un
 * subpaquete o en un vertical -exactamente el verde falso que decia venir a cerrar-.
 *
 * Es la misma leccion que ya dejaron escrita `_lib/source-roots.mjs` ("un gate ciego que pasa es peor
 * que no tener gate") y `_lib/prototype-state.mjs`: dos copias de la misma logica garantizan dos
 * versiones del mismo punto ciego, y solo se arregla una. Aqui hay UNA.
 *
 * Consumidores: `gen-catalogo-tipos.mjs` (genera el catalogo canonico) y `check-likec4-sources.mjs`
 * (exige que el diagrama dibuje lo que el codigo registra).
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { JAVA_MODULES } from './source-roots.mjs';

/** Marca de un provider que calcula su tipo en tiempo de ejecucion (no hay valor que catalogar). */
export const DINAMICO = '(dinamico)';

/** Recorre un directorio EN PROFUNDIDAD devolviendo todos los .java. */
export function javaFiles(dir, out = []) {
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
 * dinamico: un provider que calcule su tipo en runtime se reporta como `(dinamico)` en vez de
 * inventar un valor. Es preferible un hueco visible a un catalogo que miente.
 */
export function declaredTypes(file, methodNames) {
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
      else found.add(DINAMICO);
    }
  }
  return [...found];
}

/**
 * Recolecta los providers de un tipo (`SourceProvider`, `ReaderProvider`, `TaskProvider`) en LOS SIETE
 * modulos del reactor, en profundidad.
 *
 * Devuelve dos listas, y la segunda es la que importa para un gate:
 *   - `tipos`  : lo que se pudo leer. Incluye entradas `(dinamico)`, igual que antes.
 *   - `sinTipo`: clases cuyo nombre dice que son providers pero de las que NO se pudo leer ningun
 *                tipo. Antes se descartaban en silencio -un `type()` escrito de una forma que el
 *                regex no cubre desaparecia del contrato sin que nada lo dijera-. Quien consuma
 *                esto decide si eso es aceptable; lo que no puede es no enterarse.
 */
export function collectProviders(root, suffix, methodNames) {
  const tipos = [];
  const sinTipo = [];
  for (const mod of JAVA_MODULES) {
    for (const f of javaFiles(join(root, mod, 'src', 'main', 'java'))) {
      const name = basename(f, '.java');
      if (!name.endsWith(suffix) || name.startsWith('Abstract')) continue;
      // La INTERFAZ del SPI se llama igual que el sufijo (`SourceProvider`), asi que el filtro por
      // nombre la captura. No declara ningun tipo -declara el contrato para declararlo-, igual que
      // las bases `Abstract*`. Antes se colaba y se descartaba en silencio por no tener tipo legible;
      // en cuanto ese descarte silencioso paso a ser un fallo, quedo a la vista.
      if (new RegExp(`\\binterface\\s+${name}\\b`).test(readFileSync(f, 'utf8'))) continue;
      const types = declaredTypes(f, methodNames);
      if (!types.length) {
        sinTipo.push({ clase: name, modulo: mod, motivo: 'no se pudo leer el tipo declarado' });
        continue;
      }
      for (const t of types) tipos.push({ tipo: t, clase: name, modulo: mod });
    }
  }
  tipos.sort((a, b) => a.tipo.localeCompare(b.tipo));
  sinTipo.sort((a, b) => a.clase.localeCompare(b.clase));
  return { tipos, sinTipo };
}
