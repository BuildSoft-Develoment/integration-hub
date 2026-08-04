import { VocabularyKind } from '@integration-hub/core/i18n';

/**
 * Valor de dominio SIN traducir, con la familia a la que pertenece.
 *
 * Es un objeto y no una cadena a proposito. Mientras `status` fue `string`, la plantilla podia
 * interpolarlo tal cual — y eso fue justo lo que ocurrio: el overview mostraba `COMPLETED` donde
 * la lista de ejecuciones decia `Completada`. Con esta forma no hay nada legible que interpolar,
 * asi que pintarlo obliga a pasar por el resolutor.
 */
export interface OverviewVocabularyValue {
  readonly kind: VocabularyKind;
  readonly value: string;
}

export interface OverviewTableRow {
  primary: string;
  secondary: string;
  /** `null` cuando la fila no trae estado: sin valor no hay distintivo que pintar. */
  status: OverviewVocabularyValue | null;
  timestamp: string | null;
}
