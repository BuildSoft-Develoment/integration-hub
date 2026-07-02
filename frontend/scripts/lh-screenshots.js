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
  { name: 'audit-record-lineage', hash: '#/audit/record-lineage' },
  { name: 'audit-spool', hash: '#/audit/spool' },
  { name: 'audit-mt101-fragments', hash: '#/audit/mt101-fragments' },
  { name: 'audit-mt101-quarantine', hash: '#/audit/mt101-quarantine' },
  { name: 'payment-rules', hash: '#/payment-rules' },
];

async function assertAppShell(page, routeName) {
  const title = await page.locator('h1').first().textContent({ timeout: 1000 }).catch(() => '');
  if ((title || '').includes('Error restarting Quarkus')) {
    throw new Error(`Quarkus dev error page detected before collecting "${routeName}" evidence.`);
  }
  await page.waitForSelector('ih-app-layout, .shell-layout', { timeout: 15000 });
}

(async () => {
  const shotDir = 'C:\\chatgtp\\quarkus\\lighthouse-report\\screenshots';
  if (!fs.existsSync(shotDir)) fs.mkdirSync(shotDir, { recursive: true });

  console.log('=== Authenticating ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:8080', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page
    .waitForSelector('#username, ih-app-layout, .shell-layout', { timeout: 15000 })
    .catch(() => undefined);
  const loginForm = page.locator('#username');
  if (await loginForm.count()) {
    await loginForm.fill('admin');
    await page.fill('#password', 'admin123');
    await page.click('#kc-login');
    await page.waitForURL('**/localhost:8080/**', { timeout: 15000 });
  } else {
    console.log('Login form not shown; continuing with current session.');
  }
  await assertAppShell(page, 'bootstrap');
  await page.waitForTimeout(3000);
  console.log('Logged in. URL:', page.url());

  const metrics = [];
  let currentRoute = 'bootstrap';
  const consoleErrorsByRoute = new Map();
  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    const errors = consoleErrorsByRoute.get(currentRoute) || [];
    errors.push(msg.text());
    consoleErrorsByRoute.set(currentRoute, errors);
  });

  for (const route of ROUTES) {
    console.log(`\n=== ${route.name} ===`);
    const url = `http://localhost:8080/${route.hash}`;
    currentRoute = route.name;
    consoleErrorsByRoute.set(route.name, []);
    
    const start = Date.now();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await assertAppShell(page, route.name);
    const navTime = Date.now() - start;
    
    await page.waitForTimeout(1500);

    // Take screenshot
    await page.screenshot({ path: `${shotDir}\\${route.name}.png`, fullPage: false });
    
    // Collect performance metrics from the page
    const perf = await page.evaluate(() => {
      const entries = performance.getEntriesByType('navigation');
      const nav = entries[0] || {};
      const resources = performance.getEntriesByType('resource');
      const totalTransfer = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
      const domElements = document.querySelectorAll('*').length;
      return {
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
        loadComplete: Math.round(nav.loadEventEnd || 0),
        domSize: domElements,
        resourceCount: resources.length,
        totalTransferKB: Math.round(totalTransfer / 1024),
      };
    });

    // Check for console errors
    const errors = consoleErrorsByRoute.get(route.name) || [];

    // Check a11y basics
    const a11y = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      const buttonsWithoutAria = Array.from(buttons).filter(b => !b.getAttribute('aria-label') && !b.getAttribute('aria-labelledby') && !b.textContent.trim()).length;
      const images = document.querySelectorAll('img');
      const imgsWithoutAlt = Array.from(images).filter(i => !i.getAttribute('alt')).length;
      const hasMainLandmark = document.querySelector('main, [role="main"]') !== null;
      const hasLang = document.documentElement.getAttribute('lang') !== null;
      const focusable = document.querySelectorAll('button, a, input, select, textarea, [tabindex]').length;
      return {
        totalButtons: buttons.length,
        buttonsWithoutAria,
        totalImages: images.length,
        imgsWithoutAlt,
        hasMainLandmark,
        hasLang,
        focusableElements: focusable,
      };
    });

    metrics.push({
      route: route.name,
      navTimeMs: navTime,
      ...perf,
      consoleErrors: errors.length,
      ...a11y,
    });

    console.log(`  Nav: ${navTime}ms  DOM: ${perf.domSize} elements  Resources: ${perf.resourceCount}  Transfer: ${perf.totalTransferKB}KB  Buttons: ${a11y.totalButtons}  Focusable: ${a11y.focusableElements}`);
  }

  fs.writeFileSync(`${shotDir}\\metrics.json`, JSON.stringify(metrics, null, 2));

  console.log('\n=== METRICS SUMMARY ===');
  console.log('Route'.padEnd(16) + 'Nav'.padStart(8) + 'DOM'.padStart(8) + 'Res'.padStart(6) + 'KB'.padStart(8) + 'Btns'.padStart(6) + 'Focus'.padStart(6) + 'Errors'.padStart(8));
  console.log('-'.repeat(64));
  for (const m of metrics) {
    console.log(
      m.route.padEnd(16) +
      String(m.navTimeMs).padStart(8) +
      String(m.domSize).padStart(8) +
      String(m.resourceCount).padStart(6) +
      String(m.totalTransferKB).padStart(8) +
      String(m.totalButtons).padStart(6) +
      String(m.focusableElements).padStart(6) +
      String(m.consoleErrors).padStart(8)
    );
  }

  await browser.close();
  console.log('\nScreenshots saved to:', shotDir);
})().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
