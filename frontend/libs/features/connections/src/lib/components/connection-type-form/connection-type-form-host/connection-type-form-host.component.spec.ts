import { TestBed } from '@angular/core/testing';

import { ConnectionTypeFormHostComponent } from './connection-type-form-host.component';

function render(family: string, type = 'X') {
  TestBed.configureTestingModule({ imports: [ConnectionTypeFormHostComponent] });
  const fixture = TestBed.createComponent(ConnectionTypeFormHostComponent);
  fixture.componentRef.setInput('connectionType', type as never);
  fixture.componentRef.setInput('draft', { type, family } as never);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('ConnectionTypeFormHostComponent', () => {
  it('renders the mongodb form for the mongodb family', () => {
    const el = render('mongodb', 'MONGODB');
    expect(el.querySelector('ih-connection-mongodb-form')).toBeTruthy();
    expect(el.querySelector('.connection-type-form-host__unsupported')).toBeNull();
  });

  it('shows an explicit message for an unknown family (no silent JDBC fallback)', () => {
    const el = render('unknown', 'WEIRD');
    expect(el.querySelector('.connection-type-form-host__unsupported')).toBeTruthy();
    expect(el.querySelector('ih-connection-jdbc-form')).toBeNull();
    expect(el.querySelector('ih-connection-mongodb-form')).toBeNull();
  });
});
