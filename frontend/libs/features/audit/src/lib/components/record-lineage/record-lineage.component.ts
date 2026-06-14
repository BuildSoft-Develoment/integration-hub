// @trace observabilidad: visor de trazabilidad E2E a nivel de registro
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuditApiService } from '../../api/audit-api.service';
import { RecordLineageEntry } from '../../models/audit.models';

/**
 * Visor de la linea de tiempo E2E de un registro (:20:) o de toda una ejecucion
 * (traceId): INGESTED -> BUILT -> VALIDATED -> ARCHIVED -> SENT/REJECTED.
 * Consume GET /api/query/record-lineage.
 */
@Component({
  selector: 'ih-record-lineage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .lineage { display:flex; flex-direction:column; gap:1rem; }
    .lineage__search { display:flex; gap:.5rem; flex-wrap:wrap; align-items:center; }
    .lineage__search input { padding:.45rem .6rem; min-width:16rem; }
    .lineage__timeline { display:flex; flex-direction:column; gap:.25rem; }
    .lineage__entry { display:grid; grid-template-columns:11rem 9rem 1fr 12rem; gap:.75rem;
      padding:.5rem .75rem; border-left:3px solid var(--ih-accent, #4c6ef5); background:var(--ih-surface, #1b1f27); }
    .lineage__stage { font-weight:600; }
    .lineage__status--REJECTED { color:#e03131; }
    .lineage__status--SENT,.lineage__status--ARCHIVED,.lineage__status--VALIDATED { color:#2f9e44; }
    .lineage__empty,.lineage__error { color:var(--ih-text-soft); padding:.75rem; }
    .lineage__error { color:#e03131; }
  `],
  template: `
    <section class="lineage">
      <div class="lineage__search">
        <input [(ngModel)]="recordId" placeholder="recordId (:20:)" (keyup.enter)="searchByRecord()" />
        <button (click)="searchByRecord()">Buscar registro</button>
        <input [(ngModel)]="traceId" placeholder="traceId (exec-<id>)" (keyup.enter)="searchByTrace()" />
        <button (click)="searchByTrace()">Buscar ejecucion</button>
      </div>

      @if (loading()) {
        <p class="lineage__empty">Cargando linea de tiempo...</p>
      } @else if (error()) {
        <p class="lineage__error">{{ error() }}</p>
      } @else if (entries().length === 0) {
        <p class="lineage__empty">Sin eventos. Ingresa un recordId o traceId.</p>
      } @else {
        <div class="lineage__timeline">
          @for (entry of entries(); track $index) {
            <div class="lineage__entry">
              <span class="lineage__stage">{{ entry.stage }}</span>
              <span class="lineage__status lineage__status--{{ entry.status }}">{{ entry.status }}</span>
              <span>{{ entry.message || entry.recordId || entry.traceId }}</span>
              <span>{{ entry.eventTs }}</span>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class RecordLineageComponent {
  private readonly api = inject(AuditApiService);

  recordId = '';
  traceId = '';

  readonly entries = signal<RecordLineageEntry[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  searchByRecord(): void {
    if (!this.recordId.trim()) {
      return;
    }
    this.fetch({ recordId: this.recordId });
  }

  searchByTrace(): void {
    if (!this.traceId.trim()) {
      return;
    }
    this.fetch({ traceId: this.traceId });
  }

  private fetch(query: { recordId?: string; traceId?: string }): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.recordLineage(query).subscribe({
      next: (rows) => {
        this.entries.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la trazabilidad.');
        this.loading.set(false);
      },
    });
  }
}
