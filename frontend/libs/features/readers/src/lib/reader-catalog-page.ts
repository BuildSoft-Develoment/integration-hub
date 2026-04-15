import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ReaderProviderType } from '@integration-hub/core/providers';
import { I18nService, ReaderManagerService } from '@integration-hub/core/services';
import { ReaderEditorComponent } from './components/reader-editor/reader-editor.component';
import { ReaderListComponent } from './components/reader-list/reader-list.component';
import { ReaderToolbarComponent } from './components/reader-toolbar/reader-toolbar.component';
import { ReaderCatalogStore } from './reader-catalog.store';

@Component({
  selector: 'ih-reader-catalog-page',
  standalone: true,
  providers: [ReaderCatalogStore],
  imports: [CommonModule, MatSidenavModule, ReaderToolbarComponent, ReaderListComponent, ReaderEditorComponent],
  templateUrl: './reader-catalog-page.html',
  styleUrl: './reader-catalog-page.css',
})
export class ReaderCatalogPageComponent implements OnInit {
  readonly i18n = inject(I18nService);
  readonly readerManager = inject(ReaderManagerService);
  readonly store = inject(ReaderCatalogStore);

  readonly providerOptions = computed(() => this.readerManager.availableProviders());

  ngOnInit(): void {
    void this.store.load();
  }

  updateReaderType(type: ReaderProviderType): void {
    this.store.updateFormField('readerType', type);
  }
}
