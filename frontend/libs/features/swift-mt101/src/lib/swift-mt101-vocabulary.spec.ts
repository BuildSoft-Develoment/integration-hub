import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { I18nService, resolveVocabulary, vocabularyKey, vocabularyTone } from '@integration-hub/core/i18n';
import { SWIFT_MT101_MESSAGES, provideSwiftMt101I18n } from './swift-mt101-i18n';

/**
 * El vertical debe saber nombrar SUS propios estados.
 *
 * <p>El core no puede comprobarlo: estas claves llegan por overlay (`registerMessages`) y el
 * diccionario del motor no las conoce — esa inversion es deliberada (ADR-021) y no se toca. La
 * consecuencia es que la exhaustividad del vocabulario del vertical solo se puede exigir aqui.</p>
 *
 * <p>Antes de esto, la mesa de pagos pintaba `UNCERTAIN` y `DISPATCHING` en crudo aunque el overlay
 * SI estuviera cargado en esas rutas: no era un problema de cableado, es que las claves no
 * existian. Ninguna prueba lo veia porque ninguna preguntaba por ellas.</p>
 */

const REPO = join(process.cwd(), '..');
const PROVIDER = join(
  REPO,
  'vertical-swift-mt101/src/main/java/com/integrationhub/vertical/swift/mt101/provider',
);

/**
 * Estados terminales del intento, derivados de `intentStatus(...)`, mas los no terminales que
 * declara el store. Derivar en vez de copiar es lo que hace que anadir un estado en Java ponga
 * rojo este fichero.
 */
function estadosDeDespacho(): string[] {
  const task = readFileSync(join(PROVIDER, 'task/Mt101PayTaskProvider.java'), 'utf8');
  const cuerpo = task.slice(task.indexOf('private String intentStatus('));
  const terminales = [...cuerpo.slice(0, cuerpo.indexOf('}')).matchAll(/"([A-Z_]{3,})"/g)].map((m) => m[1]);

  const store = readFileSync(join(PROVIDER, 'Mt101PayDispatchIntentStore.java'), 'utf8');
  const enVuelo = [...store.matchAll(/status\s*=\s*'([A-Z_]{3,})'/g)].map((m) => m[1]);

  return [...new Set([...terminales, ...enVuelo])];
}

/**
 * Stages del recorrido por registro, derivados de `Mt101RowTimelineService`.
 *
 * <p>Ese servicio no emite una lista cerrada: COMPONE parte de los nombres concatenando un prefijo
 * con el estado del fragmento o del archivo (`"RECORD_" + status`). El vocabulario es abierto, y por
 * eso `PAYMENT_STATUS_REJECTED` llego a produccion sin etiqueta y se vio crudo en el timeline de
 * cuarentena: mi barrido anterior derivaba de los emisores de eventos de auditoria, y estos hitos no
 * pasan por ahi.</p>
 *
 * <p>Se derivan las dos formas: los literales y el producto prefijo x estado. Enumerar a mano las
 * combinaciones seria repetir el mismo error con un envoltorio distinto.</p>
 */
function stagesDelTimeline(): string[] {
  const src = readFileSync(
    join(REPO, 'vertical-swift-mt101/src/main/java/com/integrationhub/vertical/swift/mt101/service/Mt101RowTimelineService.java'),
    'utf8',
  );

  // Los literales: se descartan los que acaban en `_`, que son prefijos de concatenacion.
  const literales = [...src.matchAll(/"((?:RECORD|CORRECTIVE_RECORD|PAYMENT)_[A-Z_]{3,})"/g)]
    .map((m) => m[1])
    .filter((s) => !s.endsWith('_'));

  // Cada prefijo se concatena con un dominio DISTINTO, y cruzarlos todos contra todos generaria
  // combinaciones imposibles (`PAYMENT_STATUS_VALIDATED` no existe: el archivo no se "valida").
  const compuestos = [
    ...['BUILT', 'VALIDATED', 'SENT', 'REJECTED'].flatMap((e) => [`RECORD_${e}`, `CORRECTIVE_RECORD_${e}`]),
    ...['CONFIRMED', 'REJECTED'].map((e) => `PAYMENT_STATUS_${e}`),
  ];

  return [...new Set([...literales, ...compuestos])];
}

describe('vocabulario del vertical SWIFT MT101', () => {
  it('el recorrido por registro sabe nombrar TODOS los hitos que compone', () => {
    const stages = stagesDelTimeline();
    expect(stages.length, 'no se pudieron derivar los hitos del timeline').toBeGreaterThan(8);

    // Se resuelve por el CAMINO REAL en vez de mirar un diccionario: algunos hitos los declara el
    // motor (RECORD_INGESTED) y otros el vertical, y comprobar solo uno de los dos dejaria un hueco
    // -o exigiria una lista a mano de quien declara que, que es justo lo que envejece.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [...provideSwiftMt101I18n()] });
    const i18n = TestBed.inject(I18nService);

    const sinEtiqueta = stages.filter((s) => resolveVocabulary(i18n, 'recordStage', s).startsWith('⚠'));
    expect(
      sinEtiqueta,
      'el timeline los mostraria marcados:\n  ' + sinEtiqueta.join('\n  '),
    ).toEqual([]);
  });

  it('deriva los estados de despacho del codigo Java', () => {
    const estados = estadosDeDespacho();
    expect(estados.length, 'no se pudo derivar el dominio de despacho').toBeGreaterThan(3);
    // Sin estos tres el resto del test no probaria lo que importa.
    expect(estados).toEqual(expect.arrayContaining(['SENT', 'UNCERTAIN', 'REJECTED']));
  });

  it('cada estado de despacho tiene etiqueta en es y en', () => {
    const sinClave: string[] = [];
    for (const estado of estadosDeDespacho()) {
      const key = vocabularyKey('payDispatchStatus', estado);
      if (!(key in SWIFT_MT101_MESSAGES.es)) sinClave.push(`es: ${key}`);
      if (!(key in SWIFT_MT101_MESSAGES.en)) sinClave.push(`en: ${key}`);
    }
    expect(sinClave, `la mesa de pagos los mostraria marcados:\n  ${sinClave.join('\n  ')}`).toEqual([]);
  });

  it('no confunde "no salio" con "lo rechazo el banco"', () => {
    // Son decisiones distintas para quien opera: uno se reintenta, el otro se corrige antes.
    expect(SWIFT_MT101_MESSAGES.es[vocabularyKey('payDispatchStatus', 'INVALIDATED')])
      .not.toBe(SWIFT_MT101_MESSAGES.es[vocabularyKey('payDispatchStatus', 'REJECTED')]);
    expect(vocabularyTone('payDispatchStatus', 'INVALIDATED')).not.toBe('danger');
    expect(vocabularyTone('payDispatchStatus', 'REJECTED')).toBe('danger');
  });

  it('"sin confirmar" no se pinta como un fallo', () => {
    // Es la senal de dinero-en-el-aire. En rojo, quien la vea la tratara como un envio fallido
    // y la reintentara; en gris, ni la vera.
    expect(vocabularyTone('payDispatchStatus', 'UNCERTAIN')).toBe('warning');
  });
});
