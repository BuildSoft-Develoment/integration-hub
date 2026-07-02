const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('1. Navigating to http://localhost:8080 ...');
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 30000 });

  console.log('2. Current URL:', page.url());

  // Wait for Keycloak login form
  await page.waitForSelector('#username', { timeout: 15000 }).catch(() => {
    console.log('WARNING: username field not found, may already be logged in');
  });

  if (page.url().includes('8180') || page.url().includes('localhost:8180')) {
    console.log('3. On Keycloak login page, filling credentials...');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('#kc-login');

    console.log('4. Waiting for redirect back to app...');
    await page.waitForURL('**/localhost:8080**', { timeout: 15000 }).catch(() => {
      console.log('WARNING: redirect timeout, current URL:', page.url());
    });
  }

  console.log('5. Final URL:', page.url());

  // Wait for the Angular app to render
  await page.waitForTimeout(3000);

  // Extract cookies
  const cookies = await context.cookies();
  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  fs.writeFileSync('C:\\chatgtp\\quarkus\\lighthouse-cookies.txt', cookieHeader);
  console.log('6. Cookies saved:', cookies.length, 'cookies');
  cookies.forEach(c => console.log('   ', c.name, '=', c.value.substring(0, 30) + '...'));

  // Also save a screenshot to verify the app loaded
  await page.screenshot({ path: 'C:\\chatgtp\\quarkus\\lighthouse-report\\app-loaded.png', fullPage: false });
  console.log('7. Screenshot saved');

  await browser.close();
  console.log('DONE');
})().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
