// @trace spec 002-catalogo-readers RF-001
// @trace spec 008-mensajeria-pagos RF-008, T-015
import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReaderDraft } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';
import { SuggestInputComponent } from '@integration-hub/shared/ui';
import { ReaderTypeFormBaseComponent } from '../reader-type-form.abstract';

@Component({
  selector: 'ih-reader-swift-mt-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCheckboxModule, SuggestInputComponent],
  template: `
    <div class="form-grid">
      <ih-suggest-input [label]="i18n.t('ui.encoding')" [hint]="i18n.t('ui.encodingHint')" [suggestions]="encodings" [disabled]="readonly()" [value]="draft().encoding || 'UTF-8'" (valueChange)="patchDraft.emit({ encoding: $event })" />

      <div class="checkbox-wrap">
        <mat-checkbox
          [disabled]="readonly()"
          [ngModel]="draft().rejectNonSwiftXChars"
          (ngModelChange)="patchDraft.emit({ rejectNonSwiftXChars: $event })">
          SWIFT-X strict
        </mat-checkbox>
      </div>
    </div>
  `,
  styles: [
    `
      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 0.8rem;
        min-width: 0;
      }
      .form-grid mat-form-field { min-width: 0; }
      .checkbox-wrap { display:flex; align-items:center; min-height:52px; }
      @container (max-width: 900px){ .form-grid { grid-template-columns: 1fr; } }
    `,
  ],
})
export class ReaderSwiftMtFormComponent extends ReaderTypeFormBaseComponent {
  readonly i18n = inject(I18nService);
  readonly draft = input.required<ReaderDraft>();
  readonly readonly = input(false);
  readonly patchDraft = output<Partial<ReaderDraft>>();
}
