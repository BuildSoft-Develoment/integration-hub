import { Component, inject, input } from '@angular/core';
import { ReaderFieldDraft } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';

/**
 * Vista READ-ONLY de la "Definicion de campos" de un reader (lo que ya se configuro en el reader). La usa
 * FILE_READ para que, al elegir un reader, se vea que campos produce el record sin salir del form. No edita
 * nada — la config del campo se cambia en el editor del reader (otra feature; los boundaries Nx impiden
 * reusar ese editor desde processes, y para "solo vista" una tabla compacta es mejor UX que el editor
 * deshabilitado). El shape es {@link ReaderFieldDraft}: variante 'position' (delimitado) o 'range' (fixed).
 */
@Component({
  selector: 'ih-process-reader-fields-view',
  standalone: true,
  templateUrl: './process-reader-fields-view.component.html',
  styleUrl: './process-reader-fields-view.component.css',
})
export class ProcessReaderFieldsViewComponent {
  readonly i18n = inject(I18nService);

  readonly fields = input<readonly ReaderFieldDraft[]>([]);
  /** 'position' = delimitado (columna/posicion); 'range' = fixed-length (inicio/fin). */
  readonly variant = input<'position' | 'range'>('position');
}
