import { TestBed } from '@angular/core/testing';

import { ReaderTypeFormHostComponent } from './reader-type-form-host.component';

function render(type: string) {
  TestBed.configureTestingModule({ imports: [ReaderTypeFormHostComponent] });
  const fixture = TestBed.createComponent(ReaderTypeFormHostComponent);
  fixture.componentRef.setInput('readerType', type as never);
  fixture.componentRef.setInput('draft', { type } as never);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('ReaderTypeFormHostComponent', () => {
  it('shows an explicit message for an unknown reader type (no silent JSON fallback)', () => {
    const el = render('QUANTUM');
    expect(el.querySelector('.reader-type-form-host__unsupported')).toBeTruthy();
    expect(el.querySelector('ih-reader-json-form')).toBeNull();
  });
});
