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

  it('VALIDATE: una conexion SIN tabla no se persiste (por eso la UI la deshabilita)', () => {
    const p = new Mt101ValidateTaskProvider();

    const saved = save(p, { ...p.createDraft(), taskRef: 'v', publishIssuesConnectionRef: 'conn-audit' });

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
