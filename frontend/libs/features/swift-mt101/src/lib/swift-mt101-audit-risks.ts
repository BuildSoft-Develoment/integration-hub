import { AuditOperationRisk } from '@integration-hub/shared/audit-kit';

/**
 * ADR-021: riesgo operativo de las acciones gobernadas del vertical SWIFT MT101.
 *
 * <p>Vivian dentro de `shared/audit-kit`, en un `Record` cuyas claves tipaba una union CERRADA que
 * nombraba las 9 operaciones del estandar. Una lib compartida no tiene por que saber que existe
 * un rebuild de MT101 ni con cuantos ojos se aprueba; el kit aporta el CONTRATO (severidad, modo,
 * capability, evidencia) y cada vertical declara sus operaciones.</p>
 *
 * <p>Se registran en los puntos de entrada del vertical, igual que sus etiquetas i18n.</p>
 */
export const SWIFT_MT101_AUDIT_RISKS: readonly AuditOperationRisk[] = [
  {
    id: 'mt101-quarantine-build',
    mode: 'governed-operation',
    severity: 'high',
    requiredCapability: 'audit-operate',
    labelKey: 'audit.risk.operation.quarantineBuild',
    summaryKey: 'audit.risk.summary.quarantineBuild',
    evidence: ['two-step-confirmation'],
  },
  {
    id: 'mt101-rebuild-request',
    mode: 'governed-operation',
    severity: 'high',
    requiredCapability: 'audit-operate',
    labelKey: 'audit.risk.operation.rebuildRequest',
    summaryKey: 'audit.risk.summary.rebuildRequest',
    evidence: ['reason', 'maker-checker', 'append-only-history'],
  },
  {
    id: 'mt101-rebuild-approve',
    mode: 'governed-operation',
    severity: 'critical',
    requiredCapability: 'audit-admin',
    labelKey: 'audit.risk.operation.rebuildApprove',
    summaryKey: 'audit.risk.summary.rebuildApprove',
    evidence: ['reason', 'maker-checker', 'append-only-history'],
  },
  {
    id: 'mt101-rebuild-execute',
    mode: 'governed-operation',
    severity: 'critical',
    requiredCapability: 'audit-operate',
    labelKey: 'audit.risk.operation.rebuildExecute',
    summaryKey: 'audit.risk.summary.rebuildExecute',
    evidence: ['maker-checker', 'append-only-history'],
  },
  {
    id: 'mt101-correction-save',
    mode: 'governed-operation',
    severity: 'high',
    requiredCapability: 'audit-operate',
    labelKey: 'audit.risk.operation.correctionSave',
    summaryKey: 'audit.risk.summary.correctionSave',
    evidence: ['reason', 'ticket', 'optimistic-lock', 'append-only-history'],
  },
  {
    id: 'mt101-corrective-advance',
    mode: 'governed-operation',
    severity: 'high',
    requiredCapability: 'audit-operate',
    labelKey: 'audit.risk.operation.correctiveAdvance',
    summaryKey: 'audit.risk.summary.correctiveAdvance',
    evidence: ['append-only-history'],
  },
  {
    id: 'mt101-corrective-pay-request',
    mode: 'governed-operation',
    severity: 'critical',
    requiredCapability: 'audit-operate',
    labelKey: 'audit.risk.operation.payRequest',
    summaryKey: 'audit.risk.summary.payRequest',
    evidence: ['reason', 'ticket', 'maker-checker', 'append-only-history'],
  },
  {
    id: 'mt101-corrective-pay-approve',
    mode: 'governed-operation',
    severity: 'critical',
    requiredCapability: 'audit-admin',
    labelKey: 'audit.risk.operation.payApprove',
    summaryKey: 'audit.risk.summary.payApprove',
    evidence: ['maker-checker', 'append-only-history'],
  },
  {
    id: 'mt101-pay-uncertain-resolve',
    mode: 'governed-operation',
    severity: 'critical',
    requiredCapability: 'audit-operate',
    labelKey: 'audit.risk.operation.payUncertain',
    summaryKey: 'audit.risk.summary.payUncertain',
    evidence: ['reason', 'append-only-history'],
  },
];
