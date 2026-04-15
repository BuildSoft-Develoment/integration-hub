import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ExecutionCatalogStore } from './execution-catalog.store';
import { ExecutionDetailLoaderService } from './execution-detail-loader.service';
import { ExecutionFileActionService } from './execution-file-action.service';
import { ExecutionNavigationService } from './execution-navigation.service';
import { ExecutionEditorComponent } from './components/execution-editor/execution-editor.component';
import { ExecutionListComponent } from './components/execution-list/execution-list.component';
import { ExecutionToolbarComponent } from './components/execution-toolbar/execution-toolbar.component';

@Component({
  selector: 'ih-execution-catalog-page',
  standalone: true,
  providers: [
    ExecutionCatalogStore,
    ExecutionNavigationService,
    ExecutionDetailLoaderService,
    ExecutionFileActionService,
  ],
  imports: [CommonModule, MatSidenavModule, ExecutionToolbarComponent, ExecutionListComponent, ExecutionEditorComponent],
  templateUrl: './execution-catalog-page.html',
  styleUrl: './execution-catalog-page.css',
})
export class ExecutionCatalogPageComponent implements OnInit {
  readonly store = inject(ExecutionCatalogStore);

  ngOnInit(): void {
    void this.store.load();
  }
}
