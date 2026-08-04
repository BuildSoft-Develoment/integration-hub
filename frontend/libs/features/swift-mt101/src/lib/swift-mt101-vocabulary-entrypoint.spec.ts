import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * El punto de entrada de vocabulario debe seguir siendo estrecho.
 *
 * <p>Existe para que overview, ejecuciones y auditoria puedan instalar las etiquetas del vertical
 * sin arrastrar su consola al chunk de esas rutas. Esa ventaja no la protege ningun tipo ni ninguna
 * regla de Nx: se pierde el dia que alguien reexporte "solo un componentito" desde aqui, y se pierde
 * en silencio — la aplicacion seguiria funcionando, solo que tres rutas del motor empezarian a
 * descargar el vertical entero.</p>
 *
 * <p>Por eso la restriccion se comprueba leyendo el fichero: es una decision de arquitectura, no un
 * detalle de implementacion, y el unico sitio donde puede fallar es su lista de exports.</p>
 */

const ENTRYPOINT = join(process.cwd(), 'libs/features/swift-mt101/src/vocabulary.ts');

describe('punto de entrada de vocabulario del vertical', () => {
  const fuente = readFileSync(ENTRYPOINT, 'utf8');

  it('solo reexporta el vocabulario y su proveedor', () => {
    const exports = [...fuente.matchAll(/export\s*\{([^}]*)\}/g)]
      .flatMap((m) => m[1].split(','))
      .map((s) => s.trim())
      .filter(Boolean);

    expect(exports.sort()).toEqual(['SWIFT_MT101_MESSAGES', 'provideSwiftMt101I18n'].sort());
  });

  it('no arrastra componentes ni rutas', () => {
    // Un reexport de algo que acabe en Component, Routes o routes traeria la consola detras.
    const sospechosos = [...fuente.matchAll(/\b(\w*(?:Component|Routes|routes))\b/g)].map((m) => m[1]);
    expect(
      sospechosos,
      'reexportar esto aqui haria que las rutas del motor descarguen el vertical entero: ' +
        sospechosos.join(', '),
    ).toEqual([]);
  });

  it('no pasa por el barril del vertical', () => {
    // Importar desde './index' anularia el proposito: el barril reexporta toda la consola.
    expect(fuente).not.toMatch(/from\s*'\.\/index'/);
  });
});
