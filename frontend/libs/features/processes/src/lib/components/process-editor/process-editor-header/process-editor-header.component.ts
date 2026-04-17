import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { I18nService } from '@integration-hub/core/services';

@Component({
  selector: 'ih-process-editor-header',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
    templateUrl: './process-editor-header.component.html',
    styleUrl: './process-editor-header.component.css'
})
export class ProcessEditorHeaderComponent {
  readonly i18n = inject(I18nService);

  readonly titleKey = input.required<string>();
  readonly scheduled = input(false);

  readonly close = output<void>();
}
