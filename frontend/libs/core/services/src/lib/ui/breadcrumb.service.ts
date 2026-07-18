import { Injectable, inject, signal } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { IhBreadcrumbItem } from '@integration-hub/shared/models';

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private readonly _items = signal<IhBreadcrumbItem[]>([]);
  readonly items = this._items.asReadonly();

  private readonly _backLabel = signal<string | null>(null);
  readonly backLabel = this._backLabel.asReadonly();

  constructor() {
    // 002: limpiar el breadcrumb (items + back) al INICIO de cada navegacion. Sin esto, un back como
    // "Volver a ejecuciones" (que setea Operaciones DLQ) persistia en todas las paginas siguientes.
    // Cada pagina setea su propio breadcrumb en ngOnInit, que corre despues del NavigationStart.
    inject(Router)
      .events.pipe(filter((event) => event instanceof NavigationStart))
      .subscribe(() => this.clear());
  }

  setItems(items: IhBreadcrumbItem[]): void {
    this._items.set(items);
  }

  setBackLabel(label: string | null): void {
    this._backLabel.set(label);
  }

  clear(): void {
    this._items.set([]);
    this._backLabel.set(null);
  }
}
