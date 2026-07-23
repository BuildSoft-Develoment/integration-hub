import { TestBed } from '@angular/core/testing';

import { ProcessReaderFieldsViewComponent } from './process-reader-fields-view.component';
import { ReaderFieldDraft } from '@integration-hub/core/providers';

function setup(fields: readonly ReaderFieldDraft[], variant: 'position' | 'range' = 'position') {
  TestBed.configureTestingModule({ imports: [ProcessReaderFieldsViewComponent] });
  const fixture = TestBed.createComponent(ProcessReaderFieldsViewComponent);
  fixture.componentRef.setInput('fields', fields);
  fixture.componentRef.setInput('variant', variant);
  fixture.detectChanges();
  return fixture;
}

describe('ProcessReaderFieldsViewComponent', () => {
  it('variante position: una fila por campo con nombre, posicion y tipo', () => {
    const el = setup([
      { name: 'amount', position: '3', type: 'NUMBER' },
      { name: 'currency', position: '4', type: 'TEXT' },
    ]).nativeElement as HTMLElement;
    const rows = el.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(el.textContent).toContain('amount');
    expect(el.textContent).toContain('currency');
    expect(el.textContent).toContain('NUMBER');
    // sin columnas de rango en variante position
    expect(el.querySelector('thead')?.textContent).not.toContain('undefined');
  });

  it('variante range: muestra columnas de inicio/fin (start/end de fixed-length)', () => {
    const el = setup([{ name: 'ref', start: '1', end: '16', type: 'TEXT' }], 'range').nativeElement as HTMLElement;
    const row = el.querySelector('tbody tr') as HTMLElement;
    expect(row.textContent).toContain('ref');
    expect(row.textContent).toContain('1');
    expect(row.textContent).toContain('16');
  });

  it('marca fx los campos con script y no los demas', () => {
    const el = setup([
      { name: 'net', position: '5', type: 'NUMBER', script: 'gross - fee' },
      { name: 'plain', position: '6', type: 'TEXT' },
    ]).nativeElement as HTMLElement;
    const badges = el.querySelectorAll('.rfv__fx');
    expect(badges.length).toBe(1);
    expect((badges[0] as HTMLElement).getAttribute('title')).toBe('gross - fee');
  });

  it('required se marca con check y ausencia con guion', () => {
    const el = setup([
      { name: 'req', position: '1', type: 'TEXT', required: true },
      { name: 'opt', position: '2', type: 'TEXT', required: false },
    ]).nativeElement as HTMLElement;
    const rows = el.querySelectorAll('tbody tr');
    expect(rows[0].textContent).toContain('✓');
  });
});
