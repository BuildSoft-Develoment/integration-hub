import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { I18nService } from '@integration-hub/core/services';
import { inject } from '@angular/core';

@Component({
  selector: 'ih-managed-editor-readonly-actions',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './managed-editor-readonly-actions.component.html',
  styleUrl: './managed-editor-readonly-actions.component.css',
})
export class ManagedEditorReadonlyActionsComponent {
  readonly i18n = inject(I18nService);

  readonly readonly = input(false);
  readonly canEdit = input(false);
  readonly active = input(false);

  readonly edit = output<void>();
  readonly toggleActive = output<void>();
}
