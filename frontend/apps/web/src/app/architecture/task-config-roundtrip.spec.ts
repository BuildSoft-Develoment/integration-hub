import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  PROCESS_TASK_PROVIDERS,
  ProcessTaskFormModel,
  ProcessTaskProvider,
  RUNTIME_OWNED_KEYS,
  provideProcessTaskProviders,
} from '@integration-hub/core/providers';

/**
 * TRINQUETE de pérdida de configuración: **editar una tarea en la UI no puede borrar claves**.
 *
 * <p>`toTaskPatch` reconstruye el `configurationJson` DESDE CERO. Toda clave que el formulario no
 * conozca y no re-emita desaparece en el primer guardado, aunque el operador no la haya tocado. Ya
 * mordió dos veces en producción: `MT101_STATUS` perdía `resolveNormalPay` (apagaba la conciliación
 * del money-path en silencio) e `input.filters` se borraba (la tarea pasaba de procesar un
 * subconjunto acotado a barrer la TABLA ENTERA).</p>
 *
 * <p>Esas dos se arreglaron una por una. Este archivo existe para que no haya una tercera: recorre
 * TODOS los providers registrados, así que un provider nuevo queda cubierto por el solo hecho de
 * registrarse — sin que nadie se acuerde de escribirle una prueba.</p>
 *
 * <p>Vive en la app porque es la única capa que ve el motor y los verticales a la vez.</p>
 */

/**
 * Claves que el backend lee y NINGÚN formulario gobierna. Un provider que las pierda rompe la
 * ejecución sin que la UI muestre nada raro. No son inventadas: son las de los dos incidentes.
 */
const SENTINELS: Record<string, unknown> = {
  __unknownScalar: 'no lo toca ningún formulario',
  __unknownNested: { a: 1, b: ['x'] },
};

/**
 * Deuda medida el 2026-07-28: los 21 providers registrados descartan cualquier clave que no
 * gobiernen. NO es un descuido de 21 personas distintas — es el diseño actual: `toTaskPatch`
 * reconstruye el JSON desde cero y cada provider re-emite lo que conoce. `MT101_STATUS` es el único
 * que preserva de más, y con una LISTA BLANCA de 13 claves concretas (`PRESERVED_KEYS`), no de forma
 * genérica; por eso también aparece acá.
 *
 * <p>Se congela en vez de arreglarse en el mismo commit porque la corrección de fondo —que la clase
 * base re-emita verbatim todo lo no gobernado— toca los 21 providers y es una decisión de diseño
 * pendiente, no una omisión. Mientras tanto el trinquete cumple lo que sí puede: un provider NUEVO
 * nace preservando, y esta lista solo puede achicarse.</p>
 */
const FROZEN_DROPS_UNKNOWN_KEYS: readonly string[] = [
];

function taskWith(type: string, config: Record<string, unknown>): ProcessTaskFormModel {
  return {
    clientId: 'task-under-test',
    id: 1,
    taskOrder: 1,
    taskType: type,
    active: true,
    sourceDefinitionId: null,
    readerDefinitionId: null,
    configurationJson: JSON.stringify(config),
  };
}

function configOf(patch: Partial<ProcessTaskFormModel>): Record<string, unknown> {
  return JSON.parse(patch.configurationJson || '{}');
}

/** Claves de primer nivel presentes en `before` que ya no están en `after`. */
function lostKeys(before: Record<string, unknown>, after: Record<string, unknown>): string[] {
  return Object.keys(before).filter((key) => !(key in after));
}

describe('trinquete · round-trip de configuración de tareas', () => {
  let providers: readonly ProcessTaskProvider<unknown>[];

  beforeEach(async () => {
    const { provideSwiftMt101ProcessTasks } = await import('@integration-hub/features/swift-mt101');
    TestBed.configureTestingModule({
      providers: [...provideProcessTaskProviders(), ...provideSwiftMt101ProcessTasks()],
    });
    providers = TestBed.inject(PROCESS_TASK_PROVIDERS, []);
  });

  it('el trinquete ve a todos los providers (motor + vertical)', () => {
    // Sin esta guarda, un cambio en el registro dejaría las pruebas de abajo iterando sobre una
    // lista vacía y pasando por vacío. Ya pasó con el trinquete del backend: un trinquete ciego
    // reporta verde.
    expect(providers.length, 'no se registró ningún provider: el trinquete está ciego').toBeGreaterThan(15);
  });

  it('ningún provider pierde las claves que él mismo emite', () => {
    const offenders: string[] = [];
    const thin: string[] = [];

    for (const provider of providers) {
      const type = provider.descriptor.type;
      const canonical = configOf(provider.toTaskPatch(provider.createDraft()));
      const reemitted = configOf(provider.toTaskPatch(provider.hydrateDraft(taskWith(type, canonical))));

      if (Object.keys(canonical).length < 3) {
        thin.push(`${type}=${Object.keys(canonical).length}`);
      }
      const lost = lostKeys(canonical, reemitted);
      if (lost.length > 0) {
        offenders.push(`${type}: pierde ${lost.join(', ')}`);
      }
    }

    expect(offenders, 'un provider no puede perder su propia configuración al releerla').toEqual([]);
    // Doble check contra el paso por vacío: si `createDraft()` produjera solo {taskRef, executionMode},
    // la afirmación de arriba sería casi trivial. Medido: entre 3 (FILE_DELIVER) y 10
    // (MT101_BUILD_FROM_TABLE) claves por provider, 118 en total.
    expect(thin, 'config canónica trivial: para esos la afirmación de arriba no prueba nada').toEqual([]);
  });

  it('toda clave que un provider emite está declarada como gobernada', () => {
    // Es la contracara de la preservación automática y la parte que la hace SEGURA. Una clave
    // emitida pero no declarada acaba en la bolsa de preservados; el día que el operador apague esa
    // opción, el provider deja de emitirla y el valor viejo la resucita. Un checkbox que no se puede
    // apagar, en el camino del dinero.
    const offenders: string[] = [];
    const migrated: string[] = [];

    for (const provider of providers) {
      const governed = provider.governedKeys;
      // `null` = provider sin migrar: no preserva nada, así que no hay nada que resucitar.
      if (governed === null) {
        continue;
      }
      migrated.push(provider.descriptor.type);
      const emitted = Object.keys(configOf(provider.toTaskPatch(provider.createDraft())));
      const declared = new Set<string>([...RUNTIME_OWNED_KEYS, ...governed]);
      const undeclared = emitted.filter((key) => !declared.has(key));
      if (undeclared.length > 0) {
        offenders.push(`${provider.descriptor.type}: ${undeclared.join(', ')}`);
      }
    }

    expect(offenders, 'declara estas claves en `governedKeys` del provider').toEqual([]);
    // Guarda contra el paso por vacío: si nadie estuviera migrado, lo de arriba no probaría nada.
    expect(migrated.length, 'ningún provider migrado: esta prueba no está verificando nada').toBeGreaterThan(0);
  });

  it('un provider NUEVO no puede borrar claves que el formulario no gobierna', () => {
    const offenders: string[] = [];
    const survivors: string[] = [];

    for (const provider of providers) {
      const type = provider.descriptor.type;
      const canonical = configOf(provider.toTaskPatch(provider.createDraft()));
      const seeded = { ...canonical, ...SENTINELS };
      const reemitted = configOf(provider.toTaskPatch(provider.hydrateDraft(taskWith(type, seeded))));

      if (lostKeys(SENTINELS, reemitted).length > 0) {
        offenders.push(type);
      } else {
        survivors.push(type);
      }
    }

    const nuevos = offenders.filter((type) => !FROZEN_DROPS_UNKNOWN_KEYS.includes(type));
    expect(nuevos, 'un provider nuevo tiene que preservar lo que no gobierna, desde el día uno').toEqual([]);

    // El trinquete solo puede APRETARSE: si un provider congelado se arregla, hay que sacarlo de la
    // lista. Sin esto la lista envejece y vuelve a permitir lo que ya se corrigió.
    const yaCorregidos = FROZEN_DROPS_UNKNOWN_KEYS.filter((type) => survivors.includes(type));
    expect(yaCorregidos, 'estos ya preservan: bórralos de FROZEN_DROPS_UNKNOWN_KEYS').toEqual([]);
  });
});
