import { durationBetween, formatDurationMs, timelineStatusIcon, timelineStatusKind } from './timeline-format';

describe('timeline-format', () => {
  describe('timelineStatusKind', () => {
    it('clasifica estados terminales correctos como ok', () => {
      expect(timelineStatusKind('SENT')).toBe('ok');
      expect(timelineStatusKind('built')).toBe('ok');
      expect(timelineStatusKind('RESOLVED')).toBe('ok');
    });
    it('clasifica fallos como error', () => {
      expect(timelineStatusKind('REJECTED')).toBe('error');
      expect(timelineStatusKind('VALIDATION_ISSUE')).toBe('error');
    });
    it('lo desconocido o vacío es pending', () => {
      expect(timelineStatusKind(null)).toBe('pending');
      expect(timelineStatusKind('QUEUED')).toBe('pending');
    });
  });

  describe('timelineStatusIcon', () => {
    it('mapea a nombres de icono por familia', () => {
      expect(timelineStatusIcon('VALIDATED')).toBe('check');
      expect(timelineStatusIcon('REJECTED')).toBe('x');
      expect(timelineStatusIcon(null)).toBe('loader');
    });
  });

  describe('formatDurationMs', () => {
    it('sub-segundo en ms', () => {
      expect(formatDurationMs(800)).toBe('800ms');
    });
    it('segundos con un decimal', () => {
      expect(formatDurationMs(1500)).toBe('1.5s');
    });
    it('minutos y segundos', () => {
      expect(formatDurationMs(754000)).toBe('12min 34s');
    });
    it('horas y minutos', () => {
      expect(formatDurationMs(3 * 3600_000 + 5 * 60_000)).toBe('3h 5min');
    });
    it('clampa negativos a 0', () => {
      expect(formatDurationMs(-100)).toBe('0ms');
    });
  });

  describe('durationBetween', () => {
    it('calcula la diferencia entre dos ISO', () => {
      expect(durationBetween('2026-06-18T10:15:32Z', '2026-06-18T10:15:33Z')).toBe('1s');
    });
    it('es null si falta un timestamp', () => {
      expect(durationBetween(null, '2026-06-18T10:15:33Z')).toBeNull();
      expect(durationBetween('2026-06-18T10:15:33Z', undefined)).toBeNull();
    });
    it('es null si el orden es inverso (reloj inconsistente)', () => {
      expect(durationBetween('2026-06-18T10:15:33Z', '2026-06-18T10:15:32Z')).toBeNull();
    });
  });
});
