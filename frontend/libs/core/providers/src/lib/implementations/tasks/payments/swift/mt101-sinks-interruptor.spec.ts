import { describe, expect, it } from 'vitest';
import { Mt101ValidateTaskProvider } from './mt101-validate-task.provider';
import { Mt101ReconcileTaskProvider } from './mt101-reconcile-task.provider';
import { ProcessTaskFormModel } from '../../../../tasks/process-task.models';

/**
 * Fija la semantica del sink: <b>la TABLA es el interruptor y la conexion es opcional</b>.
 *
 * <p>Existe porque la alternativa tentadora —emitir el sink tambien cuando solo hay conexion, rellenando la
 * tabla con el default del backend— es PEOR: vaciar la tabla para apagar el sink pasaria a REDIRIGIRLO a otra
 * tabla en vez de apagarlo, en silencio. Por eso una conexion sin tabla no se persiste, y por eso el
 * formulario deshabilita el selector de conexion mientras la tabla este vacia (si no, elegirla no tendria
 * ningun efecto: descarte silencioso).</p>
 */
function task(taskType: string, config: Record<string, unknown>): ProcessTaskFormModel {
  return {
    clientId: 'c', id: null, taskOrder: 1, taskType, active: true,
    sourceDefinitionId: null, readerDefinitionId: null, configurationJson: JSON.stringify(config),
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const save = (p: any, draft: any) => JSON.parse(p.toTaskPatch(draft).configurationJson as string);

describe('Interruptor del sink (la tabla, no la conexion)', () => {
  it('VALIDATE: vaciar la tabla APAGA el sink, no lo redirige a la tabla por defecto', () => {
    const p = new Mt101ValidateTaskProvider();
    const draft = p.hydrateDraft(task('MT101_VALIDATE', {
      taskRef: 'v', publishIssuesTo: 'table:conn-audit:mt101_validation_issue',
    }));

    const saved = save(p, { ...draft, publishIssuesTable: '' });

    expect(saved.publishIssuesTo, 'el sink sobrevivio apuntando a otro lado').toBeUndefined();
  });

  it('RECONCILE: vaciar la tabla no reescribe el destino de las excepciones', () => {
    const p = new Mt101ReconcileTaskProvider();
    const draft = p.hydrateDraft(task('MT101_RECONCILE', {
      taskRef: 'r', publishExceptionsTo: 'table:conn-1:excepciones_tesoreria',
    }));

    const saved = save(p, { ...draft, exceptionTable: '' });

    expect(saved.publishExceptionsTo).toBeUndefined();
  });

  it('VALIDATE: una tarea NUEVA publica en la tabla por defecto via Data Source de la plataforma', () => {
    // Default tipo DB_WRITE: la tabla arranca poblada (fija en el backend) y la conexion vacia = plataforma.
    const p = new Mt101ValidateTaskProvider();

    const saved = save(p, { ...p.createDraft(), taskRef: 'v' });

    expect(saved.publishIssuesTo, 'el sink deberia venir activo en la tabla por defecto')
      .toBe('table:mt101_validation_issue');
  });

  it('RECONCILE: una tarea NUEVA apunta a la tabla de excepciones por defecto', () => {
    const p = new Mt101ReconcileTaskProvider();

    const saved = save(p, { ...p.createDraft(), taskRef: 'r' });

    expect(saved.publishExceptionsTo).toBe('table:mt101_reconciliation_exception');
  });

  it('VALIDATE: un publishIssuesTo AUSENTE hidrata a la tabla por defecto (no queda vacio)', () => {
    // Antes: ausente -> tabla vacia -> sink apagado. Ahora: ausente -> default poblado -> sink activo al guardar.
    const p = new Mt101ValidateTaskProvider();
    const draft = p.hydrateDraft(task('MT101_VALIDATE', { taskRef: 'v', ruleSet: 'structural-mvp' }));
    expect(draft.publishIssuesTable).toBe('mt101_validation_issue');

    const saved = save(p, draft);
    expect(saved.publishIssuesTo).toBe('table:mt101_validation_issue');
  });

  it('VALIDATE: un mapa preservado NO es pisado por el default de tabla', () => {
    // Regresion del default nuevo contra el fix anti-corrupcion: si publishIssuesTo vino como mapa (no
    // parseable), la tabla NO debe defaultearse — el crudo se re-emite verbatim.
    const p = new Mt101ValidateTaskProvider();
    const draft = p.hydrateDraft(task('MT101_VALIDATE', {
      taskRef: 'v', publishIssuesTo: { table: 'mt101_validation_issue', connectionRef: 'externa' },
    }));
    expect(draft.publishIssuesTable, 'el mapa no se parsea; la tabla queda vacia, no defaulteada').toBe('');

    const saved = save(p, draft);
    expect(saved.publishIssuesTo).toEqual({ table: 'mt101_validation_issue', connectionRef: 'externa' });
  });

  it('VALIDATE: una conexion SIN tabla no se persiste (por eso la UI la deshabilita)', () => {
    // La tabla por defecto se vacia explicitamente para simular el sink apagado: sin tabla, la conexion suelta
    // no se emite.
    const p = new Mt101ValidateTaskProvider();

    const saved = save(p, {
      ...p.createDraft(), taskRef: 'v', publishIssuesTable: '', publishIssuesConnectionRef: 'conn-audit',
    });

    expect(saved.publishIssuesTo).toBeUndefined();
  });

  it('VALIDATE: con tabla, la conexion elegida SI manda y supera al crudo preservado', () => {
    // La salida de la forma mapa: en cuanto el operador escribe la tabla, el form gobierna y su conexion pisa
    // lo que viniera guardado.
    const p = new Mt101ValidateTaskProvider();
    const draft = p.hydrateDraft(task('MT101_VALIDATE', {
      taskRef: 'v', publishIssuesTo: { table: 'mt101_validation_issue', connectionRef: 'vieja' },
    }));
    expect(draft.publishIssuesTable, 'el mapa no se parsea, la tabla queda vacia').toBe('');

    const saved = save(p, {
      ...draft, publishIssuesTable: 'mt101_validation_issue', publishIssuesConnectionRef: 'nueva',
    });

    expect(saved.publishIssuesTo).toBe('table:nueva:mt101_validation_issue');
  });
});
