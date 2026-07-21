import { TestBed } from '@angular/core/testing';
import { I18nService } from '@integration-hub/core/services';
import { ProcessTaskBindingOption } from '@integration-hub/core/providers';
import { BindingOriginSelectComponent } from './binding-origin-select.component';

/**
 * Control composite de origen compartido (ADR-018). Se aisla la logica con template='' (sin Material) — el reset
 * del mat-select (viewChild) queda undefined y el guard lo tolera, que es justo lo que se verifica ademas del routing.
 */
describe('BindingOriginSelectComponent', () => {
  const option = (kind: ProcessTaskBindingOption['kind'], key: string): ProcessTaskBindingOption => ({
    key,
    label: `${kind}:${key}`,
    kind,
    groupKey: `ui.group.${kind}`,
  });

  function setup() {
    TestBed.configureTestingModule({
      providers: [{ provide: I18nService, useValue: { t: (k: string) => k } }],
    });
    TestBed.overrideComponent(BindingOriginSelectComponent, { set: { template: '', imports: [] } });
    const fixture = TestBed.createComponent(BindingOriginSelectComponent);
    fixture.componentRef.setInput('groups', []);
    const picked: ProcessTaskBindingOption[] = [];
    let clearedCount = 0;
    fixture.componentInstance.picked.subscribe((o) => picked.push(o));
    fixture.componentInstance.cleared.subscribe(() => (clearedCount += 1));
    return { component: fixture.componentInstance, picked, cleared: () => clearedCount };
  }

  it('emite picked con la opcion elegida (sin crashear aunque no haya mat-select renderizado)', () => {
    const { component, picked, cleared } = setup();
    const opt = option('records', 'nombre');

    component.onPicked(opt);

    expect(picked).toEqual([opt]);
    expect(cleared()).toBe(0);
  });

  it('elegir "Ninguno" (null) emite cleared, no picked', () => {
    const { component, picked, cleared } = setup();

    component.onPicked(null);

    expect(cleared()).toBe(1);
    expect(picked).toHaveLength(0);
  });

  it('un drop lee el origen del dataTransfer y emite picked (camino readFromTransfer)', () => {
    const { component, picked } = setup();
    const opt = option('summary', 'processedCount');
    const dataTransfer = { getData: (_type: string) => JSON.stringify(opt) } as unknown as DataTransfer;
    const event = { preventDefault: () => undefined, dataTransfer } as unknown as DragEvent;

    component.handleDrop(event);

    expect(picked).toEqual([opt]);
  });
});
