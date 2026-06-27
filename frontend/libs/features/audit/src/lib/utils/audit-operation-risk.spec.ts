import { auditEvidenceLabelKey, auditOperationRisk } from './audit-operation-risk';

describe('auditOperationRisk', () => {
  it('clasifica PAY como operacion critica con maker-checker', () => {
    const risk = auditOperationRisk('mt101-corrective-pay-approve');

    expect(risk.severity).toBe('critical');
    expect(risk.requiredCapability).toBe('audit-admin');
    expect(risk.evidence).toContain('maker-checker');
    expect(risk.evidence).toContain('append-only-history');
  });

  it('mantiene limpieza de spool como operacion admin con confirmacion', () => {
    const risk = auditOperationRisk('audit-spool-cleanup-sent');

    expect(risk.requiredCapability).toBe('audit-admin');
    expect(risk.evidence).toEqual(['two-step-confirmation']);
  });

  it('resuelve keys i18n de evidencia sin acoplar componentes', () => {
    expect(auditEvidenceLabelKey('optimistic-lock')).toBe('audit.risk.evidence.optimistic-lock');
  });
});
