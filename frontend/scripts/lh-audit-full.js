const { chromium } = require('playwright');
const fs = require('fs');

const ROUTES = [
  { name: 'overview', hash: '#/overview' },
  { name: 'connections', hash: '#/connections' },
  { name: 'sources', hash: '#/sources' },
  { name: 'readers', hash: '#/readers' },
  { name: 'processes', hash: '#/processes' },
  { name: 'schedules', hash: '#/schedules' },
  { name: 'executions', hash: '#/executions' },
  { name: 'audit', hash: '#/audit' },
  { name: 'audit-spool', hash: '#/audit/spool' },
  { name: 'record-lineage', hash: '#/audit/record-lineage' },
  { name: 'mt101-quarantine', hash: '#/audit/mt101-quarantine' },
  { name: 'mt101-fragments', hash: '#/audit/mt101-fragments' },
  { name: 'payment-rules', hash: '#/payment-rules' },
];

(async () => {
  const shotDir = 'C:\\chatgtp\\quarkus\\lighthouse-report\\screenshots';
  if (!fs.existsSync(shotDir)) fs.mkdirSync(shotDir, { recursive: true });

  console.log('=== Authenticating ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(`${msg.text()}`); });
  page.on('pageerror', err => { errors.push(`PAGE_ERROR: ${err.message}`); });

  await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('#username', { timeout: 15000 });
  await page.fill('#username', 'admin');
  await page.fill('#password', 'admin123');
  await page.click('#kc-login');
  await page.waitForURL('**/localhost:8080/**', { timeout: 15000 });
  await page.waitForTimeout(3000);
  console.log('Logged in. URL:', page.url());

  const metrics = [];

  for (const route of ROUTES) {
    console.log(`\n=== ${route.name} ===`);
    const url = `http://localhost:8080/${route.hash}`;
    const routeErrors = [];

    page.removeAllListeners('console');
    page.removeAllListeners('pageerror');
    page.on('console', msg => { if (msg.type() === 'error') routeErrors.push(msg.text()); });
    page.on('pageerror', err => { routeErrors.push(`PAGE_ERROR: ${err.message}`); });

    const start = Date.now();
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    } catch (e) {
      console.log('  Nav timeout, continuing...');
    }
    const navTime = Date.now() - start;
    await page.waitForTimeout(1500);

    await page.screenshot({ path: `${shotDir}\\${route.name}.png`, fullPage: false });

    const perf = await page.evaluate(() => {
      const entries = performance.getEntriesByType('navigation');
      const nav = entries[0] || {};
      const resources = performance.getEntriesByType('resource');
      const totalTransfer = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
      const domElements = document.querySelectorAll('*').length;
      const mainThread = performance.now();
      return {
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
        loadComplete: Math.round(nav.loadEventEnd || 0),
        domSize: domElements,
        resourceCount: resources.length,
        totalTransferKB: Math.round(totalTransfer / 1024),
      };
    });

    const a11y = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      const buttonsWithoutAria = Array.from(buttons).filter(b => !b.getAttribute('aria-label') && !b.textContent.trim() && !b.querySelector('svg')).length;
      const inputs = document.querySelectorAll('input, select, textarea');
      const inputsWithoutLabel = Array.from(inputs).filter(i => {
        if (i.type === 'hidden' || i.type === 'checkbox' || i.type === 'radio') return false;
        const id = i.id;
        const hasLabel = id ? document.querySelector(`label[for="${id}"]`) : null;
        const hasAriaLabel = i.getAttribute('aria-label') || i.getAttribute('aria-labelledby');
        const parent = i.closest('mat-form-field');
        const hasMatLabel = parent ? parent.querySelector('mat-label') : null;
        return !hasLabel && !hasAriaLabel && !hasMatLabel;
      }).length;
      const images = document.querySelectorAll('img');
      const imgsWithoutAlt = Array.from(images).filter(i => !i.getAttribute('alt')).length;
      const hasMainLandmark = document.querySelector('main, [role="main"], [role="region"]') !== null;
      const hasLang = document.documentElement.getAttribute('lang') !== null;
      const focusable = document.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])').length;
      const ariaLiveRegions = document.querySelectorAll('[aria-live], [role="status"], [role="alert"]').length;
      const dialogElements = document.querySelectorAll('[role="dialog"], [aria-modal="true"]').length;
      const tableRows = document.querySelectorAll('tr, [role="row"]').length;
      const matChips = document.querySelectorAll('mat-chip, .mat-chip').length;
      return {
        totalButtons: buttons.length,
        buttonsWithoutAria,
        totalInputs: inputs.length,
        inputsWithoutLabel,
        totalImages: images.length,
        imgsWithoutAlt,
        hasMainLandmark,
        hasLang,
        focusableElements: focusable,
        ariaLiveRegions,
        dialogElements,
        tableRows,
        matChips,
      };
    });

    const title = await page.title();
    const finalUrl = page.url();

    metrics.push({
      route: route.name,
      url: finalUrl,
      title,
      navTimeMs: navTime,
      consoleErrors: routeErrors.length,
      consoleErrorSamples: routeErrors.slice(0, 3),
      ...perf,
      ...a11y,
    });

    console.log(`  URL: ${finalUrl}`);
    console.log(`  Title: ${title}`);
    console.log(`  Nav: ${navTime}ms  DOM: ${perf.domSize}  Res: ${perf.resourceCount}  Transfer: ${perf.totalTransferKB}KB`);
    console.log(`  Buttons: ${a11y.totalButtons} (sin aria: ${a11y.buttonsWithoutAria})  Inputs: ${a11y.totalInputs} (sin label: ${a11y.inputsWithoutLabel})  Focusable: ${a11y.focusableElements}`);
    console.log(`  ARIA live: ${a11y.ariaLiveRegions}  Dialogs: ${a11y.dialogElements}  Table rows: ${a11y.tableRows}  Chips: ${a11y.matChips}`);
    if (routeErrors.length > 0) {
      console.log(`  CONSOLE ERRORS (${routeErrors.length}):`);
      routeErrors.slice(0, 3).forEach(e => console.log(`    - ${e.substring(0, 120)}`));
    } else {
      console.log(`  Console errors: 0`);
    }
  }

  fs.writeFileSync(`${shotDir}\\metrics.json`, JSON.stringify(metrics, null, 2));

  console.log('\n=== FINAL SUMMARY ===');
  console.log('Route'.padEnd(18) + 'Nav'.padStart(6) + 'DOM'.padStart(7) + 'Res'.padStart(5) + 'KB'.padStart(7) + 'Btns'.padStart(5) + 'Inpt'.padStart(5) + 'Focs'.padStart(5) + 'Live'.padStart(5) + 'Errs'.padStart(5));
  console.log('-'.repeat(72));
  for (const m of metrics) {
    console.log(
      m.route.padEnd(18) +
      String(m.navTimeMs).padStart(6) +
      String(m.domSize).padStart(7) +
      String(m.resourceCount).padStart(5) +
      String(m.totalTransferKB).padStart(7) +
      String(m.totalButtons).padStart(5) +
      String(m.totalInputs).padStart(5) +
      String(m.focusableElements).padStart(5) +
      String(m.ariaLiveRegions).padStart(5) +
      String(m.consoleErrors).padStart(5)
    );
  }

  console.log('\n=== A11Y ISSUES ===');
  let totalA11yIssues = 0;
  for (const m of metrics) {
    const issues = [];
    if (m.buttonsWithoutAria > 0) issues.push(`${m.buttonsWithoutAria} buttons without aria-label`);
    if (m.inputsWithoutLabel > 0) issues.push(`${m.inputsWithoutLabel} inputs without label`);
    if (m.imgsWithoutAlt > 0) issues.push(`${m.imgsWithoutAlt} images without alt`);
    if (!m.hasLang) issues.push('missing <html lang>');
    if (!m.hasMainLandmark) issues.push('no main landmark');
    if (issues.length > 0) {
      console.log(`  ${m.route}: ${issues.join(', ')}`);
      totalA11yIssues += issues.length;
    }
  }
  if (totalA11yIssues === 0) {
    console.log('  (none)');
  }

  await browser.close();
  console.log('\nScreenshots:', shotDir);
  console.log('Metrics:', `${shotDir}\\metrics.json`);
})().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
