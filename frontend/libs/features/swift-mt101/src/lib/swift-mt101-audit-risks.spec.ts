import { describe, expect, it } from 'vitest';

import { SWIFT_MT101_AUDIT_RISKS } from './swift-mt101-audit-risks';

/**
 * ADR-021: el vertical verifica SUS operaciones gobernadas.
 *
 * <p>Antes esto se probaba dentro de `shared/audit-kit`, o sea una lib compartida afirmando con
 * cuántos ojos se aprueba un reenvío de MT101. El kit conserva su contrato (severidad, capability,
 * evidencia) y cada vertical responde por lo suyo.</p>
 *
 * <p>Lo que se fija acá no es cosmético: es el control operativo del money-path. Bajar una
 * severidad o quitar `maker-checker` cambia qué le exige la UI al operador antes de mover dinero.</p>
 */
describe('ADR-021 · riesgos de auditoría del vertical SWIFT MT101', () => {
  const byId = (id: string) => SWIFT_MT101_AUDIT_RISKS.find((risk) => risk.id === id);

  it('declara las 9 operaciones gobernadas', () => {
    expect(SWIFT_MT101_AUDIT_RISKS).toHaveLength(9);
    expect(SWIFT_MT101_AUDIT_RISKS.every((risk) => risk.id.startsWith('mt101-'))).toBe(true);
  });

  it('aprobar el PAY correctivo es crítico y exige maker-checker', () => {
    const risk = byId('mt101-corrective-pay-approve');

    expect(risk?.severity).toBe('critical');
    expect(risk?.requiredCapability).toBe('audit-admin');
    expect(risk?.evidence).toContain('maker-checker');
    expect(risk?.evidence).toContain('append-only-history');
  });

  it('toda operación gobernada deja evidencia', () => {
    const sinEvidencia = SWIFT_MT101_AUDIT_RISKS.filter(
      (risk) => risk.mode === 'governed-operation' && risk.evidence.length === 0
    ).map((risk) => risk.id);

    expect(sinEvidencia, 'una acción gobernada sin evidencia no es auditable').toEqual([]);
  });
});
