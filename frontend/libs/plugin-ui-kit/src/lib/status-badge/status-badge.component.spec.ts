import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { StatusBadgeComponent, StatusBadgeKind } from './status-badge.component';

@Component({
  standalone: true,
  imports: [StatusBadgeComponent],
  template: `<ih-status-badge [status]="status()">{{ label }}</ih-status-badge>`,
})
class HostComponent {
  readonly status = signal<StatusBadgeKind>('success');
  label = 'Active';
}

describe('StatusBadgeComponent', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('projects the label and exposes the status as data-status', () => {
    const fixture = setup();
    const badge = fixture.nativeElement.querySelector('.ih-status-badge') as HTMLElement;

    expect(badge.textContent?.trim()).toBe('Active');
    expect(badge.getAttribute('data-status')).toBe('success');
  });

  it('reflects a changed status', () => {
    const fixture = setup();
    fixture.componentInstance.status.set('error');
    fixture.detectChanges();

    expect(
      (fixture.nativeElement.querySelector('.ih-status-badge') as HTMLElement).getAttribute('data-status')
    ).toBe('error');
  });
});
