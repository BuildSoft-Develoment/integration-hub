// @trace spec 002-catalogo-readers RF-001
// @trace spec 008-mensajeria-pagos RF-008, T-015
import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReaderDraft } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';
import { ReaderTypeFormBaseComponent } from '../reader-type-form.abstract';

@Component({
  selector: 'ih-reader-swift-mt-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="form-grid">
      <mat-form-field>
        <mat-label>{{ i18n.t('ui.encoding') }}</mat-label>
        <input
          matInput
          [disabled]="readonly()"
          [ngModel]="draft().encoding || 'UTF-8'"
          (ngModelChange)="patchDraft.emit({ encoding: $event })" />
      </mat-form-field>

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
      .form-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:0.8rem; }
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
