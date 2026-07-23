import { signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ProcessSchemaFieldContextService } from '../../../../forms/process-schema-field-context.service';
import { ProcessTokenFieldComponent } from './process-token-field.component';

class FakeContext {
  readonly groupedOptions = signal([
    { key: 'source', items: [{ key: 'src.out.amount', label: 'Amount', groupKey: 'source' }] },
  ]);
  tokenFor(key: string): string {
    return `{${key}}`;
  }
  set(): void {
    /* no-op for the test */
  }
}

function setup(initial = '') {
  TestBed.configureTestingModule({
    imports: [ProcessTokenFieldComponent],
    providers: [
      provideNoopAnimations(),
      { provide: ProcessSchemaFieldContextService, useClass: FakeContext },
    ],
  });
  const control = new FormControl(initial);
  const fixture = TestBed.createComponent(ProcessTokenFieldComponent);
  fixture.componentRef.setInput('field', { key: 'message', type: 'token-text', label: 'Message' });
  fixture.componentRef.setInput('control', control);
  fixture.detectChanges();
  return { fixture, control };
}

describe('ProcessTokenFieldComponent', () => {
  it('renders a textarea bound to the control and offers the token menu when options exist', () => {
    const { fixture } = setup('hola');
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('textarea')).toBeTruthy();
    // With binding options in context, the "insert token" trigger is shown.
    expect(el.querySelector('button[mat-stroked-button]')).toBeTruthy();
  });

  it('inserts the selected option token into the control value', () => {
    const { fixture, control } = setup('mensaje: ');
    fixture.componentInstance.insert('src.out.amount');
    expect(String(control.value)).toContain('{src.out.amount}');
  });

  it('does not modify the value when readonly', () => {
    const { fixture, control } = setup('fijo');
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    fixture.componentInstance.insert('src.out.amount');
    expect(control.value).toBe('fijo');
  });
});
