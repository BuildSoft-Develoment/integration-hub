import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { I18nService } from '@integration-hub/core/services';
import { inject } from '@angular/core';

@Component({
  selector: 'ih-managed-editor-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './managed-editor-header.component.html',
  styleUrl: './managed-editor-header.component.css',
})
export class ManagedEditorHeaderComponent {
  readonly i18n = inject(I18nService);

  readonly titleKey = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly avatarText = computed(() => this.subtitle().slice(0, 1).toUpperCase());
}
