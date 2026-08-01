import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { I18nService } from '@integration-hub/core/services';

// El tipo se IMPORTA del store en vez de redeclararse. Existian dos copias de la misma union y por
// eso pudieron divergir en silencio: la del store y esta. Con `import type` no hay import en tiempo
// de ejecucion -se borra al compilar-, asi que no se introduce ciclo con la pagina de catalogo.
import type { ExecutionStatusFilter } from '../../catalog/execution-catalog-query.store';

type ExecutionModeFilter = 'ALL' | 'MANUAL' | 'SCHEDULED';

@Component({
  selector: 'ih-execution-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, RouterLink],
  templateUrl: './execution-toolbar.component.html',
  styleUrl: './execution-toolbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExecutionToolbarComponent {
  readonly i18n = inject(I18nService);
  readonly search = input('');
  readonly modeFilter = input<ExecutionModeFilter>('ALL');
  readonly statusFilter = input<ExecutionStatusFilter>('ALL');
  readonly startedFrom = input('');
  readonly startedTo = input('');
  readonly loading = input(false);
  readonly searchChange = output<string>();
  readonly modeFilterChange = output<ExecutionModeFilter>();
  readonly statusFilterChange = output<ExecutionStatusFilter>();
  readonly startedFromChange = output<string>();
  readonly startedToChange = output<string>();
  readonly refresh = output<void>();
  readonly clearFilters = output<void>();

  /** Habilita "Limpiar" solo si hay algun filtro activo (evita un boton muerto). */
  readonly hasActiveFilters = computed(
    () => !!this.search() || this.modeFilter() !== 'ALL' || this.statusFilter() !== 'ALL'
      || !!this.startedFrom() || !!this.startedTo(),
  );
}
