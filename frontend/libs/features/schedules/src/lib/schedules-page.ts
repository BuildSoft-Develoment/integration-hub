import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { SchedulesEditorComponent } from './components/schedules-editor/schedules-editor.component';
import { SchedulesListComponent } from './components/schedules-list/schedules-list.component';
import { SchedulesToolbarComponent } from './components/schedules-toolbar/schedules-toolbar.component';
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

  ngOnInit(): void {
    void this.store.load();
  }

  openProcesses(): void {
    void this.router.navigate(['/processes']);
  }
}
