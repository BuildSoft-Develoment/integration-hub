import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { SchedulesEditorComponent } from '../components/schedules-editor/schedules-editor.component';
import { SchedulesListComponent } from '../components/schedules-list/schedules-list.component';
import { SchedulesToolbarComponent } from '../components/schedules-toolbar/schedules-toolbar.component';
import { SchedulesStore } from './schedules.store';

@Component({
  selector: 'ih-schedules-page',
  standalone: true,
  providers: [SchedulesStore],
  imports: [CommonModule, MatSidenavModule, SchedulesToolbarComponent, SchedulesListComponent, SchedulesEditorComponent],
  templateUrl: './schedules-page.html',
  styleUrl: './schedules-page.css',
})
export class SchedulesPageComponent implements OnInit {
  readonly store = inject(SchedulesStore);
  private readonly router = inject(Router);
  readonly viewModel = computed(() => ({
    search: this.store.search(),
    modeFilter: this.store.modeFilter(),
    statusFilter: this.store.statusFilter(),
    schedules: this.store.pagedSchedules(),
    totalLength: this.store.totalLength(),
    selectedSchedule: this.store.selectedSchedule(),
    sortField: this.store.sortField(),
    sortDirection: this.store.sortDirection(),
    drawerOpen: this.store.drawerOpen(),
    pageIndex: this.store.currentPage(),
    pageSize: this.store.pageSize(),
    executing: this.store.executing(),
    canOperate: this.store.canOperate(),
  }));

  ngOnInit(): void {
    void this.store.load();
  }

  updateSearch(value: string): void {
    this.store.updateSearch(value);
  }

  updateModeFilter(value: 'ALL' | 'SCHEDULED' | 'MANUAL'): void {
    this.store.updateModeFilter(value);
  }

  updateStatusFilter(value: 'ALL' | 'ACTIVE' | 'INACTIVE'): void {
    this.store.updateStatusFilter(value);
  }

  refresh(): void {
    void this.store.load();
  }

  selectSchedule(schedule: Parameters<SchedulesStore['selectSchedule']>[0]): void {
    this.store.selectSchedule(schedule);
  }

  updatePagination(event: PageEvent): void {
    this.store.updatePagination(event.pageIndex, event.pageSize);
  }

  closeDrawer(): void {
    this.store.closeDrawer();
  }

  runSelected(): void {
    const selectedSchedule = this.store.selectedSchedule();
    if (selectedSchedule) {
      void this.store.execute(selectedSchedule);
    }
  }

  openProcesses(): void {
    void this.router.navigate(['/processes']);
  }
}
