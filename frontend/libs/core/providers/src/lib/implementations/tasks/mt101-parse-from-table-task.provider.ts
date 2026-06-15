import { Injectable } from '@angular/core';
import { Mt101ParseTaskProvider } from './mt101-parse-task.provider';

/**
 * Provider del task type {@code MT101_PARSE_FROM_TABLE}: variante table-backed/
 * paginada de {@code MT101_PARSE} para ingestion inbound a escala. Reusa el form
 * de MT101_PARSE (mismo modelo de interpretacion); el config table-driven
 * (input table + inboundSetIdTemplate + pageSize) lo gestiona el backend.
 */
@Injectable()
export class Mt101ParseFromTableTaskProvider extends Mt101ParseTaskProvider {
  override readonly descriptor = {
    type: 'MT101_PARSE_FROM_TABLE' as const,
    labelKey: 'processTask.MT101_PARSE_FROM_TABLE',
    descriptionKey: 'processTaskDescription.MT101_PARSE_FROM_TABLE',
    modalLayout: 'workspace' as const,
  };
}
