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

  it('warns when async is on but the feature is disabled in the environment', () => {
    const el = setup({ async: true, featureEnabled: false }).nativeElement as HTMLElement;
    expect(el.querySelector('.async-dispatch__warning')).toBeTruthy();
  });

  it('shows no warning when the async feature is enabled', () => {
    const el = setup({ async: true, featureEnabled: true }).nativeElement as HTMLElement;
    expect(el.querySelector('.async-dispatch__warning')).toBeNull();
  });

  it('hides the toggle and shows a hint when the type does not support async (UNSUPPORTED)', () => {
    const fixture = setup({ offloadSupport: 'UNSUPPORTED', executionMode: 'once' });
    const el = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance.available()).toBe(false);
    expect(el.querySelector('mat-slide-toggle')).toBeNull();
    expect(el.querySelector('.async-dispatch__hint--unavailable')?.textContent).toBe(
      fixture.componentInstance.i18n.t('ui.asyncNotSupported')
    );
  });

  it('SLICE_ONLY is unavailable in once mode', () => {
    expect(setup({ offloadSupport: 'SLICE_ONLY', executionMode: 'once' }).componentInstance.available()).toBe(false);
  });

  it('SLICE_ONLY is available in batch mode', () => {
    expect(setup({ offloadSupport: 'SLICE_ONLY', executionMode: 'batch' }).componentInstance.available()).toBe(true);
  });

  it('SLICE_ONLY is available in per-record mode', () => {
    expect(
      setup({ offloadSupport: 'SLICE_ONLY', executionMode: 'per-record' }).componentInstance.available()
    ).toBe(true);
  });

  it('SLICE_ONLY in once mode shows the scatter-only hint', () => {
    const fixture = setup({ offloadSupport: 'SLICE_ONLY', executionMode: 'once' });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.async-dispatch__hint--unavailable')?.textContent).toBe(
      fixture.componentInstance.i18n.t('ui.asyncScatterOnly')
    );
  });

  it('keeps the toggle visible when async is already on even if now unsupported, so it can be turned off', () => {
    const fixture = setup({ offloadSupport: 'UNSUPPORTED', executionMode: 'once', async: true });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('mat-slide-toggle')).toBeTruthy();
    expect(fixture.componentInstance.toggleDisabled()).toBe(false);
  });

  it('emits async and transport changes', () => {
    const fixture = setup({ async: false });
    const emitted: Record<string, unknown> = {};
    fixture.componentInstance.asyncChange.subscribe((v) => (emitted['async'] = v));
    fixture.componentInstance.transportChange.subscribe((v) => (emitted['transport'] = v));

    fixture.componentInstance.asyncChange.emit(true);
    fixture.componentInstance.transportChange.emit('RABBITMQ');

    expect(emitted).toEqual({ async: true, transport: 'RABBITMQ' });
  });
});
