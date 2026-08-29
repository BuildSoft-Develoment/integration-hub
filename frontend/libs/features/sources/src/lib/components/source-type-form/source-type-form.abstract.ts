import { Directive, inject, input, output } from '@angular/core';
import { SourceDraft } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';
import { COMMON_MEDIA_TYPES } from '@integration-hub/shared/ui';

@Directive()
export abstract class SourceTypeFormComponentBase {
  readonly i18n = inject(I18nService);
  // 004: sugerencias del combo "Media type" (el usuario puede elegir o escribir uno propio).
  readonly mediaTypes = COMMON_MEDIA_TYPES;
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
