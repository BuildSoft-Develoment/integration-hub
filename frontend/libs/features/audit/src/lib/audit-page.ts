import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AuditEditorComponent } from './components/audit-editor/audit-editor.component';
import { AuditListComponent } from './components/audit-list/audit-list.component';
import { AuditToolbarComponent } from './components/audit-toolbar/audit-toolbar.component';
import { AuditStore } from './audit.store';

@Component({
  selector: 'ih-audit-page',
  standalone: true,
  providers: [AuditStore],
  imports: [CommonModule, MatSidenavModule, AuditToolbarComponent, AuditListComponent, AuditEditorComponent],
  templateUrl: './audit-page.html',
  styleUrl: './audit-page.css',
})
export class AuditPageComponent implements OnInit {
  readonly store = inject(AuditStore);

  ngOnInit(): void {
    void this.store.load();
  }
}
