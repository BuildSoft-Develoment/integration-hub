// @trace ADR-016 (procesos: formulario de la tarea FILE_WRITE - layout header/detalle/trailer)
import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import {
  FileWriteCellDraft,
  FileWriteColumnDraft,
  FileWriteSourceMode,
  FileWriteTableSourceDraft,
  FileWriteTaskDraft,
  ProcessTaskFormBridgeService,
} from '@integration-hub/core/providers';
import { COMMON_ENCODINGS, SuggestInputComponent } from '@integration-hub/shared/ui';
import { firstValueFrom } from 'rxjs';
import { ConnectionRef, ProcessTaskFormModel } from '../../../models/process.models';
import { ProcessApiService } from '../../../api/process-api.service';
import { DbWriteColumnRef, DbWriteTableRef } from '../../../models/process-db-write.models';
import { ProcessDbWriteTableSelectorComponent } from '../process-db-write-table-selector/process-db-write-table-selector.component';
import { ProcessTaskRuntimePanelComponent } from '../process-task-runtime-panel/process-task-runtime-panel.component';

type CellSection = 'header' | 'trailer';

@Component({
  selector: 'ih-process-file-write-task-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    SuggestInputComponent,
    ProcessDbWriteTableSelectorComponent,
    ProcessTaskRuntimePanelComponent,
  ],
  templateUrl: './process-file-write-task-form.component.html',
  styleUrl: '../file-task-form.shared.css',
})
export class ProcessFileWriteTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bridge = inject(ProcessTaskFormBridgeService);
  private readonly api = inject(ProcessApiService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly connections = input<readonly ConnectionRef[]>([]);
  readonly readonly = input(false);

  readonly draft = computed<FileWriteTaskDraft>(() => this.manager.hydrateDraft<FileWriteTaskDraft>(this.task()) ?? {
    taskRef: this.task().clientId,
    executionMode: 'once',
    format: 'CSV',
    encoding: 'UTF-8',
    lineEnding: 'LF',
    delimiter: ',',
    columns: [],
    header: [],
    trailer: [],
    archiveNameTemplate: '',
    sourceMode: 'records',
    tableSource: { table: '', connectionRef: '', orderBy: 'id', payloadColumn: '', batchSize: '' },
  });

  // 008: sugerencias del combo de codificacion (editable), consistente con los readers.
  readonly encodings = COMMON_ENCODINGS;
  // ADR-016: FILE_WRITE es once-task -> el selector de modo de ejecucion se restringe a 'once' (evita ofrecer
  // batch/per-record, que toTaskPatch igual fuerza a 'once' y rebotarian).
  readonly executionModes = ['once'] as const;

  readonly isTxt = computed(() => this.draft().format === 'TXT');
  readonly isTableSource = computed(() => this.draft().sourceMode === 'table');

  // --- introspeccion de la fuente-tabla (patron DB_WRITE): elegir la tabla por autocomplete y sugerir
  //     las columnas REALES de la tabla en cada `field` del detalle ("alinear campos" con la fuente). ---
  readonly tables = signal<readonly DbWriteTableRef[]>([]);
  readonly columns = signal<readonly DbWriteColumnRef[]>([]);
  // Texto del autocomplete (mientras se escribe/filtra); el valor COMMITEADO vive en draft.tableSource.table.
  readonly tableQuery = signal('');

  readonly selectedConnection = computed(() =>
    this.connections().find((c) => c.name === this.draft().tableSource.connectionRef) ?? null,
  );
  // Sugerencias del `field` de cada columna de detalle = columnas reales de la tabla introspectada. Combo
  // EDITABLE: si la fuente es un JSON por fila (payloadColumn) el usuario escribe las claves manualmente.
  readonly fieldSuggestions = computed(() => this.columns().map((c) => c.name));

  private lastTablesKey = '';
  private lastColumnsKey = '';

  constructor() {
    // Sincroniza el texto del autocomplete con el valor commiteado (hidratacion / seleccion). NO se dispara al
    // TIPEAR (tipear cambia tableQuery, no draft.table), asi que no pisa lo que el usuario escribe.
    effect(() => {
      const table = this.draft().tableSource.table;
      untracked(() => {
        if (this.tableQuery() !== table) this.tableQuery.set(table);
      });
    });
    // Al cambiar la conexion (o entrar en modo tabla), recargar la lista de tablas del autocomplete.
    effect(() => {
      const connId = this.isTableSource() ? this.selectedConnection()?.id ?? null : null;
      const key = String(connId ?? '');
      if (key === this.lastTablesKey) return;
      this.lastTablesKey = key;
      untracked(() => {
        this.tables.set([]);
        if (connId != null) void this.loadTables(connId, '');
      });
    });
    // Introspecciona columnas al cambiar conexion + tabla COMMITEADA (select/hidratacion), no al tipear.
    effect(() => {
      const connId = this.isTableSource() ? this.selectedConnection()?.id ?? null : null;
      const table = this.draft().tableSource.table.trim();
      const key = `${connId ?? 'none'}|${table}`;
      if (key === this.lastColumnsKey) return;
      this.lastColumnsKey = key;
      untracked(() => {
        if (connId != null && table) void this.loadColumns(connId, table);
        else this.columns.set([]);
      });
    });
  }

  setSourceMode(mode: FileWriteSourceMode): void {
    this.updateDraft({ sourceMode: mode });
  }

  updateTableSource(patch: Partial<FileWriteTableSourceDraft>): void {
    this.updateDraft({ tableSource: { ...this.draft().tableSource, ...patch } });
  }

  handleConnectionChange(connectionRef: string): void {
    this.tables.set([]);
    this.columns.set([]);
    this.updateTableSource({ connectionRef });
  }

  // Autocomplete: al tipear filtra las tablas del server; NO commitea (evita introspeccionar columnas por tecla).
  onTableQuery(query: string): void {
    this.tableQuery.set(query);
    const connId = this.selectedConnection()?.id;
    if (connId != null) void this.loadTables(connId, String(query || '').trim());
  }

  // Al elegir una tabla del autocomplete se commitea el nombre CALIFICADO (schema.tabla) -> el effect carga columnas.
  onTablePick(table: DbWriteTableRef): void {
    this.updateTableSource({ table: table.qualifiedName });
  }

  private async loadTables(connectionId: number, query: string): Promise<void> {
    // Introspeccion best-effort: si falla (rol insuficiente / conexion caida) se degrada a lista vacia
    // (el autocomplete no ofrece nada, pero el form sigue usable con texto libre).
    try {
      this.tables.set(await firstValueFrom(this.api.listConnectionTables(connectionId, { query })));
    } catch {
      this.tables.set([]);
    }
  }

  private async loadColumns(connectionId: number, qualifiedTable: string): Promise<void> {
    const dot = qualifiedTable.lastIndexOf('.');
    const schema = dot > 0 ? qualifiedTable.slice(0, dot) : undefined;
    const table = dot > 0 ? qualifiedTable.slice(dot + 1) : qualifiedTable;
    try {
      this.columns.set(await firstValueFrom(this.api.listConnectionColumns(connectionId, { schema, table })));
    } catch {
      this.columns.set([]);
    }
  }

  updateDraft(patch: Partial<FileWriteTaskDraft>): void {
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, { ...this.draft(), ...patch }));
  }

  // --- columnas de detalle ---
  addColumn(): void {
    this.updateDraft({ columns: [...this.draft().columns, { field: '' }] });
  }

  removeColumn(index: number): void {
    this.updateDraft({ columns: this.draft().columns.filter((_, i) => i !== index) });
  }

  updateColumn(index: number, patch: Partial<FileWriteColumnDraft>): void {
    this.updateDraft({ columns: this.draft().columns.map((column, i) => (i === index ? { ...column, ...patch } : column)) });
  }

  // --- celdas de cabecera / trailer ---
  cells(section: CellSection): FileWriteCellDraft[] {
    return section === 'header' ? this.draft().header : this.draft().trailer;
  }

  addCell(section: CellSection): void {
    this.setCells(section, [...this.cells(section), { kind: 'value', value: '' }]);
  }

  removeCell(section: CellSection, index: number): void {
    this.setCells(section, this.cells(section).filter((_, i) => i !== index));
  }

  updateCell(section: CellSection, index: number, patch: Partial<FileWriteCellDraft>): void {
    this.setCells(section, this.cells(section).map((cell, i) => (i === index ? { ...cell, ...patch } : cell)));
  }

  private setCells(section: CellSection, cells: FileWriteCellDraft[]): void {
    this.updateDraft(section === 'header' ? { header: cells } : { trailer: cells });
  }
}
