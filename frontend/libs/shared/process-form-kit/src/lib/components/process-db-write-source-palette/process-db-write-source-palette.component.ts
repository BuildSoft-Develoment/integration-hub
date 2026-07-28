import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, effect, inject, input, output, signal } from '@angular/core';
import { I18nService } from '@integration-hub/core/services';
import { DbWriteSourceItem } from '../../models/process-db-write.models';

@Component({
  selector: 'ih-process-db-write-source-palette',
  standalone: true,
  imports: [CommonModule],
    templateUrl: './process-db-write-source-palette.component.html',
    styleUrl: './process-db-write-source-palette.component.css'
})
export class ProcessDbWriteSourcePaletteComponent {
  readonly i18n = inject(I18nService);
  private readonly compactViewport = signal(this.detectCompactViewport());
  private lastCompactViewport = this.compactViewport();

  readonly groups = input.required<ReadonlyArray<{ key: string; items: readonly DbWriteSourceItem[] }>>();
  readonly draggingSource = input<DbWriteSourceItem | null>(null);
  readonly readonly = input(false);
  readonly titleKey = input('ui.dbWriteAvailableSources');
  readonly hintKey = input('ui.dbWriteAvailableSourcesHint');

  readonly sourceDragStart = output<DbWriteSourceItem>();
  readonly sourceDragEnd = output<void>();

  readonly groupOrder = signal<string[]>([]);
  readonly expandedGroups = signal<Record<string, boolean>>({});
  readonly orderedGroups = computed(() => {
    const groupsByKey = new Map(this.groups().map((group) => [group.key, group]));
    return this.groupOrder()
      .map((key) => groupsByKey.get(key))
      .filter((group): group is { key: string; items: readonly DbWriteSourceItem[] } => !!group);
  });

  constructor() {
    effect(() => {
      const incoming = this.groups();
      const incomingKeys = incoming.map((group) => group.key);
      this.groupOrder.update((current) => {
        const retained = current.filter((key) => incomingKeys.includes(key));
        const additions = incomingKeys.filter((key) => !retained.includes(key));
        return [...retained, ...additions];
      });
      this.expandedGroups.update((current) => {
        const next = { ...current };
        incomingKeys.forEach((key) => {
          if (!(key in next)) {
            next[key] = !this.compactViewport();
          }
        });
        Object.keys(next).forEach((key) => {
          if (!incomingKeys.includes(key)) {
            delete next[key];
          }
        });
        return next;
      });
    });
  }

  isExpanded(groupKey: string): boolean {
    return this.expandedGroups()[groupKey] ?? true;
  }

  toggleGroup(groupKey: string): void {
    this.expandedGroups.update((current) => ({
      ...current,
      [groupKey]: !(current[groupKey] ?? true),
    }));
  }

  moveGroup(index: number, delta: -1 | 1): void {
    // El indice proviene de orderedGroups() (lista renderizada y filtrada). El swap debe
    // hacerse sobre esas mismas keys visibles, no sobre groupOrder() crudo: si groupOrder
    // tuviera keys residuales (no presentes en groups()), los indices dejan de alinearse y
    // el reorden solo funcionaria en el prefijo comun (metadata/summary).
    const visible = this.orderedGroups().map((group) => group.key);
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= visible.length) {
      return;
    }
    const reordered = [...visible];
    [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
    // Preserva, al final, cualquier key de groupOrder que no este visible (defensivo).
    const residual = this.groupOrder().filter((key) => !reordered.includes(key));
    this.groupOrder.set([...reordered, ...residual]);
  }

  handleDragStart(event: DragEvent, item: DbWriteSourceItem): void {
    if (this.readonly()) {
      event.preventDefault();
      return;
    }
    event.dataTransfer?.setData('text/plain', JSON.stringify(item));
    event.dataTransfer!.effectAllowed = 'copy';
    this.sourceDragStart.emit(item);
  }

  @HostListener('window:resize')
  handleViewportResize(): void {
    const nextCompactViewport = this.detectCompactViewport();
    if (nextCompactViewport === this.lastCompactViewport) {
      return;
    }
    this.compactViewport.set(nextCompactViewport);
    this.lastCompactViewport = nextCompactViewport;
    this.expandedGroups.update((current) =>
      Object.keys(current).reduce<Record<string, boolean>>((accumulator, key) => {
        accumulator[key] = !nextCompactViewport;
        return accumulator;
      }, {}),
    );
  }

  private detectCompactViewport(): boolean {
    return typeof window !== 'undefined' ? window.matchMedia('(max-width: 1080px)').matches : false;
  }

  groupLabel(groupKey: string): string {
    const translated = this.i18n.t(groupKey);
    if (translated !== groupKey) {
      return translated;
    }
    switch (groupKey) {
      case 'ui.dbWriteGroup.fields':
        return this.i18n.t('ui.dbWriteGroup.fields');
      case 'ui.dbWriteGroup.variables':
        return this.i18n.t('ui.dbWriteGroup.variables');
      case 'ui.dbWriteGroup.metadata':
        return this.i18n.t('ui.dbWriteGroup.metadata');
      default:
        return groupKey;
    }
  }
}
