import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { I18nService } from '@integration-hub/core/services';
import { inject } from '@angular/core';

@Component({
  selector: 'ih-managed-editor-shell',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './managed-editor-shell.component.html',
  styleUrl: './managed-editor-shell.component.css',
})
export class ManagedEditorShellComponent {
  readonly i18n = inject(I18nService);
  readonly dirty = input(false);
  readonly close = output<void>();

  attemptClose(): void {
    if (this.dirty() && !confirm(this.i18n.t('common.discardConfirm'))) {
      return;
    }
    this.close.emit();
  }
}
