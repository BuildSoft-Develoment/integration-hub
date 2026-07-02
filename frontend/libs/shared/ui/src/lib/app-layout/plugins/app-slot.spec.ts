import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthAccessService } from '@integration-hub/core/services';

import {
  AppSlotRegistry,
  provideAppSlotContributions,
} from './app-slot.token';
import { SlotOutletComponent } from './slot-outlet.component';

@Component({ standalone: true, template: `<span class="widget-a">A</span>` })
class WidgetA {}

@Component({ standalone: true, template: `<span class="widget-b">B</span>` })
class WidgetB {}

@Component({ standalone: true, template: `<span class="widget-secret">S</span>` })
class WidgetSecret {}

function accessStub(capabilities: string[]) {
  return { hasCapability: (c: string) => capabilities.includes(c) } as unknown as AuthAccessService;
}

describe('AppSlotRegistry', () => {
  it('resolves contributions for a slot, RBAC-filtered and ordered', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthAccessService, useValue: accessStub(['ops']) },
        ...provideAppSlotContributions([
          { slot: 'overview.widgets', component: WidgetB, order: 2 },
          { slot: 'overview.widgets', component: WidgetA, order: 1 },
          { slot: 'overview.widgets', component: WidgetSecret, requiredCapability: 'admin' as never },
          { slot: 'other.slot', component: WidgetA },
        ]),
      ],
    });
    const registry = TestBed.inject(AppSlotRegistry);

    const resolved = registry.contributionsFor('overview.widgets');

    // ordered by `order`, secret excluded (missing capability), other slot excluded.
    expect(resolved.map((c) => c.component)).toEqual([WidgetA, WidgetB]);
    expect(registry.contributionsFor('other.slot').length).toBe(1);
  });

  it('includes a capability-gated contribution when the user holds it', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthAccessService, useValue: accessStub(['admin']) },
        ...provideAppSlotContributions([
          { slot: 'overview.widgets', component: WidgetSecret, requiredCapability: 'admin' as never },
        ]),
      ],
    });

    expect(TestBed.inject(AppSlotRegistry).contributionsFor('overview.widgets').length).toBe(1);
  });
});

describe('SlotOutletComponent', () => {
  @Component({
    standalone: true,
    imports: [SlotOutletComponent],
    template: `<ih-slot name="overview.widgets" />`,
  })
  class HostComponent {}

  it('renders the contributed widgets of its slot', () => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        { provide: AuthAccessService, useValue: accessStub([]) },
        ...provideAppSlotContributions([
          { slot: 'overview.widgets', component: WidgetA, order: 1 },
          { slot: 'overview.widgets', component: WidgetB, order: 2 },
          { slot: 'elsewhere', component: WidgetSecret },
        ]),
      ],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.widget-a')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.widget-b')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.widget-secret')).toBeNull();
  });
});
