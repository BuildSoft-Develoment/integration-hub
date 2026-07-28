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
const WATCHED_LIBS = ['libs/core', 'libs/shared'];

/**
 * Deuda registrada (ADR-021, migración del frontend en olas): archivos de MT101 que todavía viven
 * en una lib del core o compartida. Se borran de acá a medida que migran; agregar una entrada nueva
 * tiene que ser una decisión consciente, no un descuido.
 */
const FROZEN: readonly string[] = [
  'libs/core/i18n/src/lib/dictionaries/en.ts',
  'libs/core/i18n/src/lib/dictionaries/es.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-archive-task.provider.spec.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-archive-task.provider.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-build-from-table-task.provider.spec.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-build-from-table-task.provider.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-build-source.spec.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-build-task.provider.spec.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-build-task.provider.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-inbound-deliver-task.provider.spec.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-inbound-deliver-task.provider.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-parse-from-table-task.provider.spec.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-parse-from-table-task.provider.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-parse-task.provider.spec.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-parse-task.provider.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-pay-task.provider.spec.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-pay-task.provider.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-preserva-config.spec.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-preserva-sinks-tuning.spec.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-reconcile-task.provider.spec.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-reconcile-task.provider.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-repair-task.provider.spec.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-repair-task.provider.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-route-task.provider.spec.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-route-task.provider.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-sinks-interruptor.spec.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-split-task.provider.spec.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-split-task.provider.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-status-task.provider.spec.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-status-task.provider.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-summary-fields.spec.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-validate-task.provider.spec.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/mt101-validate-task.provider.ts',
  'libs/core/providers/src/lib/implementations/tasks/payments/swift/payments-swift.providers.ts',
  'libs/core/providers/src/lib/implementations/tasks/plantilla-masiva-round-trip.spec.ts',
  'libs/core/providers/src/lib/implementations/tasks/rest/rest-call-task.provider.ts',
  'libs/core/providers/src/lib/tasks/process-task-form-registry.spec.ts',
  'libs/core/providers/src/lib/tasks/process-task-form-registry.ts',
  'libs/core/providers/src/lib/tasks/process-task.models.ts',
  'libs/core/services/src/lib/managers/process-task-manager.service.spec.ts',
  'libs/core/services/src/lib/managers/process-task-manager.service.ts',
  'libs/core/services/src/lib/presentation/resource-presentation.maps.spec.ts',
  'libs/core/services/src/lib/presentation/resource-presentation.maps.ts',
  'libs/shared/audit-kit/src/lib/audit-operation-risk.spec.ts',
  'libs/shared/audit-kit/src/lib/audit-operation-risk.ts',
  'libs/shared/audit-kit/src/lib/audit-workspace-nav/audit-workspace-nav.component.spec.ts',
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
  // El nombre no alcanza: MT101 también se cuela como claves o entradas dentro de archivos
  // genéricos — los diccionarios i18n y los mapas de presentación son el caso real.
  return VERTICAL_CONTENT_PATTERN.test(readFileSync(file, 'utf8'));
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
