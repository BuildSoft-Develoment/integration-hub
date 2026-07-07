import { Injectable, signal } from '@angular/core';
import { IhBreadcrumbItem } from '@integration-hub/shared/models';

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private readonly _items = signal<IhBreadcrumbItem[]>([]);
  readonly items = this._items.asReadonly();

  private readonly _backLabel = signal<string | null>(null);
  readonly backLabel = this._backLabel.asReadonly();

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
