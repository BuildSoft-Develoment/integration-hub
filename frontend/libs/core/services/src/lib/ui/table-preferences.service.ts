import { Injectable } from '@angular/core';

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

const STORAGE_KEY = 'ih-table-prefs';

@Injectable({ providedIn: 'root' })
export class TablePreferencesService {
  private readonly store = localStorage;

  getSort(tableId: string): SortState | null {
    const prefs = this.read();
    const entry = prefs[tableId]?.sort;
    return entry ? { field: entry.field, direction: entry.direction } : null;
  }

  setSort(tableId: string, sort: SortState): void {
    const prefs = this.read();
    prefs[tableId] = { ...prefs[tableId], sort };
    this.write(prefs);
  }

  clearTable(tableId: string): void {
    const prefs = this.read();
    delete prefs[tableId];
    this.write(prefs);
  }

  private read(): Record<string, { sort?: SortState }> {
    try {
      return JSON.parse(this.store.getItem(STORAGE_KEY) ?? '{}');
    } catch {
      return {};
    }
  }

  private write(value: Record<string, { sort?: SortState }>): void {
    try {
      this.store.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // storage full or unavailable — silently ignore
    }
  }
}
