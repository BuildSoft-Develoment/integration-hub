import { Directive, inject, input, output } from '@angular/core';
import { ConnectionDraft } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';

@Directive()
export abstract class ConnectionTypeFormComponentBase {
  readonly i18n = inject(I18nService);
  readonly draft = input.required<ConnectionDraft>();
  readonly readonly = input(false);
  readonly patchDraft = output<Partial<ConnectionDraft>>();

  protected update<K extends keyof ConnectionDraft>(
    field: K,
    value: ConnectionDraft[K]
  ): void {
    if (this.readonly()) {
      return;
    }
    this.patchDraft.emit({ [field]: value } as Partial<ConnectionDraft>);
  }
}
