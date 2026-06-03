// @trace RF-001, RF-002 (catalogo-readers: UI de configuracion para reader formato JSON)
import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReaderDraft } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';
import { ReaderTypeFormBaseComponent } from '../reader-type-form.abstract';

@Component({
  selector: 'ih-reader-json-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="ih-muted hint-copy">{{ i18n.t('ui.readerJsonEmpty') }}</div>
    <mat-form-field>
      <mat-label>{{ i18n.t('ui.fieldMappings') }}</mat-label>
      <textarea matInput rows="6" [disabled]="readonly()" [ngModel]="draft().fieldMappingsText" (ngModelChange)="patchDraft.emit({ fieldMappingsText: $event })"></textarea>
    </mat-form-field>
  `,
  styles: [` .hint-copy{padding:0.15rem 0 0.35rem;} `],
})
export class ReaderJsonFormComponent extends ReaderTypeFormBaseComponent {
  readonly i18n = inject(I18nService);
  readonly draft = input.required<ReaderDraft>();
  readonly readonly = input(false);
  readonly patchDraft = output<Partial<ReaderDraft>>();
}
