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
  template: `
    <section class="task-shell">
      <div class="task-shell__header">
        <div>
          <p class="section-eyebrow">{{ i18n.t('ui.provider') }}</p>
          <h4>{{ i18n.t('ui.tasks', { count: tasks().length }) }}</h4>
        </div>
      </div>

      <div class="task-designer">
        <div class="task-flow-shell" [class.task-flow-shell--expanded]="expanded()">
          @if (!readonly()) {
            <div class="task-flow-shell__palette" [class.task-flow-shell__palette--expanded]="expanded()">
              <ih-process-flow-palette />
            </div>
          }

          <div class="task-flow-shell__actions" [class.task-flow-shell__actions--expanded]="expanded()">
            <ih-process-flow-action-panel
              [nodeCount]="tasks().length"
              [hasSelection]="hasSelection()"
              [canUndo]="flowApiService.canUndo()"
              [canRedo]="flowApiService.canRedo()"
              [expanded]="expanded()"
              (action)="handleAction($event)"
            />
          </div>

          <f-flow
            fDraggable
            class="task-flow-root"
            (fCreateNode)="handleCreateNode($event)"
            (fCreateConnection)="handleCreateConnection($event)"
            (fReassignConnection)="handleReassignConnection($event)"
            (fMoveNodes)="handleMoveNodes($event)"
            (fSelectionChange)="handleSelectionChange($event)"
          >
            <f-background>
              <f-circle-pattern />
            </f-background>
            <f-line-alignment [fAlignThreshold]="20" />
            <f-selection-area />

              <f-canvas
              #canvasRef
              fZoom
              class="task-flow-canvas"
              [scale]="designerModel().transform?.zoom"
              [position]="canvasPosition()"
              [debounceTime]="120"
              (fCanvasChange)="handleCanvasChange($event)"
            >
              @for (edge of flowLayout().edges; track edge.id) {
                <f-connection
                  fBehavior="fixed"
                  [fConnectionId]="edge.id"
                  [fOffset]="24"
                  fType="segment"
                  [fOutputId]="edge.source + '-out'"
                  [fInputId]="edge.target + '-in'"
                  fOutputSide="bottom"
                  fInputSide="top"
                >
                  <svg viewBox="0 0 700 700" fMarker [type]="'end'" [height]="5" [width]="5" [refX]="4" [refY]="2.5">
                    <path d="M0,0L700,350L0,700L150,350z" />
                  </svg>
                </f-connection>
              }

              <f-connection-for-create fType="segment" [fOffset]="24">
                <svg viewBox="0 0 700 700" fMarker [type]="'end'" [height]="5" [width]="5" [refX]="4" [refY]="2.5">
                  <path d="M0,0L700,350L0,700L150,350z" />
                </svg>
              </f-connection-for-create>

              @for (node of flowLayout().nodes; track node.id) {
                <div
                  fNode
                  fDragHandle
                  [class.task-node-host--active]="selectedTaskId() === node.taskRef"
                  [fNodeId]="node.id"
                  [fNodePosition]="node.position"
                  [fNodeSize]="node.size"
                >
                  <div
                    class="task-node__port task-node__port--in"
                    fNodeInput
                    [fInputId]="node.id + '-in'"
                    fInputConnectableSide="top"
                  ></div>

                  <ih-process-flow-node
                    [node]="node"
                    [ordinal]="taskOrdinal(node.taskRef)"
                    [title]="taskTypeLabel(node.type)"
                    [summary]="summarizeByRef(node.taskRef)"
                    [presentation]="nodePresentation(node)"
                    (edit)="openTask($event)"
                    (expandedChange)="resizeNode(node.id, $event)"
                  />

                  <div
                    class="task-node__port task-node__port--out"
                    fNodeOutput
                    [fOutputId]="node.id + '-out'"
                    [fOutputDisabled]="readonly()"
                    fOutputConnectableSide="bottom"
                    (click)="removeOutgoingConnection(node.id, $event)"
                  >
                    @if (!readonly() && outgoingConnectionId(node.id)) {
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M6 6 18 18M18 6 6 18" />
                      </svg>
                    }
                  </div>
                </div>
              }
            </f-canvas>

            <f-minimap class="task-flow-shell__minimap" [fMinSize]="1800" />
          </f-flow>
        </div>
      </div>

      @if (selectedTask(); as activeTask) {
        <ih-process-task-modal
          [task]="activeTask"
          [tasks]="tasks()"
          [index]="selectedTaskIndex()"
          [sources]="sources()"
          [readers]="readers()"
          [connections]="connections()"
          [readonly]="readonly()"
          (patchTask)="patchTask.emit({ clientId: activeTask.clientId, patch: $event })"
          (close)="closeTask()"
        />
      }
    </section>
  `,
  styles: [`
      .task-shell {
        display: grid;
        gap: 0.9rem;
      }
      .task-shell__header {
        display: flex;
        gap: 1rem;
        align-items: end;
        justify-content: space-between;
      }
      .section-eyebrow {
        margin: 0;
        font-size: 0.74rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--ih-text-soft);
      }
      h4 {
        margin: 0.28rem 0 0;
        font-size: 1rem;
      }
      .task-designer {
        display: block;
        min-height: 580px;
      }
      .task-flow-shell {
        position: relative;
        min-height: 580px;
        border: 1px solid var(--ih-border);
        border-radius: 22px;
        background:
          radial-gradient(circle at top left, color-mix(in srgb, var(--ih-accent) 7%, transparent), transparent 32%),
          linear-gradient(180deg, color-mix(in srgb, var(--ih-surface-alt) 95%, transparent), color-mix(in srgb, var(--ih-surface) 96%, transparent));
        overflow: hidden;
      }
      .task-flow-shell--expanded {
        position: fixed;
        inset: 0 0 0 var(--ih-shell-sidebar-width);
        min-height: 0;
        z-index: 1200;
        border-radius: 0;
        border: 0;
        box-shadow: none;
        background:
          radial-gradient(circle at top left, color-mix(in srgb, var(--ih-accent) 5%, transparent), transparent 24%),
          linear-gradient(
            180deg,
            color-mix(in srgb, var(--ih-surface-alt) 100%, transparent),
            color-mix(in srgb, var(--ih-surface) 100%, transparent)
          );
      }
      .task-flow-shell__palette {
        position: absolute;
        top: 1rem;
        left: 1rem;
        z-index: 5;
        width: 80px;
        max-width: calc(100% - 8rem);
      }
      .task-flow-shell__palette--expanded {
        position: fixed;
        top: 1.25rem;
        left: calc(var(--ih-shell-sidebar-width) + 1.25rem);
        z-index: 1210;
        width: 80px;
        min-width: 80px;
        max-width: calc(100vw - var(--ih-shell-sidebar-width) - 7rem);
        pointer-events: auto;
      }
      .task-flow-shell__actions {
        position: absolute;
        top: 1rem;
        right: 1rem;
        z-index: 5;
      }
      .task-flow-shell__actions--expanded {
        position: fixed;
        top: 1.25rem;
        right: 1.25rem;
        z-index: 1210;
      }
      .task-flow-root,
      .task-flow-canvas {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 580px;
      }
      .task-flow-shell--expanded .task-flow-root,
      .task-flow-shell--expanded .task-flow-canvas {
        min-height: 100%;
      }
      :host ::ng-deep f-connection path,
      :host ::ng-deep f-connection-for-create path {
        stroke: color-mix(in srgb, var(--ih-accent-strong) 78%, #0f172a) !important;
        stroke-width: 2.75px !important;
        fill: none !important;
      }
      :host ::ng-deep f-connection:hover path {
        stroke: color-mix(in srgb, var(--ih-accent-strong) 92%, white 8%) !important;
        stroke-width: 3.1px !important;
      }
      :host ::ng-deep f-connection-marker path {
        fill: color-mix(in srgb, var(--ih-accent-strong) 78%, #0f172a) !important;
      }
      :host ::ng-deep .f-connection-selection path {
        stroke: color-mix(in srgb, var(--ih-accent-strong) 36%, transparent) !important;
        stroke-width: 10px !important;
      }
      :host ::ng-deep .f-line-alignment line {
        stroke: color-mix(in srgb, var(--ih-accent) 30%, transparent) !important;
        stroke-width: 1.5px !important;
      }
      .task-flow-shell__minimap {
        position: absolute;
        right: 1rem;
        bottom: 1rem;
        z-index: 4;
        width: 220px;
        height: 160px;
        border-radius: 18px;
        overflow: hidden;
        border: 1px solid var(--ih-border);
        background: color-mix(in srgb, var(--ih-surface) 92%, transparent);
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
        backdrop-filter: blur(10px);
      }
      .task-node-host--active {
        display: block;
        border-radius: 18px;
        box-shadow: 0 18px 34px rgba(15, 23, 42, 0.16);
      }
      :host ::ng-deep .f-node-selected .task-node,
      .task-node-host--active .task-node {
        border-color: color-mix(in srgb, var(--ih-accent) 48%, var(--ih-border));
        box-shadow:
          0 0 0 3px color-mix(in srgb, var(--ih-accent) 16%, transparent),
          0 18px 34px rgba(15, 23, 42, 0.14);
      }
      .task-node__port {
        position: absolute;
        left: 50%;
        width: 13px;
        height: 13px;
        border-radius: 999px;
        background: var(--ih-accent);
        border: 2px solid white;
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--ih-accent) 18%, transparent);
        transform: translateX(-50%);
        z-index: 3;
        transition: transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
      }
      .task-node__port--in {
        top: -6px;
      }
      .task-node__port--out {
        bottom: -6px;
        display: inline-grid;
        place-items: center;
        cursor: pointer;
      }
      .task-node__port--out svg {
        width: 0.54rem;
        height: 0.54rem;
        stroke: white;
        fill: none;
        stroke-width: 2.2;
        stroke-linecap: round;
        stroke-linejoin: round;
        pointer-events: none;
      }
      .task-node-host--active .task-node__port,
      :host ::ng-deep .f-node-selected .task-node__port {
        transform: translateX(-50%) scale(1.08);
        box-shadow: 0 0 0 4px color-mix(in srgb, var(--ih-accent) 24%, transparent);
      }
      @media (max-width: 760px) {
        .task-flow-shell--expanded {
          inset: 0;
          border-radius: 0;
          border: 0;
        }
        .task-flow-shell,
        .task-flow-root,
        .task-flow-canvas {
          min-height: 460px;
        }
        .task-flow-shell__palette {
          top: 0.75rem;
          left: 0.75rem;
          width: 80px;
          max-width: calc(100% - 7rem);
        }
        .task-flow-shell__palette--expanded {
          position: fixed;
          top: 0.75rem;
          left: calc(var(--ih-shell-sidebar-width) + 0.75rem);
          width: 80px;
          min-width: 80px;
          max-width: calc(100vw - var(--ih-shell-sidebar-width) - 6rem);
        }
        .task-flow-shell__actions {
          top: 0.75rem;
          right: 0.75rem;
        }
        .task-flow-shell__actions--expanded {
          position: fixed;
          top: 0.75rem;
          right: 0.75rem;
        }
        .task-flow-shell__minimap {
          right: 0.75rem;
          bottom: 0.75rem;
          width: 160px;
          height: 120px;
        }
      }
    `],
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

