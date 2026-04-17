import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal, viewChild } from '@angular/core';
import {
  FCanvasChangeEvent,
  FCanvasComponent,
  FFlowComponent,
  FFlowModule,
  FMoveNodesEvent,
  FSelectionChangeEvent,
  FZoomDirective,
} from '@foblex/flow';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { ProcessFlowLayout, ProcessFlowNode } from '../../process-flow.models';
import { ProcessFlowApiService } from '../../process-flow-api.service';
import { getProcessFlowNodePresentation } from '../../process-flow.presentation';
import { ConnectionRef, ProcessTaskFormModel, ProcessTaskType, ReaderRef, SourceRef } from '../../process.models';
import {
  ProcessFlowAction,
  ProcessFlowActionPanelComponent,
} from '../process-flow-action-panel/process-flow-action-panel.component';
import { ProcessFlowNodeComponent } from '../process-flow-node/process-flow-node.component';
import { ProcessFlowPaletteComponent } from '../process-flow-palette/process-flow-palette.component';
import { ProcessTaskModalComponent } from '../process-task-modal/process-task-modal.component';

@Component({
  selector: 'ih-process-task-list',
  standalone: true,
  imports: [
    CommonModule,
    FFlowModule,
    ProcessFlowActionPanelComponent,
    ProcessFlowNodeComponent,
    ProcessFlowPaletteComponent,
    ProcessTaskModalComponent,
  ],
    templateUrl: './process-task-list.component.html',
    styleUrl: './process-task-list.component.css'
})
export class ProcessTaskListComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  readonly flowApiService = inject(ProcessFlowApiService);

  private readonly flowRef = viewChild(FFlowComponent);
  private readonly canvasRef = viewChild(FCanvasComponent);
  private readonly zoomRef = viewChild(FZoomDirective);

  readonly selectedTaskId = signal<string | null>(null);
  readonly selection = signal<{ nodes: string[]; connections: string[] }>({ nodes: [], connections: [] });
  readonly expanded = signal(false);

  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly flowLayout = input.required<ProcessFlowLayout>();
  readonly sources = input.required<readonly SourceRef[]>();
  readonly readers = input.required<readonly ReaderRef[]>();
  readonly connections = input.required<readonly ConnectionRef[]>();
  readonly readonly = input(false);

  readonly designerModel = computed(() => this.flowApiService.setModelFromLayout(this.flowLayout()));
  readonly canvasPosition = computed(() => {
    const transform = this.designerModel()?.transform;
    return transform ? { x: transform.x, y: transform.y } : undefined;
  });
  readonly hasSelection = computed(() => this.selection().nodes.length > 0 || this.selection().connections.length > 0);

  readonly selectedTask = computed(
    () => this.tasks().find((task) => task.clientId === this.selectedTaskId()) ?? null
  );

  readonly selectedTaskIndex = computed(() =>
    Math.max(
      0,
      this.tasks().findIndex((task) => task.clientId === this.selectedTaskId())
    )
  );

  readonly addTask = output<ProcessTaskType>();
  readonly addTaskAt = output<{ taskType: ProcessTaskType; position?: { x: number; y: number } }>();
  readonly removeTask = output<string>();
  readonly patchTask = output<{ clientId: string; patch: Partial<ProcessTaskFormModel> }>();
  readonly flowLayoutChange = output<ProcessFlowLayout>();
  readonly flowStateChange = output<{ layout: ProcessFlowLayout; tasks: ProcessTaskFormModel[] }>();

  constructor() {
    effect(() => {
      this.flowApiService.setModelFromLayout(this.flowLayout());
    });
  }

  summarize(task: ProcessTaskFormModel): string {
    return this.manager.summarize(task, {
      sources: this.sources(),
      readers: this.readers(),
      connections: this.connections(),
    });
  }

  summarizeByRef(taskRef: string): string {
    const task = this.tasks().find((item) => item.clientId === taskRef);
    return task ? this.summarize(task) : '';
  }

  taskTypeLabel(taskType: ProcessTaskType): string {
    return this.manager.label(taskType);
  }

  taskOrdinal(taskRef: string): string {
    const index = this.tasks().findIndex((task) => task.clientId === taskRef);
    return this.i18n.t('ui.task', { index: index + 1 });
  }

  nodePresentation(node: ProcessFlowNode) {
    return getProcessFlowNodePresentation(node.type);
  }

  openTask(clientId: string): void {
    const nextSelection = { nodes: [clientId], connections: [] };
    this.selection.set(nextSelection);
    this.flowApiService.updateSelection(nextSelection.nodes, nextSelection.connections);
    this.flowRef()?.select([clientId], [], false);
    this.selectedTaskId.set(clientId);
  }

  closeTask(): void {
    this.selectedTaskId.set(null);
  }

  updateNodePosition(nodeId: string, position: { x: number; y: number }): void {
    this.flowLayoutChange.emit(this.flowApiService.moveNode(this.flowLayout(), nodeId, position));
  }

  resizeNode(nodeId: string, event: { expanded: boolean; height: number }): void {
    const nextHeight = event.expanded ? Math.max(120, event.height) : 120;
    const nextLayout: ProcessFlowLayout = {
      ...this.flowLayout(),
      nodes: this.flowLayout().nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              size: {
                width: node.size?.width ?? 220,
                height: nextHeight,
              },
            }
          : node
      ),
    };
    this.flowLayoutChange.emit(nextLayout);
  }

  handleMoveNodes(event: FMoveNodesEvent): void {
    if (this.readonly()) {
      return;
    }
    this.flowLayoutChange.emit(this.flowApiService.moveNodes(this.flowLayout(), event));
  }

  handleCreateNode(event: { data: ProcessTaskType; externalItemRect?: { x: number; y: number }; rect?: { x: number; y: number } }): void {
    if (this.readonly()) {
      return;
    }
    const rect = event.externalItemRect ?? event.rect;
    this.addTaskAt.emit({
      taskType: event.data,
      position: rect ? { x: rect.x, y: rect.y } : undefined,
    });
  }

  handleCreateConnection(event: { sourceId: string; targetId?: string }): void {
    if (this.readonly()) {
      return;
    }
    this.flowLayoutChange.emit(this.flowApiService.createConnection(this.flowLayout(), event.sourceId, event.targetId));
  }

  handleReassignConnection(event: {
    connectionId: string;
    previousSourceId: string;
    nextSourceId?: string;
    previousTargetId: string;
    nextTargetId?: string;
  }): void {
    if (this.readonly()) {
      return;
    }
    this.flowLayoutChange.emit(
      this.flowApiService.reassignConnection(
        this.flowLayout(),
        event.connectionId,
        event.nextSourceId,
        event.nextTargetId,
        event.previousSourceId,
        event.previousTargetId
      )
    );
  }

  handleSelectionChange(event: FSelectionChangeEvent): void {
    const nodeIds = [...((event as any).fNodeIds ?? (event as any).nodeIds ?? [])];
    const connectionIds = [...((event as any).fConnectionIds ?? (event as any).connectionIds ?? [])];
    this.selection.set({
      nodes: nodeIds,
      connections: connectionIds,
    });
    this.flowApiService.updateSelection(nodeIds, connectionIds);
  }

  handleCanvasChange(event: FCanvasChangeEvent): void {
    this.flowApiService.updateTransform(event.position, event.scale);
  }

  handleAction(action: ProcessFlowAction): void {
    switch (action) {
      case 'delete-selection': {
        const removedTaskIds = new Set(this.selection().nodes);
        const next = this.flowApiService.removeSelected(this.flowLayout(), this.tasks());
        this.selection.set({ nodes: [], connections: [] });
        if (this.selectedTaskId() && removedTaskIds.has(this.selectedTaskId()!)) {
          this.closeTask();
        }
        this.flowStateChange.emit(next);
        break;
      }
      case 'toggle-expanded':
        this.expanded.update((value) => !value);
        queueMicrotask(() => this.canvasRef()?.fitToScreen());
        break;
      case 'select-all': {
        const selection = this.flowApiService.selectAll(this.flowLayout());
        this.selection.set(selection);
        this.flowRef()?.select(selection.nodes, selection.connections, false);
        break;
      }
      case 'zoom-in':
        this.zoomRef()?.zoomIn();
        break;
      case 'zoom-out':
        this.zoomRef()?.zoomOut();
        break;
      case 'fit':
        this.canvasRef()?.fitToScreen();
        break;
      case 'one-to-one':
        this.canvasRef()?.resetScaleAndCenter();
        break;
      case 'undo': {
        const { layout, tasks } = this.flowApiService.undo(this.flowLayout(), this.tasks());
        this.selection.set({ nodes: [], connections: [] });
        this.flowStateChange.emit({ layout, tasks });
        break;
      }
      case 'redo': {
        const { layout, tasks } = this.flowApiService.redo(this.flowLayout(), this.tasks());
        this.selection.set({ nodes: [], connections: [] });
        this.flowStateChange.emit({ layout, tasks });
        break;
      }
    }
  }

  removeConnection(connectionId: string, event: Event): void {
    event.stopPropagation();
    const next = this.flowApiService.removeConnection(this.flowLayout(), this.tasks(), connectionId);
    this.selection.set({ nodes: [], connections: [] });
    this.flowStateChange.emit(next);
  }

  outgoingConnectionId(nodeId: string): string | null {
    return this.flowLayout().edges.find((edge) => edge.source === nodeId)?.id ?? null;
  }

  removeOutgoingConnection(nodeId: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const connectionId = this.outgoingConnectionId(nodeId);
    if (!connectionId) {
      return;
    }
    this.removeConnection(connectionId, event);
  }
}

