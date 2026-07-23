import { signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TestBed } from '@angular/core/testing';

import { ProcessSchemaFieldContextService } from '../../../../forms/process-schema-field-context.service';
import { ProcessHttpRequestFieldComponent } from './process-http-request-field.component';

// Contexto sin tarea: el @if del template no renderiza el ih-process-http-request pesado,
// así el test se centra en la lógica del wrapper (draft <-> FormControl).
class FakeContext {
  readonly task = signal<unknown>(null);
  readonly tasks = signal<unknown[]>([]);
  readonly readers = signal<unknown[]>([]);
}

function setup(initial: unknown) {
  TestBed.configureTestingModule({
    imports: [ProcessHttpRequestFieldComponent],
    providers: [{ provide: ProcessSchemaFieldContextService, useClass: FakeContext }],
  });
  const control = new FormControl(initial);
  const fixture = TestBed.createComponent(ProcessHttpRequestFieldComponent);
  fixture.componentRef.setInput('field', { key: 'request', type: 'http-request', label: 'HTTP request' });
  fixture.componentRef.setInput('control', control);
  fixture.detectChanges();
  return { fixture, control };
}

describe('ProcessHttpRequestFieldComponent', () => {
  it('reads the control value as the HttpRequestDraft', () => {
    const { fixture } = setup({ method: 'GET', baseUrl: 'https://api.example' });
    expect(fixture.componentInstance.draft().method).toBe('GET');
  });

  it('provides a default draft when the control has no value', () => {
    const { fixture } = setup(null);
    expect(fixture.componentInstance.draft().method).toBe('POST');
  });

  it('merges httpRequestChange patches back into the control value', () => {
    const { fixture, control } = setup({ method: 'GET', baseUrl: 'https://api.example' });
    fixture.componentInstance.onChange({ method: 'POST' });
    const value = control.value as { method: string; baseUrl: string };
    expect(value.method).toBe('POST');
    expect(value.baseUrl).toBe('https://api.example');
  });

  it('ignores changes when readonly', () => {
    const { fixture, control } = setup({ method: 'GET' });
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    fixture.componentInstance.onChange({ method: 'POST' });
    expect((control.value as { method: string }).method).toBe('GET');
  });
});
