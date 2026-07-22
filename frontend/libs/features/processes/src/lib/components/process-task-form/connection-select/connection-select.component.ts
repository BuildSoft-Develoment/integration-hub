import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ConnectionRef } from '../../../models/process.models';

/**
 * Atomo compartido: el {@code <mat-select>} de conexion que se repetia identico en 8 forms de tarea
 * (db-write/db-execute-fn/db-execute-sp/file-write y mt101-status/archive/reconcile/validate). El render de
 * la opcion — {@code name (connectionType)} — es identico en todos; la varianza real se cubre con inputs:
 *
 * <ul>
 *   <li>{@code valueBy} — que campo de la conexion es el valor de la opcion: {@code 'name'} (forms DB, el
 *       {@code connectionRef} es el nombre) o {@code 'id'} (forms MT101, el {@code connectionRef} es el id).</li>
 *   <li>{@code emptyLabel} — texto de la opcion vacia ({@code value=""}); {@code null} = sin opcion vacia.</li>
 * </ul>
 *
 * <p>El atomo es TONTO: emite {@code valueChange} con el valor elegido y el form cablea su side-effect
 * (DB resetea tabla/columnas via su handler; MT101 solo hace {@code updateDraft}). No conoce el draft ni i18n
 * (recibe los textos ya traducidos).</p>
 */
@Component({
  selector: 'ih-connection-select',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './connection-select.component.html',
  styleUrl: './connection-select.component.css',
})
export class ConnectionSelectComponent {
  readonly connections = input<readonly ConnectionRef[]>([]);
  /** Valor actual (el {@code connectionRef} del draft; todos los forms lo tipan {@code string}). */
  readonly value = input<string | null>(null);
  /** Que campo de la conexion es el valor de la opcion: {@code 'name'} (DB) o {@code 'id'} (MT101). */
  readonly valueBy = input<'name' | 'id'>('name');
  /** Texto del {@code <mat-label>} (ya traducido). */
  readonly label = input('');
  /** Texto de la opcion vacia; {@code null} = no renderizar opcion vacia. */
  readonly emptyLabel = input<string | null>(null);
  readonly disabled = input(false);
  /** Paridad de layout: los forms MT101 usan {@code subscriptSizing="dynamic"}; los DB, el default. */
  readonly subscriptSizing = input<'fixed' | 'dynamic'>('fixed');

  // Emite string, igual que el ngModelChange original (que fluia a un connectionRef:string en todos los
  // forms). En la variante id, el valor de la opcion es numerico en runtime pero el destino es string:
  // se preserva ese comportamiento suelto tal cual (drop-in fiel), sin coaccionar (coaccionar deseleccionaria
  // la opcion, porque las opciones comparan por identidad numerica).
  readonly valueChange = output<string>();
}
