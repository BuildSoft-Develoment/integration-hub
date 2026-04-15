import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { provideProcessTaskProviders } from '@integration-hub/core/providers';
import { ProcessTaskManagerService } from '@integration-hub/core/services';
import { ProcessCatalogStore } from './process-catalog.store';
import { ProcessFlowApiService } from './process-flow-api.service';
import { ProcessEditorComponent } from './components/process-editor/process-editor.component';
import { ProcessListComponent } from './components/process-list/process-list.component';
import { ProcessToolbarComponent } from './components/process-toolbar/process-toolbar.component';

@Component({
  selector: 'ih-process-catalog-page',
  standalone: true,
  providers: [ProcessCatalogStore, ProcessTaskManagerService, ProcessFlowApiService, ...provideProcessTaskProviders()],
  imports: [CommonModule, MatSidenavModule, ProcessToolbarComponent, ProcessListComponent, ProcessEditorComponent],
  templateUrl: './process-catalog-page.html',
  styleUrl: './process-catalog-page.css',
})
export class ProcessCatalogPageComponent implements OnInit {
  readonly store = inject(ProcessCatalogStore);

  ngOnInit(): void {
    void this.store.load();
  }
}
