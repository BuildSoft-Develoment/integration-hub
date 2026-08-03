import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * ADR-021: red de seguridad de la migracion de i18n del vertical.
 *
 * <p>Las 237 claves por idioma salieron de los diccionarios monoliticos de `core/i18n` y ahora las
 * aporta el vertical con `registerMessages()`. El riesgo de ese movimiento es silencioso: una clave
 * que se usa pero ya no existe no rompe nada — se renderiza CRUDA en pantalla. Y la prueba de
 * paridad es/en tampoco la ve, porque falta en ambos idiomas.</p>
 *
 * <p>De hecho ya paso: al mover la plantilla masiva le puse un `labelKey` que no existia en ningun
 * diccionario y el boton habria mostrado `processes.template.swiftMt101Massive`. Esta prueba
 * recorre el codigo del vertical, junta las claves que USA y verifica que todas esten declaradas.</p>
 */

const WORKSPACE_ROOT = process.cwd();
const VERTICAL_ROOT = join(WORKSPACE_ROOT, 'libs/features/swift-mt101/src');

/** Claves i18n usadas: `i18n.t('x')`, `labelKey: 'x'`, `titleKey: 'x'`, `{{ i18n.t('x') }}`. */
const USAGE_PATTERNS = [
  /\bt\(\s*'([a-zA-Z][\w.-]*)'/g,
  /\b(?:labelKey|titleKey|descriptionKey|descriptionHintKey)\s*:\s*'([a-zA-Z][\w.-]*)'/g,
];

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

describe('ADR-021 · i18n del vertical SWIFT MT101', () => {
  let declared: Record<'es' | 'en', Record<string, string>>;
  let baseEs: string;

  // `beforeAll`, no `beforeEach`: los diccionarios y el fichero son de SOLO LECTURA, asi que
  // reimportarlos por test no compraba nada y costaba caro. El `import()` del chunk lazy en frio
  // superaba los 10 s de timeout de hook en una maquina cargada y tumbaba el PRIMER test del
  // archivo — los otros dos pasaban porque reusaban el modulo ya cacheado. Importar una sola vez
  // quita el trabajo repetido y, con el, la fragilidad.
  beforeAll(async () => {
    // Dinamico: importar la lib lazy de forma estatica la traeria al bundle inicial.
    const { SWIFT_MT101_MESSAGES } = await import('@integration-hub/features/swift-mt101');
    declared = SWIFT_MT101_MESSAGES;
    baseEs = readFileSync(join(WORKSPACE_ROOT, 'libs/core/i18n/src/lib/dictionaries/es.ts'), 'utf8');
  });

  it('declara las mismas claves en ambos idiomas', () => {
    const es = Object.keys(declared.es).sort();
    const en = Object.keys(declared.en).sort();

    expect(es.length, 'no se declaro ninguna clave: el escaneo fallo').toBeGreaterThan(100);
    expect(en).toEqual(es);
  });

  it('toda clave que el vertical USA esta declarada', () => {
    const files = walk(VERTICAL_ROOT).filter((f) => f.endsWith('.ts') || f.endsWith('.html'));
    expect(files.length, 'no se encontro codigo del vertical: revisar la ruta').toBeGreaterThan(50);

    const used = new Set<string>();
    for (const file of files) {
      if (file.endsWith('swift-mt101-i18n.ts')) continue;
      const src = readFileSync(file, 'utf8');
      for (const pattern of USAGE_PATTERNS) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(src))) used.add(match[1]);
      }
    }

    // Solo se exigen las del namespace del vertical; las genericas (common.*, nav.*) las trae el core.
    const ownKeys = [...used]
      // Una clave terminada en punto es un PREFIJO que el código completa en runtime
      // (`t('mt101.debitAccountMode.' + modo)`): no es una clave declarable.
      .filter((key) => !key.endsWith('.'))
      .filter(
        (key) => /^mt101/i.test(key) || /MT101_/.test(key) || key.startsWith('processes.template.swiftMt101')
      );
    const missing = ownKeys.filter((key) => !(key in declared.es)).sort();

    expect(ownKeys.length, 'no se detecto ninguna clave en uso: revisar los patrones').toBeGreaterThan(20);
    expect(missing, 'claves usadas por el vertical que nadie declara (se renderizan crudas)').toEqual([]);

    // PUNTO CIEGO QUE ESTA PRUEBA TENIA. El filtro de arriba se queda con el namespace del vertical y
    // ASUME que las demas las trae el core. Nadie lo comprobaba: `ui.dbWriteOpenPicker` se usaba en
    // este vertical y en dos componentes de process-form-kit, no existia en ningun diccionario, y los
    // tres botones renderizaban la clave cruda como su aria-label. La prueba pasaba en verde.
    // Una clave asumida y no verificada es igual de invisible que una que no se mira.
    const foraneas = [...used]
      .filter((key) => !key.endsWith('.'))
      .filter((key) => !ownKeys.includes(key));
    // Vale que este declarada en CUALQUIERA de los dos sitios: el vertical tambien aporta claves
    // fuera de su namespace (p.ej. `audit.quarantine.*` de sus propias pantallas de auditoria).
    const foraneasHuerfanas = foraneas
      .filter((key) => !(key in declared.es) && !baseEs.includes(`'${key}':`))
      .sort();
    expect(
      foraneasHuerfanas,
      'claves de otros namespaces que el vertical usa y el core NO declara (se renderizan crudas)'
    ).toEqual([]);
  });

  it('las claves del vertical ya no estan en el diccionario del core', () => {
    const leftovers = Object.keys(declared.es).filter((key) => baseEs.includes(`'${key}':`));

    // registerMessages IGNORA una clave que ya exista en el diccionario base: si quedara duplicada,
    // el core seguiria ganando y mover la clave no habria servido de nada.
    expect(leftovers, 'claves duplicadas en el core: registerMessages las ignoraria').toEqual([]);
  });
});
