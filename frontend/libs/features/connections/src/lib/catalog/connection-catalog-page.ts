import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ConnectionProviderType } from '@integration-hub/core/providers';
import { ConnectionManagerService } from '@integration-hub/core/services';
import { ConnectionCatalogCommandService } from './connection-catalog-command.service';
import { ConnectionCatalogQueryStore } from './connection-catalog-query.store';
import { ConnectionCatalogStore } from './connection-catalog.store';
import { provideConnectionBulkActionHandlers } from './connection-bulk-action.handlers';
import { ConnectionEditorStateService } from '../editor/connection-editor-state.service';
import {
  AppActionContribution,
  AppActionExecutionContext,
  AppActionExecutor,
  AppActionQueryService,
  FloatingActionBarComponent,
  provideAppActionConfirmationGate,
} from '@integration-hub/shared/ui';
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
    AppActionExecutor,
    AppActionQueryService,
    provideAppActionConfirmationGate(),
    ...provideConnectionBulkActionHandlers(),
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
  private readonly actionExecutor = inject(AppActionExecutor);
  private readonly actionQuery = inject(AppActionQueryService);

  readonly providerOptions = computed(() => this.connectionManager.availableProviders());
  readonly bulkActionContext = computed<AppActionExecutionContext>(() => ({
    source: 'connections.bulk',
    selection: [...this.store.selectedIds()].map((id) => String(id)),
    payload: {
      selectedConnections: this.store.selectedConnections(),
    },
  }));
  readonly bulkActionContributions = computed<readonly AppActionContribution[]>(() =>
    this.actionQuery.visibleActions(
      { placement: 'toolbar', group: 'connections' },
      this.bulkActionContext()
    )
  );
  readonly bulkActions = computed(() =>
    this.actionQuery.actionBarActions(
      { placement: 'toolbar', group: 'connections' },
      this.bulkActionContext()
    )
  );

  ngOnInit(): void {
    void this.store.load();
  }

  updateConnectionType(type: ConnectionProviderType): void {
    this.store.updateFormField('connectionType', type);
  }

  async onBulkAction(actionId: string): Promise<void> {
    const action = this.bulkActionContributions().find((item) => item.id === actionId);
    if (!action) {
      return;
    }
    await this.actionExecutor.execute(action, this.bulkActionContext());
  }
}
