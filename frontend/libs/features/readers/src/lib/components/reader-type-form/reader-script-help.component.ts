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
  template: `
    <mat-expansion-panel class="script-help-panel">
      <mat-expansion-panel-header>
        <mat-panel-title>{{ i18n.t('ui.legendExamples') }}</mat-panel-title>
        <mat-panel-description>{{ i18n.t('ui.script') }}</mat-panel-description>
      </mat-expansion-panel-header>

      <div class="script-help-body">
        <p class="ih-muted script-intro">{{ i18n.t('ui.scriptHelpIntro') }}</p>

        <section class="script-help-section">
          <h5>{{ i18n.t('ui.scriptReferenceTitle') }}</h5>
          <div class="script-reference-grid">
            @for (item of referenceKeys; track item) {
              <div class="script-reference-card">
                <strong>{{ i18n.t('ui.scriptReference.' + item + '.title') }}</strong>
                <p>{{ i18n.t('ui.scriptReference.' + item + '.body') }}</p>
              </div>
            }
          </div>
        </section>

        <section class="script-help-section">
          <h5>{{ i18n.t('ui.legendExamples') }}</h5>
          <div class="script-example-grid">
            @for (example of examples; track example.titleKey) {
              <div class="script-example-card">
                <strong>{{ i18n.t(example.titleKey) }}</strong>
                <pre>{{ example.code }}</pre>
              </div>
            }
          </div>
        </section>
      </div>
    </mat-expansion-panel>
  `,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }
      .script-help-panel {
        margin-top: 0.25rem;
        border: 1px dashed var(--ih-border);
        border-radius: 12px !important;
        background: color-mix(in srgb, var(--ih-surface) 16%, transparent);
        box-shadow: none !important;
        min-width: 0;
      }
      .script-help-body {
        display: grid;
        gap: 0.9rem;
        min-width: 0;
      }
      .script-intro {
        margin: 0;
        line-height: 1.5;
        overflow-wrap: anywhere;
      }
      .script-help-section {
        display: grid;
        gap: 0.55rem;
        min-width: 0;
      }
      .script-help-section h5 {
        margin: 0;
        font-size: 0.84rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--ih-text-soft);
      }
      .script-reference-grid,
      .script-example-grid {
        display: grid;
        gap: 0.55rem;
        min-width: 0;
      }
      .script-reference-card,
      .script-example-card {
        padding: 0.7rem 0.8rem;
        border: 1px solid var(--ih-border);
        border-radius: 12px;
        background: color-mix(in srgb, var(--ih-surface-alt) 94%, transparent);
        min-width: 0;
      }
      .script-reference-card p {
        margin: 0.3rem 0 0;
        color: var(--ih-text-soft);
        line-height: 1.45;
        overflow-wrap: anywhere;
      }
      .script-example-card pre {
        margin: 0.45rem 0 0;
        padding: 0.65rem 0.75rem;
        border-radius: 10px;
        background: color-mix(in srgb, var(--ih-surface) 55%, #0f172a 10%);
        overflow: auto;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      @container (max-width: 760px) {
        .script-help-panel {
          margin-top: 0;
        }
        .script-help-body {
          gap: 0.75rem;
        }
        .script-help-section h5 {
          font-size: 0.78rem;
        }
      }
    `,
  ],
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

