import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { I18nService } from '@integration-hub/core/services';

export type ProcessFlowAction =
  | 'toggle-expanded'
  | 'delete-selection'
  | 'select-all'
  | 'zoom-in'
  | 'zoom-out'
  | 'fit'
  | 'one-to-one'
  | 'undo'
  | 'redo';

@Component({
  selector: 'ih-process-flow-action-panel',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatTooltipModule],
  template: `
    <div class="flow-action-panel">
      <button type="button" mat-icon-button [disabled]="!hasSelection()" (click)="action.emit('delete-selection')" [matTooltip]="i18n.t('flow.deleteSelection')" matTooltipPosition="below">
        <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v6M14 10v6" /></svg>
      </button>
      <button type="button" mat-icon-button (click)="action.emit('toggle-expanded')" [matTooltip]="expanded() ? i18n.t('flow.exitFullView') : i18n.t('flow.expandCanvas')" matTooltipPosition="below">
        @if (expanded()) {
          <svg viewBox="0 0 24 24"><path d="M9 3H5a2 2 0 0 0-2 2v4M15 3h4a2 2 0 0 1 2 2v4M21 15v4a2 2 0 0 1-2 2h-4M3 15v4a2 2 0 0 0 2 2h4" /><path d="m9 9-3 3m0 0 3 3m-3-3h12m0 0-3-3m3 3-3 3" /></svg>
        } @else {
          <svg viewBox="0 0 24 24"><path d="M8 3H4a1 1 0 0 0-1 1v4M16 3h4a1 1 0 0 1 1 1v4M21 16v4a1 1 0 0 1-1 1h-4M3 16v4a1 1 0 0 0 1 1h4" /><path d="m9 9-3-3m3 3V6H6m9 3 3-3m-3 3V6h3m-9 6-3 3m3-3v3H6m9-3 3 3m-3-3v3h3" /></svg>
        }
      </button>
      <button type="button" mat-icon-button [disabled]="nodeCount() === 0" (click)="action.emit('select-all')" [matTooltip]="i18n.t('flow.selectAll')" matTooltipPosition="below">
        <svg viewBox="0 0 24 24"><path d="M8 4H5a1 1 0 0 0-1 1v3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M9 9h6v6H9z" /></svg>
      </button>
      <button type="button" mat-icon-button (click)="action.emit('zoom-in')" [matTooltip]="i18n.t('flow.zoomIn')" matTooltipPosition="below">
        <svg viewBox="0 0 24 24"><path d="M11 8v6M8 11h6M16.5 16.5 21 21M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" /></svg>
      </button>
      <button type="button" mat-icon-button (click)="action.emit('zoom-out')" [matTooltip]="i18n.t('flow.zoomOut')" matTooltipPosition="below">
        <svg viewBox="0 0 24 24"><path d="M8 11h6M16.5 16.5 21 21M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" /></svg>
      </button>
      <button type="button" mat-icon-button (click)="action.emit('fit')" [matTooltip]="i18n.t('flow.fitToScreen')" matTooltipPosition="below">
        <svg viewBox="0 0 24 24"><path d="M8 3H4a1 1 0 0 0-1 1v4M16 3h4a1 1 0 0 1 1 1v4M21 16v4a1 1 0 0 1-1 1h-4M3 16v4a1 1 0 0 0 1 1h4" /></svg>
      </button>
      <button type="button" mat-icon-button (click)="action.emit('one-to-one')" [matTooltip]="i18n.t('flow.oneToOne')" matTooltipPosition="below">
        <svg viewBox="0 0 24 24"><path d="M9 3H5a2 2 0 0 0-2 2v4M15 3h4a2 2 0 0 1 2 2v4M21 15v4a2 2 0 0 1-2 2h-4M3 15v4a2 2 0 0 0 2 2h4M9 9h6v6H9z" /></svg>
      </button>
      <button type="button" mat-icon-button [disabled]="!canUndo()" (click)="action.emit('undo')" [matTooltip]="i18n.t('flow.undo')" matTooltipPosition="below">
        <svg viewBox="0 0 24 24"><path d="m10 7-5 5 5 5" /><path d="M19 17a7 7 0 0 0-7-7H5" /></svg>
      </button>
      <button type="button" mat-icon-button [disabled]="!canRedo()" (click)="action.emit('redo')" [matTooltip]="i18n.t('flow.redo')" matTooltipPosition="below">
        <svg viewBox="0 0 24 24"><path d="m14 7 5 5-5 5" /><path d="M5 17a7 7 0 0 1 7-7h7" /></svg>
      </button>
    </div>
  `,
  styles: [`
      .flow-action-panel {
        display: inline-flex;
        align-items: center;
        gap: 0.2rem;
        padding: 0.3rem;
        border: 1px solid var(--ih-border);
        border-radius: 16px;
        background: color-mix(in srgb, var(--ih-surface) 96%, transparent);
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
        backdrop-filter: blur(10px);
      }
      .flow-action-panel button {
        width: 2rem;
        height: 2rem;
        border-radius: 12px;
        color: var(--ih-text-soft);
      }
      .flow-action-panel button:hover:not([disabled]) {
        background: color-mix(in srgb, var(--ih-surface-alt) 88%, white 12%);
        color: var(--ih-text);
      }
      .flow-action-panel button[disabled] {
        opacity: 0.45;
      }
      .flow-action-panel button svg {
        width: 1rem;
        height: 1rem;
        stroke: currentColor;
        fill: none;
        stroke-width: 2.1;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    `],
})
export class ProcessFlowActionPanelComponent {
  readonly i18n = inject(I18nService);
  readonly nodeCount = input(0);
  readonly hasSelection = input(false);
  readonly canUndo = input(false);
  readonly canRedo = input(false);
  readonly expanded = input(false);

  readonly action = output<ProcessFlowAction>();
}
