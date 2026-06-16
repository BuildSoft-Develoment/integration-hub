// @trace observabilidad: visor de trazabilidad E2E a nivel de registro
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
  imports: [CommonModule, FormsModule, RouterLink],
  styles: [`
    .lineage { display:flex; flex-direction:column; gap:1rem; }
    .lineage__search { display:grid; grid-template-columns:repeat(auto-fit, minmax(14rem, 1fr)); gap:.75rem; align-items:end; }
    .lineage__field { display:flex; flex-direction:column; gap:.25rem; }
    .lineage__field label { font-size:.75rem; color:var(--ih-text-soft); }
    .lineage__field input,.lineage__field select { min-height:2.35rem; padding:.45rem .6rem; border:1px solid var(--ih-border, #354052); background:var(--ih-surface, #10141b); color:inherit; }
    .lineage__actions { display:flex; gap:.5rem; flex-wrap:wrap; }
    .lineage__actions button { min-height:2.35rem; padding:.45rem .8rem; }
    .lineage__timeline { display:flex; flex-direction:column; gap:.35rem; }
    .lineage__entry { display:grid; grid-template-columns:minmax(9rem, 13rem) minmax(7rem, 9rem) minmax(12rem, 1fr) minmax(10rem, 13rem); gap:.75rem;
      padding:.65rem .75rem; border-left:3px solid var(--ih-accent, #4c6ef5); background:var(--ih-surface, #1b1f27); align-items:start; }
    .lineage__stage { font-weight:600; overflow-wrap:anywhere; }
    .lineage__status--REJECTED { color:#e03131; }
    .lineage__status--SENT,.lineage__status--ARCHIVED,.lineage__status--VALIDATED,.lineage__status--CONFIRMED,.lineage__status--RECONCILED { color:#2f9e44; }
    .lineage__keys { display:flex; flex-direction:column; gap:.15rem; font-size:.82rem; overflow-wrap:anywhere; }
    .lineage__key { color:var(--ih-text-soft); }
    .lineage__link { font-size:.78rem; color:var(--ih-accent, #4c6ef5); text-decoration:none; width:fit-content; }
    .lineage__link:hover { text-decoration:underline; }
    .lineage__empty,.lineage__error { color:var(--ih-text-soft); padding:.75rem; }
    .lineage__error { color:#e03131; }
    @media (max-width: 760px) {
      .lineage__entry { grid-template-columns:1fr; }
    }
  `],
  template: `
    <section class="lineage">
      <div class="lineage__search">
        <div class="lineage__field">
          <label>recordId</label>
          <input [(ngModel)]="recordId" placeholder="archivo:linea o :20:" (keyup.enter)="searchByRecord()" />
        </div>
        <div class="lineage__field">
          <label>traceId</label>
          <input [(ngModel)]="traceId" placeholder="exec-123" (keyup.enter)="searchByTrace()" />
        </div>
        <div class="lineage__field">
          <label>clave</label>
          <select [(ngModel)]="key">
            @for (option of keyOptions; track option.value) {
              <option [value]="option.value">{{ option.label }}</option>
            }
          </select>
        </div>
        <div class="lineage__field">
          <label>valor</label>
          <input [(ngModel)]="value" placeholder=":20:, :21:, UETR, hash..." (keyup.enter)="searchByKey()" />
        </div>
        <div class="lineage__field">
          <label>hash archivo</label>
          <input [(ngModel)]="sourceFileHash" placeholder="SHA-256" (keyup.enter)="searchBySourceRow()" />
        </div>
        <div class="lineage__field">
          <label>fila</label>
          <input [(ngModel)]="recordNumber" placeholder="1002" (keyup.enter)="searchBySourceRow()" />
        </div>
        <div class="lineage__actions">
          <button (click)="searchByRecord()">Registro</button>
          <button (click)="searchByTrace()">Ejecucion</button>
          <button (click)="searchByKey()">Clave</button>
          <button (click)="searchBySourceRow()">Archivo/fila</button>
        </div>
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
              <span class="lineage__keys">
                <span>{{ entry.message || entry.paymentReference || entry.recordId || entry.traceId }}</span>
                @if (entry.paymentReference) { <span class="lineage__key">:20: {{ entry.paymentReference }}</span> }
                @if (entry.transactionReference) { <span class="lineage__key">:21: {{ entry.transactionReference }}</span> }
                @if (entry.uetr) { <span class="lineage__key">UETR {{ entry.uetr }}</span> }
                @if (entry.archiveId) { <span class="lineage__key">archive {{ entry.archiveId }}</span> }
                @if (entry.gatewayReference) { <span class="lineage__key">gateway {{ entry.gatewayReference }}</span> }
                @if (entry.sourceFileName || entry.recordNumber !== null) {
                  <span class="lineage__key">{{ entry.sourceFileName || entry.sourceFileHash }} #{{ entry.recordNumber }}</span>
                }
                @if (entry.recordNumber !== null) {
                  <a class="lineage__link" [routerLink]="['/audit/mt101-fragments']" [queryParams]="{ recordNumber: entry.recordNumber }">Ver fragmento</a>
                }
              </span>
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
  private readonly route = inject(ActivatedRoute);

  recordId = '';
  traceId = '';
  key = 'paymentReference';
  value = '';
  sourceFileHash = '';
  recordNumber = '';

  constructor() {
    // Drill-in desde cuarentena / ejecuciones: pre-rellena y auto-busca sin teclear IDs.
    const qp = this.route.snapshot.queryParamMap;
    const recordId = qp.get('recordId');
    const traceId = qp.get('traceId');
    const hash = qp.get('sourceFileHash');
    const recordNumber = qp.get('recordNumber');
    const key = qp.get('key');
    const value = qp.get('value');
    if (recordId) {
      this.recordId = recordId;
      this.searchByRecord();
    } else if (traceId) {
      this.traceId = traceId;
      this.searchByTrace();
    } else if (hash && recordNumber) {
      this.sourceFileHash = hash;
      this.recordNumber = recordNumber;
      this.searchBySourceRow();
    } else if (key && value) {
      this.key = key;
      this.value = value;
      this.searchByKey();
    }
  }

  readonly keyOptions = [
    { value: 'paymentReference', label: ':20:' },
    { value: 'transactionReference', label: ':21:' },
    { value: 'uetr', label: 'UETR' },
    { value: 'archiveId', label: 'Archive ID' },
    { value: 'gatewayReference', label: 'Gateway' },
    { value: 'businessKeyHash', label: 'Hash negocio' },
  ];

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

  searchByKey(): void {
    if (!this.key.trim() || !this.value.trim()) {
      return;
    }
    this.fetch({ key: this.key, value: this.value });
  }

  searchBySourceRow(): void {
    if (!this.sourceFileHash.trim() || !this.recordNumber.trim()) {
      return;
    }
    this.fetch({ sourceFileHash: this.sourceFileHash, recordNumber: this.recordNumber });
  }

  private fetch(query: { recordId?: string; traceId?: string; key?: string; value?: string; sourceFileHash?: string; recordNumber?: string }): void {
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
