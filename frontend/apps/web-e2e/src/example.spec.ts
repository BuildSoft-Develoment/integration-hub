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
    test.setTimeout(180_000);

    for (const route of routes) {
      await test.step(`renders ${route.path}`, async () => {
        await gotoAuthenticated(page, route.path);

        await expect(page.locator('h1')).toContainText(route.title, {
          timeout: 20_000,
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
    // Discoverable entry point to the live UI-kit catalog (author reference).
    const uiKitLink = page.getByRole('link', { name: /^UI kit$/ });
    await expect(uiKitLink).toBeVisible({ timeout: 15_000 });
    await expect(uiKitLink).toHaveAttribute('href', '#/ui-kit');
    // Unified, filterable frontend registry view.
    await expect(
      page.getByRole('heading', { name: /Registro frontend|Frontend registry/ }).first()
    ).toBeVisible({ timeout: 15_000 });
    const filterGroup = page.getByRole('group', { name: /Registro frontend|Frontend registry/ });
    await expect(filterGroup).toBeVisible();
    // a11y: filter chips are keyboard-operable native buttons. Focusing and pressing
    // Enter activates the "Installed" filter (aria-pressed toggles to true).
    const installedChip = filterGroup.getByRole('button', { name: /Instalados|Installed/ });
    await installedChip.focus();
    await expect(installedChip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(installedChip).toHaveAttribute('aria-pressed', 'true');
    // a11y: keyboard focus shows a visible outline (focus-visible ring).
    const outlineWidth = await installedChip.evaluate(
      (el) => getComputedStyle(el).outlineWidth
    );
    expect(parseFloat(outlineWidth)).toBeGreaterThan(0);
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
    // Canary metrics: read-only dashboard of the promotion window.
    await expect(
      page.getByRole('heading', { name: /Metricas de canary|Canary metrics/ }).first()
    ).toBeVisible();
    // a11y (WCAG 1.3.1): data tables expose column headers via scope and are named
    // by a visually-hidden caption.
    await expect(page.locator('table th[scope="col"]').first()).toBeAttached();
    await expect(page.locator('table caption').first()).toBeAttached();
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

    // Generic diagnostics route first; more specific routes are registered after so
    // they take priority (Playwright uses the most recently registered matching route).
    await page.route('**/api/plugins', (route) => route.fulfill(json(diagnostics)));
    await page.route('**/api/plugins/canary/metrics', (route) =>
      route.fulfill(
        json([
          {
            pluginId: 'acme',
            version: '2.0.0',
            totalSamples: 5,
            failures: 1,
            failureRatio: 0.2,
            windowHours: 24,
            minSamples: 3,
            maxFailureRatio: 0.0,
            promotable: false,
            blockReason: 'FAILURE_RATIO_EXCEEDED',
            trend: [0, 0.1, 0.2, 0.15, 0.3, 0.2],
          },
        ])
      )
    );
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

    // Read-only canary dashboard renders the mocked metric: failure ratio as a
    // percentage and the blocked status/reason.
    await expect(page.getByText('20.0%')).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByText(/Ratio de fallo superado|Failure ratio exceeded/).first()
    ).toBeVisible();
    // Temporal trend sparkline: an accessible SVG polyline with one point per bucket.
    const spark = page.locator('svg.canary-spark[role="img"]').first();
    await expect(spark).toBeAttached();
    const points = await spark.locator('polyline').getAttribute('points');
    expect((points ?? '').trim().split(/\s+/).length).toBe(6);

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

  test('sets a canary rollout weight from the versions table', async ({ page }) => {
    test.setTimeout(90_000);

    const json = (body: unknown) => ({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
    let weight: number | null = null;
    const diagnostics = () => ({
      installed: [],
      versions: [
        { id: 'acme', version: '1.0.0', spiVersion: '1', transport: 'GRPC', trusted: true, active: true, channel: 'stable', pinned: false, canaryWeight: null },
        { id: 'acme', version: '2.0.0', spiVersion: '1', transport: 'GRPC', trusted: true, active: false, channel: 'canary', pinned: false, canaryWeight: weight },
      ],
      degraded: {},
    });

    await page.route('**/api/plugins', (route) => route.fulfill(json(diagnostics())));
    await page.route('**/api/plugins/canary/metrics', (route) => route.fulfill(json([])));
    await page.route('**/api/plugins/acme/versions/2.0.0/canary-weight', (route) => {
      weight = JSON.parse(route.request().postData() || '{}').weight;
      return route.fulfill(json(diagnostics()));
    });

    await gotoAuthenticated(page, '/#/plugins');

    const weightInput = page.locator('input.plugins-input--num').first();
    await expect(weightInput).toBeVisible({ timeout: 15_000 });
    await weightInput.fill('40');
    await page.getByRole('button', { name: /Fijar peso|Set weight/ }).first().click();

    // After the refetch the persisted weight is reflected.
    await expect(page.locator('[data-testid="canary-weight"]').first()).toHaveText('40%', {
      timeout: 15_000,
    });
  });

  for (const route of ['sources', 'processes', 'schedules', 'executions', 'audit', 'connections'] as const) {
    test(`renders the ${route} catalog on the shared catalog-list shell`, async ({ page }) => {
      test.setTimeout(90_000);

      await gotoAuthenticated(page, `/#/${route}`);

      const list = page.locator('ih-catalog-list').first();
      await expect(list).toBeVisible({ timeout: 20_000 });
      // Sortable column headers rendered by the shell from the columns config.
      await expect(list.getByRole('columnheader').first()).toBeVisible();
      await expect(list.locator('.table-body')).toBeVisible();
    });
  }

  test('renders the readers catalog on the shared catalog-list shell', async ({ page }) => {
    test.setTimeout(90_000);

    await gotoAuthenticated(page, '/#/readers');

    // The readers list now renders through the shared ih-catalog-list shell.
    const list = page.locator('ih-catalog-list').first();
    await expect(list).toBeVisible({ timeout: 20_000 });
    // Sortable column headers provided by the shell (from the columns config).
    await expect(
      list.getByRole('columnheader', { name: /Nombre|Name/ }).first()
    ).toBeVisible();
    await expect(list.getByRole('columnheader', { name: /Tipo|Type/ }).first()).toBeVisible();
    // The shell renders either rows or its empty state, never the old duplicated markup.
    await expect(list.locator('.table-body')).toBeVisible();
  });

  test('previews a frontend plugin manifest in the console', async ({ page }) => {
    test.setTimeout(90_000);

    await gotoAuthenticated(page, '/#/plugins');

    const manifestBox = page.getByPlaceholder(/Manifiesto \(JSON\)|Manifest \(JSON\)/);
    await expect(manifestBox).toBeVisible({ timeout: 15_000 });
    const previewButton = page.getByRole('button', { name: /Previsualizar|Preview/ }).last();

    // Acceptable metadata-only manifest (no remote, command action within namespace).
    await manifestBox.fill(
      JSON.stringify({
        id: 'preview-demo',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Preview Demo',
        i18nNamespaces: ['previewDemo'],
        actions: [
          { id: 'preview-demo-run', group: 'overview', labelKey: 'previewDemo.run', command: 'previewDemo.run' },
        ],
      })
    );
    await previewButton.click();
    await expect(page.getByText(/Se aceptaria|Would be accepted/)).toBeVisible({ timeout: 15_000 });

    // Untrusted remote -> would be quarantined with the origin reason.
    await manifestBox.fill(
      JSON.stringify({
        id: 'sample-plugin',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Sample Plugin',
        remote: {
          url: 'https://plugins.example.com/remoteEntry.json',
          exposedModule: './Widget',
          integrity: `sha384-${'A'.repeat(64)}`,
          signature: `sample-plugin-key-1:${'A'.repeat(43)}=`,
        },
      })
    );
    await previewButton.click();
    await expect(page.getByText(/not in the allowed plugin origins/)).toBeVisible({ timeout: 15_000 });
  });

  test('installs a previewed frontend plugin into the runtime catalog', async ({ page }) => {
    test.setTimeout(90_000);

    const json = (body: unknown) => ({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
    // Stateful mock of the runtime frontend catalog: GET lists, POST persists.
    let catalog: { id: string }[] = [];
    await page.route('**/api/plugins/ui-catalog', (route) => {
      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        catalog = [{ id: body.id }];
        return route.fulfill(json({ manifests: catalog }));
      }
      return route.fulfill(json({ manifests: catalog }));
    });

    await gotoAuthenticated(page, '/#/plugins');

    // Preview an acceptable metadata-only manifest, then add it to the catalog.
    const manifestBox = page.getByPlaceholder(/Manifiesto \(JSON\)|Manifest \(JSON\)/);
    await manifestBox.fill(
      JSON.stringify({
        id: 'preview-demo',
        version: '1.0.0',
        platformVersion: '1.0.0',
        displayName: 'Preview Demo',
        i18nNamespaces: ['previewDemo'],
        actions: [
          { id: 'preview-demo-run', group: 'overview', labelKey: 'previewDemo.run', command: 'previewDemo.run' },
        ],
      })
    );
    await page.getByRole('button', { name: /Previsualizar|Preview/ }).last().click();
    await page.getByRole('button', { name: /Anadir al catalogo|Add to catalog/ }).click();

    // The persisted entry appears in the catalog list with a Remove action.
    await expect(page.getByRole('cell', { name: 'preview-demo' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /Quitar|Remove/ }).first()).toBeVisible();
  });

  test('exposes the overview.widgets extension slot on the dashboard', async ({ page }) => {
    test.setTimeout(90_000);

    await gotoAuthenticated(page, '/#/overview');

    // The slot outlet is wired into the overview so plugins/features can register widgets.
    await expect(page.locator('ih-slot').first()).toBeAttached({ timeout: 20_000 });
  });

  test('renders the UI kit catalog with the shared primitives', async ({ page }) => {
    test.setTimeout(90_000);

    await gotoAuthenticated(page, '/#/ui-kit');

    // The author-facing catalog of @integration-hub/shared/ui.
    await expect(page.getByRole('heading', { name: /^UI kit$/ }).first()).toBeVisible({
      timeout: 20_000,
    });
    // One badge per kind (5) plus the badges inside the demo catalog rows.
    await expect(page.locator('ih-status-badge').first()).toBeVisible();
    expect(await page.locator('ih-status-badge').count()).toBeGreaterThanOrEqual(5);
    // The live catalog-list shell renders with sample rows by default.
    const list = page.locator('ih-catalog-list').first();
    await expect(list).toBeVisible();
    await expect(list.locator('[data-row-index]')).toHaveCount(3);
    // Toggling to the empty state clears the rows and shows the empty-state component.
    await page.getByRole('button', { name: 'empty' }).click();
    await expect(list.locator('[data-row-index]')).toHaveCount(0);
    await expect(list.locator('ih-empty-state')).toBeVisible();

    // Schema-driven config form: renders controls from a schema (the mechanism that lets a
    // backend plugin declare its config and be configured in the UI without a hardcoded form).
    const schemaForm = page.locator('ih-schema-form');
    await expect(schemaForm).toBeVisible();
    // text/number/select/secret render as mat-form-field; the boolean as a slide toggle.
    expect(await schemaForm.locator('mat-form-field').count()).toBeGreaterThanOrEqual(4);
    await expect(schemaForm.locator('mat-slide-toggle')).toBeVisible();
    // The secret field is masked (rendered as a password input).
    await expect(schemaForm.locator('input[type="password"]')).toBeVisible();
  });

  test('shows the plugin health card on the overview dashboard', async ({ page }) => {
    test.setTimeout(90_000);

    const json = (body: unknown) => ({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
    // Deterministic plugin health: 2 ACTIVE + 1 DEGRADED, 1 blocked canary.
    await page.route('**/api/plugins', (route) =>
      route.fulfill(
        json({
          installed: [
            { id: 'a', status: 'ACTIVE' },
            { id: 'b', status: 'ACTIVE' },
            { id: 'c', status: 'DEGRADED' },
          ],
          degraded: { c: 'boom' },
        })
      )
    );
    await page.route('**/api/plugins/canary/metrics', (route) =>
      route.fulfill(json([{ pluginId: 'c', version: '2.0.0', promotable: false }]))
    );

    await gotoAuthenticated(page, '/#/overview');

    const card = page.locator('ih-overview-plugin-health-card');
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(card.getByText(/Salud de plugins|Plugin health/)).toBeVisible();
    // active=2, degraded=1, blocked=1 rendered.
    await expect(card.locator('.plugin-health-value--active')).toHaveText('2');
    await expect(card.locator('.plugin-health-value--degraded')).toHaveText('1');
    await expect(card.locator('.plugin-health-value--blocked')).toHaveText('1');
    await expect(card.getByRole('link', { name: /Ver plugins|View plugins/ })).toBeVisible();
  });

  test('quarantines an untrusted external frontend plugin from the catalog', async ({ page }) => {
    test.setTimeout(90_000);

    // Serve the sample-plugin manifest (mirrors apps/sample-plugin/manifest.json) via the
    // external plugin catalog the shell loads at boot. With the default (empty) origin/key
    // allowlists, the fail-safe gate must quarantine it without breaking the shell.
    await page.route('**/plugins/catalog.json', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          manifests: [
            {
              id: 'sample-plugin',
              version: '1.0.0',
              platformVersion: '1.0.0',
              displayName: 'Sample Plugin',
              remote: {
                url: 'https://plugins.example.com/remoteEntry.json',
                exposedModule: './Widget',
                integrity: `sha384-${'A'.repeat(64)}`,
                signature: `sample-plugin-key-1:${'A'.repeat(43)}=`,
              },
            },
          ],
        }),
      })
    );

    await gotoAuthenticated(page, '/#/plugins');

    // The plugin surfaces in the frontend registry, filtered to quarantined.
    const filterGroup = page.getByRole('group', { name: /Registro frontend|Frontend registry/ });
    await filterGroup.getByRole('button', { name: /En cuarentena|Quarantined/ }).click();
    await expect(page.getByRole('cell', { name: 'sample-plugin' }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByText(/not in the allowed plugin origins/).first()
    ).toBeVisible();
  });
});

async function gotoAuthenticated(page: Page, path: string): Promise<void> {
  // Retry navigation to absorb transient dev-server rebuilds (server briefly down)
  // while treating ERR_ABORTED as expected (hash routing aborts the top-level load).
  for (let attempt = 0; ; attempt++) {
    try {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      break;
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('ERR_ABORTED')) {
        break;
      }
      const transient =
        /ERR_EMPTY_RESPONSE|ERR_CONNECTION_REFUSED|ERR_CONNECTION_RESET|Timeout/i.test(message);
      if (!transient || attempt >= 3) {
        throw error;
      }
      await page.waitForTimeout(3000);
    }
  }

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

  // Wait for the app shell (h1) to render so per-route assertions are stable.
  await page
    .locator('h1')
    .first()
    .waitFor({ state: 'visible', timeout: 20_000 })
    .catch(() => undefined);
}
