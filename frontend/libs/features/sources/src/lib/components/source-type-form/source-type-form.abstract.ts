import { Directive, inject, input, output } from '@angular/core';
import { isPlaintextSecret, SourceDraft } from '@integration-hub/core/providers';
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

  // QA-006: true si el campo de credencial trae texto plano (no vacio y no ${secret:...}) -> hint de warning.
  protected readonly isPlaintextSecret = isPlaintextSecret;

  /** i18n key del hint bajo un campo de credencial: warning si esta en claro, guia de referencia si no. */
  protected credentialHintKey(value: unknown): string {
    return this.isPlaintextSecret(value) ? 'sources.credentialPlaintext' : 'schemaForm.secretRef';
  }

  protected update<K extends keyof SourceDraft>(field: K, value: SourceDraft[K]): void {
    if (this.readonly()) {
      return;
    }
    this.patchDraft.emit({ [field]: value } as Partial<SourceDraft>);
  }
}
