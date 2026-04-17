import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { ReaderDraft, ReaderProviderType } from '@integration-hub/core/providers';
import { ReaderCsvFormComponent } from '../reader-csv-form/reader-csv-form.component';
import { ReaderExcelFormComponent } from '../reader-excel-form/reader-excel-form.component';
import { ReaderJsonFormComponent } from '../reader-json-form/reader-json-form.component';
import { ReaderTxtFormComponent } from '../reader-txt-form/reader-txt-form.component';
import { ReaderXmlFormComponent } from '../reader-xml-form/reader-xml-form.component';

@Component({
  selector: 'ih-reader-type-form-host',
  standalone: true,
  imports: [CommonModule, ReaderTxtFormComponent, ReaderCsvFormComponent, ReaderExcelFormComponent, ReaderXmlFormComponent, ReaderJsonFormComponent],
    templateUrl: './reader-type-form-host.component.html'
})
export class ReaderTypeFormHostComponent {
  readonly readerType = input.required<ReaderProviderType>();
  readonly draft = input.required<ReaderDraft>();
  readonly readonly = input(false);
  readonly patchDraft = output<Partial<ReaderDraft>>();
}
