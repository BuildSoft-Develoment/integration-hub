import { expect, Page, test } from '@playwright/test';

const credentials = {
  username: process.env['E2E_USERNAME'] || 'admin',
  password: process.env['E2E_PASSWORD'] || 'admin123',
};

const now = '2026-07-09T10:00:00Z';
const hash = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const fragmentSetId = 'QA-AUDIT-MT101-001';

test.describe('Audit data and remote plugin process tasks', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuditAndProcessData(page);
  });

  test('shows installed remote plugin task types in the process palette', async ({ page }) => {
    test.setTimeout(90_000);
    await gotoAuthenticated(page, '/#/processes');

    await page.getByRole('button', { name: /Crear|Create|Nuevo/i }).click();
    await expect(page.getByRole('button', { name: /Plugins/ })).toBeVisible({ timeout: 20_000 });

    await page.getByRole('button', { name: /Plugins/ }).click();
    await expect(page.locator('.flow-palette__label', { hasText: 'TN' })).toBeVisible();
    await expect(page.locator('.flow-palette__label', { hasText: 'TP' })).toBeVisible();

    const disabledRemote = page.locator('.flow-palette__item--disabled', { hasText: 'TP' });
    await expect(disabledRemote).toBeDisabled();
  });

  test('renders all audit routes with success and error data', async ({ page }) => {
    test.setTimeout(120_000);
    await gotoAuthenticated(page, '/#/audit');
    await expect(page.getByText('MT101_QA_SEED')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/COMPLETED_WITH_ERRORS|Completado con errores/i)).toBeVisible();
    await page.getByRole('button', { name: /MT101_QA_SEED/ }).click();
    await expect(page.getByText(fragmentSetId).first()).toBeVisible({ timeout: 20_000 });

    await gotoAuthenticated(page, '/#/audit/spool');
    await expect(page.getByText('qa-audit-mt101-spool-dead')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('QA seed dead-letter')).toBeVisible();

    await gotoAuthenticated(page, `/#/audit/record-lineage?sourceFileHash=${hash}&recordNumber=2&processExecutionId=501`);
    await expect(page.getByText('INGESTED')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('QA20B').first()).toBeVisible();
    await expect(page.getByText('Currency XXX no permitida')).toBeVisible();

    await gotoAuthenticated(page, `/#/audit/mt101-fragments?sourceFileHash=${hash}&recordNumber=2&fragmentSetId=${fragmentSetId}`);
    await expect(page.getByText(fragmentSetId)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('QA20B').first()).toBeVisible();
    await expect(page.getByText('Currency XXX no permitida')).toBeVisible();

    await gotoAuthenticated(page, `/#/audit/mt101-quarantine?fragmentSetId=${fragmentSetId}`);
    await expect(page.getByText('QA.CURRENCY')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Moneda XXX rechazada para evidencia visual')).toBeVisible();

    await gotoAuthenticated(page, '/#/audit/mt101-pay-dispatch');
    await expect(page.getByText('QA-AUDIT-MT101-001:QA20A').or(page.getByText('QA20A'))).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Timeout posterior al envio')).toBeVisible();

    await gotoAuthenticated(page, '/#/audit/mt101-pay-conflicts');
    await expect(page.getByText('QA20A').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Banco confirmo REJECTED pero worker dejo SENT')).toBeVisible();
  });
});

async function mockAuditAndProcessData(page: Page): Promise<void> {
  const json = (body: unknown) => ({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });

  await page.route('**/api/system/theme', (route) => route.fulfill(json({ mode: 'system' })));
  await page.route('**/api/query/process-definitions**', (route) => route.fulfill(json({ total: 0, items: [] })));
  await page.route('**/api/source-definitions', (route) => route.fulfill(json([])));
  await page.route('**/api/reader-definitions', (route) => route.fulfill(json([])));
  await page.route('**/api/connection-definitions', (route) => route.fulfill(json([])));
  await page.route('**/api/task-types', (route) =>
    route.fulfill(json({
      taskTypes: [
        { type: 'FILE_READ', origin: 'BUILTIN', status: 'AVAILABLE', asyncOffload: 'UNSUPPORTED' },
        { type: 'REST_CALL', origin: 'BUILTIN', status: 'AVAILABLE', asyncOffload: 'SUPPORTED' },
        {
          type: 'DEMO_TRANSFORM_NODE',
          origin: 'REMOTE',
          status: 'AVAILABLE',
          pluginId: 'demo-remote-node',
          pluginVersion: '1.0.0',
          transport: 'GRPC',
          asyncOffload: 'UNSUPPORTED',
        },
        {
          type: 'DEMO_TRANSFORM_PY',
          origin: 'REMOTE',
          status: 'UNTRUSTED',
          reason: 'Descriptor signature is not trusted',
          pluginId: 'demo-remote-python',
          pluginVersion: '1.0.0',
          transport: 'GRPC',
          asyncOffload: 'UNSUPPORTED',
        },
      ],
    }))
  );

  await page.route('**/api/query/audit-events**', (route) =>
    route.fulfill(json({
      total: 1,
      eventTypeOptions: ['MT101_QA_SEED'],
      items: [{
        id: 9001,
        processExecutionId: 501,
        processDefinitionId: 77,
        sourceExecutionId: null,
        triggerSource: 'QA_SEED',
        taskDefinitionId: 88,
        taskType: 'MT101_BUILD_FROM_TABLE',
        eventType: 'MT101_QA_SEED',
        status: 'COMPLETED_WITH_ERRORS',
        message: `Lote ${fragmentSetId} listo para audit/*`,
        payloadJson: JSON.stringify({ fragmentSetId, records: 2, failed: 1, payConflicts: 2 }),
        createdAt: now,
        processedFiles: [],
      }],
    }))
  );

  await page.route('**/api/query/audit-spool/summary', (route) =>
    route.fulfill(json({ pending: 1, inFlight: 0, sent: 250, dead: 1, oldestPendingCreatedAt: now }))
  );
  await page.route('**/api/query/audit-spool/dead**', (route) =>
    route.fulfill(json([{
      id: 8001,
      eventId: 'qa-audit-mt101-spool-dead',
      traceId: 'qa-trace-mt101-001',
      topic: 'audit-events',
      partitionKey: fragmentSetId,
      spoolStatus: 'DEAD',
      attempts: 20,
      lastError: 'Simulated poison message for audit spool screen',
      createdAt: now,
      sentAt: null,
      lockedBy: null,
      lockedAt: null,
      nextAttemptAt: now,
      deadAt: now,
      deadReason: 'QA seed dead-letter',
    }]))
  );

  await page.route('**/api/query/record-lineage**', (route) =>
    route.fulfill(json(lineageRows()))
  );
  await page.route('**/api/query/mt101-fragments/source-row**', (route) =>
    route.fulfill(json([fragmentLink('QA20B', 'REJECTED', 'Currency XXX no permitida')]))
  );
  await page.route('**/api/query/mt101-fragments/by-physical-line**', (route) =>
    route.fulfill(json([physicalLineMatch()]))
  );
  await page.route('**/api/query/mt101-fragments/by-sheet-row**', (route) =>
    route.fulfill(json([physicalLineMatch()]))
  );
  await page.route('**/api/query/mt101-fragments/summary**', (route) =>
    route.fulfill(json({ fragmentSetId, total: 2, byStatus: { SENT: 1, REJECTED: 1 }, conflicts: 2 }))
  );
  await page.route('**/api/query/mt101-fragments/pay-conflicts/open**', (route) =>
    route.fulfill(json({
      items: [{
        source: 'NORMAL',
        fragmentSetId,
        processExecutionId: 501,
        sendersReference: 'QA20A',
        status: 'SENT',
        reason: 'Banco confirmo REJECTED pero worker dejo SENT',
        updatedAt: now,
        rebuildRunId: null,
        id: 7001,
      }],
      nextCursor: null,
    }))
  );
  await page.route('**/api/query/mt101-fragments/pay-conflicts/confirmations**', (route) =>
    route.fulfill(json([{ confirmationType: 'STATUS', gatewayReference: 'GW-QA-REJ-001', confirmedStatus: 'REJECTED', receivedAt: now }]))
  );
  await page.route(/\/api\/query\/mt101-fragments\/pay-conflicts(?:\?|$)/, (route) =>
    route.fulfill(json([{ sendersReference: 'QA20A', status: 'SENT', reason: 'Banco confirmo REJECTED pero worker dejo SENT', updatedAt: now }]))
  );
  await page.route('**/api/query/mt101-fragments/row-timeline**', (route) =>
    route.fulfill(json([
      { stage: 'INGESTED', status: 'COMPLETED', detail: 'qa-mt101-seed.csv #2', eventTs: now },
      { stage: 'VALIDATED', status: 'FAILED', detail: 'Currency XXX no permitida', eventTs: now },
    ]))
  );

  await page.route('**/api/query/mt101-quarantine/lote**', (route) =>
    route.fulfill(json({
      fragmentSetId,
      processExecutionId: 501,
      sourceFileName: 'qa-mt101-seed.csv',
      sourceFileHash: hash,
      rowCount: 2,
      totalFragments: 2,
      byStatus: { SENT: 1, REJECTED: 1 },
    }))
  );
  await page.route(/\/api\/query\/mt101-quarantine\/rebuild-runs(?:\?|$)/, (route) =>
    route.fulfill(json([{
      rebuildRunId: 'QA-REBUILD-001',
      originalFragmentSetId: fragmentSetId,
      correctiveSetId: 'QA-AUDIT-MT101-CORR-001',
      status: 'EXECUTED',
      selectedRows: 1,
      affectedFragments: 1,
      connectionRef: null,
      payStatus: 'UNCERTAIN',
      payRequestedBy: 'qa-maker',
      payApprovedBy: 'qa-checker',
    }]))
  );
  await page.route(/\/api\/query\/mt101-quarantine(?:\?|$)/, (route) =>
    route.fulfill(json([{
      id: 6001,
      fragmentSetId,
      sendersReference: 'QA20B',
      transactionReference: 'QA21B',
      sourceFileHash: hash,
      sourceRecordNumber: 2,
      stagingId: 9002,
      sourceTaskDefinitionId: 11,
      sourceName: 'qa-mt101-seed.csv',
      ruleCode: 'QA.CURRENCY',
      ruleSet: 'QA_MT101',
      severity: 'E',
      message: 'Moneda XXX rechazada para evidencia visual',
      status: 'QUARANTINED',
      createdAt: now,
      resolvedAt: null,
    }]))
  );
  await page.route('**/api/query/mt101-pay-dispatch-intents/summary', (route) =>
    route.fulfill(json({ total: 1, byStatus: { UNCERTAIN: 1 }, stuck: 1 }))
  );
  await page.route('**/api/query/mt101-pay-dispatch-intents/stuck**', (route) =>
    route.fulfill(json([{
      dispatchKey: `${fragmentSetId}:QA20A`,
      processExecutionId: 501,
      sendersReference: 'QA20A',
      status: 'UNCERTAIN',
      gatewayReference: 'GW-QA-REJ-001',
      attempts: 2,
      errorMessage: 'Timeout posterior al envio',
      createdAt: now,
      updatedAt: now,
    }]))
  );

}

function fragmentLink(sendersReference: string, status: string, errorMessage: string | null) {
  return {
    fragmentSetId,
    processExecutionId: 501,
    taskDefinitionId: 88,
    sourceTable: 'staging_record',
    stagingIdFrom: 9002,
    stagingIdTo: 9002,
    sourceRecordFrom: 2,
    sourceRecordTo: 2,
    sourceFileHash: hash,
    fragmentIndex: 2,
    fragmentTotal: 2,
    sendersReference,
    status,
    errorMessage,
    createdAt: now,
    updatedAt: now,
  };
}

function physicalLineMatch() {
  return {
    stagingId: 9002,
    recordIndex: 1,
    physicalLine: 43,
    sourceFileHash: hash,
    processExecutionId: 501,
    sheetName: 'Pagos',
    sheetRow: 8,
    quarantineRuleCode: 'QA.CURRENCY',
    quarantineMessage: 'Moneda XXX rechazada para evidencia visual',
    quarantineStatus: 'QUARANTINED',
    sendersReference: 'QA20B',
    transactionReference: 'QA21B',
  };
}

function lineageRows() {
  return [
    {
      recordId: 'qa-mt101-seed.csv:2',
      traceId: 'qa-trace-mt101-001',
      stage: 'INGESTED',
      status: 'COMPLETED',
      processExecutionId: 501,
      taskDefinitionId: 11,
      message: 'CSV/TXT/Excel source row captured',
      payloadJson: '{}',
      standard: 'SWIFT',
      messageType: 'MT101',
      sourceFileName: 'qa-mt101-seed.csv',
      sourceFileHash: hash,
      recordNumber: 2,
      businessKey: 'QA20B',
      businessKeyHash: null,
      paymentReference: 'QA20B',
      transactionReference: 'QA21B',
      uetr: null,
      archiveId: null,
      gatewayReference: null,
      eventTs: now,
    },
    {
      recordId: 'qa-mt101-seed.csv:2',
      traceId: 'qa-trace-mt101-001',
      stage: 'VALIDATED',
      status: 'FAILED',
      processExecutionId: 501,
      taskDefinitionId: 88,
      message: 'Currency XXX no permitida',
      payloadJson: '{}',
      standard: 'SWIFT',
      messageType: 'MT101',
      sourceFileName: 'qa-mt101-seed.csv',
      sourceFileHash: hash,
      recordNumber: 2,
      businessKey: 'QA20B',
      businessKeyHash: null,
      paymentReference: 'QA20B',
      transactionReference: 'QA21B',
      uetr: null,
      archiveId: null,
      gatewayReference: 'GW-QA-REJ-001',
      eventTs: now,
    },
  ];
}

async function gotoAuthenticated(page: Page, path: string): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    try {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      break;
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('ERR_ABORTED')) {
        break;
      }
      if (!/ERR_EMPTY_RESPONSE|ERR_CONNECTION_REFUSED|ERR_CONNECTION_RESET|Timeout/i.test(message) || attempt >= 3) {
        throw error;
      }
    }
  }

  const appShellVisible = await page
    .locator('a[href="#/processes"], a[href="#/audit"]')
    .first()
    .waitFor({ state: 'visible', timeout: 2_000 })
    .then(() => true)
    .catch(() => false);

  const username = page.locator('input[name="username"], input#username').first();
  const loginVisible = appShellVisible
    ? false
    : await username.waitFor({ state: 'visible', timeout: 20_000 }).then(() => true).catch(() => false);

  if (loginVisible) {
    await username.fill(credentials.username);
    await page.locator('input[name="password"], input#password').first().fill(credentials.password);
    await Promise.all([
      page.waitForURL(/#\//, { timeout: 30_000 }),
      page.locator('button[type="submit"], input[type="submit"]').first().click(),
    ]);
  }

  await page.locator('a[href="#/processes"], a[href="#/audit"]').first().waitFor({ state: 'visible', timeout: 20_000 }).catch(() => undefined);
}
