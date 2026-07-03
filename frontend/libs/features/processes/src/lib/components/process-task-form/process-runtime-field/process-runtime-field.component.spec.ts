import { signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TestBed } from '@angular/core/testing';

import { ProcessSchemaFieldContextService } from '../../../forms/process-schema-field-context.service';
import { ProcessRuntimeFieldComponent } from './process-runtime-field.component';

// Contexto sin tarea: el @if no renderiza el panel pesado -> se testea la lógica del wrapper.
class FakeContext {
  readonly task = signal<{ clientId: string } | null>(null);
  readonly tasks = signal<unknown[]>([]);
  readonly readers = signal<unknown[]>([]);
}

function setup(initial: unknown) {
  TestBed.configureTestingModule({
    imports: [ProcessRuntimeFieldComponent],
    providers: [{ provide: ProcessSchemaFieldContextService, useClass: FakeContext }],
  });
  const control = new FormControl(initial);
  const fixture = TestBed.createComponent(ProcessRuntimeFieldComponent);
  fixture.componentRef.setInput('field', { key: 'runtime', type: 'runtime-panel', label: 'Runtime' });
  fixture.componentRef.setInput('control', control);
  fixture.detectChanges();
  return { fixture, control };
}

describe('ProcessRuntimeFieldComponent', () => {
  it('reads the control value as the runtime draft', () => {
    const { fixture } = setup({ taskRef: 't1', executionMode: 'per-record' });
    expect(fixture.componentInstance.draft().executionMode).toBe('per-record');
  });

  it('defaults to executionMode once when the control has no value', () => {
    const { fixture } = setup(null);
    expect(fixture.componentInstance.draft().executionMode).toBe('once');
  });

  it('merges runtimeChange patches back into the control value', () => {
    const { fixture, control } = setup({ taskRef: 't1', executionMode: 'once' });
    fixture.componentInstance.onChange({ executionMode: 'batch' });
    const value = control.value as { taskRef: string; executionMode: string };
    expect(value.executionMode).toBe('batch');
    expect(value.taskRef).toBe('t1');
  });

  it('ignores changes when readonly', () => {
    const { fixture, control } = setup({ taskRef: 't1', executionMode: 'once' });
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    fixture.componentInstance.onChange({ executionMode: 'batch' });
    expect((control.value as { executionMode: string }).executionMode).toBe('once');
  });
});
