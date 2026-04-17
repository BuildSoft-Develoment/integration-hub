import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { I18nService } from '@integration-hub/core/services';

interface ScriptExample {
  titleKey: string;
  code: string;
}

@Component({
  selector: 'ih-reader-script-help',
  standalone: true,
  imports: [CommonModule, MatExpansionModule],
    templateUrl: './reader-script-help.component.html',
    styleUrl: './reader-script-help.component.css'
})
export class ReaderScriptHelpComponent {
  readonly i18n = inject(I18nService);

  readonly referenceKeys = [
    'rawValue',
    'value',
    'rawRow',
    'row',
    'field',
    'valid',
    'skipRecord',
    'helpers',
  ] as const;

  readonly examples: readonly ScriptExample[] = [
    {
      titleKey: 'ui.scriptExample.required',
      code: "if (value == null || value == '') {\n  valid = false\n}",
    },
    {
      titleKey: 'ui.scriptExample.normalize',
      code: "value = value == null ? '' : value.toString().trim().toUpperCase()",
    },
    {
      titleKey: 'ui.scriptExample.useOtherField',
      code: "if (row.tipo == 'ANULADO') {\n  skipRecord = true\n}",
    },
    {
      titleKey: 'ui.scriptExample.currentDate',
      code: 'value = currentDate()',
    },
    {
      titleKey: 'ui.scriptExample.uuid',
      code: 'value = uuid()',
    },
    {
      titleKey: 'ui.scriptExample.formatDate',
      code: "value = formatDate(now(), 'yyyy-MM-dd HH:mm:ss')",
    },
    {
      titleKey: 'ui.scriptExample.skipRecord',
      code: "if (row.estado == 'IGNORAR') {\n  skipRecord = true\n}",
    },
  ];
}

