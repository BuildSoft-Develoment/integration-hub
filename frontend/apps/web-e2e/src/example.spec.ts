import { expect, Page, test } from '@playwright/test';

const credentials = {
  username: process.env['E2E_USERNAME'] || 'admin',
  password: process.env['E2E_PASSWORD'] || 'admin123',
};

const routes = [
  { path: '/#/overview', title: /Resumen|Overview/ },
  { path: '/#/connections', title: /Conexiones|Connections/ },
  { path: '/#/processes', title: /Procesos|Processes/ },
  { path: '/#/audit', title: /Auditoria|Audit/ },
  { path: '/#/audit/spool', title: /Spool de auditoria|Audit spool/ },
  { path: '/#/audit/mt101-quarantine', title: /cuarentena|quarantine/i },
] as const;

test.describe('Integration Hub shell', () => {
  test('renders core protected routes', async ({ page }) => {
    test.setTimeout(90_000);

    for (const route of routes) {
      await test.step(`renders ${route.path}`, async () => {
        await gotoAuthenticated(page, route.path);

        await expect(page.locator('h1')).toContainText(route.title, {
          timeout: 15_000,
        });
        await expect(page.locator('body')).not.toContainText('Unable to resolve specifier');
        await expect(page.locator('body')).not.toContainText('@angular/core/testing');
      });
    }
  });

  test('shows the plugin management console with backend controls', async ({ page }) => {
    test.setTimeout(90_000);

    await gotoAuthenticated(page, '/#/plugins');

    // The plugins page renders its sections (frontend installed/quarantined/degraded + backend).
    await expect(page.getByRole('heading', { name: /Plugins/ }).first()).toBeVisible({
      timeout: 15_000,
    });
    // Management controls over the backend lifecycle API (refresh + reload).
    await expect(
      page.getByRole('button', { name: /Refrescar|Refresh/ }).first()
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole('button', { name: /Recargar|Reload/ }).first()
    ).toBeVisible();
    // Versions section: activate/rollback a specific plugin version.
    await expect(
      page.getByRole('heading', { name: /Versiones|Versions/ }).first()
    ).toBeVisible();
    // Marketplace section: install-from-outside a backend plugin (preview + install).
    await expect(
      page.getByRole('heading', { name: /Marketplace/ }).first()
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Previsualizar|Preview/ }).first()
    ).toBeVisible();
  });

  test('runs backend plugin actions end-to-end (mocked backend)', async ({ page }) => {
    test.setTimeout(90_000);

    const diagnostics = {
      installed: [
        {
          id: 'acme',
          version: '1.0.0',
          spiVersion: '1',
          providedTypes: ['ACME_DO'],
          transport: 'GRPC',
          trusted: true,
          status: 'ACTIVE',
          degradedReason: null,
        },
      ],
      versions: [
        { id: 'acme', version: '1.0.0', spiVersion: '1', transport: 'GRPC', trusted: true, active: true, channel: 'stable', pinned: false },
        { id: 'acme', version: '2.0.0', spiVersion: '1', transport: 'GRPC', trusted: true, active: false, channel: 'canary', pinned: false },
      ],
      degraded: {},
    };
    let activateCalled = false;
    let previewCalled = false;
    const json = (body: unknown) => ({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });

    await page.route('**/api/plugins', (route) => route.fulfill(json(diagnostics)));
    await page.route('**/api/plugins/acme/versions/2.0.0/activate', (route) => {
      activateCalled = true;
      return route.fulfill(json(diagnostics));
    });
    await page.route('**/api/plugins/marketplace/preview', (route) => {
      previewCalled = true;
      return route.fulfill(
        json({
          id: 'demo-remote',
          version: '1.0.0',
          spiVersion: '1',
          providedTypes: ['DEMO'],
          transport: 'GRPC',
          trusted: true,
          status: 'ACTIVE',
          degradedReason: null,
        })
      );
    });

    await gotoAuthenticated(page, '/#/plugins');

    // Version rollback/promote action calls the activate endpoint.
    await page
      .getByRole('button', { name: /Activar version|Activate version/ })
      .first()
      .click();
    await expect.poll(() => activateCalled, { timeout: 15_000 }).toBe(true);

    // Marketplace preview action returns and renders the previewed descriptor.
    await page.getByPlaceholder(/URL del catalogo|Catalog URL/).fill('https://market.example.com/catalog.json');
    await page.getByPlaceholder(/Id del plugin|Plugin id/).fill('demo-remote');
    await page.getByRole('button', { name: /Previsualizar|Preview/ }).first().click();
    await expect.poll(() => previewCalled, { timeout: 15_000 }).toBe(true);
    await expect(page.getByText('demo-remote')).toBeVisible({ timeout: 15_000 });
  });
});

async function gotoAuthenticated(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: 'domcontentloaded' }).catch((error: Error) => {
    if (!error.message.includes('ERR_ABORTED')) {
      throw error;
    }
  });

  const username = page.locator('input[name="username"], input#username').first();
  const loginVisible = await username
    .waitFor({ state: 'visible', timeout: 20_000 })
    .then(() => true)
    .catch(() => false);

  if (loginVisible) {
    await username.fill(credentials.username);
    await page
      .locator('input[name="password"], input#password')
      .first()
      .fill(credentials.password);
    await Promise.all([
      page.waitForURL(/localhost:8080\/#\//, { timeout: 30_000 }),
      page.locator('button[type="submit"], input[type="submit"]').first().click(),
    ]);
  }
}
