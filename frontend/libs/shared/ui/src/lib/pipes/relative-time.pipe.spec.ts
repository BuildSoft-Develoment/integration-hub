import { TestBed } from '@angular/core/testing';
import { DateTimeService } from '@integration-hub/core/services';

import { RelativeTimePipe } from './relative-time.pipe';

describe('RelativeTimePipe', () => {
  let pipe: RelativeTimePipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RelativeTimePipe,
        {
          provide: DateTimeService,
          useValue: {
            formatRelative: (v: string | null | undefined) => (v ? `rel(${v})` : ''),
            formatIso: (v: string | null | undefined) => (v ? `abs(${v})` : ''),
          },
        },
      ],
    });
    pipe = TestBed.runInInjectionContext(() => new RelativeTimePipe());
  });

  it('usa el formato relativo por defecto', () => {
    expect(pipe.transform('2026-06-18T10:00:00Z')).toBe('rel(2026-06-18T10:00:00Z)');
  });

  it('usa el formato absoluto cuando se pide', () => {
    expect(pipe.transform('2026-06-18T10:00:00Z', 'absolute')).toBe('abs(2026-06-18T10:00:00Z)');
  });

  it('devuelve cadena vacía con valor nulo', () => {
    expect(pipe.transform(null)).toBe('');
  });
});
