import { Pipe, PipeTransform, inject } from '@angular/core';
import { DateTimeService } from '@integration-hub/core/services';

/**
 * Muestra un timestamp ISO de forma accionable en columnas operativas.
 * - modo 'relative' (por defecto): "hace 2 horas" (Luxon, locale es).
 * - modo 'absolute': formato fecha/hora completo, ideal para el tooltip.
 *
 * Uso recomendado (accesible): el texto visible es relativo y el title el absoluto.
 *   <time [attr.datetime]="ts" [title]="ts | ihTime:'absolute'">{{ ts | ihTime }}</time>
 */
@Pipe({ name: 'ihTime', standalone: true })
export class RelativeTimePipe implements PipeTransform {
  private readonly dateTime = inject(DateTimeService);

  transform(value: string | null | undefined, mode: 'relative' | 'absolute' = 'relative'): string {
    return mode === 'absolute' ? this.dateTime.formatIso(value) : this.dateTime.formatRelative(value);
  }
}
