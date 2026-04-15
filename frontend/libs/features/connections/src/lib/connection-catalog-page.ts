import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ConnectionProviderType } from '@integration-hub/core/providers';
import { ConnectionManagerService } from '@integration-hub/core/services';
import { ConnectionCatalogStore } from './connection-catalog.store';
import { ConnectionEditorComponent } from './components/connection-editor/connection-editor.component';
import { ConnectionListComponent } from './components/connection-list/connection-list.component';
import { ConnectionToolbarComponent } from './components/connection-toolbar/connection-toolbar.component';

@Component({
  selector: 'ih-connection-catalog-page',
  standalone: true,
  providers: [ConnectionCatalogStore],
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
