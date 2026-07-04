import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AsyncHealth } from '../../models/overview-async-health.model';
import { OverviewAsyncHealthCardComponent } from './overview-async-health-card.component';

describe('OverviewAsyncHealthCardComponent', () => {
  function build(health: AsyncHealth) {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(OverviewAsyncHealthCardComponent);
    fixture.componentRef.setInput('health', health);
    return fixture;
  }

  it('eleva a error cuando hay filas muertas', () => {
    expect(build({ dead: 3, stalled: 0 }).componentInstance.alert()).toBe('error');
  });

  it('prioriza error sobre estancados', () => {
    expect(build({ dead: 1, stalled: 5 }).componentInstance.alert()).toBe('error');
  });

  it('advierte cuando solo hay scatters estancados', () => {
    expect(build({ dead: 0, stalled: 2 }).componentInstance.alert()).toBe('warn');
  });

  it('sin alerta cuando el backbone está limpio', () => {
    expect(build({ dead: 0, stalled: 0 }).componentInstance.alert()).toBeNull();
  });

  it('renderiza los contadores y el enlace a la consola DLQ', () => {
    const fixture = build({ dead: 3, stalled: 2 });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('3');
    expect(el.textContent).toContain('2');
    expect(el.querySelector('a[href="/executions/async-dlq"]')).not.toBeNull();
  });
});
