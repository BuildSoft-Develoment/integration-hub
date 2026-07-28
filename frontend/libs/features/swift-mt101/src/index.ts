export * from './lib/swift-mt101.routes';
// ADR-021: el vertical aporta sus task providers, sus formularios y el mapeo tipo->formulario.
// La app lo ensambla en la ruta de procesos; `features/processes` NO lo importa (feature -> feature
// esta prohibido por las fronteras Nx, y es justamente lo que este movimiento vino a respetar).
export * from './lib/process-tasks/swift-mt101-process-tasks.providers';
// ADR-021: el catalogo de reglas de validacion. Estaba en `features/payments` con nombre de dominio
// generico, pero sus unicos consumidores son de MT101 — igual que en el backend, donde
// `payment_validation_rule` solo la leen las clases del vertical.
export * from './lib/validation-rules/catalog/payment-validation-rules.routes';
export * from './lib/process-tasks/swift-mt101-process-template';
export * from './lib/swift-mt101-i18n';
export * from './lib/swift-mt101-audit-risks';
