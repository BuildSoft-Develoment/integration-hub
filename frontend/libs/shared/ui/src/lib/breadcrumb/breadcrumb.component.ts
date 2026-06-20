import { CommonModule, Location } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { IconComponent } from '../icon/icon.component';

export interface IhBreadcrumbItem {
  /** Texto ya traducido (el consumidor resuelve i18n). */
  label: string;
  /** RouterLink destino; si falta o es el último, se muestra como texto plano. */
  link?: unknown[];
  queryParams?: Params;
}

/**
 * Migas de pan accesibles (WCAG 2.2): `nav[aria-label]` + lista ordenada,
 * último con `aria-current="page"`. Componente tonto y reusable: el consumidor
 * pasa los items ya traducidos.
 */
@Component({
  selector: 'ih-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.css',
})
export class BreadcrumbComponent {
  private readonly location = inject(Location);

  readonly items = input.required<IhBreadcrumbItem[]>();
  readonly ariaLabel = input('breadcrumb');
  /** Si se pasa una etiqueta, muestra un boton "Volver" que regresa a la pantalla anterior. */
  readonly backLabel = input<string | null>(null);

  // Solo hay a donde volver si hubo navegacion previa en esta sesion del navegador.
  readonly canGoBack = typeof history !== 'undefined' && history.length > 1;

  goBack(): void {
    this.location.back();
  }
}
