import { Directive, inject, input, output } from '@angular/core';
import { SourceDraft } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';

@Directive()
export abstract class SourceTypeFormComponentBase {
  readonly i18n = inject(I18nService);
  readonly draft = input.required<SourceDraft>();
  readonly readonly = input(false);
  readonly patchDraft = output<Partial<SourceDraft>>();

  protected update<K extends keyof SourceDraft>(field: K, value: SourceDraft[K]): void {
    if (this.readonly()) {
      return;
    }
    this.patchDraft.emit({ [field]: value } as Partial<SourceDraft>);
  }
}
