import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DbExecuteStoredProcedureTaskDraft, ProcessTaskFormBridgeService, ProcessTaskParameterBindingDraft } from '@integration-hub/core/providers';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { firstValueFrom } from 'rxjs';
import { ConnectionRef, ProcessTaskFormModel, ReaderRef } from '../../../models/process.models';
import { ProcessApiService } from '../../../api/process-api.service';
import { ProcessTaskBindingContextService } from '../../../forms/process-task-binding-context.service';
import { DbRoutineRef } from '../../../models/process-db-routine.models';
import { DbWriteSchemaRef } from '../../../models/process-db-write.models';
import { ProcessDbRoutineSelectorComponent } from '../process-db-routine-selector/process-db-routine-selector.component';
import { ProcessTaskBindingBoardComponent } from '../process-task-binding-board/process-task-binding-board.component';
import { ProcessTaskRuntimePanelComponent } from '../process-task-runtime-panel/process-task-runtime-panel.component';
import { ConnectionSelectComponent } from '../connection-select/connection-select.component';

@Component({
  selector: 'ih-process-db-execute-sp-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule, MatSelectModule, ProcessDbRoutineSelectorComponent, ProcessTaskBindingBoardComponent, ProcessTaskRuntimePanelComponent, ConnectionSelectComponent],
    templateUrl: './process-db-execute-sp-task-form.component.html',
    styleUrl: './process-db-execute-sp-task-form.component.css'
})
export class ProcessDbExecuteSpTaskFormComponent {
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

  readonly draft = computed<DbExecuteStoredProcedureTaskDraft>(() => this.manager.hydrateDraft<DbExecuteStoredProcedureTaskDraft>(this.task()) ?? {
    taskRef: this.task().clientId,
    executionMode: 'once',
    connectionRef: '',
    procedureSchema: '',
    procedureName: '',
    timeoutSeconds: '30',
    parameters: [],
  });
  readonly groupedSources = computed(() => this.bindingContext.groupOptions(this.bindingContext.buildOptions(this.task(), this.tasks(), this.readers(), this.draft().input)));
  readonly selectedConnection = computed(() => this.connections().find((item) => item.name === this.draft().connectionRef) ?? null);
  readonly procedureSchema = computed(() => this.draft().procedureSchema || this.parseQualifiedName(this.draft().procedureName).schema || '');

  private lastConnectionId: number | null = null;
  private lastParametersKey = '';

  constructor() {
    effect(() => {
      const qualifiedName = this.draft().procedureName || '';
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
        void this.loadRoutines(connectionId, this.procedureSchema(), this.routineQuery());
      }
    });

    effect(() => {
      const connectionId = this.selectedConnection()?.id ?? null;
      const key = `${connectionId ?? 'none'}|${this.procedureSchema()}|${this.draft().procedureName}`;
      if (key === this.lastParametersKey) {
        return;
      }
      this.lastParametersKey = key;
      if (connectionId && this.draft().procedureName) {
        const { name } = this.parseQualifiedName(this.draft().procedureName);
        if (name) {
          void this.loadParameters(connectionId, this.procedureSchema(), name);
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
      procedureSchema: '',
      procedureName: '',
      parameters: [],
    });
  }

  handleSchemaChange(schema: string): void {
    this.routineQuery.set('');
    this.routines.set([]);
    this.updateDraft({
      procedureSchema: schema || '',
      procedureName: '',
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
      void this.loadRoutines(connectionId, this.procedureSchema(), query);
    }
  }

  handleRoutineSelect(routine: DbRoutineRef): void {
    this.routineQuery.set(routine.qualifiedName);
    this.lastParametersKey = '';
    this.updateDraft({
      procedureSchema: routine.schema ?? '',
      procedureName: routine.qualifiedName,
    });
    const connectionId = this.selectedConnection()?.id;
    const { name } = this.parseQualifiedName(routine.qualifiedName);
    if (connectionId && name) {
      void this.loadParameters(connectionId, routine.schema ?? '', name);
    }
  }

  updateDraft(patch: Partial<DbExecuteStoredProcedureTaskDraft>): void {
    const nextDraft = { ...this.draft(), ...patch };
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, nextDraft));
  }

  private async loadSchemas(connectionDefinitionId: number): Promise<void> {
    this.schemas.set(await firstValueFrom(this.api.listConnectionSchemas(connectionDefinitionId)));
  }

  private async loadRoutines(connectionDefinitionId: number, schema: string, query: string): Promise<void> {
    this.routines.set(await firstValueFrom(this.api.listConnectionProcedures(connectionDefinitionId, { schema, query })));
  }

  private async loadParameters(connectionDefinitionId: number, schema: string, procedure: string): Promise<void> {
    const parameters = await firstValueFrom(this.api.listConnectionProcedureParameters(connectionDefinitionId, { schema, procedure }));
    const currentByName = new Map(this.draft().parameters.map((entry) => [entry.name, entry]));
    const next = parameters.map((entry) => {
      const current = currentByName.get(entry.parameterName);
      return {
        name: entry.parameterName,
        jdbcType: (entry.jdbcType || 'VARCHAR').trim().toUpperCase(),
        direction: (entry.direction || 'IN').trim().toUpperCase(),
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
