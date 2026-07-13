import { describe, expect, it } from 'vitest';

import {
  CATEGORY_LABELS,
  getProcessFlowNodePresentation,
  taskCategory,
} from './process-flow.presentation';

describe('process flow presentation', () => {
  it('keeps platform and MT101 tasks in their canonical groups', () => {
    expect(taskCategory('FILE_READ')).toBe('motor');
    expect(taskCategory('REST_CALL')).toBe('motor');
    expect(taskCategory('MT101_PAY')).toBe('swift-mt101');
  });

  it('groups externally installed backend tasks as plugin tasks', () => {
    expect(taskCategory('DEMO_TRANSFORM_NODE')).toBe('plugin');
    expect(CATEGORY_LABELS.plugin).toBe('Plugins');

    const presentation = getProcessFlowNodePresentation('DEMO_TRANSFORM_NODE');
    expect(presentation.badge).toBe('TN');
    expect(presentation.toneClass).toBe('task-node--integration');
    expect(presentation.iconPath).toContain('M12 2');
  });
});
