import { Injectable } from '@angular/core';
import { DateTime } from 'luxon';

@Injectable({ providedIn: 'root' })
export class DateTimeService {
  readonly zone = 'America/Lima';

  now(): DateTime {
    return DateTime.now().setZone(this.zone);
  }

  formatNow(format = "dd LLL yyyy, HH:mm"): string {
    return this.now().toFormat(format);
  }

  formatIso(value: string | null | undefined, format = "dd LLL yyyy, HH:mm"): string {
    if (!value) {
      return '';
    }

    const dateTime = DateTime.fromISO(value, { zone: this.zone });
    return dateTime.isValid ? dateTime.toFormat(format) : value;
  }

  /**
   * Formato relativo y accionable para columnas operativas ("hace 2 horas").
   * Cae al formato absoluto si Luxon no puede expresar el relativo.
   */
  formatRelative(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const dateTime = DateTime.fromISO(value, { zone: this.zone });
    if (!dateTime.isValid) {
      return value;
    }
    return dateTime.toRelative({ locale: 'es' }) ?? this.formatIso(value);
  }
}
