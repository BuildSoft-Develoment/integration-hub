const { chromium } = require('playwright');
const { execSync } = require('child_process');
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
  { name: 'payment-rules', hash: '#/payment-rules' },
];

(async () => {
  const reportDir = 'C:\\chatgtp\\quarkus\\lighthouse-report';
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  // Step 1: Authenticate and get cookies
  console.log('=== Authenticating ===');
  const authBrowser = await chromium.launch({ headless: true });
  const authCtx = await authBrowser.newContext();
  const authPage = await authCtx.newPage();
  await authPage.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 30000 });
  await authPage.waitForSelector('#username', { timeout: 15000 });
  await authPage.fill('#username', 'admin');
  await authPage.fill('#password', 'admin123');
  await authPage.click('#kc-login');
  await authPage.waitForURL('**/localhost:8080/**', { timeout: 15000 });
  await authPage.waitForTimeout(2000);
  const cookies = await authCtx.cookies();
  await authBrowser.close();
  console.log('Logged in. Cookies:', cookies.length);

  const results = [];

  for (const route of ROUTES) {
    console.log(`\n=== Auditing: ${route.name} ===`);
    try {
      // For each route: launch Chrome with cookies injected, navigate, then run Lighthouse
      const browser = await chromium.launch({
        headless: true,
        args: ['--remote-debugging-port=0', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
      });
      
      // Get the actual debugging port
      const port = await new Promise((resolve) => {
        browser.on('targetcreated', () => {});
        // Read the port from the process
        const proc = browser._connection?._transport?._proc;
        if (proc) {
          // Alternative: parse stderr for DevTools listening
        }
        resolve(null);
      });

      // We need the port - let's use a fixed port approach
      await browser.close();

      // Use fixed port per route to avoid conflicts
      const debugPort = 9222 + results.length;
      const b2 = await chromium.launch({
        headless: true,
        args: [`--remote-debugging-port=${debugPort}`, '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
      });
      const ctx2 = await b2.newContext();
      await ctx2.addCookies(cookies);
      const page2 = await ctx2.newPage();
      
      const fullUrl = `http://localhost:8080/${route.hash}`;
      await page2.goto(fullUrl, { waitUntil: 'networkidle', timeout: 20000 });
      await page2.waitForTimeout(2000);
      console.log('  URL:', page2.url());

      // Run Lighthouse CLI
      const outputPath = `${reportDir}\\${route.name}`;
      const cmd = `npx lighthouse "${page2.url()}" --port=${debugPort} --preset=desktop --output=json --output=html --output-path="${outputPath}" --quiet --chrome-flags="--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage" --max-wait-for-load=45000`;
      
      try {
        execSync(cmd, { stdio: 'pipe', timeout: 90000, cwd: 'C:\\chatgtp\\quarkus\\frontend' });
      } catch (e) {
        // Lighthouse may exit non-zero
      }

      await b2.close();

      // Parse report
      const jsonPath = `${outputPath}.report.json`;
      if (fs.existsSync(jsonPath)) {
        const lhr = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        const scores = {
          route: route.name,
          performance: Math.round((lhr.categories?.performance?.score ?? 0) * 100),
          accessibility: Math.round((lhr.categories?.accessibility?.score ?? 0) * 100),
          bestPractices: Math.round((lhr.categories?.['best-practices']?.score ?? 0) * 100),
          seo: Math.round((lhr.categories?.seo?.score ?? 0) * 100),
          lcp: lhr.audits?.['largest-contentful-paint']?.displayValue || 'n/a',
          fcp: lhr.audits?.['first-contentful-paint']?.displayValue || 'n/a',
          cls: lhr.audits?.['cumulative-layout-shift']?.displayValue || 'n/a',
          tbt: lhr.audits?.['total-blocking-time']?.displayValue || 'n/a',
          speedIndex: lhr.audits?.['speed-index']?.displayValue || 'n/a',
          domSize: lhr.audits?.['dom-size']?.displayValue || 'n/a',
        };
        results.push(scores);
        console.log(`  Perf=${scores.performance}  A11y=${scores.accessibility}  BP=${scores.bestPractices}  SEO=${scores.seo}`);
        console.log(`  LCP=${scores.lcp}  FCP=${scores.fcp}  CLS=${scores.cls}  TBT=${scores.tbt}  SI=${scores.speedIndex}`);
        console.log(`  DOM=${scores.domSize}`);
      } else {
        console.log('  FAILED - no report');
        results.push({ route: route.name, performance: 'ERR', accessibility: 'ERR', bestPractices: 'ERR', seo: 'ERR', lcp: 'n/a', fcp: 'n/a', cls: 'n/a', tbt: 'n/a', speedIndex: 'n/a', domSize: 'n/a' });
      }
    } catch (err) {
      console.log(`  ERROR: ${err.message}`);
      results.push({ route: route.name, performance: 'ERR', accessibility: 'ERR', bestPractices: 'ERR', seo: 'ERR', lcp: 'n/a', fcp: 'n/a', cls: 'n/a', tbt: 'n/a', speedIndex: 'n/a', domSize: 'n/a' });
    }
  }

  fs.writeFileSync(`${reportDir}\\summary.json`, JSON.stringify(results, null, 2));

  console.log('\n=== FINAL SUMMARY ===');
  console.log('Route'.padEnd(18) + 'Perf'.padStart(6) + 'A11y'.padStart(6) + 'BP'.padStart(6) + 'SEO'.padStart(6) + '  LCP'.padStart(8) + '  FCP'.padStart(8) + '  CLS'.padStart(6) + '  TBT'.padStart(6));
  console.log('-'.repeat(70));
  for (const r of results) {
    console.log(
      r.route.padEnd(18) +
      String(r.performance).padStart(6) +
      String(r.accessibility).padStart(6) +
      String(r.bestPractices).padStart(6) +
      String(r.seo).padStart(6) +
      String(r.lcp).padStart(8) +
      String(r.fcp).padStart(8) +
      String(r.cls).padStart(6) +
      String(r.tbt).padStart(6)
    );
  }
  console.log('\nReports:', reportDir);
})().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
