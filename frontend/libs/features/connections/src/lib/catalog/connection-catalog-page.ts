import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ConnectionProviderType } from '@integration-hub/core/providers';
import { ConnectionManagerService } from '@integration-hub/core/services';
import { ConnectionCatalogCommandService } from './connection-catalog-command.service';
import { ConnectionCatalogQueryStore } from './connection-catalog-query.store';
import { ConnectionCatalogStore } from './connection-catalog.store';
import { ConnectionEditorStateService } from '../editor/connection-editor-state.service';
import { ActionBarAction, FloatingActionBarComponent } from '@integration-hub/shared/ui';
import { ConnectionEditorComponent } from '../components/connection-editor/connection-editor.component';
import { ConnectionListComponent } from '../components/connection-list/connection-list.component';
import { ConnectionToolbarComponent } from '../components/connection-toolbar/connection-toolbar.component';

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
    FloatingActionBarComponent,
  ],
  templateUrl: './connection-catalog-page.html',
  styleUrl: './connection-catalog-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectionCatalogPageComponent implements OnInit {
  readonly connectionManager = inject(ConnectionManagerService);
  readonly store = inject(ConnectionCatalogStore);

  readonly providerOptions = computed(() => this.connectionManager.availableProviders());

  readonly bulkActions = computed<readonly ActionBarAction[]>(() => {
    const selected = this.store.selectedConnections();
    const actions: ActionBarAction[] = [];
    if (selected.some((connection) => !connection.active)) {
      actions.push({ id: 'activate', labelKey: 'connections.activateSelected', icon: 'toggle-on' });
    }
    if (selected.some((connection) => connection.active)) {
      actions.push({ id: 'deactivate', labelKey: 'connections.deactivateSelected', icon: 'toggle-off' });
    }
    return actions;
  });

  ngOnInit(): void {
    void this.store.load();
  }

  updateConnectionType(type: ConnectionProviderType): void {
    this.store.updateFormField('connectionType', type);
  }

  async onBulkAction(actionId: string): Promise<void> {
    const ids = this.store.selectedIds();
    if (ids.size === 0) { return; }
    if (actionId === 'activate') {
      await this.store.setSelectedActive(true);
    } else if (actionId === 'deactivate') {
      await this.store.setSelectedActive(false);
    }
  }
}
