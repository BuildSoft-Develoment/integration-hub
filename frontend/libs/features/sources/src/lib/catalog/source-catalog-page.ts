import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { SourceProviderType } from '@integration-hub/core/providers';
import { I18nService, SourceManagerService } from '@integration-hub/core/services';
import { SourceEditorComponent } from '../components/source-editor/source-editor.component';
import { SourceListComponent } from '../components/source-list/source-list.component';
import { SourceToolbarComponent } from '../components/source-toolbar/source-toolbar.component';
import { SourceCatalogCommandService } from './source-catalog-command.service';
import { SourceCatalogQueryStore } from './source-catalog-query.store';
import { SourceCatalogStore } from './source-catalog.store';
import { SourceEditorStateService } from '../editor/source-editor-state.service';

@Component({
  selector: 'ih-source-catalog-page',
  standalone: true,
  providers: [
    SourceCatalogStore,
    SourceCatalogQueryStore,
    SourceCatalogCommandService,
    SourceEditorStateService,
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSidenavModule,
    SourceListComponent,
    SourceToolbarComponent,
    SourceEditorComponent,
  ],
  templateUrl: './source-catalog-page.html',
  styleUrl: './source-catalog-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceCatalogPageComponent implements OnInit {
  readonly i18n = inject(I18nService);
  readonly sourceManager = inject(SourceManagerService);
  readonly store = inject(SourceCatalogStore);

  readonly providerOptions = computed(() => this.sourceManager.availableProviders());

  ngOnInit(): void {
    void this.store.load();
  }

  updateSourceType(type: SourceProviderType): void {
    this.store.updateFormField('sourceType', type);
  }
}
