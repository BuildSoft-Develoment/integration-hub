import { describe, expect, it } from 'vitest';
import { NotificationTaskProvider } from './notification-task.provider';
import { ProcessTaskFormModel } from '../../../tasks/process-task.models';

const baseTask: ProcessTaskFormModel = {
  clientId: 'c', id: null, taskOrder: 1, taskType: 'NOTIFICATION', active: true,
  sourceDefinitionId: null, readerDefinitionId: null, configurationJson: '{}',
};

/** Config de un webhook completo, con destino y credenciales. */
const webhookConfig = {
  taskRef: 'notif', executionMode: 'once', channel: 'webhook',
  url: 'https://hooks.banco.local/avisos',
  method: 'POST',
  authType: 'bearer',
  token: '${secret:notif/webhook/token}',
  loginTimeoutSeconds: 45,
  tokenTtlSeconds: 120,
  message: 'aviso',
};

describe('NotificationTaskProvider — cambio de canal', () => {
  it('pasar el canal a log NO destruye la url ni las credenciales del webhook', () => {
    // Regresion (auditoria 2026-07-24): toTaskPatch emitia SOLO la rama del canal activo, asi que cambiar a
    // 'log' —tipico para probar— borraba el destino y el token. Sin authType el request sale despues SIN
    // header Authorization: es desactivar una proteccion, no perder un tuning.
    const p = new NotificationTaskProvider();
    const draft = p.hydrateDraft({ ...baseTask, configurationJson: JSON.stringify(webhookConfig) });

    const saved = JSON.parse(p.toTaskPatch({ ...draft, channel: 'log' }).configurationJson as string);

    expect(saved.channel).toBe('log');
    expect(saved.url, 'se perdio la url de destino del webhook').toBe(webhookConfig.url);
    expect(saved.token, 'se perdieron las credenciales').toBe(webhookConfig.token);
    expect(saved.authType, 'sin authType el request sale sin Authorization').toBe('bearer');
  });

  it('pasar a email conserva el webhook y viceversa', () => {
    const p = new NotificationTaskProvider();
    const draft = p.hydrateDraft({ ...baseTask, configurationJson: JSON.stringify(webhookConfig) });

    const email = JSON.parse(p.toTaskPatch({ ...draft, channel: 'email', to: 'ops@banco.local' })
      .configurationJson as string);
    expect(email.channel).toBe('email');
    expect(email.to).toBe('ops@banco.local');
    expect(email.url, 'el webhook debe sobrevivir al cambio a email').toBe(webhookConfig.url);
  });

  it('conserva loginTimeoutSeconds y tokenTtlSeconds, que no tienen campo propio en el draft', () => {
    // Estos dos los lee HttpRequestSupport pero no existen en HttpRequestDraft, asi que se perdian SIEMPRE,
    // incluso guardando en el propio canal webhook.
    const p = new NotificationTaskProvider();
    const draft = p.hydrateDraft({ ...baseTask, configurationJson: JSON.stringify(webhookConfig) });

    const saved = JSON.parse(p.toTaskPatch(draft).configurationJson as string);

    expect(saved.loginTimeoutSeconds).toBe(45);
    expect(saved.tokenTtlSeconds).toBe(120);
  });

  it('una tarea nueva no inventa claves de canales que nunca tuvo', () => {
    const p = new NotificationTaskProvider();
    const saved = JSON.parse(p.toTaskPatch({ ...p.createDraft(), taskRef: 'n' }).configurationJson as string);
    expect(saved.url).toBeUndefined();
    expect(saved.token).toBeUndefined();
    expect(saved.to).toBeUndefined();
  });
});
