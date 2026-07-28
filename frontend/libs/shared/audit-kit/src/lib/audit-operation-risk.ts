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

/** Operaciones gobernadas que aporta la propia plataforma. */
export type PlatformAuditOperationId = 'audit-spool-retry-dead' | 'audit-spool-cleanup-sent';

/**
 * ADR-021: ABIERTO. Antes esta union nombraba las 9 operaciones de MT101 (rebuild, corrective-pay,
 * pay-uncertain...), o sea que una lib COMPARTIDA sabia con cuantos ojos se aprueba un reenvio de
 * un estandar concreto. Cada vertical declara las suyas y las registra; el kit aporta el contrato.
 */
export type AuditOperationId = PlatformAuditOperationId | (string & {});

export interface AuditOperationRisk {
  readonly id: AuditOperationId;
  readonly mode: AuditOperationMode;
  readonly severity: AuditOperationRiskSeverity;
  readonly requiredCapability: AuditOperationCapability;
  readonly labelKey: string;
  readonly summaryKey: string;
  readonly evidence: readonly AuditOperationEvidence[];
}

const RISKS: Record<PlatformAuditOperationId, AuditOperationRisk> = {
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
};

/**
 * Riesgos que aportan los verticales. Mismo patron de overlay que `I18nService.registerMessages`:
 * el kit no puede conocerlos de antemano, y hacerlos inyectables obligaria a convertir esta funcion
 * en servicio y a tocar a todos sus consumidores.
 */
const REGISTERED = new Map<string, AuditOperationRisk>();

/** Un vertical declara sus operaciones gobernadas al entrar en escena. Idempotente. */
export function registerAuditOperationRisks(risks: readonly AuditOperationRisk[]): void {
  for (const risk of risks) {
    REGISTERED.set(risk.id, risk);
  }
}

export function auditOperationRisk(id: AuditOperationId): AuditOperationRisk {
  const risk = REGISTERED.get(id) ?? RISKS[id as PlatformAuditOperationId];
  if (!risk) {
    // Politica no-fallback: una operacion gobernada sin riesgo declarado se renderizaria sin sus
    // controles (confirmacion, motivo, maker-checker). Mejor romper que degradar en silencio.
    throw new Error(`audit operation risk not registered: ${id}`);
  }
  return risk;
}

export function auditEvidenceLabelKey(evidence: AuditOperationEvidence): string {
  return `audit.risk.evidence.${evidence}`;
}
