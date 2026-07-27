// @trace spec 003-diseno-y-ejecucion-procesos T-015 (M-1a: palette descubierta via manager)
// @trace ADR-009
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FFlowModule } from '@foblex/flow';
import { ProcessTaskManagerService } from '@integration-hub/core/services';
import { I18nService } from '@integration-hub/core/i18n';
import { ProcessTaskType } from '../../models/process.models';
import { CATEGORY_PLUGIN, categoryLabelKey, getProcessFlowNodePresentation, taskCategory, TaskCategory } from '../../flow/process-flow.presentation';

/**
 * Paleta del flow editor: muestra los task types disponibles para arrastrar al
 * canvas.
 *
 * <p>Tras M-1a, la lista NO esta hardcoded. Se deriva reactivamente de
 * {@code ProcessTaskManagerService.availableProviders()}, que agrega:</p>
 * <ul>
 *   <li>Los 6 task types del motor (FILE_READ, DB_WRITE, ...).</li>
 *   <li>Los task types aportados por verticales via
 *       {@code provideProcessTaskProviders} y {@code providePaymentsSwiftForms}
 *       (los 10 MT101_* de spec 008, futuros PAIN001_* de spec 008 sub-catalogo
 *       iso20022/, etc).</li>
 * </ul>
 */
@Component({
  selector: 'ih-process-flow-palette',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatTooltipModule, FFlowModule],
  templateUrl: './process-flow-palette.component.html',
  styleUrl: './process-flow-palette.component.css',
})
export class ProcessFlowPaletteComponent {
  private readonly manager = inject(ProcessTaskManagerService);

  private readonly i18n = inject(I18nService);

  /**
   * Categorias que el usuario abrio/cerro explicitamente. Lo que no toco sigue el default de
   * {@link isExpanded}: asi no hay que enumerar de antemano los verticales existentes.
   */
  private readonly expansionOverrides = signal<ReadonlyMap<TaskCategory, boolean>>(new Map());

  readonly groupedTaskTypes = computed(() => {
    const groups = new Map<TaskCategory, ProcessTaskType[]>();
    // ADR-021: se agrupa por la categoria que DECLARA cada provider (por eso se conserva el
    // descriptor y no solo el type).
    for (const descriptor of this.manager.availableProviders()) {
      const cat = taskCategory(descriptor);
      if (!groups.has(cat)) { groups.set(cat, []); }
      groups.get(cat)!.push(descriptor.type);
    }
    return groups;
  });

  readonly categories = computed<TaskCategory[]>(() => Array.from(this.groupedTaskTypes().keys()));

  /** Default: todo abierto salvo el cajon de plugins — sin nombrar ningun vertical. */
  isExpanded(cat: TaskCategory): boolean {
    return this.expansionOverrides().get(cat) ?? cat !== CATEGORY_PLUGIN;
  }

  toggleCategory(cat: TaskCategory): void {
    const next = new Map(this.expansionOverrides());
    next.set(cat, !this.isExpanded(cat));
    this.expansionOverrides.set(next);
  }

  /** Etiqueta del grupo por i18n; si el vertical no aporto la clave, muestra el identificador. */
  categoryLabel(cat: TaskCategory): string {
    const key = categoryLabelKey(cat);
    const translated = this.i18n.t(key);
    return translated === key ? cat : translated;
  }

  presentation(taskType: ProcessTaskType) {
    return getProcessFlowNodePresentation(taskType, this.manager.declaredNodePresentation(taskType));
  }

  taskLabel(taskType: ProcessTaskType): string {
    return this.manager.label(taskType);
  }

  taskTooltip(taskType: ProcessTaskType): string {
    const label = this.taskLabel(taskType);
    const status = this.manager.status(taskType);
    const reason = this.manager.statusReason(taskType);
    if (!status || status === 'AVAILABLE') {
      return label;
    }
    return reason ? `${label} - ${status}: ${reason}` : `${label} - ${status}`;
  }

  taskDisabled(taskType: ProcessTaskType): boolean {
    return !this.manager.isAvailable(taskType);
  }
}
