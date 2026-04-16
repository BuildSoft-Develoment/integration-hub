import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { I18nService } from '@integration-hub/core/services';
import { inject } from '@angular/core';

@Component({
  selector: 'ih-managed-editor-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './managed-editor-section.component.html',
  styleUrl: './managed-editor-section.component.css',
})
export class ManagedEditorSectionComponent {
  readonly i18n = inject(I18nService);

  readonly eyebrowKey = input.required<string>();
  readonly title = input<string | null>(null);
  readonly titleKey = input<string | null>(null);
}
