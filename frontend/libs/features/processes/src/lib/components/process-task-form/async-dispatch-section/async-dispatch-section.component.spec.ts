import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { AsyncDispatchSectionComponent } from './async-dispatch-section.component';

function setup(inputs: Record<string, unknown> = {}) {
  TestBed.configureTestingModule({
    imports: [AsyncDispatchSectionComponent],
    providers: [provideNoopAnimations()],
  });
  const fixture = TestBed.createComponent(AsyncDispatchSectionComponent);
  Object.entries(inputs).forEach(([key, value]) => fixture.componentRef.setInput(key, value));
  fixture.detectChanges();
  return fixture;
}

describe('AsyncDispatchSectionComponent', () => {
  it('treats batch async as distributed (scatter-gather)', () => {
    const fixture = setup({ async: true, executionMode: 'batch' });
    expect(fixture.componentInstance.distributed()).toBe(true);
  });

  it('treats per-record async as distributed', () => {
    const fixture = setup({ async: true, executionMode: 'per-record' });
    expect(fixture.componentInstance.distributed()).toBe(true);
  });

  it('treats once async as a single-unit offload, not distributed', () => {
    const fixture = setup({ async: true, executionMode: 'once' });
    expect(fixture.componentInstance.distributed()).toBe(false);
  });

  it('is never distributed when async is off', () => {
    const fixture = setup({ async: false, executionMode: 'batch' });
    expect(fixture.componentInstance.distributed()).toBe(false);
  });

  it('mode hint is sync when async is off', () => {
    const fixture = setup({ async: false });
    expect(fixture.componentInstance.modeHint()).toBe(fixture.componentInstance.i18n.t('ui.asyncModeSync'));
  });

  it('mode hint is single-unit offload for once async', () => {
    const fixture = setup({ async: true, executionMode: 'once' });
    expect(fixture.componentInstance.modeHint()).toBe(fixture.componentInstance.i18n.t('ui.asyncModeOffload'));
  });

  it('mode hint is scatter for batch async', () => {
    const fixture = setup({ async: true, executionMode: 'batch' });
    expect(fixture.componentInstance.modeHint()).toBe(fixture.componentInstance.i18n.t('ui.asyncModeScatter'));
  });

  it('emits changes for each control', () => {
    const fixture = setup({ async: false });
    const emitted: Record<string, unknown> = {};
    fixture.componentInstance.asyncChange.subscribe((v) => (emitted['async'] = v));
    fixture.componentInstance.transportChange.subscribe((v) => (emitted['transport'] = v));
    fixture.componentInstance.continueOnFailureChange.subscribe((v) => (emitted['continueOnFailure'] = v));

    fixture.componentInstance.asyncChange.emit(true);
    fixture.componentInstance.transportChange.emit('RABBITMQ');
    fixture.componentInstance.continueOnFailureChange.emit(true);

    expect(emitted).toEqual({ async: true, transport: 'RABBITMQ', continueOnFailure: true });
  });
});
