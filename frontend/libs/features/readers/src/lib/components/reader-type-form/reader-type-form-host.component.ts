import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { ReaderDraft, ReaderProviderType } from '@integration-hub/core/providers';
import { ReaderCsvFormComponent } from './reader-csv-form.component';
import { ReaderExcelFormComponent } from './reader-excel-form.component';
import { ReaderJsonFormComponent } from './reader-json-form.component';
import { ReaderTxtFormComponent } from './reader-txt-form.component';
import { ReaderXmlFormComponent } from './reader-xml-form.component';

@Component({
  selector: 'ih-reader-type-form-host',
  standalone: true,
  imports: [CommonModule, ReaderTxtFormComponent, ReaderCsvFormComponent, ReaderExcelFormComponent, ReaderXmlFormComponent, ReaderJsonFormComponent],
  template: `
    @switch (readerType()) {
      @case ('TXT') {
        <ih-reader-txt-form [draft]="draft()" [readonly]="readonly()" (patchDraft)="patchDraft.emit($event)" />
      }
      @case ('CSV') {
        <ih-reader-csv-form [draft]="draft()" [readonly]="readonly()" (patchDraft)="patchDraft.emit($event)" />
      }
      @case ('XLS') {
        <ih-reader-excel-form [draft]="draft()" [readonly]="readonly()" [excelType]="'XLS'" (patchDraft)="patchDraft.emit($event)" />
      }
      @case ('XLSX') {
        <ih-reader-excel-form [draft]="draft()" [readonly]="readonly()" [excelType]="'XLSX'" (patchDraft)="patchDraft.emit($event)" />
      }
      @case ('XML') {
        <ih-reader-xml-form [draft]="draft()" [readonly]="readonly()" (patchDraft)="patchDraft.emit($event)" />
      }
      @default {
        <ih-reader-json-form [draft]="draft()" [readonly]="readonly()" (patchDraft)="patchDraft.emit($event)" />
      }
    }
  `,
})
export class ReaderTypeFormHostComponent {
  readonly readerType = input.required<ReaderProviderType>();
  readonly draft = input.required<ReaderDraft>();
  readonly readonly = input(false);
  readonly patchDraft = output<Partial<ReaderDraft>>();
}
