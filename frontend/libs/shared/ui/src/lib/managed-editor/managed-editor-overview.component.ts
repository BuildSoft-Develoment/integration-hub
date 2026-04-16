import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { I18nService } from '@integration-hub/core/services';
import { inject } from '@angular/core';

import { ManagedEditorOption } from './managed-editor.models';
import { ManagedEditorSectionComponent } from './managed-editor-section.component';

@Component({
  selector: 'ih-managed-editor-overview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    ManagedEditorSectionComponent,
  ],
  templateUrl: './managed-editor-overview.component.html',
  styleUrl: './managed-editor-overview.component.css',
})
export class ManagedEditorOverviewComponent {
  readonly i18n = inject(I18nService);

  readonly sectionTitleKey = input.required<string>();
  readonly fieldPrefix = input.required<string>();
  readonly name = input.required<string>();
  readonly selectedType = input.required<string>();
  readonly active = input.required<boolean>();
  readonly readonly = input(false);
  readonly providerOptions = input.required<readonly ManagedEditorOption[]>();

  readonly nameChange = output<string>();
  readonly typeChange = output<string>();
  readonly activeChange = output<boolean>();
}
