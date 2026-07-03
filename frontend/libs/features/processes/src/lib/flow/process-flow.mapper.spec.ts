import { ProcessFlowMapper } from './process-flow.mapper';
import { ProcessTaskFormModel } from '../models/process.models';

function task(taskType: string, configurationJson: string): ProcessTaskFormModel {
  return { clientId: 'c1', taskType, configurationJson, taskOrder: 1 } as unknown as ProcessTaskFormModel;
}

describe('ProcessFlowMapper (dispatch badge, ADR-015)', () => {
  const mapper = new ProcessFlowMapper();

  it('marks an async once-task as offload (async)', () => {
    expect(mapper.createNode(task('DB_WRITE', '{"async":true,"executionMode":"once"}'), 0).dispatch).toBe('async');
  });

  it('marks an async batch/per-record task as scatter (distributed)', () => {
    expect(mapper.createNode(task('DB_WRITE', '{"async":true,"executionMode":"batch"}'), 0).dispatch).toBe('scatter');
    expect(mapper.createNode(task('DB_WRITE', '{"async":true,"executionMode":"per-record"}'), 0).dispatch).toBe('scatter');
  });

  it('leaves synchronous tasks without a dispatch badge', () => {
    expect(mapper.createNode(task('DB_WRITE', '{"executionMode":"batch"}'), 0).dispatch).toBeUndefined();
    expect(mapper.createNode(task('DB_WRITE', '{"async":false}'), 0).dispatch).toBeUndefined();
    expect(mapper.createNode(task('DB_WRITE', 'not-json'), 0).dispatch).toBeUndefined();
  });
});
