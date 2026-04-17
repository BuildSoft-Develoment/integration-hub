import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReaderFieldDraft, ReaderFieldVariant } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';
import { ReaderScriptHelpComponent } from '../reader-script-help/reader-script-help.component';

@Component({
  selector: 'ih-reader-field-definition-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReaderScriptHelpComponent,
  ],
    templateUrl: './reader-field-definition-panel.component.html',
    styleUrl: './reader-field-definition-panel.component.css'
})
export class ReaderFieldDefinitionPanelComponent {
  readonly i18n = inject(I18nService);

  readonly index = input.required<number>();
  readonly field = input.required<ReaderFieldDraft>();
  readonly variant = input<ReaderFieldVariant>('position');
  readonly readonly = input(false);
  readonly expanded = input(false);
  readonly active = input(false);

  readonly opened = output<void>();
  readonly closed = output<void>();
  readonly activated = output<void>();
  readonly update = output<Partial<ReaderFieldDraft>>();
  readonly remove = output<void>();

  summary(): string {
    const field = this.field();
    const parts: string[] = [];
    if (this.variant() === 'range') {
      parts.push(
        field.start || field.end
          ? `${field.start || '?'}-${field.end || '?'}`
          : this.i18n.t('ui.fieldSummary.derived')
      );
    } else {
      parts.push(
        field.position
          ? this.i18n.t('ui.fieldSummary.position', { value: field.position })
          : this.i18n.t('ui.fieldSummary.derived')
      );
    }
    parts.push(this.i18n.t('ui.fieldSummary.type', { value: field.type || 'TEXT' }));
    if (field.required) {
      parts.push(this.i18n.t('ui.fieldSummary.required'));
    }
    return parts.join(' | ');
  }
}



