// @covers spec 004-observabilidad-y-auditoria RF-010 (reingenieria: prueba que cubre el/los RF en produccion — observabilidad-y-auditoria: riesgo operacional de acciones auditables)
import { auditEvidenceLabelKey, auditOperationRisk, registerAuditOperationRisks } from './audit-operation-risk';

describe('auditOperationRisk', () => {
  // ADR-021: solo operaciones de la PLATAFORMA. La de MT101 que se verificaba aca se fue con el
  // vertical (`swift-mt101-audit-risks.spec.ts`): el kit aporta el contrato, no la lista de
  // operaciones gobernadas de cada estandar.

  it('mantiene limpieza de spool como operacion admin con confirmacion', () => {
    const risk = auditOperationRisk('audit-spool-cleanup-sent');

    expect(risk.requiredCapability).toBe('audit-admin');
    expect(risk.evidence).toEqual(['two-step-confirmation']);
  });

  it('resuelve keys i18n de evidencia sin acoplar componentes', () => {
    expect(auditEvidenceLabelKey('optimistic-lock')).toBe('audit.risk.evidence.optimistic-lock');
  });
});

describe('registro de verticales (ADR-021)', () => {
  it('falla fuerte ante una operacion no registrada', () => {
    // Politica no-fallback: una accion gobernada sin riesgo declarado se renderizaria SIN sus
    // controles (confirmacion, motivo, maker-checker). Romper es mas seguro que degradar.
    expect(() => auditOperationRisk('un-vertical-no-registrado')).toThrow(/not registered/);
  });

  it('un vertical aporta las suyas y quedan resolubles', () => {
    registerAuditOperationRisks([
      {
        id: 'fake-vertical-op',
        mode: 'governed-operation',
        severity: 'critical',
        requiredCapability: 'audit-admin',
        labelKey: 'x.label',
        summaryKey: 'x.summary',
        evidence: ['maker-checker'],
      },
    ]);

    expect(auditOperationRisk('fake-vertical-op').severity).toBe('critical');
  });
});
