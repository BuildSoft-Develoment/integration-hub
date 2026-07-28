import { describe, expect, it } from 'vitest';

import { Mt101ArchiveTaskProvider } from './mt101-archive-task.provider';
import { Mt101BuildFromTableTaskProvider } from './mt101-build-from-table-task.provider';
import { Mt101ParseTaskProvider } from './mt101-parse-task.provider';
import { Mt101PayTaskProvider } from './mt101-pay-task.provider';
import { Mt101ReconcileTaskProvider } from './mt101-reconcile-task.provider';
import { Mt101RepairTaskProvider } from './mt101-repair-task.provider';
import { Mt101RouteTaskProvider } from './mt101-route-task.provider';
import { Mt101SplitTaskProvider } from './mt101-split-task.provider';
import { Mt101StatusTaskProvider } from './mt101-status-task.provider';
import { Mt101ValidateTaskProvider } from './mt101-validate-task.provider';

/**
 * ADR-021: candado de la migracion de `summaryFields` al descriptor.
 *
 * <p>Los campos del output `summary` estaban en una tabla dentro del motor de binding (una lib
 * COMPARTIDA que asi conocia los tipos de un estandar). Al moverlos al descriptor de cada provider,
 * un error silencioso rompio uno: `Mt101BuildFromTableTaskProvider` <b>sobrescribe el descriptor
 * completo</b> de su clase base, asi que declararlo en la base no tenia ningun efecto — y el tipo
 * caia al default generico `['batchCount']`, ofreciendo campos equivocados en el binding.</p>
 *
 * <p>No lo detecto ninguna prueba, de ahi esta. Verifica sobre el provider REGISTRADO (el que
 * resuelve en runtime), no sobre la clase base, que es donde estaba el agujero.</p>
 */
describe('ADR-021 · summaryFields declarados por los providers MT101', () => {
  // Valores historicos de la tabla que vivia en ProcessTaskBindingContextService. Cambiarlos aca
  // es cambiar lo que la UI de binding ofrece: tiene que ser deliberado.
  const EXPECTED: ReadonlyArray<[new () => { descriptor: { type: string; summaryFields?: readonly string[] } }, string[]]> = [
    [Mt101ValidateTaskProvider, ['validCount', 'invalidCount', 'issueCount']],
    [Mt101ArchiveTaskProvider, ['archivedCount', 'targetTable']],
    [Mt101PayTaskProvider, ['dispatchCount', 'sentCount', 'acceptedCount', 'rejectedCount', 'retriedCount', 'transport']],
    [Mt101RouteTaskProvider, ['routedCount', 'manualReviewCount']],
    [Mt101ReconcileTaskProvider, ['matchedCount', 'unmatchedCount', 'mismatchCount']],
    [Mt101StatusTaskProvider, ['updatedCount', 'pendingCount']],
    [Mt101ParseTaskProvider, ['parsedCount', 'messageCount', 'transactionCount']],
    [Mt101SplitTaskProvider, ['inputMessageCount', 'splitMessageCount', 'passthroughCount', 'outputFragmentCount']],
    [Mt101RepairTaskProvider, ['inputMessageCount', 'repairedMessageCount', 'totalChanges', 'repairAttempt']],
    [Mt101BuildFromTableTaskProvider, ['fragmentSetId', 'fragmentCount', 'transactionCount', 'totalBytes', 'format']],
  ];

  it.each(EXPECTED)('%p declara los campos de summary que ofrecia el motor', (ProviderType, expected) => {
    const descriptor = new ProviderType().descriptor;

    expect(descriptor.summaryFields, `${descriptor.type} sin summaryFields: el binding caeria a ['batchCount']`)
      .toEqual(expected);
  });
});
