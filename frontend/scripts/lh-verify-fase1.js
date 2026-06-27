const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('=== Authenticating ===');
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('#username', { timeout: 15000 });
  await page.fill('#username', 'admin');
  await page.fill('#password', 'admin123');
  await page.click('#kc-login');
  await page.waitForURL('**/localhost:8080/**', { timeout: 15000 });
  await page.waitForTimeout(3000);

  // P0.2 — meta description
  const metaDesc = await page.getAttribute('meta[name="description"]', 'content');
  console.log('\n=== P0.2 — Meta description ===');
  console.log(metaDesc ? `PASS: "${metaDesc.substring(0, 80)}..."` : 'FAIL: no meta description');

  // P0.1 — dynamic title
  const title = await page.title();
  console.log('\n=== P0.1 — Dynamic <title> ===');
  console.log(`Title: "${title}"`);
  console.log(title !== 'web' ? 'PASS: title is dynamic' : 'FAIL: still "web"');

  // Navigate to audit to check title change
  await page.goto('http://localhost:8080/#/audit', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  const auditTitle = await page.title();
  console.log(`Audit title: "${auditTitle}"`);

  // P0.4 — Refresh button in audit
  const refreshBtn = await page.locator('button:has-text("Actualizar"), button:has-text("Refresh")').count();
  console.log('\n=== P0.4 — Refresh button in audit ===');
  console.log(refreshBtn > 0 ? `PASS: refresh button found (${refreshBtn})` : 'FAIL: no refresh button');

  // P0.3 — Loading indicator in audit
  // We can't easily trigger loading, but we can check if mat-progress-bar is in the DOM template
  const progressBar = await page.locator('mat-progress-bar').count();
  console.log('\n=== P0.3 — Loading indicator in audit ===');
  console.log(`mat-progress-bar elements: ${progressBar} (may be 0 if not loading)`);

  // P0.5 — Paginator hidden when empty
  await page.goto('http://localhost:8080/#/payment-rules', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  const paginatorCount = await page.locator('mat-paginator').count();
  const rowCount = await page.locator('tr.mat-row').count();
  console.log('\n=== P0.5 — Paginator hidden when empty ===');
  console.log(`Rows: ${rowCount}, Paginators: ${paginatorCount}`);
  if (rowCount === 0 && paginatorCount === 0) {
    console.log('PASS: paginator hidden when no data');
  } else if (rowCount > 0 && paginatorCount > 0) {
    console.log('PASS: paginator visible when data exists');
  } else {
    console.log('WARN: unexpected state');
  }

  // Screenshot audit page with refresh button
  await page.goto('http://localhost:8080/#/audit', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'C:\\chatgtp\\quarkus\\lighthouse-report\\screenshots\\audit-fase1.png', fullPage: false });
  console.log('\nScreenshot saved: audit-fase1.png');

  await browser.close();
  console.log('\nDone.');
})().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
