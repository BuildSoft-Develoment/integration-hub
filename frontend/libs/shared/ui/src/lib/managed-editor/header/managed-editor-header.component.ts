import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { I18nService } from '@integration-hub/core/services';
import { IconComponent, IhIconName } from '@integration-hub/plugin-ui-kit';
import { inject } from '@angular/core';

@Component({
  selector: 'ih-managed-editor-header',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './managed-editor-header.component.html',
  styleUrl: './managed-editor-header.component.css',
})
export class ManagedEditorHeaderComponent {
  readonly i18n = inject(I18nService);

  readonly titleKey = input.required<string>();
  readonly subtitle = input.required<string>();
  /** Icono del recurso (politica no-fallback: requerido, sin inicial de texto). */
  readonly icon = input.required<IhIconName>();
  /** Clase tonal del Design System para el avatar. */
  readonly toneClass = input.required<string>();
}
