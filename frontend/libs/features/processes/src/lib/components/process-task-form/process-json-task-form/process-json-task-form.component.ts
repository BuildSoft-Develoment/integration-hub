import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { I18nService } from '@integration-hub/core/services';
import { ProcessTaskFormBridgeService } from '@integration-hub/core/providers';
import { ConnectionRef, ProcessTaskFormModel } from '../../../models/process.models';

@Component({
  selector: 'ih-process-json-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule],
  template: `
    @if (connections().length > 0) {
      <div class="helper-line ih-muted">
        {{ i18n.t('processes.availableConnections') }}: {{ connectionNames() }}
      </div>
    }

    <mat-form-field class="full-width">
      <mat-label>{{ i18n.t('ui.taskConfigJson') }}</mat-label>
      <textarea matInput [disabled]="readonly()" [ngModel]="task().configurationJson" (ngModelChange)="onConfigurationChange($event)"></textarea>
    </mat-form-field>
  `,
  styles: [`
      :host {
        display: grid;
        gap: 1rem;
      }
      .full-width {
        width: 100%;
      }
      .helper-line {
        margin-bottom: 0.1rem;
        font-size: 0.84rem;
        overflow-wrap: anywhere;
      }
      textarea {
        min-height: 8rem;
      }
    `],
})
export class ProcessJsonTaskFormComponent {
  readonly i18n = inject(I18nService);
  // M-1b: outputs viajan al host via bridge (no via @Output()).
  private readonly bridge = inject(ProcessTaskFormBridgeService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly connections = input.required<readonly ConnectionRef[]>();
  readonly readonly = input(false);

  connectionNames(): string {
    return this.connections().map((connection) => `${connection.name} (${connection.connectionType})`).join(', ');
  }

  onConfigurationChange(value: string): void {
    this.bridge.emit({ configurationJson: value });
  }
}

