import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CatalogListColumn, CatalogListComponent } from './catalog-list.component';

@Component({
  standalone: true,
  imports: [CatalogListComponent],
  template: `
    <ih-catalog-list
      [columns]="columns"
      gridColumns="1fr 1fr"
      [sortField]="sortField()"
      [sortDirection]="'asc'"
      [rowCount]="rows().length"
      [loading]="loading()"
      [error]="error()"
      [total]="rows().length"
      [selectable]="selectable()"
      [allSelected]="true"
      (toggleSort)="lastSort = $event"
      (toggleSelectAll)="selectAllToggled = true"
      (retry)="retried = true"
    >
      @for (row of rows(); track row) {
        <button type="button" class="table-row" [attr.data-row-index]="$index">{{ row }}</button>
      }
    </ih-catalog-list>
  `,
})
class HostComponent {
  readonly columns: CatalogListColumn[] = [
    { labelKey: 'common.name', sortKey: 'name' },
    { labelKey: 'common.type' },
  ];
  readonly rows = signal<string[]>(['a', 'b', 'c']);
  readonly sortField = signal<string | null>('name');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectable = signal(false);
  lastSort: string | null = null;
  retried = false;
  selectAllToggled = false;
}

describe('CatalogListComponent', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders sortable and static column headers with aria-sort', () => {
    const fixture = setup();
    const el = fixture.nativeElement as HTMLElement;

    const sortable = el.querySelector('.col-sortable') as HTMLButtonElement;
    expect(sortable).not.toBeNull();
    expect(sortable.getAttribute('aria-sort')).toBe('ascending');
    expect(el.querySelector('.col-static')).not.toBeNull();
  });

  it('emits the sort key when a sortable header is clicked', () => {
    const fixture = setup();
    const host = fixture.componentInstance;
    (fixture.nativeElement.querySelector('.col-sortable') as HTMLButtonElement).click();

    expect(host.lastSort).toBe('name');
  });

  it('projects rows when there is data', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelectorAll('.table-row').length).toBe(3);
  });

  it('shows the empty state when there are no rows', () => {
    const fixture = setup();
    fixture.componentInstance.rows.set([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('ih-empty-state')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.table-row').length).toBe(0);
  });

  it('shows the loading skeleton instead of rows', () => {
    const fixture = setup();
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('ih-loading')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.table-row').length).toBe(0);
  });

  it('shows the error with a retry that emits', () => {
    const fixture = setup();
    fixture.componentInstance.error.set('common.error');
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alert).not.toBeNull();
    (alert.querySelector('button') as HTMLButtonElement).click();
    expect(fixture.componentInstance.retried).toBe(true);
  });

  it('renders a select-all checkbox only when selectable and emits on toggle', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('.ih-checkbox-all')).toBeNull();

    fixture.componentInstance.selectable.set(true);
    fixture.detectChanges();
    const checkbox = fixture.nativeElement.querySelector('.ih-checkbox-all') as HTMLElement;
    expect(checkbox).not.toBeNull();

    (checkbox.querySelector('input') as HTMLInputElement).click();
    expect(fixture.componentInstance.selectAllToggled).toBe(true);
  });

  it('moves roving focus across rows with ArrowDown/ArrowUp', () => {
    const fixture = setup();
    const list = fixture.nativeElement.querySelector('ih-catalog-list') as HTMLElement;

    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('[data-row-index="1"]'));

    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('[data-row-index="0"]'));
  });
});
