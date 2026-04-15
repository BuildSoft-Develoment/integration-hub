import { effect, inject, Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { I18nService } from './i18n.service';

@Injectable({ providedIn: 'root' })
export class PaginatorIntlService extends MatPaginatorIntl {
  private readonly i18n = inject(I18nService);

  constructor() {
    super();

    this.getRangeLabel = (page: number, pageSize: number, length: number): string => {
      if (length === 0 || pageSize === 0) {
        return `0 ${this.i18n.t('pagination.of')} ${length}`;
      }

      const startIndex = page * pageSize;
      const endIndex = Math.min(startIndex + pageSize, length);
      return `${startIndex + 1} - ${endIndex} ${this.i18n.t('pagination.of')} ${length}`;
    };

    effect(() => {
      this.i18n.locale();
      this.itemsPerPageLabel = this.i18n.t('pagination.itemsPerPage');
      this.nextPageLabel = this.i18n.t('pagination.nextPage');
      this.previousPageLabel = this.i18n.t('pagination.previousPage');
      this.firstPageLabel = this.i18n.t('pagination.firstPage');
      this.lastPageLabel = this.i18n.t('pagination.lastPage');
      this.changes.next();
    });
  }
}
