import { COMMON_ENCODINGS } from '@integration-hub/shared/ui';

export abstract class ReaderTypeFormBaseComponent {
  // 008: sugerencias del combo de codificacion (el usuario puede elegir o escribir una propia).
  readonly encodings = COMMON_ENCODINGS;
}
