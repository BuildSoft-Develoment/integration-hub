import { Injectable } from '@angular/core';
import { Mt101PayTaskProvider } from './mt101-pay-task.provider';

/**
 * Provider del task type {@code MT101_INBOUND_DELIVER}: sink final del inbound
 * (entrega los mensajes ruteados a tabla destino o endpoint REST). Reusa el form
 * de MT101_PAY (transporte + REST); el transporte DB y el detalle de entrega los
 * gestiona el backend.
 */
@Injectable()
export class Mt101InboundDeliverTaskProvider extends Mt101PayTaskProvider {
  override readonly descriptor = {
    type: 'MT101_INBOUND_DELIVER' as const,
    labelKey: 'processTask.MT101_INBOUND_DELIVER',
    descriptionKey: 'processTaskDescription.MT101_INBOUND_DELIVER',
    modalLayout: 'workspace' as const,
  };
}
