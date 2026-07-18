// @trace RF-001, RF-002 (catalogo-readers: UI de configuracion para reader formato TXT)
import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReaderDraft } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';
import { SuggestInputComponent } from '@integration-hub/shared/ui';
import { ReaderFieldDefinitionsEditorComponent } from '../reader-field-definitions-editor/reader-field-definitions-editor.component';
import { ReaderTypeFormBaseComponent } from '../reader-type-form.abstract';

@Component({
  selector: 'ih-reader-txt-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, ReaderFieldDefinitionsEditorComponent, SuggestInputComponent],
  styles: [
    `
      .form-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:0.8rem; }
      .subsection-gap { margin-top: 1.05rem; }
      @container (max-width: 900px){ .form-grid { grid-template-columns: 1fr; } }
    `,
  ],
    templateUrl: './reader-txt-form.component.html'
})
export class ReaderTxtFormComponent extends ReaderTypeFormBaseComponent {
  readonly i18n = inject(I18nService);
  readonly draft = input.required<ReaderDraft>();
  readonly readonly = input(false);
  readonly patchDraft = output<Partial<ReaderDraft>>();
}


