import { Component, runInInjectionContext, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
  PROCESS_TASK_FORM_REGISTRY,
  ProcessTaskFormRegistration,
  provideProcessTaskForm,
  provideProcessTaskForms,
} from './process-task-form-registry';

@Component({ standalone: true, template: '' })
class TestBuildFormComponent {}

@Component({ standalone: true, template: '' })
class TestValidateFormComponent {}

describe('PROCESS_TASK_FORM_REGISTRY (M-1b)', () => {
  it('returns empty when nothing registered (host has @optional fallback)', () => {
    TestBed.configureTestingModule({ providers: [] });
    const registrations = TestBed.inject(PROCESS_TASK_FORM_REGISTRY, []);
    expect(registrations).toEqual([]);
  });

  it('collects a single registration via provideProcessTaskForm', () => {
    TestBed.configureTestingModule({
      providers: [
        provideProcessTaskForm({ type: 'FAKE_BUILD', component: TestBuildFormComponent }),
      ],
    });

    const registrations = TestBed.inject(PROCESS_TASK_FORM_REGISTRY);
    expect(registrations).toHaveLength(1);
    expect(registrations[0].type).toBe('FAKE_BUILD');
    expect(registrations[0].component).toBe(TestBuildFormComponent);
  });

  it('aggregates multiple registrations via provideProcessTaskForms', () => {
    TestBed.configureTestingModule({
      providers: [
        ...provideProcessTaskForms(
          { type: 'FAKE_BUILD', component: TestBuildFormComponent, layout: 'workspace' },
          { type: 'FAKE_VALIDATE', component: TestValidateFormComponent, layout: 'compact' },
        ),
      ],
    });

    const registrations = TestBed.inject(PROCESS_TASK_FORM_REGISTRY);
    expect(registrations).toHaveLength(2);
    expect(registrations.map((r) => r.type).sort()).toEqual(['FAKE_BUILD', 'FAKE_VALIDATE']);

    const build = registrations.find((r) => r.type === 'FAKE_BUILD')!;
    expect(build.layout).toBe('workspace');
    const validate = registrations.find((r) => r.type === 'FAKE_VALIDATE')!;
    expect(validate.layout).toBe('compact');
  });

  it('preserves multi: true behaviour across separate provider entries', () => {
    TestBed.configureTestingModule({
      providers: [
        provideProcessTaskForm({ type: 'FAKE_BUILD', component: TestBuildFormComponent }),
        provideProcessTaskForm({ type: 'FAKE_VALIDATE', component: TestValidateFormComponent }),
      ],
    });

    const registrations = TestBed.inject(PROCESS_TASK_FORM_REGISTRY);
    expect(registrations).toHaveLength(2);
  });

  it('host can resolve registration by task type', () => {
    TestBed.configureTestingModule({
      providers: [
        ...provideProcessTaskForms(
          { type: 'FAKE_BUILD', component: TestBuildFormComponent },
          { type: 'FAKE_VALIDATE', component: TestValidateFormComponent },
        ),
      ],
    });

    const registrations = TestBed.inject(PROCESS_TASK_FORM_REGISTRY);
    const resolved: ProcessTaskFormRegistration | undefined = registrations.find(
      (r) => r.type === 'FAKE_VALIDATE',
    );
    expect(resolved).toBeDefined();
    expect((resolved!.component as Type<unknown>).name).toContain('Validate');
  });
});
