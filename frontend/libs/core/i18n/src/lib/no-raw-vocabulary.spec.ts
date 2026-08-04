import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Prohibicion de pintar valores de dominio en crudo.
 *
 * <h3>Por que un escaner y no un test por pantalla</h3>
 * Un test por pantalla solo protege las pantallas que existian el dia que se escribio. El defecto
 * que motivo esto no fue una pantalla mal hecha: fue que CADA pantalla nueva improvisaba, y nadie
 * se enteraba hasta que un operador veia `COMPLETED` en un sitio y `Completada` en otro. Lo que
 * hace falta es una regla que alcance tambien a lo que aun no esta escrito.
 *
 * <h3>Que prohibe exactamente</h3>
 * Dos cosas, ambas medibles sobre el HTML:
 *   1. Interpolar una propiedad que se llame `status`, `taskType`, `eventType` o `stage` sin pasarla
 *      por una funcion. Interpolarla directa es, por definicion, pintar el enum.
 *   2. Escribir un valor de enum como TEXTO VISIBLE del marcado. Asi estaban `PENDING`, `IN_FLIGHT`,
 *      `SENT` y `DEAD` en el panel del spool: no eran datos, eran cuatro literales tecleados.
 *
 * <h3>Lo que NO prohibe</h3>
 * Las clases CSS derivadas del valor crudo son ganchos de estilo, no texto para leer, y siguen
 * siendo la forma correcta de colorear. Tampoco toca los `.spec.ts` ni los prototipos de `specs/`.
 */

const RAIZ = process.cwd(); // `frontend/`
const AMBITOS = ['libs/features', 'libs/shared'];

/** Nombres de propiedad que transportan un valor de dominio y por tanto exigen traduccion. */
const CAMPOS = ['status', 'taskType', 'eventType', 'stage'];

/**
 * Literales de enum que no deberian aparecer como texto en una plantilla. Se listan solo los
 * inequivocos: `PENDING` suelto en el marcado no es otra cosa.
 *
 * <p><b>Solo valores del MOTOR.</b> Aqui no entra el vocabulario de ningun vertical, ni siquiera
 * como dato de un test: `core` no puede conocer a MT101 (ADR-021), y el gate de frontera lo hace
 * cumplir — cazo este fichero por listar `MT101_PAY`, con razon. La proteccion de los verticales no
 * se pierde por eso: la regla de interpolacion de arriba es generica (mira `status`, `taskType`,
 * `eventType`, `stage`) y alcanza a sus plantillas sin nombrar un solo valor suyo.</p>
 */
const LITERALES = [
  'PENDING', 'RUNNING', 'SUSPENDED', 'NEEDS_RECONCILIATION', 'COMPLETED_WITH_ERRORS',
  'IN_FLIGHT', 'DEAD', 'POISON', 'CLAIMED', 'PROCESSED',
  'DB_WRITE', 'FILE_READ', 'REST_CALL',
];

function recorrer(dir: string): string[] {
  let entradas: string[];
  try {
    entradas = readdirSync(dir);
  } catch {
    return [];
  }
  return entradas.flatMap((e) => {
    const abs = join(dir, e);
    if (e === 'node_modules' || e === 'dist') return [];
    return statSync(abs).isDirectory() ? recorrer(abs) : [abs];
  });
}

function plantillas(): string[] {
  return AMBITOS.flatMap((a) => recorrer(join(RAIZ, a))).filter((f) => f.endsWith('.html'));
}

/**
 * Solo el TEXTO visible. Las interpolaciones dentro de un atributo se descartan quitando las
 * etiquetas antes de mirar.
 *
 * <p>Sin esto, el gate marcaba `class="pd__card--{{ entry.status }}"` como infraccion. Es un gancho
 * de CSS —la forma correcta de colorear por estado— y senalarlo es peor que no mirarlo: un
 * validador que acusa a codigo legitimo se acaba desactivando, y con el se va la parte que si
 * servia.</p>
 */
function soloTexto(html: string): string {
  // `[^>]*` NO sirve: un `>` dentro de un binding (`[class]="a > b"`) cortaria la etiqueta por la
  // mitad y dejaria el resto de sus atributos expuestos como si fueran texto.
  return html.replace(/<(?:"[^"]*"|'[^']*'|[^>])*>/g, ' ');
}

/**
 * Interpolaciones del tipo `{{ algo.status }}`: la propiedad va justo antes del cierre, sin que
 * nada la envuelva. Si hubiera una llamada, el ultimo caracter antes de `}}` seria un parentesis.
 */
function interpolacionesCrudas(htmlCompleto: string): string[] {
  const html = soloTexto(htmlCompleto);
  const encontradas: string[] = [];
  for (const m of html.matchAll(/\{\{([^}]*)\}\}/g)) {
    const expr = m[1].trim();
    // Una llamada a funcion, un pipe o un operador ternario ya suponen tratamiento.
    if (expr.includes('(') || expr.includes('|')) continue;
    const ultimoSegmento = expr.split(/[.?!\s]+/).filter(Boolean).pop() ?? '';
    if (CAMPOS.includes(ultimoSegmento)) {
      encontradas.push(m[0].trim());
    }
  }
  return encontradas;
}

/** Literales de enum como texto del marcado: entre `>` y `<`, no dentro de un atributo. */
function literalesVisibles(html: string): string[] {
  const encontrados: string[] = [];
  for (const m of html.matchAll(/>([^<>{]{1,40})</g)) {
    const texto = m[1].trim();
    if (LITERALES.includes(texto)) {
      encontrados.push(texto);
    }
  }
  return encontrados;
}

describe('ningun valor de dominio se pinta en crudo', () => {
  const ficheros = plantillas();

  it('encuentra plantillas que escanear (si no, este fichero seria un verde vacio)', () => {
    expect(ficheros.length).toBeGreaterThan(20);
  });

  it('ninguna plantilla interpola status, taskType, eventType ni stage sin traducir', () => {
    const infracciones: string[] = [];
    for (const f of ficheros) {
      const rel = f.substring(RAIZ.length + 1).replace(/\\/g, '/');
      for (const expr of interpolacionesCrudas(readFileSync(f, 'utf8'))) {
        infracciones.push(`${rel}  ->  ${expr}`);
      }
    }
    expect(
      infracciones,
      'usa resolveVocabulary desde un metodo del componente:\n  ' + infracciones.join('\n  '),
    ).toEqual([]);
  });

  it('ninguna plantilla escribe un valor de enum como texto visible', () => {
    const infracciones: string[] = [];
    for (const f of ficheros) {
      const rel = f.substring(RAIZ.length + 1).replace(/\\/g, '/');
      for (const literal of literalesVisibles(readFileSync(f, 'utf8'))) {
        infracciones.push(`${rel}  ->  ${literal}`);
      }
    }
    expect(
      infracciones,
      'son valores de dominio, no rotulos: deben salir del diccionario\n  ' + infracciones.join('\n  '),
    ).toEqual([]);
  });
});
