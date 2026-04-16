import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

import { ManagedEditorTestResult } from './managed-editor.models';

@Component({
  selector: 'ih-managed-editor-test-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './managed-editor-test-result.component.html',
  styleUrl: './managed-editor-test-result.component.css',
})
export class ManagedEditorTestResultComponent {
  readonly result = input<ManagedEditorTestResult | null>(null);
}
