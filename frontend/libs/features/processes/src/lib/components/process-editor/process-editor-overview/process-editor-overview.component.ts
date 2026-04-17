import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { I18nService } from '@integration-hub/core/services';

import { ProcessFormModel } from '../../../process.models';

@Component({
  selector: 'ih-process-editor-overview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
  ],
    templateUrl: './process-editor-overview.component.html',
    styleUrl: './process-editor-overview.component.css'
})
export class ProcessEditorOverviewComponent {
  readonly i18n = inject(I18nService);

  readonly form = input.required<ProcessFormModel>();
  readonly readonly = input(false);

  readonly patchForm = output<Partial<ProcessFormModel>>();
}
