import { Component, input } from '@angular/core';

/**
 * Iconos SVG inline (sin fuente externa) — el proyecto no carga ninguna webfont
 * de iconos. Trazo estilo lucide, hereda el color via currentColor.
 */
export type IhIconName =
  | 'check'
  | 'x'
  | 'loader'
  | 'alert-triangle'
  | 'clock'
  | 'file'
  | 'list'
  | 'arrow-left'
  | 'external-link'
  | 'copy'
  | 'plus'
  | 'edit'
  | 'save'
  | 'download'
  | 'upload'
  | 'toggle-on'
  | 'toggle-off'
  | 'database'
  | 'server'
  | 'folder'
  | 'globe'
  | 'file-text'
  | 'table'
  | 'code'
  | 'cloud'
  | 'cpu'
  | 'play'
  | 'send'
  | 'bell'
  | 'shield'
  | 'git-branch'
  | 'banknote'
  | 'search'
  | 'trash'
  | 'refresh'
  | 'chevron-down'
  | 'chevron-right'
  | 'filter'
  | 'menu'
  | 'eye'
  | 'more-vertical'
  | 'calendar'
  | 'zap'
  | 'lock';

@Component({
  selector: 'ih-icon',
  standalone: true,
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.css',
})
export class IconComponent {
  /** Nombre del icono (ver IhIconName). String para aceptar valores calculados; los desconocidos no pintan nada. */
  readonly name = input.required<string>();
  readonly size = input(16);
}
