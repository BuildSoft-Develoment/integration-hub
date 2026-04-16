import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DbWriteMappingDraft, DbWriteTaskDraft } from '@integration-hub/core/providers';
import { I18nService, ProcessTaskManagerService, ReaderManagerService } from '@integration-hub/core/services';
import { firstValueFrom } from 'rxjs';
import { ConnectionRef, ProcessTaskFormModel, ReaderRef } from '../../process.models';
import { ProcessApiService } from '../../process-api.service';
import {
  DB_WRITE_METADATA_ITEMS,
  DbWriteColumnRef,
  DbWriteSchemaRef,
  DbWriteSourceItem,
  DbWriteTableRef,
} from '../../process-db-write.models';
import { ProcessDbWriteMappingBoardComponent } from './process-db-write-mapping-board.component';
import { ProcessDbWriteSourcePaletteComponent } from './process-db-write-source-palette.component';
import { ProcessDbWriteTableSelectorComponent } from './process-db-write-table-selector.component';

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
  ],
  template: `
    <div class="task-form-stack ih-compact-section">
      <div class="task-grid task-grid--primary">
        <mat-form-field>
          <mat-label>{{ i18n.t('ui.connection') }}</mat-label>
          <mat-select [disabled]="readonly()" [ngModel]="draft().connectionRef" (ngModelChange)="handleConnectionChange($event)">
            <mat-option value="">{{ i18n.t('ui.platformDatasource') }}</mat-option>
            @for (connection of connections(); track connection.id) {
              <mat-option [value]="connection.name">{{ connection.name }} ({{ connection.connectionType }})</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field>
          <mat-label>{{ i18n.t('ui.modeLabel') }}</mat-label>
          <mat-select [disabled]="readonly()" [ngModel]="draft().mode" (ngModelChange)="updateDraft({ mode: $event })">
            <mat-option value="insert">{{ i18n.t('ui.dbWriteMode.insert') }}</mat-option>
            <mat-option value="update">{{ i18n.t('ui.dbWriteMode.update') }}</mat-option>
            <mat-option value="upsert">{{ i18n.t('ui.dbWriteMode.upsert') }}</mat-option>
            <mat-option value="batch-update">{{ i18n.t('ui.dbWriteMode.batchUpdate') }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field>
          <mat-label>{{ i18n.t('ui.batchSize') }}</mat-label>
          <input matInput [disabled]="readonly()" [ngModel]="draft().batchSize" (ngModelChange)="updateDraft({ batchSize: $event })" />
        </mat-form-field>
      </div>

      <div class="task-grid task-grid--metadata">
        <mat-form-field>
          <mat-label>{{ i18n.t('ui.schema') }}</mat-label>
          <mat-select [disabled]="readonly() || !selectedConnection()" [ngModel]="draft().targetSchema" (ngModelChange)="handleSchemaChange($event)">
            <mat-option value="">{{ i18n.t('ui.allSchemas') }}</mat-option>
            @for (schema of schemas(); track schema.name) {
              <mat-option [value]="schema.name">{{ schema.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <ih-process-db-write-table-selector
          class="task-grid__table-field"
          [disabled]="readonly() || !selectedConnection()"
          [query]="tableQuery()"
          [tables]="tables()"
          (queryChange)="handleTableQueryChange($event)"
          (tableSelect)="handleTableAutocompleteSelect($event)"
        />
      </div>

      @if (!selectedConnection()) {
        <div class="task-note ih-soft-panel">{{ i18n.t('ui.dbWriteConnectionHint') }}</div>
      } @else if (loadingColumns()) {
        <div class="task-note ih-soft-panel">{{ i18n.t('ui.loading') }}</div>
      }
    </div>

    <div class="mapping-workspace">
      <ih-process-db-write-source-palette
        [groups]="groupedSources()"
        [draggingSource]="draggingSource()"
        [readonly]="readonly()"
        (sourceDragStart)="draggingSource.set($event)"
        (sourceDragEnd)="draggingSource.set(null)"
      />

      <ih-process-db-write-mapping-board
        [columns]="columns()"
        [mappings]="draft().mappings"
        [sourceGroups]="groupedSources()"
        [readonly]="readonly()"
        [draggingSource]="draggingSource()"
        (sourceDrop)="assignSource($event.columnName, $event.source)"
        (expressionChange)="updateExpression($event.columnName, $event.expression)"
        (keyChange)="updateKey($event.columnName, $event.value)"
        (clear)="clearMapping($event)"
      />
    </div>
  `,
  styles: [`
      :host {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 1rem;
        min-width: 0;
        min-height: 0;
        height: 100%;
        overflow: hidden;
      }
      .task-form-stack {
        display: grid;
        gap: 1rem;
        min-width: 0;
        align-content: start;
      }
      .task-grid {
        display: grid;
        gap: 0.95rem;
        min-width: 0;
      }
      .task-grid--primary {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .task-grid--metadata {
        grid-template-columns: minmax(min(160px, 100%), 0.75fr) minmax(min(180px, 100%), 0.95fr) minmax(min(220px, 100%), 1.2fr);
      }
      .mapping-workspace {
        display: grid;
        grid-template-columns: minmax(min(260px, 100%), 0.9fr) minmax(0, 1.4fr);
        gap: 1rem;
        align-items: stretch;
        min-height: 0;
        height: 100%;
        overflow: hidden;
      }
      .mapping-workspace > * {
        min-height: 0;
        max-height: 100%;
      }
      .task-note {
        padding: 0.85rem 1rem;
        border-radius: 16px;
        border: 1px dashed var(--ih-border);
        color: var(--ih-text-soft);
        background: color-mix(in srgb, var(--ih-surface-alt) 76%, transparent);
      }
      @media (max-width: 1080px) {
        :host {
          grid-template-rows: auto;
          height: auto;
          overflow: visible;
        }
        .task-grid--primary,
        .task-grid--metadata,
        .mapping-workspace {
          grid-template-columns: 1fr;
        }
        .mapping-workspace {
          height: auto;
          min-height: auto;
        }
      }
    `],
})
export class ProcessDbWriteTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly api = inject(ProcessApiService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly readerManager = inject(ReaderManagerService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly readers = input.required<readonly ReaderRef[]>();
  readonly connections = input.required<readonly ConnectionRef[]>();
  readonly readonly = input(false);
  readonly patchTask = output<Partial<ProcessTaskFormModel>>();

  readonly schemas = signal<DbWriteSchemaRef[]>([]);
  readonly tables = signal<DbWriteTableRef[]>([]);
  readonly columns = signal<DbWriteColumnRef[]>([]);
  readonly tableQuery = signal('');
  readonly draggingSource = signal<DbWriteSourceItem | null>(null);
  readonly loadingColumns = signal(false);

  readonly draft = computed(() => this.manager.hydrateDraft<DbWriteTaskDraft>(this.task()) ?? {
    connectionRef: '',
    mode: 'insert',
    targetSchema: '',
    targetTable: '',
    batchSize: '1000',
    mappings: [],
  });

  readonly selectedConnection = computed(() => this.connections().find((item) => item.name === this.draft().connectionRef) ?? null);

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
    const sources: DbWriteSourceItem[] = [];
    const readTask = this.resolveReadTask();
    if (readTask) {
      const reader = this.readers().find((item) => item.id === readTask.readerDefinitionId);
      if (reader?.readerType && reader.configurationJson) {
        const readerDraft = this.readerManager.hydrateDraft(reader.readerType as any, reader.configurationJson);
        const fieldItems = [...(readerDraft.fields ?? []), ...(readerDraft.fixedFields ?? [])]
          .map((field) => field.name?.trim())
          .filter((name, index, values) => !!name && values.indexOf(name) === index)
          .map((name) => ({
            key: name!,
            label: name!,
            kind: 'field' as const,
            groupKey: 'ui.dbWriteGroup.fields',
          }));
        sources.push(...fieldItems);
      }
      const sourceVariables = this.parseObject(readTask.configurationJson, 'sourceVariables');
      Object.keys(sourceVariables)
        .sort((a, b) => a.localeCompare(b))
        .forEach((key) => {
          sources.push({
            key,
            label: `{${key}}`,
            kind: 'variable',
            groupKey: 'ui.dbWriteGroup.variables',
          });
        });
    }
    sources.push(...DB_WRITE_METADATA_ITEMS);
    return sources;
  });

  private lastConnectionId: number | null = null;
  private lastColumnsKey = '';
  private lastHydratedTableQualifiedName = '';

  constructor() {
    effect(() => {
      const qualifiedName = [this.draft().targetSchema, this.draft().targetTable].filter(Boolean).join('.');
      if (!qualifiedName) {
        this.lastHydratedTableQualifiedName = '';
        if (!this.draft().targetTable && this.tableQuery() === this.lastHydratedTableQualifiedName) {
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
    this.updateDraft({
      connectionRef,
      targetSchema: '',
      targetTable: '',
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

  private resolveReadTask(): ProcessTaskFormModel | null {
    const currentOrder = this.task().taskOrder;
    const candidates = this.tasks()
      .filter((item) => item.taskType === 'FILE_READ' && item.taskOrder < currentOrder)
      .sort((a, b) => a.taskOrder - b.taskOrder);
    const lastCandidate =
      candidates.length > 0 ? candidates[candidates.length - 1] : null;
    return (
      lastCandidate ??
      this.tasks().find((item) => item.taskType === 'FILE_READ') ??
      null
    );
  }

  private parseObject(configurationJson: string, key: string): Record<string, string> {
    try {
      const parsed = JSON.parse(configurationJson || '{}');
      const value = parsed?.[key];
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
      }
      return Object.entries(value).reduce<Record<string, string>>((accumulator, [entryKey, entryValue]) => {
        accumulator[String(entryKey)] = String(entryValue);
        return accumulator;
      }, {});
    } catch {
      return {};
    }
  }

  updateDraft(patch: Partial<DbWriteTaskDraft>): void {
    const nextDraft = { ...this.draft(), ...patch };
    this.patchTask.emit(this.manager.toTaskPatch(this.task().taskType, nextDraft));
  }
}


