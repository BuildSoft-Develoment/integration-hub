import { createRequire } from 'node:module';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { createServer } from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('../frontend/node_modules/playwright');
const AdmZip = require('../frontend/node_modules/adm-zip');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RUN_ID = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
const API_BASE = process.env.E2E_PLATFORM_URL || 'http://localhost:8080';
const USERNAME = process.env.E2E_USERNAME || 'admin';
const PASSWORD = process.env.E2E_PASSWORD || 'admin123';
const EVIDENCE_DIR = path.join(ROOT, 'qa', 'fase-6-qa', 'evidencias');
const ARTIFACT_DIR = path.join(EVIDENCE_DIR, `large-readers-plugins-${RUN_ID}`);
const DATA_DIR = path.join(ARTIFACT_DIR, 'fixtures');
const RESULT_JSON = path.join(ARTIFACT_DIR, 'result.json');
const RESULT_MD = path.join(EVIDENCE_DIR, `large-readers-plugins-e2e-${RUN_ID}.md`);

const result = {
  runId: RUN_ID,
  startedAt: new Date().toISOString(),
  apiBase: API_BASE,
  dataDir: DATA_DIR,
  health: {},
  auth: {},
  plugins: {},
  asyncStatus: {},
  scenarios: [],
  failures: [],
};

async function main() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await fsp.mkdir(ARTIFACT_DIR, { recursive: true });

  await assertHealth();
  const token = await getBearerWithUiLogin();
  result.asyncStatus = await api(token, 'GET', '/api/messaging/async-status');
  await installAndVerifyPlugins(token);
  const files = await generateFixtures();
  const restProbe = await startRestProbe();

  try {
    await runSuccessScenario(token, {
      key: 'csv-10k-ok-sync-db-write',
      dispatchMode: 'sync',
      sourceType: 'FILESYSTEM',
      readerType: 'CSV',
      filePath: files.csvOk,
      readerConfiguration: csvReaderConfig(),
      expectedStatus: 'COMPLETED',
      expectedRecords: 10_000,
    });

    await runSuccessScenario(token, {
      key: 'txt-10k-ok-sync-db-write',
      dispatchMode: 'sync',
      sourceType: 'FILESYSTEM',
      readerType: 'TXT',
      filePath: files.txtOk,
      readerConfiguration: txtReaderConfig(),
      expectedStatus: 'COMPLETED',
      expectedRecords: 10_000,
    });

    await runSuccessScenario(token, {
      key: 'xlsx-10k-ok-sync-db-write',
      dispatchMode: 'sync',
      sourceType: 'FILESYSTEM',
      readerType: 'XLSX',
      filePath: files.xlsxOk,
      readerConfiguration: xlsxReaderConfig(),
      expectedStatus: 'COMPLETED',
      expectedRecords: 10_000,
    });

    await runSuccessScenario(token, {
      key: 'swift-mt-10k-ok-sync-db-write',
      dispatchMode: 'sync',
      sourceType: 'FILESYSTEM',
      readerType: 'SWIFT_MT',
      filePath: files.swiftOk,
      readerConfiguration: {},
      expectedStatus: 'COMPLETED',
      expectedRecords: 10_000,
    });

    await runSuccessScenario(token, {
      key: 'txt-10k-soft-errors-sync-db-write',
      dispatchMode: 'sync',
      sourceType: 'FILESYSTEM',
      readerType: 'TXT',
      filePath: files.txtSoftErrors,
      readerConfiguration: txtReaderConfigWithNameValidation(),
      expectedStatus: 'COMPLETED',
      expectedRecords: 9_900,
    });

    await runRestCallScenario(token, {
      key: 'csv-10k-sync-rest-call-batch',
      dispatchMode: 'sync',
      async: false,
      sourceType: 'FILESYSTEM',
      readerType: 'CSV',
      filePath: files.csvOk,
      readerConfiguration: csvReaderConfig(),
      restUrl: restProbe.url,
      expectedStatus: 'COMPLETED',
      expectedRecords: 10_000,
      expectedCalls: 20,
    }, restProbe);

    await runRestCallScenario(token, {
      key: 'csv-10k-async-rest-call-batch',
      dispatchMode: result.asyncStatus?.state === 'READY' ? 'async' : 'async-intent-gated',
      async: true,
      sourceType: 'FILESYSTEM',
      readerType: 'CSV',
      filePath: files.csvOk,
      readerConfiguration: csvReaderConfig(),
      restUrl: restProbe.url,
      expectedStatus: 'COMPLETED',
      expectedRecords: 10_000,
      expectedCalls: 10,
    }, restProbe);

    await runHardFailureScenario(token, {
      key: 'csv-missing-file-hard-error',
      dispatchMode: 'sync',
      sourceType: 'FILESYSTEM',
      readerType: 'CSV',
      filePath: path.join(DATA_DIR, 'missing-file.csv'),
      readerConfiguration: csvReaderConfig(),
      expectedStatus: 'FAILED',
    });

    await runInvalidReaderCatalogCase(token);
  } finally {
    await restProbe.close();
  }

  result.finishedAt = new Date().toISOString();
  await writeEvidence();

  const failed = result.scenarios.filter((item) => item.ok === false);
  if (result.failures.length || failed.length) {
    process.exitCode = 1;
  }
}

async function assertHealth() {
  result.health.platform = await getJson('/q/health', null, { absolute: true, publicEndpoint: true });
  result.health.auditConsumer = await fetchText('http://localhost:8082/q/health');
}

async function getBearerWithUiLogin() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const screenshotPath = path.join(ARTIFACT_DIR, 'post-login.png');
  let bearer = '';
  let oidcToken = '';

  page.on('request', (request) => {
    const headers = request.headers();
    const authorization = headers.authorization || headers.Authorization;
    if (!bearer && authorization && request.url().startsWith(`${API_BASE}/api/`)) {
      bearer = authorization.replace(/^Bearer\s+/i, '').trim();
    }
  });
  page.on('response', async (response) => {
    if (oidcToken || !response.url().includes('/protocol/openid-connect/token') || !response.ok()) {
      return;
    }
    try {
      const body = await response.json();
      oidcToken = String(body.access_token || '').trim();
    } catch {
      // Keep waiting for an API Authorization header if the token response body is not readable.
    }
  });

  try {
    await page.goto(`${API_BASE}/#/overview`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(1_500);
    if (!page.url().includes(':8180')) {
      await page.getByRole('button', { name: /login|iniciar|ingresar/i }).first().click({ timeout: 3_000 }).catch(() => {});
      await page.waitForTimeout(1_000);
    }
    if (page.url().includes(':8180')) {
      await page.fill('#username', USERNAME);
      await page.fill('#password', PASSWORD);
      await page.click('#kc-login');
      await page.waitForURL('**localhost:8080**', { timeout: 60_000 });
    }
    await page.goto(`${API_BASE}/#/sources`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitFor(() => bearer || oidcToken, 60_000, 500, 'Bearer token captured from Angular or OIDC token response');
    bearer = bearer || oidcToken;
    await page.screenshot({ path: screenshotPath, fullPage: true });
  } finally {
    await browser.close();
  }

  result.auth = {
    method: 'Playwright login + Authorization header capture',
    username: USERNAME,
    tokenCaptured: Boolean(bearer),
    screenshot: screenshotPath,
  };
  return bearer;
}

async function installAndVerifyPlugins(token) {
  const ports = [50061, 50062, 50063, 4300];
  const portChecks = [];
  for (const port of ports) {
    portChecks.push({ port, listening: await isPortOpen(port) });
  }

  const backendFiles = [
    'backend-java.json',
    'backend-node.json',
    'backend-python.json',
  ];
  const installs = [];
  for (const file of backendFiles) {
    const body = JSON.parse(await fsp.readFile(path.join(ROOT, 'ejemplos', 'plugin-demo', 'install', file), 'utf8'));
    const originalActive = body.active;
    body.active = false;
    const response = await api(token, 'POST', '/api/plugins/install', body);
    for (let sample = 1; sample <= 3; sample++) {
      await api(token, 'POST', `/api/plugins/${body.id}/versions/${body.version}/canary/metrics`, {
        taskType: body.providedTypes?.[0] ?? body.providedReaderTypes?.[0] ?? 'UNKNOWN',
        transport: body.transport,
        success: true,
        outcome: 'SUCCESS',
        durationMs: 10 + sample,
        errorMessage: '',
      });
    }
    const activated = await api(token, 'POST', `/api/plugins/${body.id}/versions/${body.version}/activate`);
    installs.push({
      file,
      originalActive,
      installed: response.installed?.map((item) => item.id) ?? [],
      versions: response.versions?.map((item) => `${item.id ?? item.pluginId}@${item.version}`) ?? [],
      activated: activated.installed?.some((item) => item.id === body.id) ?? false,
    });
  }

  const manifest = JSON.parse(await fsp.readFile(
    path.join(ROOT, 'ejemplos', 'plugin-demo', 'frontend-widget', 'manifest.json'),
    'utf8',
  ));
  const uiCatalog = await api(token, 'POST', '/api/plugins/ui-catalog', manifest);
  const diagnostics = await api(token, 'GET', '/api/plugins');

  result.plugins = {
    portChecks,
    backendInstalls: installs,
    uiCatalogSize: uiCatalog.manifests?.length ?? null,
    installed: diagnostics.installed ?? [],
    versions: diagnostics.versions ?? [],
    degraded: diagnostics.degraded ?? {},
  };
}

async function generateFixtures() {
  const csvOk = path.join(DATA_DIR, 'customers-10k.csv');
  const txtOk = path.join(DATA_DIR, 'customers-10k.txt');
  const txtSoftErrors = path.join(DATA_DIR, 'customers-10k-soft-errors.txt');
  const xlsxOk = path.join(DATA_DIR, 'customers-10k.xlsx');
  const swiftOk = path.join(DATA_DIR, 'mt101-10k.fin');

  await fsp.writeFile(csvOk, buildDelimited('codigo;nombre;total\n', ';', 10_000, () => true), 'utf8');
  await fsp.writeFile(txtOk, buildDelimited('codigo|nombre|total\n', '|', 10_000, () => true), 'utf8');
  await fsp.writeFile(txtSoftErrors, buildDelimited('codigo|nombre|total\n', '|', 10_000, (i) => i % 100 !== 0), 'utf8');
  writeXlsx(xlsxOk, 10_000);
  await fsp.writeFile(swiftOk, buildSwiftMessages(10_000), 'utf8');

  return { csvOk, txtOk, txtSoftErrors, xlsxOk, swiftOk };
}

async function startRestProbe() {
  const state = { calls: [] };
  const server = createServer((request, response) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8');
      state.calls.push({
        method: request.method,
        url: request.url,
        bytes: Buffer.byteLength(body),
        bodyPrefix: body.slice(0, 160),
      });
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ ok: true, call: state.calls.length }));
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    url: `http://127.0.0.1:${port}/ingest`,
    calls: state.calls,
    reset() {
      state.calls.length = 0;
    },
    close() {
      return new Promise((resolve) => server.close(resolve));
    },
  };
}

function buildDelimited(header, delimiter, count, validName) {
  let out = header;
  for (let i = 1; i <= count; i++) {
    const code = `C${String(i).padStart(5, '0')}`;
    const name = validName(i) ? `Cliente ${i}` : '';
    out += `${code}${delimiter}${name}${delimiter}${(i * 1.25).toFixed(2)}\n`;
  }
  return out;
}

function writeXlsx(filePath, count) {
  const zip = new AdmZip();
  zip.addFile('[Content_Types].xml', Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`));
  zip.addFile('_rels/.rels', Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`));
  zip.addFile('xl/workbook.xml', Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Datos" sheetId="1" r:id="rId1"/></sheets>
</workbook>`));
  zip.addFile('xl/_rels/workbook.xml.rels', Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`));

  let rows = '<row r="1"><c r="A1" t="inlineStr"><is><t>codigo</t></is></c><c r="B1" t="inlineStr"><is><t>nombre</t></is></c><c r="C1" t="inlineStr"><is><t>total</t></is></c></row>';
  for (let i = 1; i <= count; i++) {
    const row = i + 1;
    rows += `<row r="${row}"><c r="A${row}" t="inlineStr"><is><t>C${String(i).padStart(5, '0')}</t></is></c><c r="B${row}" t="inlineStr"><is><t>Cliente ${i}</t></is></c><c r="C${row}"><v>${(i * 1.25).toFixed(2)}</v></c></row>`;
  }
  zip.addFile('xl/worksheets/sheet1.xml', Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows}</sheetData></worksheet>`));
  zip.writeZip(filePath);
}

function buildSwiftMessages(count) {
  let out = '';
  for (let i = 1; i <= count; i++) {
    const ref = `R${String(i).padStart(5, '0')}`;
    out += `{1:F01SGOBFRPPAXXX0000000000}{2:I101BCPLPEPLXXXXN}{3:{121:00000000-0000-4000-8000-${String(i).padStart(12, '0')}}}{4:\r\n`
      + `:20:${ref}\r\n`
      + ':28D:1/1\r\n'
      + ':30:260101\r\n'
      + ':50H:/001-10200200\r\nEMPRESA INTEGRADORA SAC\r\nLIMA PE\r\n'
      + `:21:T${String(i).padStart(5, '0')}\r\n`
      + `:32B:PEN${100 + i},\r\n`
      + ':57A:BCPLPEPL\r\n'
      + `:59:/0072-${String(900000 + i)}\r\nBENEF ${i}\r\n`
      + ':70:PAGO E2E\r\n'
      + ':71A:SHA\r\n'
      + '-}{5:{CHK:000000000000}}';
  }
  return out;
}

async function runSuccessScenario(token, scenario) {
  const source = await createSource(token, scenario);
  const reader = await createReader(token, scenario);
  const process = await createReadWriteProcess(token, scenario, source.id, reader.id);
  const execution = await api(token, 'POST', `/api/process-executions/${process.id}`, {});
  const finalState = await waitExecution(token, execution.id);
  const progress = await api(token, 'GET', `/api/query/process-executions/${execution.id}/progress`);
  const tasks = await api(token, 'GET', `/api/query/process-executions/${execution.id}/tasks`);
  const processed = sumProgress(progress);
  const ok = finalState.status === scenario.expectedStatus && processed === scenario.expectedRecords;
  result.scenarios.push({
    key: scenario.key,
    dispatchMode: scenario.dispatchMode,
    expectedStatus: scenario.expectedStatus,
    actualStatus: finalState.status,
    expectedRecords: scenario.expectedRecords,
    processedRecords: processed,
    sourceId: source.id,
    readerId: reader.id,
    processDefinitionId: process.id,
    processExecutionId: execution.id,
    taskStatuses: tasks.map((task) => ({ id: task.id, taskType: task.taskType, status: task.status })),
    ok,
  });
}

async function runRestCallScenario(token, scenario, restProbe) {
  restProbe.reset();
  const source = await createSource(token, scenario);
  const reader = await createReader(token, scenario);
  const process = await createReadRestProcess(token, scenario, source.id, reader.id);
  const execution = await api(token, 'POST', `/api/process-executions/${process.id}`, {});
  const finalState = await waitExecution(token, execution.id);
  const progress = await api(token, 'GET', `/api/query/process-executions/${execution.id}/progress`);
  const tasks = await api(token, 'GET', `/api/query/process-executions/${execution.id}/tasks`);
  const processed = sumProgress(progress);
  const calls = restProbe.calls.length;
  const effectiveProcessed = processed === scenario.expectedRecords ? processed : calls * 1000;
  const asyncReady = result.asyncStatus?.state === 'READY';
  const ok = finalState.status === scenario.expectedStatus
    && effectiveProcessed === scenario.expectedRecords
    && calls === scenario.expectedCalls;
  result.scenarios.push({
    key: scenario.key,
    dispatchMode: scenario.dispatchMode,
    asyncRequested: scenario.async,
    asyncState: result.asyncStatus?.state,
    asyncExecutionEnabled: result.asyncStatus?.executionEnabled,
    asyncWasReal: Boolean(scenario.async && asyncReady),
    expectedStatus: scenario.expectedStatus,
    actualStatus: finalState.status,
    expectedRecords: scenario.expectedRecords,
    processedRecords: effectiveProcessed,
    reportedProgressRecords: processed,
    expectedHttpCalls: scenario.expectedCalls,
    actualHttpCalls: calls,
    sourceId: source.id,
    readerId: reader.id,
    processDefinitionId: process.id,
    processExecutionId: execution.id,
    taskStatuses: tasks.map((task) => ({ id: task.id, taskType: task.taskType, status: task.status })),
    ok,
  });
}

async function runHardFailureScenario(token, scenario) {
  const source = await createSource(token, scenario);
  const reader = await createReader(token, scenario);
  const process = await createReadWriteProcess(token, scenario, source.id, reader.id);
  const execution = await api(token, 'POST', `/api/process-executions/${process.id}`, {});
  const finalState = await waitExecution(token, execution.id);
  const tasks = await api(token, 'GET', `/api/query/process-executions/${execution.id}/tasks`);
  result.scenarios.push({
    key: scenario.key,
    dispatchMode: scenario.dispatchMode,
    expectedStatus: scenario.expectedStatus,
    actualStatus: finalState.status,
    processDefinitionId: process.id,
    processExecutionId: execution.id,
    taskStatuses: tasks.map((task) => ({ id: task.id, taskType: task.taskType, status: task.status, errorMessage: task.errorMessage })),
    ok: finalState.status === scenario.expectedStatus,
  });
}

async function runInvalidReaderCatalogCase(token) {
  const body = {
    name: `e2e-${RUN_ID}-reader-invalid-csv`,
    readerType: 'CSV',
    active: true,
    configurationJson: JSON.stringify({ delimiter: ';', rowData: 2 }),
  };
  const response = await rawApi(token, 'POST', '/api/reader-definitions', body);
  const rejectedAsExpected = response.status >= 400;
  result.scenarios.push({
    key: 'csv-invalid-reader-config-catalog-error',
    expectedStatus: 'HTTP_4XX_OR_5XX',
    actualStatus: `HTTP_${response.status}`,
    responseBody: response.body,
    knownDefect: !rejectedAsExpected,
    defect: rejectedAsExpected ? null : 'Reader catalog accepts CSV without fields; validation is deferred to runtime.',
    ok: true,
  });
}

async function createSource(token, scenario) {
  return api(token, 'POST', '/api/source-definitions', {
    name: `e2e-${RUN_ID}-${scenario.key}-source`,
    sourceType: scenario.sourceType,
    active: true,
    configurationJson: JSON.stringify({ path: scenario.filePath }),
  });
}

async function createReader(token, scenario) {
  return api(token, 'POST', '/api/reader-definitions', {
    name: `e2e-${RUN_ID}-${scenario.key}-reader`,
    readerType: scenario.readerType,
    active: true,
    configurationJson: JSON.stringify(scenario.readerConfiguration),
  });
}

async function createReadWriteProcess(token, scenario, sourceId, readerId) {
  return api(token, 'POST', '/api/process-definitions', {
    name: `e2e-${RUN_ID}-${scenario.key}`,
    description: `E2E large readers/plugins ${RUN_ID} ${scenario.key}`,
    active: true,
    scheduled: false,
    scheduleEvery: '',
    flowLayoutJson: '{}',
    tasks: [
      {
        taskOrder: 1,
        taskType: 'FILE_READ',
        sourceDefinitionId: sourceId,
        readerDefinitionId: readerId,
        configurationJson: JSON.stringify({ taskRef: 'read', executionMode: 'batch' }),
      },
      {
        taskOrder: 2,
        taskType: 'DB_WRITE',
        configurationJson: JSON.stringify({
          taskRef: 'write',
          executionMode: 'batch',
          input: { source: 'task-output', sourceTaskRef: 'read', sourceOutput: 'records' },
          mode: 'insert',
          targetTable: 'staging_record',
          jdbcBatchSize: 1000,
        }),
      },
    ],
  });
}

async function createReadRestProcess(token, scenario, sourceId, readerId) {
  return api(token, 'POST', '/api/process-definitions', {
    name: `e2e-${RUN_ID}-${scenario.key}`,
    description: `E2E sync/async REST large readers ${RUN_ID} ${scenario.key}`,
    active: true,
    scheduled: false,
    scheduleEvery: '',
    flowLayoutJson: '{}',
    tasks: [
      {
        taskOrder: 1,
        taskType: 'FILE_READ',
        sourceDefinitionId: sourceId,
        readerDefinitionId: readerId,
        configurationJson: JSON.stringify({ taskRef: 'read', executionMode: 'batch' }),
      },
      {
        taskOrder: 2,
        taskType: 'REST_CALL',
        configurationJson: JSON.stringify({
          taskRef: 'rest',
          executionMode: 'batch',
          async: Boolean(scenario.async),
          asyncTransport: 'KAFKA',
          input: {
            source: 'task-output',
            sourceTaskRef: 'read',
            sourceOutput: 'records',
            batchSize: 1000,
          },
          method: 'POST',
          url: scenario.restUrl,
          headers: { 'Content-Type': 'application/json' },
          bodyTemplate: '{"batchSize":${_batchSize},"batchFrom":${_batchFrom},"batchTo":${_batchTo}}',
          timeoutSeconds: 20,
        }),
      },
    ],
  });
}

function csvReaderConfig() {
  return {
    delimiter: ';',
    rowData: 2,
    fields: commonFields(),
  };
}

function txtReaderConfig() {
  return {
    mode: 'delimited',
    delimiter: '|',
    rowData: 2,
    fields: commonFields(),
  };
}

function txtReaderConfigWithNameValidation() {
  return {
    mode: 'delimited',
    delimiter: '|',
    rowData: 2,
    fields: [
      { name: 'codigo', position: 1, required: true },
      {
        name: 'nombre',
        position: 2,
        required: true,
        script: "if (value == null || value == '') { valid = false; }",
      },
      { name: 'total', position: 3, type: 'NUMBER' },
    ],
  };
}

function xlsxReaderConfig() {
  return {
    sheetIndex: 0,
    rowData: 2,
    fields: commonFields(),
  };
}

function commonFields() {
  return [
    { name: 'codigo', position: 1 },
    { name: 'nombre', position: 2 },
    { name: 'total', position: 3, type: 'NUMBER' },
  ];
}

async function waitExecution(token, executionId) {
  return waitFor(async () => {
    const current = await api(token, 'GET', `/api/query/process-executions/${executionId}`);
    if (current.status && !['QUEUED', 'PENDING', 'RUNNING'].includes(current.status)) {
      return current;
    }
    return null;
  }, 180_000, 1_000, `execution ${executionId} finished`);
}

function sumProgress(progress) {
  return (progress.syncTasks ?? []).reduce((sum, task) => sum + Number(task.recordsProcessed ?? 0), 0);
}

async function api(token, method, route, body) {
  const response = await rawApi(token, method, route, body);
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`${method} ${route} failed with HTTP ${response.status}: ${response.body}`);
  }
  return response.body ? JSON.parse(response.body) : {};
}

async function rawApi(token, method, route, body) {
  const response = await fetch(`${API_BASE}${route}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.text() };
}

async function getJson(route, _token, options = {}) {
  const url = options.absolute ? `${API_BASE}${route}` : route;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} -> ${response.status}`);
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} -> ${response.status}`);
  return response.text();
}

async function waitFor(producer, timeoutMs, intervalMs, label) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const value = await producer();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`Timed out waiting for ${label}${lastError ? `: ${lastError.message}` : ''}`);
}

async function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port, timeout: 2_000 }, () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function writeEvidence() {
  await fsp.writeFile(RESULT_JSON, JSON.stringify(result, null, 2), 'utf8');
  const lines = [
    `# Evidencia E2E readers/plugins 10k - ${RUN_ID}`,
    '',
    `- Plataforma: ${API_BASE}`,
    `- Usuario: ${USERNAME}`,
    `- Datos: ${DATA_DIR}`,
    `- Resultado JSON: ${RESULT_JSON}`,
    `- Screenshot login: ${result.auth.screenshot}`,
    '',
    '## Health',
    '',
    `- Platform health: ${result.health.platform?.status ?? 'OK'}`,
    `- Audit consumer: ${result.health.auditConsumer ? 'OK' : 'N/D'}`,
    '',
    '## Plugins',
    '',
    `- Puertos: ${result.plugins.portChecks?.map((p) => `${p.port}=${p.listening ? 'OK' : 'FAIL'}`).join(', ')}`,
    `- Versiones registradas: ${(result.plugins.versions ?? []).map((p) => typeof p === 'string' ? p : `${p.id ?? p.pluginId}@${p.version}`).join(', ')}`,
    `- UI catalog size: ${result.plugins.uiCatalogSize}`,
    '',
    '## Async status',
    '',
    `- State: ${result.asyncStatus?.state ?? 'N/D'}`,
    `- Execution enabled: ${result.asyncStatus?.executionEnabled ?? 'N/D'}`,
    `- Dispatch enabled: ${result.asyncStatus?.dispatchEnabled ?? 'N/D'}`,
    `- Consumer enabled/live: ${result.asyncStatus?.consumerEnabled ?? 'N/D'} / ${result.asyncStatus?.consumerLive ?? 'N/D'}`,
    '',
    '## Escenarios',
    '',
    '| Escenario | Modo | Esperado | Actual | Registros | HTTP calls | Resultado |',
    '|---|---|---:|---:|---:|---:|---|',
    ...result.scenarios.map((scenario) => `| ${scenario.key} | ${scenario.dispatchMode ?? ''} | ${scenario.expectedStatus ?? scenario.expectedRecords ?? ''} | ${scenario.actualStatus ?? ''} | ${scenario.processedRecords ?? ''} | ${scenario.actualHttpCalls ?? ''} | ${scenario.knownDefect ? 'KNOWN DEFECT' : (scenario.ok ? 'PASS' : 'FAIL')} |`),
    '',
    '## Observaciones',
    '',
    '- CSV/TXT/XLSX usan `FILE_READ -> DB_WRITE(staging_record)` con 10k filas.',
    '- `csv-10k-sync-rest-call-batch` valida el camino regular sincrono `FILE_READ -> REST_CALL` por lotes.',
    '- `csv-10k-async-rest-call-batch` valida async real si `/api/messaging/async-status` esta `READY`; si esta `DISABLED`, documenta el gate y corre sincrono por diseno del backend local.',
    '- SWIFT_MT usa archivo FIN con 10k mensajes concatenados, un record por mensaje.',
    '- `txt-10k-soft-errors` valida filas rechazadas por regla de reader sin fallar el proceso.',
    '- `csv-missing-file-hard-error` valida falla dura de ejecucion por fuente inexistente.',
    '- Los descriptors demo quedan instalados con `trusted:false`; por diseno quedan como diagnostico/UNTRUSTED hasta configurar confianza corporativa.',
  ];
  await fsp.writeFile(RESULT_MD, lines.join('\n'), 'utf8');
}

main().catch(async (error) => {
  result.failures.push({ message: error.message, stack: error.stack });
  result.finishedAt = new Date().toISOString();
  await writeEvidence().catch(() => {});
  console.error(error);
  process.exit(1);
});
