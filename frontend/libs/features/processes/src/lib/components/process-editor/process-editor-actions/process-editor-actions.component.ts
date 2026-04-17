import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { I18nService } from '@integration-hub/core/services';

@Component({
  selector: 'ih-process-editor-actions',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  styles: [
    `
      .panel-actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-bottom: 0.9rem;
      }
    `,
  ],
    templateUrl: './process-editor-actions.component.html'
})
export class ProcessEditorActionsComponent {
  readonly i18n = inject(I18nService);

  readonly active = input(false);
  readonly canEdit = input(false);
  readonly canOperate = input(false);
  readonly executing = input(false);

  readonly edit = output<void>();
  readonly toggleActive = output<void>();
  readonly execute = output<void>();
}
