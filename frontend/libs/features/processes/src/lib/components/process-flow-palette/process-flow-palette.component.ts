// @trace spec 003-diseno-y-ejecucion-procesos T-015 (M-1a: palette descubierta via manager)
// @trace ADR-009
import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FFlowModule } from '@foblex/flow';
import { ProcessTaskManagerService } from '@integration-hub/core/services';
import { ProcessTaskType } from '../../models/process.models';
import { getProcessFlowNodePresentation } from '../../flow/process-flow.presentation';

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

  /** Tipos disponibles — derivados del registro DI, no hardcoded. */
  readonly taskTypes = computed<readonly ProcessTaskType[]>(() =>
    this.manager.availableProviders().map((descriptor) => descriptor.type),
  );

  presentation(taskType: ProcessTaskType) {
    return getProcessFlowNodePresentation(taskType);
  }

  taskLabel(taskType: ProcessTaskType): string {
    return this.manager.label(taskType);
  }
}
