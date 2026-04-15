import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, effect, inject, input, output, signal } from '@angular/core';
import { I18nService } from '@integration-hub/core/services';
import { DbWriteSourceItem } from '../../process-db-write.models';

@Component({
  selector: 'ih-process-db-write-source-palette',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="source-palette">
      <div class="source-palette__header ih-section-header">
        <p class="ih-section-eyebrow">{{ i18n.t('ui.dbWriteAvailableSources') }}</p>
        <h5>{{ i18n.t('ui.dbWriteAvailableSourcesHint') }}</h5>
      </div>

      <div class="source-palette__groups ih-thin-scroll">
        @for (group of orderedGroups(); track group.key; let index = $index) {
          <section class="source-palette__group ih-soft-panel ih-source-group">
            <div class="source-palette__group-bar ih-source-group__bar">
              <button type="button" class="source-palette__group-toggle ih-source-group__toggle" (click)="toggleGroup(group.key)">
                <span class="source-palette__group-chevron ih-source-group__chevron" [class.source-palette__group-chevron--open]="isExpanded(group.key)">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
                <span class="source-palette__group-title ih-source-group__title">{{ groupLabel(group.key) }}</span>
                <span class="source-palette__group-count ih-source-group__count">{{ group.items.length }}</span>
              </button>

              <div class="source-palette__group-actions ih-source-group__actions">
                <button type="button" class="source-palette__group-icon ih-round-icon-button ih-source-group__icon" [disabled]="index === 0" [attr.aria-label]="i18n.t('ui.moveUp')" (click)="moveGroup(index, -1)">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m12 6-5 6h10z" />
                  </svg>
                </button>
                <button type="button" class="source-palette__group-icon ih-round-icon-button ih-source-group__icon" [disabled]="index === orderedGroups().length - 1" [attr.aria-label]="i18n.t('ui.moveDown')" (click)="moveGroup(index, 1)">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m12 18 5-6H7z" />
                  </svg>
                </button>
              </div>
            </div>

            @if (isExpanded(group.key)) {
              <div class="source-palette__group-items ih-source-items">
                @for (item of group.items; track item.kind + ':' + item.key) {
                  <button
                    type="button"
                    class="source-palette__item source-palette__item--compact ih-source-item"
                    [class.source-palette__item--dragging]="draggingSource()?.key === item.key && draggingSource()?.kind === item.kind"
                    [class.source-palette__item--readonly]="readonly()"
                    [disabled]="readonly()"
                    [title]="item.label"
                    draggable="true"
                    (dragstart)="handleDragStart($event, item)"
                    (dragend)="sourceDragEnd.emit()"
                  >
                    <span class="source-palette__kind ih-source-item__kind" [class.source-palette__kind--field]="item.kind === 'field'" [class.source-palette__kind--variable]="item.kind === 'variable'" [class.source-palette__kind--metadata]="item.kind === 'metadata'" [class.ih-source-item__kind--field]="item.kind === 'field'" [class.ih-source-item__kind--variable]="item.kind === 'variable'" [class.ih-source-item__kind--metadata]="item.kind === 'metadata'">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        @switch (item.kind) {
                          @case ('field') {
                            <path d="M5 6h14M5 12h14M5 18h9" />
                          }
                          @case ('variable') {
                            <path d="M8 5 4 12l4 7M16 5l4 7-4 7M13 4l-2 16" />
                          }
                          @default {
                            <path d="M12 3v18M4 8h16M7 13h10M9 18h6" />
                          }
                        }
                      </svg>
                    </span>
                    <span class="source-palette__copy ih-source-item__copy">
                      <strong>{{ item.label }}</strong>
                      @if (item.hint) {
                        <small>{{ item.hint }}</small>
                      }
                    </span>
                  </button>
                }
              </div>
            }
          </section>
        }
      </div>
    </section>
  `,
  styles: [`
      :host {
        display: block;
        min-width: 0;
        min-height: 0;
      }
      .source-palette {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 0.9rem;
        min-width: 0;
        min-height: 0;
        height: 100%;
      }
      .source-palette__groups {
        display: grid;
        gap: 0.6rem;
        align-content: start;
        min-height: 0;
        overflow: auto;
        padding: 0 0.25rem 0.5rem 0;
      }
      .source-palette__group-chevron--open {
        transform: rotate(180deg);
      }
      .source-palette__item {
        color: var(--ih-text);
      }
      .source-palette__item--dragging {
        border-color: color-mix(in srgb, var(--ih-accent) 48%, var(--ih-border));
        background: color-mix(in srgb, var(--ih-accent) 10%, var(--ih-surface));
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--ih-accent) 12%, transparent);
        transform: translateY(-1px);
      }
      .source-palette__item--readonly {
        cursor: default;
      }
      @media (max-width: 1080px) {
        .source-palette {
          height: auto;
        }
        .source-palette__groups {
          overflow: visible;
          max-height: none;
          padding: 0;
        }
        .source-palette__group-actions {
          gap: 0.1rem;
        }
        .source-palette__group-icon {
          width: 1.35rem;
          height: 1.35rem;
        }
      }
    `],
})
export class ProcessDbWriteSourcePaletteComponent {
  readonly i18n = inject(I18nService);
  private readonly compactViewport = signal(this.detectCompactViewport());
  private lastCompactViewport = this.compactViewport();

  readonly groups = input.required<ReadonlyArray<{ key: string; items: readonly DbWriteSourceItem[] }>>();
  readonly draggingSource = input<DbWriteSourceItem | null>(null);
  readonly readonly = input(false);

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
    this.groupOrder.update((current) => {
      const nextIndex = index + delta;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
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
