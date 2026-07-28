import { TestBed } from '@angular/core/testing';
import { I18nService } from '@integration-hub/core/services';
import { ProcessTaskBindingOption, ProcessTaskParameterBindingDraft } from '@integration-hub/core/providers';
import { ProcessTaskBindingBoardComponent } from './process-task-binding-board.component';

/**
 * Lockea la desambiguacion de claves duplicadas del binding-board (P1.1, ADR-004): el <select>
 * usa un valor compuesto `kind::key`, de modo que dos opciones con el mismo `key` en grupos
 * distintos (p.ej. records::nombre vs summary::nombre) no colisionan al seleccionar.
 */
describe('ProcessTaskBindingBoardComponent — kind::key disambiguation (P1.1)', () => {
  const option = (kind: ProcessTaskBindingOption['kind'], key: string): ProcessTaskBindingOption => ({
    key,
    label: `${kind}:${key}`,
    kind,
    groupKey: `ui.group.${kind}`,
  });

  // Dos opciones con el MISMO key en grupos distintos.
  const sourceGroups = [
    { key: 'ui.group.records', items: [option('records', 'nombre'), option('records', 'id')] },
    { key: 'ui.group.summary', items: [option('summary', 'nombre')] },
  ];

  function setup(entries: ProcessTaskParameterBindingDraft[]) {
    TestBed.configureTestingModule({
      providers: [{ provide: I18nService, useValue: { t: (k: string) => k } }],
    });
    // Aislamos la logica: sin template real (evita hijos/Material) pero con signal-inputs.
    TestBed.overrideComponent(ProcessTaskBindingBoardComponent, { set: { template: '', imports: [] } });
    const fixture = TestBed.createComponent(ProcessTaskBindingBoardComponent);
    fixture.componentRef.setInput('entries', entries);
    fixture.componentRef.setInput('sourceGroups', sourceGroups);
    const emitted: ProcessTaskParameterBindingDraft[][] = [];
    fixture.componentInstance.entriesChange.subscribe((next) => emitted.push(next));
    return { component: fixture.componentInstance, emitted };
  }

  const emptyEntry = (): ProcessTaskParameterBindingDraft => ({
    name: 'p',
    jdbcType: 'VARCHAR',
    direction: 'IN',
    sourceKind: null,
    sourceKey: '',
    sourceLabel: '',
    expression: '',
  });

  it('builds a composite kind::key value per option', () => {
    const { component } = setup([emptyEntry()]);
    expect(component.optionValue(option('summary', 'nombre'))).toBe('summary::nombre');
    expect(component.optionValue(option('records', 'nombre'))).toBe('records::nombre');
  });

  it('selects the option matching BOTH kind and key (not the first key match)', () => {
    const { component, emitted } = setup([emptyEntry()]);

    component.selectSource(0, 'summary::nombre');

    expect(emitted).toHaveLength(1);
    expect(emitted[0][0].sourceKind).toBe('summary');
    expect(emitted[0][0].sourceKey).toBe('nombre');
    expect(emitted[0][0].sourceLabel).toBe('summary:nombre');
  });

  it('round-trips the selected value in the same composite format', () => {
    const entry: ProcessTaskParameterBindingDraft = { ...emptyEntry(), sourceKind: 'summary', sourceKey: 'nombre', sourceLabel: 'summary:nombre' };
    const { component } = setup([entry]);
    expect(component.selectedValue(entry)).toBe('summary::nombre');
  });

  it('clears the binding when the selected value is null', () => {
    const entry: ProcessTaskParameterBindingDraft = { ...emptyEntry(), sourceKind: 'records', sourceKey: 'id', sourceLabel: 'records:id' };
    const { component, emitted } = setup([entry]);

    component.selectSource(0, null);

    expect(emitted[0][0].sourceKind).toBeNull();
    expect(emitted[0][0].sourceKey).toBe('');
  });
});
