import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { I18nService, resolveVocabulary } from '@integration-hub/core/i18n';

/**
 * Entrada en frio: la etiqueta no puede depender de por donde haya navegado antes el usuario.
 *
 * <h3>El defecto que cierra</h3>
 * Las claves de MT101 las aporta el vertical por overlay, y el overlay es acumulativo y global. El
 * proveedor solo estaba cableado en las rutas del vertical y en el catalogo de procesos, asi que
 * quien abria `#/audit/events` directamente leia `MT101_PAY`, y quien pasaba antes por `/processes`
 * leia "Pagar MT101". La MISMA fila, dos textos, en la misma sesion. Es de los defectos peores de
 * diagnosticar, porque no se reproduce si el que investiga navega "normal".
 *
 * <h3>Por que ademas se lee el manifiesto</h3>
 * Comprobar que el proveedor funciona no demuestra que este INSTALADO donde hace falta. Lo segundo
 * es lo que fallaba. Por eso el segundo bloque no monta nada: lee el manifiesto y exige que las
 * secciones que muestran datos de verticales carguen su vocabulario.
 */

const MANIFIESTO = join(
  process.cwd(),
  'apps/web/src/app/core/platform-plugin.manifest.ts',
);

/** Secciones del motor que listan ejecuciones, tareas o eventos de cualquier vertical. */
const SECCIONES_QUE_MUESTRAN_VOCABULARIO = ['overview', 'executions', 'audit', 'processes'];

describe('vocabulario del vertical en una ruta en frio', () => {
  // El overlay de i18n es GLOBAL y acumulativo: ese es justo el mecanismo que se esta probando.
  // Sin reiniciar el TestBed antes y despues, el injector de un caso sobrevive al siguiente y, peor,
  // se filtra a los demas specs del mismo worker — que fue lo que paso: tres ficheros ajenos se
  // cayeron por "hook timed out" hasta que se aislo esto.
  beforeEach(() => TestBed.resetTestingModule());
  afterEach(() => TestBed.resetTestingModule());

  it('sin el proveedor, un tipo de tarea del vertical sale marcado y no disimulado', () => {
    TestBed.configureTestingModule({ providers: [] });
    const i18n = TestBed.inject(I18nService);

    const etiqueta = resolveVocabulary(i18n, 'taskType', 'MT101_PAY');

    // Lo importante no es el texto exacto: es que NO devuelva 'MT101_PAY' a secas, que era el
    // fallback silencioso del helper viejo y lo que hacia el defecto invisible.
    expect(etiqueta).not.toBe('MT101_PAY');
    expect(etiqueta).toContain('MT101_PAY');
  });

  it('con el proveedor instalado, resuelve a la etiqueta del vertical', async () => {
    // Import DINAMICO a proposito. La regla de fronteras de Nx prohibe importar de forma
    // estatica una libreria que se carga en diferido, y con razon: un solo import estatico la
    // mete en el bundle inicial y anula la carga perezosa para todos.
    //
    // Aqui ademas seria contradictorio: este fichero es el que comprueba que el vocabulario
    // entra en frio. Cargarlo en caliente para probarlo invalidaria lo que mide.
    const { provideSwiftMt101I18n } = await import('@integration-hub/features/swift-mt101/vocabulary');
    TestBed.configureTestingModule({ providers: [...provideSwiftMt101I18n()] });
    // ENVIRONMENT_INITIALIZER corre al crear el injector; inyectar el servicio lo materializa.
    const i18n = TestBed.inject(I18nService);

    expect(resolveVocabulary(i18n, 'taskType', 'MT101_PAY')).toBe('Pagar MT101');
    expect(resolveVocabulary(i18n, 'payDispatchStatus', 'UNCERTAIN')).toBe('Sin confirmar');
  });

  it('las secciones que muestran datos de verticales cargan su vocabulario', () => {
    const fuente = readFileSync(MANIFIESTO, 'utf8');

    // Se parte el array en contribuciones y se busca la del id. Recortar "hasta el siguiente id:"
    // parecia equivalente y NO lo era: arrastraba los comentarios de cabecera de la contribucion
    // siguiente, y uno de ellos menciona `swift-mt101-read`. Con eso, quitarle el vocabulario a
    // /audit seguia dando verde — lo descubri mutando el manifiesto a proposito.
    const bloques = fuente.split(/\n {2}\{\n/);

    const sinVocabulario = SECCIONES_QUE_MUESTRAN_VOCABULARIO.filter((id) => {
      const bloque = bloques.find((b) => b.includes(`id: '${id}'`));
      if (!bloque) return false; // La seccion no existe; no es asunto de este test.
      return !bloque.includes('swift-mt101');
    });

    expect(
      sinVocabulario,
      'estas secciones mostrarian los valores de MT101 marcados segun por donde se entre: ' +
        sinVocabulario.join(', '),
    ).toEqual([]);
  });
});
