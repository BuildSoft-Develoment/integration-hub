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
class TestMt101BuildFormComponent {}

@Component({ standalone: true, template: '' })
class TestMt101ValidateFormComponent {}

describe('PROCESS_TASK_FORM_REGISTRY (M-1b)', () => {
  it('returns empty when nothing registered (host has @optional fallback)', () => {
    TestBed.configureTestingModule({ providers: [] });
    const registrations = TestBed.inject(PROCESS_TASK_FORM_REGISTRY, []);
    expect(registrations).toEqual([]);
  });

  it('collects a single registration via provideProcessTaskForm', () => {
    TestBed.configureTestingModule({
      providers: [
        provideProcessTaskForm({ type: 'MT101_BUILD_FROM_TABLE', component: TestMt101BuildFormComponent }),
      ],
    });

    const registrations = TestBed.inject(PROCESS_TASK_FORM_REGISTRY);
    expect(registrations).toHaveLength(1);
    expect(registrations[0].type).toBe('MT101_BUILD_FROM_TABLE');
    expect(registrations[0].component).toBe(TestMt101BuildFormComponent);
  });

  it('aggregates multiple registrations via provideProcessTaskForms', () => {
    TestBed.configureTestingModule({
      providers: [
        ...provideProcessTaskForms(
          { type: 'MT101_BUILD_FROM_TABLE', component: TestMt101BuildFormComponent, layout: 'workspace' },
          { type: 'MT101_VALIDATE', component: TestMt101ValidateFormComponent, layout: 'compact' },
        ),
      ],
    });

    const registrations = TestBed.inject(PROCESS_TASK_FORM_REGISTRY);
    expect(registrations).toHaveLength(2);
    expect(registrations.map((r) => r.type).sort()).toEqual(['MT101_BUILD_FROM_TABLE', 'MT101_VALIDATE']);

    const build = registrations.find((r) => r.type === 'MT101_BUILD_FROM_TABLE')!;
    expect(build.layout).toBe('workspace');
    const validate = registrations.find((r) => r.type === 'MT101_VALIDATE')!;
    expect(validate.layout).toBe('compact');
  });

  it('preserves multi: true behaviour across separate provider entries', () => {
    TestBed.configureTestingModule({
      providers: [
        provideProcessTaskForm({ type: 'MT101_BUILD_FROM_TABLE', component: TestMt101BuildFormComponent }),
        provideProcessTaskForm({ type: 'MT101_VALIDATE', component: TestMt101ValidateFormComponent }),
      ],
    });

    const registrations = TestBed.inject(PROCESS_TASK_FORM_REGISTRY);
    expect(registrations).toHaveLength(2);
  });

  it('host can resolve registration by task type', () => {
    TestBed.configureTestingModule({
      providers: [
        ...provideProcessTaskForms(
          { type: 'MT101_BUILD_FROM_TABLE', component: TestMt101BuildFormComponent },
          { type: 'MT101_VALIDATE', component: TestMt101ValidateFormComponent },
        ),
      ],
    });

    const registrations = TestBed.inject(PROCESS_TASK_FORM_REGISTRY);
    const resolved: ProcessTaskFormRegistration | undefined = registrations.find(
      (r) => r.type === 'MT101_VALIDATE',
    );
    expect(resolved).toBeDefined();
    expect((resolved!.component as Type<unknown>).name).toContain('Validate');
  });
});
