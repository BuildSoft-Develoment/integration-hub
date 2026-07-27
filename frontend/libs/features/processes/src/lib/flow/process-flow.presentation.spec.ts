import { describe, expect, it } from 'vitest';

import {
  categoryLabelKey,
  getProcessFlowNodePresentation,
  taskCategory,
} from './process-flow.presentation';

describe('process flow presentation', () => {
  it('keeps the engine own task types in the motor group', () => {
    expect(taskCategory({ type: 'FILE_READ' })).toBe('motor');
    expect(taskCategory({ type: 'REST_CALL' })).toBe('motor');
  });

  it('uses the category declared by the provider (ADR-021)', () => {
    // El vertical declara su agrupacion; el motor ya no la infiere por prefijo del tipo.
    expect(taskCategory({ type: 'MT101_PAY', category: 'swift-mt101' })).toBe('swift-mt101');
    // Un vertical nuevo funciona igual, sin tocar el motor.
    expect(taskCategory({ type: 'SBS_BUILD', category: 'sbs' })).toBe('sbs');
  });

  it('does not infer a vertical from the task type prefix anymore (ADR-021)', () => {
    // Sin categoria declarada, un MT101_* cae al cajon por defecto: ya no hay startsWith('MT101_').
    expect(taskCategory({ type: 'MT101_PAY' })).toBe('plugin');
  });

  it('groups externally installed backend tasks as plugin tasks', () => {
    expect(taskCategory({ type: 'DEMO_TRANSFORM_NODE' })).toBe('plugin');

    const presentation = getProcessFlowNodePresentation('DEMO_TRANSFORM_NODE');
    expect(presentation.badge).toBe('TN');
    expect(presentation.toneClass).toBe('task-node--integration');
    expect(presentation.iconPath).toContain('M12 2');
  });

  it('prefers the node presentation declared by the provider (ADR-021)', () => {
    // Un vertical trae su propio icono/badge sin editar el mapa del motor.
    const declared = { badge: 'SBS', toneClass: 'task-node--payment', iconPath: 'M1 1h4' };
    expect(getProcessFlowNodePresentation('SBS_BUILD', declared)).toEqual(declared);
    // Y puede sobrescribir incluso un tipo que el motor ya conoce.
    expect(getProcessFlowNodePresentation('FILE_READ', declared)).toEqual(declared);
  });

  it('falls back to the engine default and then to the generic one', () => {
    // Sin declarar: el tipo propio del motor conserva su default...
    expect(getProcessFlowNodePresentation('FILE_READ').badge).toBe('READ');
    // ...y un tipo desconocido no rompe, deriva la presentacion del nombre.
    const unknown = getProcessFlowNodePresentation('SBS_BUILD');
    expect(unknown.badge).toBeTruthy();
    expect(unknown.toneClass).toBe('task-node--integration');
  });

  it('derives the group label key from the category', () => {
    expect(categoryLabelKey('motor')).toBe('processTask.category.motor');
    expect(categoryLabelKey('sbs')).toBe('processTask.category.sbs');
  });
});
