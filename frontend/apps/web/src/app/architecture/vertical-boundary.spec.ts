import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * ADR-021: TRINQUETE del límite core <-> verticales en el frontend.
 *
 * <p>`@nx/enforce-module-boundaries` vigila la DIRECCIÓN de los imports (feature→core), pero es
 * ciego a la dimensión vertical: un archivo MT101 que VIVE dentro de `core-providers` no es un
 * import cruzado sino ubicación, y para esas reglas es "core" perfectamente legítimo.</p>
 *
 * <p>Esta prueba cubre justo eso, con la misma mecánica que el trinquete del backend: las
 * violaciones actuales quedan congeladas en {@link FROZEN} y el build solo falla ante una NUEVA. Al
 * migrar un archivo hay que borrarlo de la lista, o el trinquete afloja y permite que reaparezca.</p>
 *
 * <p>Vive en la app y no en una lib porque necesita mirar a TRAVÉS de las libs.</p>
 */

/** Nombres de archivo que delatan a un vertical. */
const VERTICAL_FILE_PATTERNS = [/(^|[-.])mt101/i, /(^|[-.])swift/i, /(^|[-.])pain001/i];

/** Identificadores de un vertical dentro de un archivo de nombre genérico. */
const VERTICAL_CONTENT_PATTERN = /MT101_|'mt101-|"mt101-/;

/** Libs que NO deben albergar código de un vertical: el core y lo compartido. */
const WATCHED_LIBS = ['libs/core', 'libs/shared', 'libs/features/processes'];

/**
 * ADR-021: la deuda quedó en CERO. Cada entrada que hubo aquí (45 al instalar el trinquete) fue un
 * archivo de MT101 dentro del core; hoy no queda ninguno. La lista se conserva vacía a propósito:
 * volver a llenarla tiene que ser una decisión consciente y visible en el diff, no un descuido.
 */
const FROZEN: readonly string[] = [
];

/** Vitest corre desde la raíz del workspace de frontend. */
const WORKSPACE_ROOT = process.cwd();

function walk(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

/** Ruta relativa al workspace con separadores POSIX, para que la freeze-list sea estable. */
function workspacePath(file: string): string {
  return relative(WORKSPACE_ROOT, file).split(sep).join('/');
}

function isVertical(file: string): boolean {
  const name = file.split(/[\\/]/).pop() ?? '';
  if (VERTICAL_FILE_PATTERNS.some((pattern) => pattern.test(name))) {
    return true;
  }
  // El nombre no alcanza: un vertical también se cuela como claves o entradas dentro de archivos
  // genéricos (los diccionarios i18n son el caso real). Se miran solo líneas de CÓDIGO: un
  // comentario que explica por qué algo dejó de estar acá es documentación, no acoplamiento —
  // misma regla que el trinquete del backend, que ignora `//` y javadoc.
  return readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trimStart();
      return !trimmed.startsWith('//') && !trimmed.startsWith('*') && !trimmed.startsWith('/*');
    })
    .some((line) => VERTICAL_CONTENT_PATTERN.test(line));
}

describe('ADR-021 · límite core <-> verticales (frontend)', () => {
  const scanned = WATCHED_LIBS.flatMap((lib) => walk(join(WORKSPACE_ROOT, lib)))
    .filter((file) => file.endsWith('.ts'))
    .map(workspacePath);

  it('el trinquete ve las libs que vigila', () => {
    // Si el escaneo se queda corto (una lib renombrada, una ruta mal armada) TODAS las aserciones
    // de abajo pasarían por vacío y el límite quedaría sin vigilancia REPORTANDO VERDE. En el
    // backend eso ya pasó: mover el vertical lo sacó del radar y se colaron 14 dependencias nuevas.
    expect(scanned.length).toBeGreaterThan(50);
  });

  it('ninguna lib del core alberga código de un vertical (salvo la deuda congelada)', () => {
    const offenders = scanned
      .filter((file) => isVertical(join(WORKSPACE_ROOT, file)))
      .filter((file) => !FROZEN.includes(file))
      .sort();

    expect(offenders, 'ADR-021: el código de un vertical vive en su lib, no en el core').toEqual([]);
  });

  it('la deuda congelada no queda obsoleta', () => {
    // Una entrada que ya no existe significa que se migró: hay que borrarla, o el trinquete afloja
    // en silencio y deja que el archivo reaparezca.
    const stale = FROZEN.filter((file) => !scanned.includes(file));

    expect(stale, 'entradas ya migradas: borrarlas de FROZEN').toEqual([]);
  });
});
