import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ConnectionRef } from '../../../models/process.models';

/**
 * Atomo compartido: el {@code <mat-select>} de conexion que se repetia identico en 8 forms de tarea
 * (db-write/db-execute-fn/db-execute-sp/file-write y mt101-status/archive/reconcile/validate). El valor de la
 * opcion es SIEMPRE el {@code name} de la conexion — es lo que el backend resuelve
 * ({@code ConnectionPoolManager.resolveJdbcDataSource -> findActiveRequiredByName}). El render de la opcion
 * ({@code name (connectionType)}) es identico en todos.
 *
 * <p>El atomo es TONTO: emite {@code valueChange} (string = el nombre) con el valor elegido y el form cablea
 * su side-effect (DB resetea tabla/columnas via su handler; MT101 solo hace {@code updateDraft}). No conoce el
 * draft ni i18n (recibe los textos ya traducidos).</p>
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
  /** Valor actual: el {@code connectionRef} del draft (el nombre de la conexion). */
  readonly value = input<string | null>(null);
  /** Texto del {@code <mat-label>} (ya traducido). */
  readonly label = input('');
  /** Texto de la opcion vacia; {@code null} = no renderizar opcion vacia. */
  readonly emptyLabel = input<string | null>(null);
  readonly disabled = input(false);
  /** Paridad de layout: los forms MT101 usan {@code subscriptSizing="dynamic"}; los DB, el default. */
  readonly subscriptSizing = input<'fixed' | 'dynamic'>('fixed');

  /** El nombre de la conexion elegida (o {@code ''} para la opcion vacia). */
  readonly valueChange = output<string>();
}
