import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { ProcessFlowNode } from '../../process-flow.models';
import { getProcessFlowNodePresentation } from '../../process-flow.presentation';

interface ProcessFlowNodeExpandedChange {
  expanded: boolean;
  height: number;
}

@Component({
  selector: 'ih-process-flow-node',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #card class="task-node" [class.task-node--expanded]="showSummary()" [ngClass]="presentation().toneClass">
      <div class="task-node__header">
        <div class="task-node__meta">{{ ordinal() }}</div>
        <button type="button" class="task-node__edit" (click)="edit.emit(node().taskRef); $event.stopPropagation()">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M16.86 3.49a2.12 2.12 0 0 1 3 3L9 17.35 5 18.5l1.15-4 10.71-11.01ZM14.5 5.85 18.15 9.5" />
          </svg>
        </button>
      </div>

      <div class="task-node__identity">
        <span class="task-node__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path [attr.d]="presentation().iconPath" />
          </svg>
        </span>
        <span class="task-node__badge">{{ presentation().badge }}</span>
      </div>

      <div class="task-node__title-row">
        <strong class="task-node__title">{{ title() }}</strong>
        <button type="button" class="task-node__expand" (click)="toggleExpanded($event)">
          <svg viewBox="0 0 24 24" aria-hidden="true" [class.is-open]="expanded()">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      @if (showSummary()) {
        <div class="task-node__summary-wrap">
          <span class="task-node__summary">{{ summary() }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
      .task-node {
        --task-node-accent: var(--ih-accent-strong);
        position: relative;
        display: grid;
        gap: 0.26rem;
        align-content: start;
        box-sizing: border-box;
        height: 100%;
        padding: 0.58rem 0.64rem 1.1rem 0.72rem;
        border-radius: 16px;
        border: 1px solid var(--ih-border);
        background:
          radial-gradient(circle at top right, color-mix(in srgb, var(--task-node-accent) 18%, transparent), transparent 45%),
          color-mix(in srgb, var(--ih-surface-alt) 94%, transparent);
        box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
        min-height: 92px;
        min-width: 0;
        overflow: visible;
        transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
      }
      .task-node--expanded {
        padding-bottom: 1.28rem;
      }
      .task-node:hover {
        transform: translateY(-1px);
      }
      .task-node__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.6rem;
      }
      .task-node__meta {
        font-size: 0.62rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--ih-text-soft);
      }
      .task-node__edit {
        display: inline-grid;
        place-items: center;
        width: 1.48rem;
        height: 1.48rem;
        border: 0;
        border-radius: 999px;
        background: color-mix(in srgb, var(--task-node-accent) 10%, transparent);
        color: var(--task-node-accent);
        cursor: pointer;
        transition: background-color 120ms ease, transform 120ms ease;
      }
      .task-node__edit:hover {
        background: color-mix(in srgb, var(--task-node-accent) 18%, transparent);
        transform: translateY(-1px);
      }
      .task-node__edit svg {
        width: 0.82rem;
        height: 0.82rem;
        stroke: currentColor;
        fill: none;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .task-node__identity {
        display: flex;
        align-items: center;
        gap: 0.32rem;
        min-width: 0;
      }
      .task-node__icon {
        display: inline-grid;
        place-items: center;
        width: 1.28rem;
        height: 1.28rem;
        border-radius: 0.42rem;
        color: var(--task-node-accent);
        background: color-mix(in srgb, var(--task-node-accent) 10%, transparent);
      }
      .task-node__icon svg {
        width: 0.76rem;
        height: 0.76rem;
        stroke: currentColor;
        fill: none;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .task-node__badge {
        display: inline-flex;
        align-items: center;
        padding: 0.12rem 0.34rem;
        border-radius: 999px;
        font-size: 0.56rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        background: color-mix(in srgb, var(--task-node-accent) 12%, transparent);
        color: var(--task-node-accent);
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .task-node__title-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 0.38rem;
        align-items: center;
        min-width: 0;
      }
      .task-node__title {
        font-size: 0.78rem;
        line-height: 1.12;
        overflow-wrap: anywhere;
      }
      .task-node__expand {
        display: inline-grid;
        place-items: center;
        width: 1.22rem;
        height: 1.22rem;
        padding: 0;
        border: 0;
        border-radius: 999px;
        background: color-mix(in srgb, var(--task-node-accent) 8%, transparent);
        color: var(--task-node-accent);
        cursor: pointer;
        transition: background-color 120ms ease;
      }
      .task-node__expand:hover {
        background: color-mix(in srgb, var(--task-node-accent) 14%, transparent);
      }
      .task-node__expand svg {
        width: 0.72rem;
        height: 0.72rem;
        stroke: currentColor;
        fill: none;
        stroke-width: 1.9;
        stroke-linecap: round;
        stroke-linejoin: round;
        transition: transform 120ms ease;
      }
      .task-node__expand svg.is-open {
        transform: rotate(180deg);
      }
      .task-node__summary-wrap {
        padding-top: 0.08rem;
        border-top: 1px dashed color-mix(in srgb, var(--task-node-accent) 18%, var(--ih-border));
      }
      .task-node__summary {
        color: var(--ih-text-soft);
        line-height: 1.25;
        font-size: 0.68rem;
        overflow-wrap: anywhere;
        display: block;
      }
      .task-node--source {
        --task-node-accent: #0f766e;
      }
      .task-node--database {
        --task-node-accent: #1d4ed8;
      }
      .task-node--procedure {
        --task-node-accent: #7c3aed;
      }
      .task-node--function {
        --task-node-accent: #9333ea;
      }
      .task-node--integration {
        --task-node-accent: #ea580c;
      }
      .task-node--notification {
        --task-node-accent: #b45309;
      }
    `],
})
export class ProcessFlowNodeComponent {
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
