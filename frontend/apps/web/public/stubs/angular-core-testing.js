const noop = () => undefined;
const identity = (fn) => fn;

export const TestBed = {
  configureTestingModule: () => TestBed,
  compileComponents: () => Promise.resolve(),
  createComponent: () => ({
    detectChanges: noop,
    destroy: noop,
  }),
  inject: () => undefined,
};

export const TestBedStatic = TestBed;
export const ComponentFixture = class {};
export const async = identity;
export const fakeAsync = identity;
export const tick = noop;
export const flush = noop;
export const discardPeriodicTasks = noop;
export const flushMicrotasks = noop;
export const getTestBed = () => TestBed;
export const inject = () => undefined;
export const provideZonelessChangeDetection = noop;
export const provideZoneChangeDetection = noop;
export const waitForAsync = identity;
