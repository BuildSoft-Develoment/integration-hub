import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ConnectionSelectComponent } from './connection-select.component';
import { ConnectionRef } from '../../../models/process.models';

const CONNS: readonly ConnectionRef[] = [
  { id: 1, name: 'core-oracle', connectionType: 'ORACLE' },
  { id: 2, name: 'reporting-pg', connectionType: 'POSTGRES' },
];

function setup(inputs: Record<string, unknown> = {}) {
  TestBed.configureTestingModule({
    imports: [ConnectionSelectComponent],
    providers: [provideNoopAnimations()],
  });
  const fixture = TestBed.createComponent(ConnectionSelectComponent);
  fixture.componentRef.setInput('connections', CONNS);
  Object.entries(inputs).forEach(([key, value]) => fixture.componentRef.setInput(key, value));
  fixture.detectChanges();
  return fixture;
}

describe('ConnectionSelectComponent', () => {
  it('renderiza el label cuando esta presente', () => {
    const el = setup({ label: 'Conexion' }).nativeElement as HTMLElement;
    expect(el.querySelector('mat-label')?.textContent?.trim()).toBe('Conexion');
  });

  it('acepta emptyLabel para la opcion vacia', () => {
    expect((setup({ emptyLabel: '-' }).componentInstance as ConnectionSelectComponent).emptyLabel()).toBe('-');
  });

  it('sin emptyLabel (null) no declara opcion vacia', () => {
    expect((setup().componentInstance as ConnectionSelectComponent).emptyLabel()).toBeNull();
  });

  it('variante DB: valueBy=name (default) con el valor actual seleccionado', () => {
    const cmp = setup({ value: 'core-oracle' }).componentInstance as ConnectionSelectComponent;
    expect(cmp.valueBy()).toBe('name');
    expect(cmp.value()).toBe('core-oracle');
  });

  it('variante MT101: valueBy=id (la opcion usa el id como valor)', () => {
    const cmp = setup({ valueBy: 'id', value: '2' }).componentInstance as ConnectionSelectComponent;
    expect(cmp.valueBy()).toBe('id');
    expect(cmp.value()).toBe('2');
  });

  it('emite valueChange con el valor elegido', () => {
    const fixture = setup({ valueBy: 'name' });
    let emitted: string | undefined;
    fixture.componentInstance.valueChange.subscribe((v) => (emitted = v));
    fixture.componentInstance.valueChange.emit('reporting-pg');
    expect(emitted).toBe('reporting-pg');
  });

  it('subscriptSizing por defecto es fixed (paridad DB)', () => {
    expect((setup().componentInstance as ConnectionSelectComponent).subscriptSizing()).toBe('fixed');
  });

  it('subscriptSizing acepta dynamic (paridad MT101)', () => {
    expect((setup({ subscriptSizing: 'dynamic' }).componentInstance as ConnectionSelectComponent).subscriptSizing()).toBe('dynamic');
  });
});
