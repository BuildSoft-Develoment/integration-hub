import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FFlowModule } from '@foblex/flow';
import { ProcessTaskManagerService } from '@integration-hub/core/services';
import { processTaskTypes, ProcessTaskType } from '../../process.models';
import { getProcessFlowNodePresentation } from '../../process-flow.presentation';

@Component({
  selector: 'ih-process-flow-palette',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatTooltipModule, FFlowModule],
    templateUrl: './process-flow-palette.component.html',
    styleUrl: './process-flow-palette.component.css'
})
export class ProcessFlowPaletteComponent {
  private readonly manager = inject(ProcessTaskManagerService);
  readonly taskTypes = processTaskTypes;

  presentation(taskType: ProcessTaskType) {
    return getProcessFlowNodePresentation(taskType);
  }

  taskLabel(taskType: ProcessTaskType): string {
    return this.manager.label(taskType);
  }
}
