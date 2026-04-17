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
    templateUrl: './process-flow-action-panel.component.html',
    styleUrl: './process-flow-action-panel.component.css'
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
