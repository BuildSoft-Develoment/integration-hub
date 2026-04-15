import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FFlowModule } from '@foblex/flow';
import { ProcessTaskManagerService } from '@integration-hub/core/services';
import { processTaskTypes, ProcessTaskType } from '../../process.models';
import { getProcessFlowNodePresentation } from '../../process-flow.presentation';

@Component({
  selector: 'ih-process-flow-palette',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatTooltipModule, FFlowModule],
  template: `
    <div class="flow-palette">
      @for (taskType of taskTypes; track taskType) {
        <button
          fExternalItem
          type="button"
          class="flow-palette__item"
          [fData]="taskType"
          [matTooltip]="taskLabel(taskType)"
          matTooltipPosition="right"
        >
          <span class="flow-palette__icon" [ngClass]="presentation(taskType).toneClass" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path [attr.d]="presentation(taskType).iconPath" />
            </svg>
          </span>
          <span class="flow-palette__label">{{ presentation(taskType).badge }}</span>
        </button>
      }
    </div>
  `,
  styles: [`
      .flow-palette {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 0.2rem;
        padding: 0.3rem;
        border: 1px solid var(--ih-border);
        border-radius: 16px;
        background: color-mix(in srgb, var(--ih-surface) 96%, transparent);
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
        backdrop-filter: blur(10px);
      }
      .flow-palette__item {
        display: grid !important;
        grid-template-columns: 1.1rem minmax(0, 1fr) !important;
        align-items: center !important;
        column-gap: 0.18rem !important;
        row-gap: 0 !important;
        width: 70px !important;
        min-width: 70px !important;
        max-width: 70px !important;
        min-height: 2rem;
        padding: 0.2rem 0.22rem;
        border: 1px solid transparent;
        border-radius: 12px;
        background: transparent;
        color: var(--ih-text-soft);
        cursor: grab;
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        font: inherit;
        line-height: 1;
        transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
      }
      .flow-palette__item.f-external-item,
      .flow-palette__item.f-external-item-dragging,
      .flow-palette__item.f-external-item-preview {
        display: grid !important;
        grid-template-columns: 1.1rem minmax(0, 1fr) !important;
        align-items: center !important;
        column-gap: 0.18rem !important;
        width: 70px !important;
        min-width: 70px !important;
        max-width: 70px !important;
      }
      .flow-palette__item:hover {
        background: color-mix(in srgb, var(--ih-surface-alt) 88%, white 12%);
        color: var(--ih-text);
      }
      .flow-palette__item:active {
        cursor: grabbing;
      }
      .flow-palette__label {
        min-width: 0;
        max-width: 100%;
        font-size: 0.55rem;
        font-weight: 700;
        letter-spacing: 0.02em;
        line-height: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .flow-palette__icon {
        display: inline-grid !important;
        place-items: center !important;
        width: 1.1rem !important;
        height: 1.1rem !important;
        min-width: 1.1rem !important;
        max-width: 1.1rem !important;
        border-radius: 0.3rem;
        color: var(--ih-accent-strong);
      }
      .flow-palette__item > * {
        min-width: 0 !important;
      }
      :host ::ng-deep .f-external-item-dragging,
      :host ::ng-deep .f-external-item-preview {
        width: 70px !important;
        min-width: 70px !important;
        max-width: 70px !important;
        display: grid !important;
        grid-template-columns: 1.1rem minmax(0, 1fr) !important;
        align-items: center !important;
        column-gap: 0.18rem !important;
      }
      .flow-palette__icon svg {
        width: 0.62rem;
        height: 0.62rem;
        stroke: currentColor;
        fill: none;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .task-node--source {
        color: #0f766e;
      }
      .task-node--database {
        color: #1d4ed8;
      }
      .task-node--procedure {
        color: #7c3aed;
      }
      .task-node--function {
        color: #9333ea;
      }
      .task-node--integration {
        color: #ea580c;
      }
      .task-node--notification {
        color: #b45309;
      }
      @media (max-width: 900px) {
        .flow-palette {
          flex-direction: row;
          flex-wrap: wrap;
          padding: 0.3rem;
          gap: 0.2rem;
        }
        .flow-palette__item {
          width: 70px;
          min-width: 70px;
          max-width: 70px;
        }
      }
      @media (max-width: 760px) {
        .flow-palette__item {
          min-height: 1.88rem;
          padding: 0.16rem 0.18rem;
        }
        .flow-palette__icon {
          width: 1.02rem;
          height: 1.02rem;
        }
        .flow-palette__label {
          font-size: 0.52rem;
        }
      }
    `],
})
export class ProcessFlowPaletteComponent {
  private readonly manager = inject(ProcessTaskManagerService);
  readonly taskTypes = processTaskTypes;

  presentation(taskType: ProcessTaskType) {
    return getProcessFlowNodePresentation(taskType);
  }

  taskLabel(taskType: ProcessTaskType): string {
    return this.manager.label(taskType);
  }
}
