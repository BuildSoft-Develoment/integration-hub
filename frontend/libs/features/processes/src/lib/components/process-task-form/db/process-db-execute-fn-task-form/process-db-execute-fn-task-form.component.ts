import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DbExecuteFunctionTaskDraft, ProcessTaskFormBridgeService, ProcessTaskParameterBindingDraft } from '@integration-hub/core/providers';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { firstValueFrom } from 'rxjs';
import { ConnectionRef, ProcessTaskFormModel, ReaderRef } from '../../../../models/process.models';
import { ProcessApiService } from '../../../../api/process-api.service';
import { ProcessTaskBindingContextService } from '../../../../forms/process-task-binding-context.service';
import { DbRoutineRef } from '../../../../models/process-db-routine.models';
import { DbWriteSchemaRef } from '../../../../models/process-db-write.models';
import { ProcessDbRoutineSelectorComponent } from '../process-db-routine-selector/process-db-routine-selector.component';
import { ProcessTaskBindingBoardComponent } from '../../shared/process-task-binding-board/process-task-binding-board.component';
import { ProcessTaskRuntimePanelComponent } from '../../shared/process-task-runtime-panel/process-task-runtime-panel.component';
import { ConnectionSelectComponent } from '../../shared/connection-select/connection-select.component';
import { TaskFormShellComponent } from '../../shared/task-form-shell/task-form-shell.component';

@Component({
  selector: 'ih-process-db-execute-fn-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule, MatSelectModule, ProcessDbRoutineSelectorComponent, ProcessTaskBindingBoardComponent, ProcessTaskRuntimePanelComponent, ConnectionSelectComponent, TaskFormShellComponent],
    templateUrl: './process-db-execute-fn-task-form.component.html',
    styleUrl: './process-db-execute-fn-task-form.component.css'
})
export class ProcessDbExecuteFnTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly api = inject(ProcessApiService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bindingContext = inject(ProcessTaskBindingContextService);
  // M-1b: outputs viajan al host via bridge.
  private readonly bridge = inject(ProcessTaskFormBridgeService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly readers = input.required<readonly ReaderRef[]>();
  readonly connections = input.required<readonly ConnectionRef[]>();
  readonly readonly = input(false);

  readonly schemas = signal<DbWriteSchemaRef[]>([]);
  readonly routines = signal<DbRoutineRef[]>([]);
  readonly routineQuery = signal('');

  readonly draft = computed<DbExecuteFunctionTaskDraft>(() => this.manager.draftFor<DbExecuteFunctionTaskDraft>(this.task()));
  readonly groupedSources = computed(() => this.bindingContext.groupOptions(this.bindingContext.buildOptions(this.task(), this.tasks(), this.readers(), this.draft().input)));
  readonly selectedConnection = computed(() => this.connections().find((item) => item.name === this.draft().connectionRef) ?? null);
  readonly functionSchema = computed(() => this.draft().functionSchema || this.parseQualifiedName(this.draft().functionName).schema || '');

  private lastConnectionId: number | null = null;
  private lastParametersKey = '';

  constructor() {
    effect(() => {
      const qualifiedName = this.draft().functionName || '';
      if (!qualifiedName) {
        if (this.routineQuery()) {
          this.routineQuery.set('');
        }
        return;
      }
      if (!this.routineQuery() || this.routineQuery() === qualifiedName) {
        this.routineQuery.set(qualifiedName);
      }
    });

    effect(() => {
      const connectionId = this.selectedConnection()?.id ?? null;
      if (connectionId === this.lastConnectionId) {
        return;
      }
      this.lastConnectionId = connectionId;
      this.schemas.set([]);
      this.routines.set([]);
      if (connectionId != null) {
        void this.loadSchemas(connectionId);
        void this.loadRoutines(connectionId, this.functionSchema(), this.routineQuery());
      }
    });

    effect(() => {
      const connectionId = this.selectedConnection()?.id ?? null;
      const key = `${connectionId ?? 'none'}|${this.functionSchema()}|${this.draft().functionName}`;
      if (key === this.lastParametersKey) {
        return;
      }
      this.lastParametersKey = key;
      if (connectionId && this.draft().functionName) {
        const { name } = this.parseQualifiedName(this.draft().functionName);
        if (name) {
          void this.loadParameters(connectionId, this.functionSchema(), name);
        }
      } else if (this.draft().parameters.length) {
        this.updateDraft({ parameters: [] });
      }
    });
  }

  handleConnectionChange(connectionRef: string): void {
    this.routineQuery.set('');
    this.schemas.set([]);
    this.routines.set([]);
    this.updateDraft({
      connectionRef,
      functionSchema: '',
      functionName: '',
      parameters: [],
    });
  }

  handleSchemaChange(schema: string): void {
    this.routineQuery.set('');
    this.routines.set([]);
    this.updateDraft({
      functionSchema: schema || '',
      functionName: '',
      parameters: [],
    });
    const connectionId = this.selectedConnection()?.id;
    if (connectionId) {
      void this.loadRoutines(connectionId, schema || '', '');
    }
  }

  handleRoutineQueryChange(query: string): void {
    this.routineQuery.set(query);
    const connectionId = this.selectedConnection()?.id;
    if (connectionId) {
      void this.loadRoutines(connectionId, this.functionSchema(), query);
    }
  }

  handleRoutineSelect(routine: DbRoutineRef): void {
    this.routineQuery.set(routine.qualifiedName);
    this.lastParametersKey = '';
    this.updateDraft({
      functionSchema: routine.schema ?? '',
      functionName: routine.qualifiedName,
    });
    const connectionId = this.selectedConnection()?.id;
    const { name } = this.parseQualifiedName(routine.qualifiedName);
    if (connectionId && name) {
      void this.loadParameters(connectionId, routine.schema ?? '', name);
    }
  }

  updateDraft(patch: Partial<DbExecuteFunctionTaskDraft>): void {
    const nextDraft = { ...this.draft(), ...patch };
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, nextDraft));
  }

  private async loadSchemas(connectionDefinitionId: number): Promise<void> {
    this.schemas.set(await firstValueFrom(this.api.listConnectionSchemas(connectionDefinitionId)));
  }

  private async loadRoutines(connectionDefinitionId: number, schema: string, query: string): Promise<void> {
    this.routines.set(await firstValueFrom(this.api.listConnectionFunctions(connectionDefinitionId, { schema, query })));
  }

  private async loadParameters(connectionDefinitionId: number, schema: string, fn: string): Promise<void> {
    const parameters = await firstValueFrom(this.api.listConnectionFunctionParameters(connectionDefinitionId, { schema, function: fn }));
    const currentByName = new Map(this.draft().parameters.map((entry) => [entry.name, entry]));
    const next = parameters.map((entry) => {
      const current = currentByName.get(entry.parameterName);
      return {
        name: entry.parameterName,
        jdbcType: (entry.jdbcType || 'VARCHAR').trim().toUpperCase(),
        direction: 'IN',
        sourceKind: current?.sourceKind ?? null,
        sourceKey: current?.sourceKey ?? '',
        sourceLabel: current?.sourceLabel ?? '',
        expression: current?.expression ?? '',
      } satisfies ProcessTaskParameterBindingDraft;
    });
    this.updateDraft({ parameters: next });
  }

  private parseQualifiedName(qualifiedName: string): { schema: string; name: string } {
    const normalized = String(qualifiedName || '').trim();
    if (!normalized.includes('.')) {
      return { schema: '', name: normalized };
    }
    const index = normalized.lastIndexOf('.');
    return {
      schema: normalized.slice(0, index),
      name: normalized.slice(index + 1),
    };
  }
}
