import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { PageEvent } from '@angular/material/paginator';
import { AuditEditorComponent } from '../components/audit-editor/audit-editor.component';
import { AuditListComponent } from '../components/audit-list/audit-list.component';
import { AuditToolbarComponent } from '../components/audit-toolbar/audit-toolbar.component';
import { AuditWorkspaceNavComponent } from '@integration-hub/shared/audit-kit';
import { AuditStore } from './audit.store';
import { downloadText, eventsToCsv, eventsToJson } from '../utils/download-utils';

@Component({
  selector: 'ih-audit-page',
  standalone: true,
  providers: [AuditStore],
  imports: [CommonModule, MatProgressBarModule, MatSidenavModule, AuditWorkspaceNavComponent, AuditToolbarComponent, AuditListComponent, AuditEditorComponent],
  templateUrl: './audit-page.html',
  styleUrl: './audit-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditPageComponent implements OnInit {
  readonly store = inject(AuditStore);
  readonly viewModel = computed(() => ({
    search: this.store.search(),
    eventTypeFilter: this.store.eventTypeFilter(),
    statusFilter: this.store.statusFilter(),
    eventTypeOptions: this.store.eventTypeOptions(),
    events: this.store.pagedEvents(),
    totalLength: this.store.totalLength(),
    selectedEvent: this.store.selectedEvent(),
    sortField: this.store.sortField(),
    sortDirection: this.store.sortDirection(),
    drawerOpen: this.store.drawerOpen(),
    pageIndex: this.store.currentPage(),
    pageSize: this.store.pageSize(),
    loading: this.store.loading(),
    error: this.store.error(),
  }));

  ngOnInit(): void {
    void this.store.load();
  }

  updateSearch(value: string): void {
    this.store.updateSearch(value);
  }

  updateEventTypeFilter(value: string): void {
    this.store.updateEventTypeFilter(value);
  }

  updateStatusFilter(value: 'ALL' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PENDING' | 'COMPLETED_WITH_ERRORS'): void {
    this.store.updateStatusFilter(value);
  }

  selectEvent(event: Parameters<AuditStore['selectEvent']>[0]): void {
    this.store.selectEvent(event);
  }

  updatePagination(event: PageEvent): void {
    this.store.updatePagination(event.pageIndex, event.pageSize);
  }

  closeDrawer(): void {
    this.store.closeDrawer();
  }

  refresh(): void {
    void this.store.load();
  }

  exportCsv(): void {
    const events = this.store.pagedEvents();
    if (events.length === 0) { return; }
    downloadText(eventsToCsv(events), `audit-events-${Date.now()}.csv`);
  }

  exportJson(): void {
    const events = this.store.pagedEvents();
    if (events.length === 0) { return; }
    downloadText(eventsToJson(events), `audit-events-${Date.now()}.json`, 'application/json');
  }
}
