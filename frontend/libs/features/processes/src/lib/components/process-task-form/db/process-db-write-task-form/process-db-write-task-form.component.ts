import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { DbWriteMappingDraft, DbWriteTaskDraft, DB_WRITE_DEFAULT_PLATFORM_TABLE, ProcessTaskFormBridgeService } from '@integration-hub/core/providers';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { firstValueFrom } from 'rxjs';
import { ConnectionRef, ProcessTaskFormModel, ReaderRef } from '../../../../models/process.models';
import { ConnectionIntrospectionApiService } from '@integration-hub/shared/process-form-kit';
import {
  DbWriteColumnRef,
  DbWriteSchemaRef,
  DbWriteSourceItem,
  DbWriteTableRef,
} from '@integration-hub/shared/process-form-kit';
import { ProcessTaskBindingContextService } from '@integration-hub/shared/process-form-kit';
import { ProcessDbWriteMappingBoardComponent } from '../process-db-write-mapping-board/process-db-write-mapping-board.component';
import { ProcessDbWriteSourcePaletteComponent } from '@integration-hub/shared/process-form-kit';
import { ProcessDbWriteTableSelectorComponent } from '@integration-hub/shared/process-form-kit';
import { ProcessTaskRuntimePanelComponent } from '@integration-hub/shared/process-form-kit';
import { ConnectionSelectComponent } from '@integration-hub/shared/process-form-kit';
import { TaskFormShellComponent } from '@integration-hub/shared/process-form-kit';

@Component({
  selector: 'ih-process-db-write-task-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ProcessDbWriteSourcePaletteComponent,
    ProcessDbWriteMappingBoardComponent,
    ProcessDbWriteTableSelectorComponent,
    ProcessTaskRuntimePanelComponent,
    ConnectionSelectComponent,
    MatTabsModule,
    TaskFormShellComponent,
  ],
    templateUrl: './process-db-write-task-form.component.html',
    styleUrl: './process-db-write-task-form.component.css'
})
export class ProcessDbWriteTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly api = inject(ConnectionIntrospectionApiService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bindingContext = inject(ProcessTaskBindingContextService);
  // M-1b: outputs viajan al host via bridge (no via @Output()).
  private readonly bridge = inject(ProcessTaskFormBridgeService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly readers = input.required<readonly ReaderRef[]>();
  readonly connections = input.required<readonly ConnectionRef[]>();
  readonly readonly = input(false);

  readonly schemas = signal<DbWriteSchemaRef[]>([]);
  readonly tables = signal<DbWriteTableRef[]>([]);
  readonly columns = signal<DbWriteColumnRef[]>([]);
  readonly tableQuery = signal('');
  readonly draggingSource = signal<DbWriteSourceItem | null>(null);
  readonly loadingColumns = signal(false);

  readonly draft = computed<DbWriteTaskDraft>(() => this.manager.draftFor<DbWriteTaskDraft>(this.task()));

  readonly selectedConnection = computed(() => this.connections().find((item) => item.name === this.draft().connectionRef) ?? null);

  /**
   * Estado del destino, para no mostrar el MISMO mensaje en tres situaciones distintas (antes las tres caian en
   * "Primero selecciona una conexion JDBC", que ademas es falso en dos de ellas):
   * - `platform`: {@code connectionRef} vacio = "Datasource de la plataforma". Es una opcion EXPLICITA —y el
   *   default de una tarea nueva—, asi que pedirle al usuario que elija una conexion contradice lo que ya eligio.
   *   La introspeccion no aplica: los endpoints de esquemas/tablas/columnas se resuelven por id de conexion.
   * - `missing`: hay un {@code connectionRef} que no matchea ninguna conexion de la lista (borrada, desactivada o
   *   renombrada). Es una referencia ROTA y antes quedaba invisible, disfrazada de "todavia no elegiste nada".
   * - `jdbc`: conexion resuelta; hay introspeccion.
   */
  readonly connectionState = computed<'platform' | 'missing' | 'jdbc'>(() => {
    if (this.selectedConnection()) {
      return 'jdbc';
    }
    return this.draft().connectionRef ? 'missing' : 'platform';
  });

  /** Solo con una conexion resuelta hay endpoints de esquemas/tablas/columnas (se resuelven por id). */
  readonly canIntrospect = computed(() => this.connectionState() === 'jdbc');

  /** El tablero de mapeo es tonto: el motivo de que no haya columnas lo sabe este form. */
  readonly columnsEmptyMessageKey = computed(() =>
    this.connectionState() === 'platform' ? 'ui.dbWriteNoColumnsPlatform' : 'ui.dbWriteNoColumns',
  );

  readonly groupedSources = computed(() => {
    const groups = new Map<string, DbWriteSourceItem[]>();
    this.availableSources().forEach((item) => {
      const list = groups.get(item.groupKey) ?? [];
      list.push(item);
      groups.set(item.groupKey, list);
    });
    return Array.from(groups.entries()).map(([key, items]) => ({ key, items }));
  });
  readonly availableSources = computed(() => {
    return this.bindingContext.buildOptions(this.task(), this.tasks(), this.readers(), this.draft().input) as DbWriteSourceItem[];
  });

  private lastConnectionId: number | null = null;
  private lastColumnsKey = '';
  private lastHydratedTableQualifiedName = '';

  constructor() {
    // Mantiene el texto visible de "Tabla destino" (tableQuery) en sync con la tabla del draft, sin pisar lo que
    // el usuario este tipeando. Solo se toca lo que hidrato este mismo efecto.
    effect(() => {
      // Sin tabla NO hay nombre calificado: un esquema suelto no es una tabla. Antes se calificaba con
      // [schema, table] a secas, asi que elegir esquema 'ventas' con la tabla vacia terminaba escribiendo
      // "ventas" en el campo de tabla.
      const table = this.draft().targetTable;
      const qualifiedName = table ? [this.draft().targetSchema, table].filter(Boolean).join('.') : '';
      if (!qualifiedName) {
        // El draft se quedo sin tabla (p.ej. al cambiar a una conexion externa, que la vacia a proposito).
        // Hay que leer el valor hidratado PREVIO antes de resetearlo: al reasignarlo primero, la comparacion
        // quedaba contra '' y solo "limpiaba" lo que ya estaba vacio — un no-op que dejaba el nombre viejo
        // pegado en pantalla mientras la configuracion real ya no tenia tabla.
        const previouslyHydrated = this.lastHydratedTableQualifiedName;
        this.lastHydratedTableQualifiedName = '';
        if (this.tableQuery() === previouslyHydrated) {
          this.tableQuery.set('');
        }
        return;
      }
      const currentQuery = this.tableQuery();
      const shouldHydrate = !currentQuery || currentQuery === this.lastHydratedTableQualifiedName;
      if (shouldHydrate) {
        this.tableQuery.set(qualifiedName);
      }
      this.lastHydratedTableQualifiedName = qualifiedName;
    });

    effect(() => {
      const connectionId = this.selectedConnection()?.id ?? null;
      if (connectionId === this.lastConnectionId) {
        return;
      }
      this.lastConnectionId = connectionId;
      this.schemas.set([]);
      this.tables.set([]);
      this.columns.set([]);
      if (connectionId != null) {
        void this.loadSchemas(connectionId);
        void this.loadTables(connectionId, this.draft().targetSchema, this.tableQuery());
      }
    });

    effect(() => {
      const connectionId = this.selectedConnection()?.id ?? null;
      const schema = this.draft().targetSchema;
      const table = this.draft().targetTable;
      const key = `${connectionId ?? 'none'}|${schema}|${table}`;
      if (key === this.lastColumnsKey) {
        return;
      }
      this.lastColumnsKey = key;
      if (connectionId && table) {
        void this.loadColumns(connectionId, schema, table);
      } else {
        this.columns.set([]);
      }
    });
  }

  handleConnectionChange(connectionRef: string): void {
    this.tableQuery.set('');
    this.tables.set([]);
    this.columns.set([]);
    // 011: al elegir el "Datasource de la plataforma" (connectionRef vacio) se pre-rellena la tabla destino
    // con staging_record (la tabla de staging por defecto del money-path). Con una conexion externa queda
    // vacio para que el usuario la elija.
    this.updateDraft({
      connectionRef,
      targetSchema: '',
      targetTable: connectionRef === '' ? DB_WRITE_DEFAULT_PLATFORM_TABLE : '',
      mappings: [],
    });
  }

  handleSchemaChange(schema: string): void {
    this.tableQuery.set('');
    this.updateDraft({ targetSchema: schema || '', targetTable: '', mappings: [] });
    this.columns.set([]);
    const connectionId = this.selectedConnection()?.id;
    if (connectionId) {
      void this.loadTables(connectionId, schema || '', '');
    }
  }

  handleTableQueryChange(query: string): void {
    this.tableQuery.set(query);
    const normalizedQuery = String(query || '').trim();
    // Sin introspeccion (datasource de la plataforma) no hay lista de donde elegir, asi que lo tipeado ES la
    // tabla. Con conexion JDBC se mantiene el contrato original —el texto solo filtra el autocomplete y la tabla
    // se fija al elegir una opcion REAL—, para no dar por buena una tabla que no existe en esa conexion.
    if (!this.canIntrospect()) {
      if (normalizedQuery !== this.draft().targetTable) {
        this.updateDraft({
          targetTable: normalizedQuery,
          mappings: this.draft().targetTable ? [] : this.draft().mappings,
        });
        this.columns.set([]);
      }
      return;
    }
    const selectedQualifiedName = [this.draft().targetSchema, this.draft().targetTable].filter(Boolean).join('.');
    if (normalizedQuery !== selectedQualifiedName) {
      this.updateDraft({
        targetTable: '',
        mappings: this.draft().targetTable ? [] : this.draft().mappings,
      });
      this.columns.set([]);
    }
    const connectionId = this.selectedConnection()?.id;
    if (connectionId) {
      void this.loadTables(connectionId, this.draft().targetSchema, normalizedQuery);
    }
  }


  handleTableAutocompleteSelect(table: DbWriteTableRef): void {
    if (!table) {
      return;
    }
    this.tableQuery.set(table.qualifiedName);
    this.updateDraft({
      targetSchema: table.schema ?? '',
      targetTable: table.name,
    });
  }

  assignSource(columnName: string, source: DbWriteSourceItem): void {
    this.patchMapping(columnName, {
      sourceKind: source.kind,
      sourceKey: source.key,
      sourceLabel: source.label,
      expression: '',
    });
  }

  updateExpression(columnName: string, expression: string): void {
    const normalized = String(expression || '');
    this.patchMapping(columnName, {
      sourceKind: normalized.trim() ? 'expression' : null,
      sourceKey: '',
      sourceLabel: '',
      expression: normalized,
      key: normalized.trim() ? false : this.mappingFor(columnName).key,
    });
  }

  updateKey(columnName: string, value: boolean): void {
    this.patchMapping(columnName, { key: value });
  }

  clearMapping(columnName: string): void {
    this.patchMapping(columnName, {
      sourceKind: null,
      sourceKey: '',
      sourceLabel: '',
      expression: '',
      key: false,
    });
  }

  private async loadSchemas(connectionDefinitionId: number): Promise<void> {
    this.schemas.set(await firstValueFrom(this.api.listConnectionSchemas(connectionDefinitionId)));
  }

  private async loadTables(connectionDefinitionId: number, schema: string, query: string): Promise<void> {
    this.tables.set(await firstValueFrom(this.api.listConnectionTables(connectionDefinitionId, { schema, query })));
  }

  private async loadColumns(connectionDefinitionId: number, schema: string, table: string): Promise<void> {
    this.loadingColumns.set(true);
    try {
      const columns = await firstValueFrom(this.api.listConnectionColumns(connectionDefinitionId, { schema, table }));
      this.columns.set(columns);
      this.reconcileMappings(columns);
    } finally {
      this.loadingColumns.set(false);
    }
  }

  private reconcileMappings(columns: readonly DbWriteColumnRef[]): void {
    const current = this.draft().mappings ?? [];
    const byColumn = new Map(current.map((row) => [row.targetColumn, row]));
    const next = columns.map((column) => byColumn.get(column.name) ?? this.createEmptyMapping(column.name));
    if (JSON.stringify(next) !== JSON.stringify(current)) {
      this.updateDraft({ mappings: next });
    }
  }

  private patchMapping(columnName: string, patch: Partial<DbWriteMappingDraft>): void {
    const mappings = this.columns().length
      ? this.columns().map((column) => column.name)
      : Array.from(new Set(this.draft().mappings.map((row) => row.targetColumn).concat(columnName)));
    const next = mappings.map((name) => {
      const current = this.mappingFor(name);
      if (name !== columnName) {
        return current;
      }
      return {
        ...current,
        ...patch,
        targetColumn: name,
      };
    });
    this.updateDraft({ mappings: next });
  }

  private mappingFor(columnName: string): DbWriteMappingDraft {
    return this.draft().mappings.find((row) => row.targetColumn === columnName) ?? this.createEmptyMapping(columnName);
  }

  private createEmptyMapping(columnName: string): DbWriteMappingDraft {
    return {
      targetColumn: columnName,
      sourceKind: null,
      sourceKey: '',
      sourceLabel: '',
      expression: '',
      key: false,
    };
  }

  updateDraft(patch: Partial<DbWriteTaskDraft>): void {
    const nextDraft = this.sanitizeDraftInput({ ...this.draft(), ...patch });
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, nextDraft));
  }

  private sanitizeDraftInput(draft: DbWriteTaskDraft): DbWriteTaskDraft {
    if (!this.bindingContext.isFileInput(draft.input, this.tasks())) {
      return draft;
    }
    const { batchSize: _batchSize, ...input } = draft.input!;
    return { ...draft, input };
  }
}


