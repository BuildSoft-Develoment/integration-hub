import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  CatalogListColumn,
  CatalogListComponent,
  EmptyStateComponent,
  IconComponent,
  LoadingComponent,
  SchemaFormComponent,
  SchemaFormSchema,
  SchemaFormValue,
  StatusBadgeComponent,
  StatusBadgeKind,
} from '@integration-hub/shared/ui';

interface DemoRow {
  readonly id: number;
  readonly name: string;
  readonly type: string;
  readonly active: boolean;
}

/**
 * Live catalog of the shared UI kit (`@integration-hub/shared/ui`), i.e. the pieces a
 * plugin author consumes. Serves the role Storybook would (a discoverable component
 * gallery) but as an in-app route, since Storybook does not yet support Angular 21 cleanly.
 * Renders each component with the real `--ih-*` design tokens, so it also shows dark mode
 * (toggle the app theme) and the accessible states.
 */
@Component({
  selector: 'app-ui-kit-gallery',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CatalogListComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    LoadingComponent,
    IconComponent,
    SchemaFormComponent,
  ],
  template: `
    <section class="page-grid ui-kit">
      <header>
        <h2 class="ih-section-title">UI kit</h2>
        <p class="ih-muted">
          Componentes de <code>&#64;integration-hub/shared/ui</code> — la referencia viva para
          autores de plugins. Cambia el tema para ver el modo oscuro.
        </p>
        <p class="ih-muted ui-kit__hint">
          Para desarrollar un componente aislado, tocar sus inputs y auditar accesibilidad,
          usa Storybook (<code>npm run storybook</code>). Aquí ves el kit completo en producto,
          incluido <code>catalog-list</code> con su DI real.
        </p>
      </header>

      <section class="ui-kit__block">
        <h3 class="ih-section-title">Status badges</h3>
        <div class="ui-kit__row">
          @for (kind of badgeKinds; track kind) {
            <ih-status-badge [status]="kind">{{ kind }}</ih-status-badge>
          }
        </div>
      </section>

      <section class="ui-kit__block">
        <h3 class="ih-section-title">Icons</h3>
        <div class="ui-kit__row">
          @for (name of icons; track name) {
            <span class="ui-kit__icon"><ih-icon [name]="name" [size]="22" /> <small>{{ name }}</small></span>
          }
        </div>
      </section>

      <section class="ui-kit__block">
        <h3 class="ih-section-title">Loading</h3>
        <ih-loading variant="bar" />
        <ih-loading variant="skeleton" [rows]="3" />
      </section>

      <section class="ui-kit__block">
        <h3 class="ih-section-title">Empty state</h3>
        <ih-empty-state icon="folder" message="No hay elementos todavía." />
      </section>

      <section class="ui-kit__block">
        <h3 class="ih-section-title">Schema form (config dirigida por schema)</h3>
        <p class="ih-muted">
          Renderiza la configuración de un tipo a partir de su schema — así un plugin backend
          declara sus campos y el operador los configura sin formulario hardcoded.
        </p>
        <div class="ui-kit__schema">
          <ih-schema-form
            [schema]="demoSchema"
            [value]="schemaValue()"
            (valueChange)="schemaValue.set($event)"
            (validChange)="schemaValid.set($event)"
          />
          <div class="ui-kit__schema-out">
            <div class="ui-kit__row">
              <ih-status-badge [status]="schemaValid() ? 'success' : 'warning'">
                {{ schemaValid() ? 'válido' : 'incompleto' }}
              </ih-status-badge>
            </div>
            <pre class="ui-kit__json">{{ schemaValueJson() }}</pre>
          </div>
        </div>
      </section>

      <section class="ui-kit__block">
        <div class="ui-kit__catalog-head">
          <h3 class="ih-section-title">Catalog list</h3>
          <div class="ui-kit__row">
            <button type="button" class="ui-kit__btn" (click)="state.set('data')">datos</button>
            <button type="button" class="ui-kit__btn" (click)="state.set('loading')">loading</button>
            <button type="button" class="ui-kit__btn" (click)="state.set('empty')">empty</button>
            <button type="button" class="ui-kit__btn" (click)="state.set('error')">error</button>
          </div>
        </div>
        <div class="ui-kit__catalog">
          <ih-catalog-list
            [columns]="columns"
            gridColumns="minmax(160px, 1.5fr) 0.9fr 0.8fr"
            [rowCount]="visibleRows().length"
            [loading]="state() === 'loading'"
            [error]="state() === 'error' ? 'common.error' : null"
            emptyKey="common.empty"
            emptyIcon="folder"
            [total]="visibleRows().length"
          >
            @for (row of visibleRows(); track row.id) {
              <button type="button" class="table-row ih-catalog-table-row" [attr.data-row-index]="$index">
                <div class="ih-catalog-row-copy"><strong>{{ row.name }}</strong><small>ID {{ row.id }}</small></div>
                <div>{{ row.type }}</div>
                <div>
                  <ih-status-badge [status]="row.active ? 'success' : 'neutral'">
                    {{ row.active ? 'activo' : 'inactivo' }}
                  </ih-status-badge>
                </div>
              </button>
            }
          </ih-catalog-list>
        </div>
      </section>
    </section>
  `,
  styles: [
    `
      .ui-kit__block { margin-bottom: var(--ih-space-6, 2rem); display: grid; gap: 0.75rem; }
      .ui-kit__row { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }
      .ui-kit__icon { display: inline-flex; align-items: center; gap: 0.3rem; color: var(--ih-text-soft); }
      .ui-kit__catalog-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
      .ui-kit__catalog { height: 20rem; border: 1px solid var(--ih-border); border-radius: var(--ih-radius-lg, 18px); overflow: hidden; }
      .ui-kit__btn { padding: 0.2rem 0.6rem; border: 1px solid var(--ih-border-strong); border-radius: var(--ih-radius-sm); background: var(--ih-surface-alt); color: inherit; cursor: pointer; font-size: var(--ih-font-size-xs); }
      .table-row { display: grid; grid-template-columns: var(--ih-catalog-columns); align-items: center; gap: 0.75rem; }
      .ui-kit__schema { display: grid; grid-template-columns: minmax(280px, 24rem) 1fr; gap: 1.5rem; align-items: start; }
      @media (max-width: 760px) { .ui-kit__schema { grid-template-columns: 1fr; } }
      .ui-kit__schema-out { display: grid; gap: 0.5rem; }
      .ui-kit__json { margin: 0; padding: 0.75rem; background: var(--ih-surface-alt); border: 1px solid var(--ih-border); border-radius: var(--ih-radius-md, 12px); font-size: var(--ih-font-size-xs); overflow: auto; }
    `,
  ],
})
export class UiKitGalleryComponent {
  readonly badgeKinds: readonly StatusBadgeKind[] = ['success', 'error', 'warning', 'info', 'neutral'];
  readonly icons = ['database', 'play', 'shield', 'clock', 'git-branch', 'folder', 'calendar'];

  readonly columns: readonly CatalogListColumn[] = [
    { labelKey: 'common.name', sortKey: 'name' },
    { labelKey: 'common.type', sortKey: 'type' },
    { labelKey: 'common.status', sortKey: 'active' },
  ];

  private readonly rows: readonly DemoRow[] = [
    { id: 1, name: 'Alpha', type: 'REST', active: true },
    { id: 2, name: 'Bravo', type: 'SFTP', active: false },
    { id: 3, name: 'Charlie', type: 'JDBC', active: true },
  ];

  readonly state = signal<'data' | 'loading' | 'empty' | 'error'>('data');

  visibleRows(): readonly DemoRow[] {
    return this.state() === 'data' ? this.rows : [];
  }

  // Demo del schema-form: el tipo de config que un plugin backend declararía.
  readonly demoSchema: SchemaFormSchema = {
    fields: [
      { key: 'host', type: 'text', label: 'Host', required: true, placeholder: 'db.internal' },
      { key: 'port', type: 'number', label: 'Puerto', min: 1, max: 65535, default: 5432 },
      {
        key: 'engine',
        type: 'select',
        label: 'Motor',
        required: true,
        options: [
          { value: 'postgres', label: 'PostgreSQL' },
          { value: 'mysql', label: 'MySQL' },
          { value: 'oracle', label: 'Oracle' },
        ],
      },
      { key: 'ssl', type: 'boolean', label: 'Usar TLS', default: true },
      { key: 'password', type: 'secret', label: 'Contraseña', required: true },
      // Campo condicional: solo aparece si el motor es Oracle (visibleWhen).
      {
        key: 'serviceName',
        type: 'text',
        label: 'Service name (Oracle)',
        visibleWhen: { field: 'engine', equals: 'oracle' },
      },
    ],
  };
  readonly schemaValue = signal<SchemaFormValue>({});
  readonly schemaValid = signal(false);
  readonly schemaValueJson = computed(() => JSON.stringify(this.schemaValue(), null, 2));
}
