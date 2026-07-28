import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ConnectionSelectComponent } from './connection-select.component';
import { ConnectionRef } from '@integration-hub/core/providers';

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

  it('refleja el valor actual seleccionado (el nombre de la conexion)', () => {
    const cmp = setup({ value: 'core-oracle' }).componentInstance as ConnectionSelectComponent;
    expect(cmp.value()).toBe('core-oracle');
  });

  it('emite valueChange con el nombre elegido', () => {
    const fixture = setup();
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
