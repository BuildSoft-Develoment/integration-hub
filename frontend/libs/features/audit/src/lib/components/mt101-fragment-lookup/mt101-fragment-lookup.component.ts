// @trace SWIFT-MT101: lookup de fragmentos generados por fila origen
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuditApiService } from '../../api/audit-api.service';
import { Mt101FragmentLink } from '../../models/audit.models';

@Component({
  selector: 'ih-mt101-fragment-lookup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styles: [`
    .lookup { display:flex; flex-direction:column; gap:1rem; }
    .lookup__search { display:grid; grid-template-columns:repeat(auto-fit, minmax(12rem, 1fr)); gap:.75rem; align-items:end; }
    .lookup__field { display:flex; flex-direction:column; gap:.25rem; }
    .lookup__field label { font-size:.75rem; color:var(--ih-text-soft); }
    .lookup__field input { min-height:2.35rem; padding:.45rem .6rem; border:1px solid var(--ih-border, #354052); background:var(--ih-surface, #10141b); color:inherit; }
    .lookup__actions { display:flex; gap:.5rem; flex-wrap:wrap; }
    .lookup button { min-height:2.35rem; padding:.45rem .8rem; border:1px solid var(--ih-border, #354052); background:var(--ih-surface-alt, #1b1f27); color:inherit; cursor:pointer; }
    .lookup button:disabled { opacity:.55; cursor:not-allowed; }
    .lookup__table { overflow:auto; border:1px solid var(--ih-border, #354052); }
    table { width:100%; border-collapse:collapse; min-width:58rem; }
    th, td { padding:.55rem .65rem; border-bottom:1px solid var(--ih-border, #354052); text-align:left; vertical-align:top; }
    th { font-size:.75rem; color:var(--ih-text-soft); font-weight:600; }
    td { font-size:.86rem; }
    .lookup__mono { font-family:ui-monospace, SFMono-Regular, Consolas, monospace; overflow-wrap:anywhere; }
    .lookup__empty,.lookup__error { color:var(--ih-text-soft); padding:.75rem; }
    .lookup__error { color:#e03131; }
    .lookup__status--SENT,.lookup__status--ARCHIVED,.lookup__status--COMPOSED { color:#2f9e44; }
    .lookup__status--REJECTED,.lookup__status--ERROR { color:#e03131; }
  `],
  template: `
    <section class="lookup">
      <div>
        <h2 class="ih-section-title">Fragmento MT101 por fila</h2>
        <p class="ih-muted">Ubica el archivo/fragmento SWIFT que contiene una fila origen leida desde CSV, TXT, XLSX u otra fuente tabular.</p>
      </div>

      <div class="lookup__search">
        <div class="lookup__field">
          <label>Fila origen</label>
          <input type="number" min="1" [(ngModel)]="recordNumber" placeholder="1002" (keyup.enter)="search()" />
        </div>
        <div class="lookup__field">
          <label>Tabla origen</label>
          <input [(ngModel)]="sourceTable" placeholder="stg_payments_batch" (keyup.enter)="search()" />
        </div>
        <div class="lookup__field">
          <label>Ejecucion</label>
          <input type="number" min="1" [(ngModel)]="processExecutionId" placeholder="123" (keyup.enter)="search()" />
        </div>
        <div class="lookup__field">
          <label>Fragment set</label>
          <input [(ngModel)]="fragmentSetId" placeholder="exec-123-task-7" (keyup.enter)="search()" />
        </div>
        <div class="lookup__field">
          <label>Conexion</label>
          <input [(ngModel)]="connectionRef" placeholder="default" (keyup.enter)="search()" />
        </div>
        <div class="lookup__actions">
          <button type="button" (click)="search()" [disabled]="loading()">Buscar</button>
          <button type="button" (click)="clear()" [disabled]="loading()">Limpiar</button>
        </div>
      </div>

      @if (loading()) {
        <p class="lookup__empty">Buscando fragmentos...</p>
      } @else if (error()) {
        <p class="lookup__error">{{ error() }}</p>
      } @else if (rows().length === 0) {
        <p class="lookup__empty">Sin resultados. Ingresa al menos la fila origen.</p>
      } @else {
        <div class="lookup__table">
          <table>
            <thead>
              <tr>
                <th>Fragment set</th>
                <th>Rango origen</th>
                <th>Fragmento</th>
                <th>:20:</th>
                <th>Estado</th>
                <th>Error</th>
                <th>Actualizado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (row of rows(); track $index) {
                <tr>
                  <td class="lookup__mono">{{ row.fragmentSetId || '-' }}</td>
                  <td>
                    <div>{{ row.sourceTable || '-' }}</div>
                    <div>Fila {{ row.sourceRecordFrom ?? '?' }} - {{ row.sourceRecordTo ?? '?' }}</div>
                    <div class="lookup__mono">staging {{ row.stagingIdFrom }} - {{ row.stagingIdTo }}</div>
                  </td>
                  <td>{{ row.fragmentIndex }} / {{ row.fragmentTotal }}</td>
                  <td class="lookup__mono">{{ row.sendersReference || '-' }}</td>
                  <td class="lookup__status--{{ row.status }}">{{ row.status || '-' }}</td>
                  <td>{{ row.errorMessage || '-' }}</td>
                  <td>{{ row.updatedAt || row.createdAt || '-' }}</td>
                  <td>
                    @if (row.fragmentSetId) {
                      <a [routerLink]="['/audit/mt101-quarantine']" [queryParams]="{ fragmentSetId: row.fragmentSetId }">Cuarentena</a>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class Mt101FragmentLookupComponent {
  private readonly api = inject(AuditApiService);
  private readonly route = inject(ActivatedRoute);

  recordNumber = '';
  sourceTable = '';
  processExecutionId = '';
  fragmentSetId = '';
  connectionRef = '';

  readonly rows = signal<Mt101FragmentLink[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    // Drill-in desde el lineage (?recordNumber=) u otra vista -> auto-busca.
    const qp = this.route.snapshot.queryParamMap;
    const recordNumber = qp.get('recordNumber');
    this.fragmentSetId = qp.get('fragmentSetId') ?? '';
    this.sourceTable = qp.get('sourceTable') ?? '';
    this.processExecutionId = qp.get('processExecutionId') ?? '';
    if (recordNumber) {
      this.recordNumber = recordNumber;
      this.search();
    }
  }

  search(): void {
    if (!String(this.recordNumber).trim()) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.api.mt101FragmentLinks({
      recordNumber: this.recordNumber,
      sourceTable: this.sourceTable,
      processExecutionId: this.processExecutionId,
      fragmentSetId: this.fragmentSetId,
      connectionRef: this.connectionRef,
    }).subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron buscar fragmentos MT101.');
        this.loading.set(false);
      },
    });
  }

  clear(): void {
    this.recordNumber = '';
    this.sourceTable = '';
    this.processExecutionId = '';
    this.fragmentSetId = '';
    this.connectionRef = '';
    this.rows.set([]);
    this.error.set(null);
  }
}
