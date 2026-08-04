import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { DateTimeService } from '@integration-hub/core/services';
import { I18nService } from '@integration-hub/core/i18n';

import { AuditPresentationService } from './audit-presentation.service';

/**
 * Diccionario minimo con UN solo espacio por familia. El del test anterior tenia a la vez
 * `audit.status.RUNNING` y `executionStatus.FAILED`, que era exactamente el doble espacio que
 * hacia leer "Completado" en auditoria y "Completada" en ejecuciones.
 */
const DICCIONARIO: Record<string, string> = {
  'executionStatus.RUNNING': 'En ejecucion',
  'executionStatus.FAILED': 'Fallida',
  'audit.eventLabel.PROCESS_EXECUTION_STARTED': 'Proceso iniciado',
  'processTask.DB_WRITE': 'Escritura en base de datos',
  'audit.taskDefinitionId': 'Task definition',
};

describe('AuditPresentationService', () => {
  let service: AuditPresentationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuditPresentationService,
        {
          provide: I18nService,
          useValue: {
            has: (key: string) => key in DICCIONARIO,
            t: (key: string) => DICCIONARIO[key] ?? key,
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

  it('nombra el estado con el mismo espacio de claves que #/executions', () => {
    expect(service.statusLabel('RUNNING')).toBe('En ejecucion');
    expect(service.statusLabel('FAILED')).toBe('Fallida');
  });

  it('un estado sin traduccion sale MARCADO y deja rastro, no disfrazado de enum', () => {
    // Este es el punto del cambio: antes se afirmaba `toBe('UNKNOWN')`, es decir, el test
    // CERTIFICABA que una traduccion ausente se degradara en silencio al valor crudo.
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const etiqueta = service.statusLabel('UNKNOWN');

    expect(etiqueta).not.toBe('UNKNOWN');
    expect(etiqueta).toContain('UNKNOWN');
    expect(error).toHaveBeenCalled();

    error.mockRestore();
  });

  it('sin estado devuelve guion (no hay dato, no falta traduccion)', () => {
    expect(service.statusLabel(null)).toBe('-');
  });

  it('should build shared event, task and date labels', () => {
    expect(service.eventLabel('PROCESS_EXECUTION_STARTED')).toBe('Proceso iniciado');
    expect(service.taskTypeDescription('DB_WRITE')).toBe('Escritura en base de datos');
    expect(service.taskLabel({ taskType: 'DB_WRITE', taskDefinitionId: 8 })).toBe(
      'Escritura en base de datos · Task definition 8'
    );
    expect(service.compactTaskLabel({ taskType: 'DB_WRITE', taskDefinitionId: 8 })).toBe(
      'Escritura en base de datos · TD 8'
    );
    expect(service.formatDate('2026-04-16T00:00:00Z')).toBe('fmt:2026-04-16T00:00:00Z');
  });
});
