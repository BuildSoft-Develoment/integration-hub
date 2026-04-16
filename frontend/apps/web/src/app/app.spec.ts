import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { SystemThemeConfigService } from '@integration-hub/core/services';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }),
    });

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: SystemThemeConfigService,
          useValue: {
            get: () =>
              of({
                scheme: 'light',
                preset: 'horizon',
                density: 'comfortable',
                locale: 'es',
                sidebarMode: 'expanded',
                primary: '#0F766E',
                error: '#E5484D',
                neutral: '#8B8D98',
              }),
            update: () =>
              of({
                scheme: 'light',
                preset: 'horizon',
                density: 'comfortable',
                locale: 'es',
                sidebarMode: 'expanded',
                primary: '#0F766E',
                error: '#E5484D',
                neutral: '#8B8D98',
              }),
          },
        },
      ],
    }).compileComponents();
  });

  it('should render the app layout', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('ih-app-layout')).not.toBeNull();
  });
});
