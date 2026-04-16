import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ConnectionProviderType } from '@integration-hub/core/providers';
import { ConnectionManagerService } from '@integration-hub/core/services';
import { ConnectionCatalogCommandService } from './connection-catalog-command.service';
import { ConnectionCatalogQueryStore } from './connection-catalog-query.store';
import { ConnectionCatalogStore } from './connection-catalog.store';
import { ConnectionEditorStateService } from './connection-editor-state.service';
import { ConnectionEditorComponent } from './components/connection-editor/connection-editor.component';
import { ConnectionListComponent } from './components/connection-list/connection-list.component';
import { ConnectionToolbarComponent } from './components/connection-toolbar/connection-toolbar.component';

@Component({
  selector: 'ih-connection-catalog-page',
  standalone: true,
  providers: [
    ConnectionCatalogStore,
    ConnectionCatalogQueryStore,
    ConnectionCatalogCommandService,
    ConnectionEditorStateService,
  ],
  imports: [
    CommonModule,
    MatSidenavModule,
    ConnectionToolbarComponent,
    ConnectionListComponent,
    ConnectionEditorComponent,
  ],
  templateUrl: './connection-catalog-page.html',
  styleUrl: './connection-catalog-page.css',
})
export class ConnectionCatalogPageComponent implements OnInit {
  readonly connectionManager = inject(ConnectionManagerService);
  readonly store = inject(ConnectionCatalogStore);

  readonly providerOptions = computed(() => this.connectionManager.availableProviders());

  ngOnInit(): void {
    void this.store.load();
  }

  updateConnectionType(type: ConnectionProviderType): void {
    this.store.updateFormField('connectionType', type);
  }
}
