import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { I18nService } from '@integration-hub/core/services';
import { ProcessFlowNode } from '../../models/process-flow.models';
import { getProcessFlowNodePresentation } from '../../flow/process-flow.presentation';

interface ProcessFlowNodeExpandedChange {
  expanded: boolean;
  height: number;
}

@Component({
  selector: 'ih-process-flow-node',
  standalone: true,
  imports: [CommonModule],
    templateUrl: './process-flow-node.component.html',
    styleUrl: './process-flow-node.component.css'
})
export class ProcessFlowNodeComponent {
  protected readonly i18n = inject(I18nService);

  private readonly baseHeight = 120;
  private readonly expandedHeightGap = 10;

  readonly node = input.required<ProcessFlowNode>();
  readonly ordinal = input.required<string>();
  readonly title = input.required<string>();
  readonly summary = input.required<string>();

  readonly edit = output<string>();
  readonly expandedChange = output<ProcessFlowNodeExpandedChange>();

  readonly presentation = input.required<ReturnType<typeof getProcessFlowNodePresentation>>();
  readonly expanded = signal(false);
  readonly hasSummary = computed(() => this.summary().trim().length > 0);

  /** Tooltip del badge de despacho (ADR-015): async offload vs scatter distribuido. */
  readonly dispatchTooltip = computed(() => {
    const dispatch = this.node().dispatch;
    if (dispatch === 'scatter') {
      return this.i18n.t('flow.dispatchScatter');
    }
    return dispatch === 'async' ? this.i18n.t('flow.dispatchAsync') : '';
  });
  readonly showSummary = computed(() => this.expanded() && this.hasSummary());
  private readonly card = viewChild<ElementRef<HTMLDivElement>>('card');

  toggleExpanded(event: Event): void {
    event.stopPropagation();
    const next = !this.expanded();
    this.expanded.set(next);
    setTimeout(() => this.emitHeight(), 0);
  }

  private emitHeight(): void {
    const element = this.card()?.nativeElement;
    if (!element) {
      this.expandedChange.emit({ expanded: this.expanded(), height: this.baseHeight });
      return;
    }
    const expandedHeight = Math.ceil(element.scrollHeight + this.expandedHeightGap);
    this.expandedChange.emit({
      expanded: this.expanded(),
      height: this.expanded() && this.hasSummary() ? Math.max(this.baseHeight, expandedHeight) : this.baseHeight,
    });
  }
}
