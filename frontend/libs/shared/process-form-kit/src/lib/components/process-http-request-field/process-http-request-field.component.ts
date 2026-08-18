import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { createHttpRequestDraft, HttpRequestDraft } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';
import { SchemaFieldDescriptor } from '@integration-hub/shared/ui';

import { ProcessSchemaFieldContextService } from '../../services/process-schema-field-context.service';
import { ProcessHttpRequestComponent } from '../process-http-request/process-http-request.component';

/**
 * Renderer de campo custom `http-request` para `ih-schema-form`: envuelve el editor rico
 * {@link ProcessHttpRequestComponent} y adapta su modelo a un `FormControl` cuyo valor es un
 * {@link HttpRequestDraft}. task/tasks/readers vienen del {@link ProcessSchemaFieldContextService}
 * publicado por el host. Permite incluir la config de una petición HTTP en un form schema-driven
 * (p.ej. un tipo de plugin que hace llamadas HTTP) sin reimplementar el editor.
 */
@Component({
  selector: 'ih-process-http-request-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProcessHttpRequestComponent],
  template: `
    <label class="http-field__label">{{ label() }}</label>
    @if (context.task(); as task) {
      <ih-process-http-request
        [httpRequest]="draft()"
        [task]="task"
        [tasks]="context.tasks()"
        [readers]="context.readers()"
        [readonly]="readonly()"
        (httpRequestChange)="onChange($event)"
      />
    }
  `,
  styles: [
    `
      .http-field__label { display: block; margin-bottom: 0.25rem; color: var(--ih-text-soft); font-size: var(--ih-font-size-sm); }
    `,
  ],
})
export class ProcessHttpRequestFieldComponent {
  readonly i18n = inject(I18nService);
  readonly context = inject(ProcessSchemaFieldContextService);

  readonly field = input.required<SchemaFieldDescriptor>();
  readonly control = input.required<FormControl>();
  readonly readonly = input(false);

  readonly draft = computed<HttpRequestDraft>(() => {
    const value = this.control().value as HttpRequestDraft | null;
    return value && typeof value === 'object' ? value : createHttpRequestDraft('POST', '20');
  });

  label(): string {
    const field = this.field();
    return field.labelKey ? this.i18n.t(field.labelKey) : field.label ?? field.key;
  }

  onChange(patch: Partial<HttpRequestDraft>): void {
    if (this.readonly()) {
      return;
    }
    const next = { ...this.draft(), ...patch };
    this.control().setValue(next);
    this.control().markAsDirty();
  }
}
