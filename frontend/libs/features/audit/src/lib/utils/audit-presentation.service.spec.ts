import { TestBed } from '@angular/core/testing';

import { DateTimeService, I18nService } from '@integration-hub/core/services';

import { AuditPresentationService } from './audit-presentation.service';

describe('AuditPresentationService', () => {
  let service: AuditPresentationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuditPresentationService,
        {
          provide: I18nService,
          useValue: {
            t: (key: string) =>
              (
                {
                  'audit.status.RUNNING': 'En curso',
                  'executionStatus.FAILED': 'Fallido',
                  'audit.eventLabel.PROCESS_EXECUTION_STARTED': 'Proceso iniciado',
                  'taskTypeLabel.DB_WRITE': 'DB Write',
                  'audit.taskDefinitionId': 'Task definition',
                } as Record<string, string>
              )[key] ?? key,
          },
        },
        {
          provide: DateTimeService,
          useValue: {
            formatIso: (value: string) => `fmt:${value}`,
          },
        },
      ],
    });

    service = TestBed.inject(AuditPresentationService);
  });

  it('should resolve audit and execution statuses through translations', () => {
    expect(service.statusLabel('RUNNING')).toBe('En curso');
    expect(service.statusLabel('FAILED')).toBe('Fallido');
    expect(service.statusLabel('UNKNOWN')).toBe('UNKNOWN');
  });

  it('should build shared event, task and date labels', () => {
    expect(service.eventLabel('PROCESS_EXECUTION_STARTED')).toBe('Proceso iniciado');
    expect(service.taskTypeDescription('DB_WRITE')).toBe('DB Write');
    expect(service.taskLabel({ taskType: 'DB_WRITE', taskDefinitionId: 8 })).toBe(
      'DB Write · Task definition 8'
    );
    expect(service.compactTaskLabel({ taskType: 'DB_WRITE', taskDefinitionId: 8 })).toBe(
      'DB Write · TD 8'
    );
    expect(service.formatDate('2026-04-16T00:00:00Z')).toBe('fmt:2026-04-16T00:00:00Z');
  });
});
