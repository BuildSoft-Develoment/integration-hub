export type AuditOperationRiskSeverity = 'medium' | 'high' | 'critical';

export type AuditOperationMode = 'query' | 'governed-operation';

export type AuditOperationCapability = 'audit-read' | 'audit-operate' | 'audit-admin';

export type AuditOperationEvidence =
  | 'two-step-confirmation'
  | 'reason'
  | 'ticket'
  | 'maker-checker'
  | 'optimistic-lock'
  | 'append-only-history';

export type AuditOperationId =
  | 'audit-spool-retry-dead'
  | 'audit-spool-cleanup-sent'
  | 'mt101-quarantine-build'
  | 'mt101-rebuild-request'
  | 'mt101-rebuild-approve'
  | 'mt101-rebuild-execute'
  | 'mt101-correction-save'
  | 'mt101-corrective-advance'
  | 'mt101-corrective-pay-request'
  | 'mt101-corrective-pay-approve'
  | 'mt101-pay-uncertain-resolve';

export interface AuditOperationRisk {
  readonly id: AuditOperationId;
  readonly mode: AuditOperationMode;
  readonly severity: AuditOperationRiskSeverity;
  readonly requiredCapability: AuditOperationCapability;
  readonly labelKey: string;
  readonly summaryKey: string;
  readonly evidence: readonly AuditOperationEvidence[];
}

const RISKS: Record<AuditOperationId, AuditOperationRisk> = {
  'audit-spool-retry-dead': {
    id: 'audit-spool-retry-dead',
    mode: 'governed-operation',
    severity: 'high',
    requiredCapability: 'audit-admin',
    labelKey: 'audit.risk.operation.spoolRetry',
    summaryKey: 'audit.risk.summary.spoolRetry',
    evidence: ['two-step-confirmation', 'append-only-history'],
  },
  'audit-spool-cleanup-sent': {
    id: 'audit-spool-cleanup-sent',
    mode: 'governed-operation',
    severity: 'high',
    requiredCapability: 'audit-admin',
    labelKey: 'audit.risk.operation.spoolCleanup',
    summaryKey: 'audit.risk.summary.spoolCleanup',
    evidence: ['two-step-confirmation'],
  },
  'mt101-quarantine-build': {
    id: 'mt101-quarantine-build',
    mode: 'governed-operation',
    severity: 'high',
    requiredCapability: 'audit-operate',
    labelKey: 'audit.risk.operation.quarantineBuild',
    summaryKey: 'audit.risk.summary.quarantineBuild',
    evidence: ['two-step-confirmation'],
  },
  'mt101-rebuild-request': {
    id: 'mt101-rebuild-request',
    mode: 'governed-operation',
    severity: 'high',
    requiredCapability: 'audit-operate',
    labelKey: 'audit.risk.operation.rebuildRequest',
    summaryKey: 'audit.risk.summary.rebuildRequest',
    evidence: ['reason', 'maker-checker', 'append-only-history'],
  },
  'mt101-rebuild-approve': {
    id: 'mt101-rebuild-approve',
    mode: 'governed-operation',
    severity: 'critical',
    requiredCapability: 'audit-admin',
    labelKey: 'audit.risk.operation.rebuildApprove',
    summaryKey: 'audit.risk.summary.rebuildApprove',
    evidence: ['reason', 'maker-checker', 'append-only-history'],
  },
  'mt101-rebuild-execute': {
    id: 'mt101-rebuild-execute',
    mode: 'governed-operation',
    severity: 'critical',
    requiredCapability: 'audit-operate',
    labelKey: 'audit.risk.operation.rebuildExecute',
    summaryKey: 'audit.risk.summary.rebuildExecute',
    evidence: ['maker-checker', 'append-only-history'],
  },
  'mt101-correction-save': {
    id: 'mt101-correction-save',
    mode: 'governed-operation',
    severity: 'high',
    requiredCapability: 'audit-operate',
    labelKey: 'audit.risk.operation.correctionSave',
    summaryKey: 'audit.risk.summary.correctionSave',
    evidence: ['reason', 'ticket', 'optimistic-lock', 'append-only-history'],
  },
  'mt101-corrective-advance': {
    id: 'mt101-corrective-advance',
    mode: 'governed-operation',
    severity: 'high',
    requiredCapability: 'audit-operate',
    labelKey: 'audit.risk.operation.correctiveAdvance',
    summaryKey: 'audit.risk.summary.correctiveAdvance',
    evidence: ['append-only-history'],
  },
  'mt101-corrective-pay-request': {
    id: 'mt101-corrective-pay-request',
    mode: 'governed-operation',
    severity: 'critical',
    requiredCapability: 'audit-operate',
    labelKey: 'audit.risk.operation.payRequest',
    summaryKey: 'audit.risk.summary.payRequest',
    evidence: ['reason', 'ticket', 'maker-checker', 'append-only-history'],
  },
  'mt101-corrective-pay-approve': {
    id: 'mt101-corrective-pay-approve',
    mode: 'governed-operation',
    severity: 'critical',
    requiredCapability: 'audit-admin',
    labelKey: 'audit.risk.operation.payApprove',
    summaryKey: 'audit.risk.summary.payApprove',
    evidence: ['maker-checker', 'append-only-history'],
  },
  'mt101-pay-uncertain-resolve': {
    id: 'mt101-pay-uncertain-resolve',
    mode: 'governed-operation',
    severity: 'critical',
    requiredCapability: 'audit-operate',
    labelKey: 'audit.risk.operation.payUncertain',
    summaryKey: 'audit.risk.summary.payUncertain',
    evidence: ['reason', 'append-only-history'],
  },
};

export function auditOperationRisk(id: AuditOperationId): AuditOperationRisk {
  return RISKS[id];
}

export function auditEvidenceLabelKey(evidence: AuditOperationEvidence): string {
  return `audit.risk.evidence.${evidence}`;
}
