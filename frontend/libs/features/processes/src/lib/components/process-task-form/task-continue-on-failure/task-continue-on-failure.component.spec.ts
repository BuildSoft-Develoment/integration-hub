import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { TaskContinueOnFailureComponent } from './task-continue-on-failure.component';

function setup(inputs: Record<string, unknown> = {}) {
  TestBed.configureTestingModule({
    imports: [TaskContinueOnFailureComponent],
    providers: [provideNoopAnimations()],
  });
  const fixture = TestBed.createComponent(TaskContinueOnFailureComponent);
  Object.entries(inputs).forEach(([key, value]) => fixture.componentRef.setInput(key, value));
  fixture.detectChanges();
  return fixture;
}

describe('TaskContinueOnFailureComponent', () => {
  it('reflects continueOnFailure true', () => {
    expect(setup({ continueOnFailure: true }).componentInstance.continueOnFailure()).toBe(true);
  });

  it('reflects continueOnFailure false', () => {
    expect(setup({ continueOnFailure: false }).componentInstance.continueOnFailure()).toBe(false);
  });

  it('emits continueOnFailureChange', () => {
    const fixture = setup({ continueOnFailure: false });
    let emitted: boolean | undefined;
    fixture.componentInstance.continueOnFailureChange.subscribe((value) => (emitted = value));
    fixture.componentInstance.continueOnFailureChange.emit(true);
    expect(emitted).toBe(true);
  });
});
