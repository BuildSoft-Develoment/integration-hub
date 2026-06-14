// @trace observabilidad: operacion del spool asincronico de auditoria
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AuditApiService } from '../../api/audit-api.service';
import { AuditSpoolEntry, AuditSpoolSummary } from '../../models/audit.models';

@Component({
  selector: 'ih-audit-spool',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .spool { display:flex; flex-direction:column; gap:1rem; }
    .spool__toolbar { display:flex; justify-content:space-between; gap:.75rem; flex-wrap:wrap; align-items:end; }
    .spool__filters { display:flex; gap:.6rem; flex-wrap:wrap; align-items:end; }
    .spool__field { display:flex; flex-direction:column; gap:.25rem; min-width:9rem; }
    .spool__field label { font-size:.75rem; color:var(--ih-text-soft); }
    .spool__field input { min-height:2.35rem; padding:.45rem .6rem; border:1px solid var(--ih-border, #354052); background:var(--ih-surface, #10141b); color:inherit; }
    .spool__actions { display:flex; gap:.5rem; flex-wrap:wrap; }
    .spool button { min-height:2.35rem; padding:.45rem .8rem; border:1px solid var(--ih-border, #354052); background:var(--ih-surface-alt, #1b1f27); color:inherit; cursor:pointer; }
    .spool button:disabled { opacity:.55; cursor:not-allowed; }
    .spool__summary { display:grid; grid-template-columns:repeat(auto-fit, minmax(9rem, 1fr)); gap:.6rem; }
    .spool__metric { display:grid; gap:.25rem; padding:.75rem; border:1px solid var(--ih-border, #354052); background:var(--ih-surface, #1b1f27); }
    .spool__metric small { color:var(--ih-text-soft); }
    .spool__metric strong { font-size:1.35rem; }
    .spool__table { overflow:auto; border:1px solid var(--ih-border, #354052); }
    table { width:100%; border-collapse:collapse; min-width:58rem; }
    th, td { padding:.55rem .65rem; border-bottom:1px solid var(--ih-border, #354052); text-align:left; vertical-align:top; }
    th { font-size:.75rem; color:var(--ih-text-soft); font-weight:600; }
    td { font-size:.86rem; }
    .spool__mono { font-family:ui-monospace, SFMono-Regular, Consolas, monospace; overflow-wrap:anywhere; }
    .spool__error { color:#e03131; }
    .spool__ok { color:#2f9e44; }
    .spool__empty { color:var(--ih-text-soft); padding:.75rem; }
  `],
  template: `
    <section class="spool">
      <div class="spool__toolbar">
        <div>
          <h2 class="ih-section-title">Spool de auditoria</h2>
          <p class="ih-muted">Eventos pendientes, en vuelo y dead-letter del outbox asincronico.</p>
        </div>
        <div class="spool__actions">
          <button type="button" (click)="load()" [disabled]="loading()">Actualizar</button>
        </div>
      </div>

      @if (summary()) {
        <div class="spool__summary">
          <div class="spool__metric"><small>PENDING</small><strong>{{ summary()!.pending }}</strong></div>
          <div class="spool__metric"><small>IN_FLIGHT</small><strong>{{ summary()!.inFlight }}</strong></div>
          <div class="spool__metric"><small>SENT</small><strong>{{ summary()!.sent }}</strong></div>
          <div class="spool__metric"><small>DEAD</small><strong>{{ summary()!.dead }}</strong></div>
          <div class="spool__metric"><small>Mas antiguo</small><span>{{ summary()!.oldestPendingCreatedAt || '-' }}</span></div>
        </div>
      }

      <div class="spool__toolbar">
        <div class="spool__filters">
          <div class="spool__field">
            <label>Dead limit</label>
            <input type="number" min="1" max="1000" [(ngModel)]="deadLimit" />
          </div>
          <div class="spool__field">
            <label>Retencion SENT dias</label>
            <input type="number" min="1" [(ngModel)]="retentionDays" />
          </div>
          <div class="spool__field">
            <label>Cleanup limit</label>
            <input type="number" min="1" [(ngModel)]="cleanupLimit" />
          </div>
        </div>
        <div class="spool__actions">
          <button type="button" (click)="loadDead()" [disabled]="loading()">Ver DEAD</button>
          <button type="button" (click)="cleanupSent()" [disabled]="loading()">Limpiar SENT</button>
        </div>
      </div>

      @if (message()) { <p class="spool__ok">{{ message() }}</p> }
      @if (error()) { <p class="spool__error">{{ error() }}</p> }

      @if (loading()) {
        <p class="spool__empty">Cargando spool...</p>
      } @else if (deadRows().length === 0) {
        <p class="spool__empty">No hay eventos DEAD con el filtro actual.</p>
      } @else {
        <div class="spool__table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Evento</th>
                <th>Trace</th>
                <th>Topic / particion</th>
                <th>Intentos</th>
                <th>Error</th>
                <th>Dead at</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (row of deadRows(); track row.id) {
                <tr>
                  <td>{{ row.id }}</td>
                  <td class="spool__mono">{{ row.eventId || '-' }}</td>
                  <td class="spool__mono">{{ row.traceId || '-' }}</td>
                  <td>
                    <div>{{ row.topic || '-' }}</div>
                    <div class="spool__mono">{{ row.partitionKey || '-' }}</div>
                  </td>
                  <td>{{ row.attempts }}</td>
                  <td>{{ row.deadReason || row.lastError || '-' }}</td>
                  <td>{{ row.deadAt || '-' }}</td>
                  <td><button type="button" (click)="retry(row)" [disabled]="loading()">Reprocesar</button></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class AuditSpoolComponent implements OnInit {
  private readonly api = inject(AuditApiService);

  readonly summary = signal<AuditSpoolSummary | null>(null);
  readonly deadRows = signal<AuditSpoolEntry[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  deadLimit = 100;
  retentionDays = 7;
  cleanupLimit = 10000;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      summary: this.api.auditSpoolSummary(),
      deadRows: this.api.auditSpoolDead(this.deadLimitNumber()),
    }).subscribe({
      next: ({ summary, deadRows }) => {
        this.summary.set(summary);
        this.deadRows.set(deadRows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el spool de auditoria.');
        this.loading.set(false);
      },
    });
  }

  loadDead(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.auditSpoolDead(this.deadLimitNumber()).subscribe({
      next: (rows) => {
        this.deadRows.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los eventos DEAD.');
        this.loading.set(false);
      },
    });
  }

  retry(row: AuditSpoolEntry): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.retryAuditSpool(row.id).subscribe({
      next: () => {
        this.message.set(`Evento ${row.id} enviado a reproceso.`);
        this.load();
      },
      error: () => {
        this.error.set(`No se pudo reprocesar el evento ${row.id}.`);
        this.loading.set(false);
      },
    });
  }

  cleanupSent(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.cleanupAuditSpoolSent(this.numberOr(this.retentionDays, 7), this.numberOr(this.cleanupLimit, 10000)).subscribe({
      next: (result) => {
        this.message.set(`Eventos SENT eliminados: ${result.deleted}.`);
        this.load();
      },
      error: () => {
        this.error.set('No se pudo limpiar el spool SENT.');
        this.loading.set(false);
      },
    });
  }

  private deadLimitNumber(): number {
    return this.numberOr(this.deadLimit, 100);
  }

  private numberOr(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
