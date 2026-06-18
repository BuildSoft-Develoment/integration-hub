// @trace SWIFT-MT101: cuarentena por fila + rebuild selectivo (reprocesar solo lo necesario)
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuditApiService } from '../../api/audit-api.service';
import { Mt101FailedRecord, Mt101FragmentSetSummary, Mt101LoteHeader, Mt101RowTimelineEntry } from '../../models/audit.models';

@Component({
  selector: 'ih-mt101-quarantine',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styles: [`
    .q { display:flex; flex-direction:column; gap:1rem; }
    .q__lote { display:flex; flex-direction:column; gap:.4rem; }
    .q__lote-title { font-size:1.15rem; font-weight:600; display:flex; align-items:center; gap:.4rem; }
    .q__lote-chips { display:flex; gap:.4rem; flex-wrap:wrap; }
    .q__chip { font-size:.78rem; color:var(--ih-text-soft); background:var(--ih-surface-alt, #1b1f27); border:1px solid var(--ih-border, #354052); padding:2px 8px; border-radius:6px; display:inline-flex; align-items:center; gap:.3rem; }
    .q__search { display:grid; grid-template-columns:repeat(auto-fit, minmax(12rem, 1fr)); gap:.75rem; align-items:end; }
    .q__field { display:flex; flex-direction:column; gap:.25rem; }
    .q__field label { font-size:.75rem; color:var(--ih-text-soft); }
    .q__field input { min-height:2.35rem; padding:.45rem .6rem; border:1px solid var(--ih-border, #354052); background:var(--ih-surface, #10141b); color:inherit; }
    .q__actions { display:flex; gap:.5rem; flex-wrap:wrap; }
    .q button { min-height:2.35rem; padding:.45rem .8rem; border:1px solid var(--ih-border, #354052); background:var(--ih-surface-alt, #1b1f27); color:inherit; cursor:pointer; }
    .q button.q__primary { border-color:#2f9e44; }
    .q button:disabled { opacity:.55; cursor:not-allowed; }
    .q__table { overflow:auto; border:1px solid var(--ih-border, #354052); }
    table { width:100%; border-collapse:collapse; min-width:60rem; }
    th, td { padding:.55rem .65rem; border-bottom:1px solid var(--ih-border, #354052); text-align:left; vertical-align:top; }
    th { font-size:.75rem; color:var(--ih-text-soft); font-weight:600; }
    td { font-size:.86rem; }
    .q__mono { font-family:ui-monospace, SFMono-Regular, Consolas, monospace; overflow-wrap:anywhere; }
    .q__row { font-weight:600; color:#e8590c; }
    .q__link { color:var(--ih-accent, #4c6ef5); text-decoration:none; white-space:nowrap; margin-left:.4rem; }
    .q__link:hover { text-decoration:underline; }
    .q__tl-btn { min-height:auto; padding:2px 8px; font-size:.78rem; }
    .q__tl-row td { background:var(--ih-surface-alt, #1b1f27); padding:.5rem .75rem; }
    .q__timeline { display:flex; flex-direction:column; gap:5px; }
    .q__tl-title { font-size:.78rem; color:var(--ih-text-soft); margin-bottom:.25rem; }
    .q__tl-note { font-size:.72rem; color:var(--ih-text-soft); }
    .q__tl-entry { display:grid; grid-template-columns:minmax(8rem,12rem) 6.5rem 1fr minmax(8rem,11rem); gap:.6rem; align-items:center;
      padding:.4rem .6rem; border-left:3px solid var(--ih-border, #354052); background:var(--ih-surface, #10141b); }
    .q__tl-entry--REJECTED { border-left-color:#e03131; }
    .q__tl-entry--SENT,.q__tl-entry--ARCHIVED,.q__tl-entry--VALIDATED,.q__tl-entry--INGESTED,.q__tl-entry--BUILT { border-left-color:#2f9e44; }
    .q__tl-stage { font-weight:600; overflow-wrap:anywhere; }
    .q__tl-ts { color:var(--ih-text-soft); font-size:.8rem; }
    .q__correct { display:flex; flex-direction:column; gap:.4rem; }
    .q__correct label { font-size:.78rem; color:var(--ih-text-soft); }
    .q__correct textarea { width:100%; font-family:ui-monospace, SFMono-Regular, Consolas, monospace; font-size:.82rem; padding:.5rem; border:1px solid var(--ih-border, #354052); background:var(--ih-surface, #10141b); color:inherit; }
    .q__cards { display:grid; grid-template-columns:repeat(auto-fit, minmax(7rem, 1fr)); gap:.6rem; }
    .q__card { background:var(--ih-surface-alt, #1b1f27); border:1px solid var(--ih-border, #354052); border-radius:8px; padding:.6rem .7rem; display:flex; flex-direction:column; gap:.15rem; }
    .q__card small { font-size:.72rem; color:var(--ih-text-soft); }
    .q__card strong { font-size:1.35rem; font-weight:600; }
    .q__card--REJECTED strong,.q__card--QUARANTINED strong { color:#e8590c; }
    .q__card--SUPERSEDED strong { color:var(--ih-text-soft); }
    .q__card--SENT strong,.q__card--ARCHIVED strong,.q__card--VALIDATED strong { color:#2f9e44; }
    .q__empty,.q__error,.q__ok { padding:.75rem; }
    .q__empty { color:var(--ih-text-soft); }
    .q__error { color:#e03131; }
    .q__ok { color:#2f9e44; }
    .q__status--QUARANTINED { color:#e8590c; }
    .q__status--REBUILT { color:#2f9e44; }
    .q__status--DISCARDED { color:var(--ih-text-soft); }
  `],
  template: `
    <section class="q">
      @if (lote(); as l) {
        <div class="q__lote">
          <div class="q__lote-title"><i class="ti ti-list-tree"></i> Trazabilidad · lote {{ l.fragmentSetId }}</div>
          <div class="q__lote-chips">
            @if (l.sourceFileName) { <span class="q__chip"><i class="ti ti-file"></i> {{ l.sourceFileName }}</span> }
            @if (l.sourceFileHash) { <span class="q__chip q__mono">hash {{ l.sourceFileHash | slice:0:10 }}…</span> }
            @if (l.processExecutionId !== null) { <span class="q__chip">exec-{{ l.processExecutionId }}</span> }
            <span class="q__chip">{{ l.rowCount }} filas</span>
            <span class="q__chip">{{ l.totalFragments }} fragmentos</span>
          </div>
          <p class="ih-muted">Del lote → a la fila exacta que falló → a su traza completa → a la acción.</p>
        </div>
      } @else {
        <div>
          <h2 class="ih-section-title">Trazabilidad del lote · cuarentena</h2>
          <p class="ih-muted">Ubica la fila exacta del archivo que falló, corrígela en staging y reprocesa SOLO esa fila (rebuild selectivo) sin regenerar el lote.</p>
        </div>
      }

      <div class="q__search">
        <div class="q__field">
          <label>Ejecución</label>
          <input type="number" min="1" [(ngModel)]="processExecutionId" placeholder="123" (keyup.enter)="loadLote()" />
        </div>
        <div class="q__field">
          <label>Fragment set</label>
          <input [(ngModel)]="fragmentSetId" placeholder="E2E-123" (keyup.enter)="loadLote()" />
        </div>
        <div class="q__field">
          <label>Conexion</label>
          <input [(ngModel)]="connectionRef" placeholder="default" />
        </div>
        <div class="q__field">
          <label>Set correctivo (rebuild)</label>
          <input [(ngModel)]="correctiveSetId" placeholder="E2E-123-FIX" />
        </div>
        <div class="q__actions">
          <button type="button" class="q__primary" (click)="loadLote()" [disabled]="loading() || (!fragmentSetId.trim() && !processExecutionId.trim())">Cargar lote</button>
          <button type="button" (click)="buildQuarantine()" [disabled]="loading() || !fragmentSetId.trim()">Construir cuarentena</button>
          <button type="button" (click)="list()" [disabled]="loading() || !fragmentSetId.trim()">Listar</button>
          <button type="button" class="q__primary" (click)="rebuild()" [disabled]="loading() || !fragmentSetId.trim() || !correctiveSetId.trim()">Reprocesar filas corregidas</button>
        </div>
      </div>

      @if (summary(); as s) {
        <div class="q__cards">
          <div class="q__card"><small>Fragmentos</small><strong>{{ s.total }}</strong></div>
          @for (entry of statusEntries(); track entry.status) {
            <div class="q__card q__card--{{ entry.status }}"><small>{{ entry.status }}</small><strong>{{ entry.count }}</strong></div>
          }
          <div class="q__card q__card--QUARANTINED"><small>En cuarentena</small><strong>{{ pendingCount() }}</strong></div>
        </div>
      }

      @if (message()) {
        <p class="q__ok">{{ message() }}</p>
      }
      @if (loading()) {
        <p class="q__empty">Procesando...</p>
      } @else if (error()) {
        <p class="q__error">{{ error() }}</p>
      } @else if (rows().length === 0) {
        <p class="q__empty">
          Sin filas en cuarentena para este set.
          @if (!fragmentSetId.trim()) { Ingresa el fragment set (lo ves en el lookup de fragmentos o en la trazabilidad de la ejecución) y pulsa "Construir cuarentena". }
          @else { El lote no tiene filas rechazadas, o aún no construiste la cuarentena. }
        </p>
      } @else {
        <p class="ih-muted">{{ pendingCount() }} fila(s) en cuarentena pendientes de reproceso.</p>
        <div class="q__table">
          <table>
            <thead>
              <tr>
                <th>Fila del archivo</th>
                <th>:20:</th>
                <th>:21:</th>
                <th>Regla</th>
                <th>Severidad</th>
                <th>Mensaje</th>
                <th>Hash archivo</th>
                <th>Estado</th>
                <th>Traza</th>
              </tr>
            </thead>
            <tbody>
              @for (row of rows(); track row.id) {
                <tr>
                  <td class="q__row">{{ row.sourceRecordNumber ?? '—' }}</td>
                  <td class="q__mono">{{ row.sendersReference || '—' }}</td>
                  <td class="q__mono">{{ row.transactionReference || '—' }}</td>
                  <td class="q__mono">{{ row.ruleCode || '—' }}</td>
                  <td>{{ row.severity || '—' }}</td>
                  <td>{{ row.message || '—' }}</td>
                  <td class="q__mono">{{ (row.sourceFileHash | slice:0:12) || '—' }}</td>
                  <td class="q__status--{{ row.status }}">{{ row.status }}</td>
                  <td>
                    @if (row.sourceRecordNumber !== null) {
                      <button type="button" class="q__tl-btn" (click)="toggleTimeline(row)">
                        {{ selectedRow() === row.sourceRecordNumber ? 'Ocultar' : 'Timeline' }}
                      </button>
                      <button type="button" class="q__tl-btn" (click)="toggleCorrect(row)">Corregir</button>
                      @if (row.sourceFileHash) {
                        <a class="q__link" [routerLink]="['/audit/record-lineage']" [queryParams]="{ sourceFileHash: row.sourceFileHash, recordNumber: row.sourceRecordNumber }" title="Vista completa con timestamps (cold store)"><i class="ti ti-external-link"></i></a>
                      }
                    }
                  </td>
                </tr>
                @if (correctingRow() === row.sourceRecordNumber) {
                  <tr class="q__tl-row">
                    <td colspan="9">
                      <div class="q__correct">
                        <label>Payload corregido (JSON) para la fila {{ row.sourceRecordNumber }}</label>
                        <textarea [(ngModel)]="correctionPayload" rows="3" placeholder='{"cargos":"OUR", ...}'></textarea>
                        <div class="q__actions">
                          <button type="button" class="q__primary" (click)="saveCorrection(row)" [disabled]="loading() || !correctionPayload.trim()">Guardar corrección</button>
                          <button type="button" (click)="toggleCorrect(row)">Cancelar</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                }
                @if (selectedRow() === row.sourceRecordNumber) {
                  <tr class="q__tl-row">
                    <td colspan="9">
                      @if (timelineLoading()) {
                        <span class="q__empty">Cargando línea de tiempo...</span>
                      } @else if (timeline().length === 0) {
                        <span class="q__empty">Sin fragmento para esta fila en el set.</span>
                      } @else {
                        <div class="q__timeline">
                          <div class="q__tl-title">Línea de tiempo E2E · fila {{ row.sourceRecordNumber }} <span class="q__tl-note">(operacional, instantáneo)</span></div>
                          @for (e of timeline(); track $index) {
                            <div class="q__tl-entry q__tl-entry--{{ e.status }}">
                              <span class="q__tl-stage">{{ e.stage }}</span>
                              <span class="q__status--{{ e.status }}">{{ e.status }}</span>
                              <span>{{ e.detail }}</span>
                              <span class="q__tl-ts">{{ e.eventTs || '—' }}</span>
                            </div>
                          }
                        </div>
                      }
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class Mt101QuarantineComponent {
  private readonly api = inject(AuditApiService);
  private readonly route = inject(ActivatedRoute);

  fragmentSetId = '';
  connectionRef = '';
  correctiveSetId = '';
  processExecutionId = '';

  constructor() {
    // Entrada unificada: desde la ejecución (?processExecutionId=) o desde el lookup
    // (?fragmentSetId=). Resuelve la cabecera del lote y auto-lista, sin teclear IDs.
    const qp = this.route.snapshot.queryParamMap;
    const presetSet = qp.get('fragmentSetId');
    const presetExec = qp.get('processExecutionId');
    if (presetSet) {
      this.fragmentSetId = presetSet;
    }
    if (presetExec) {
      this.processExecutionId = presetExec;
    }
    if (presetSet || presetExec) {
      this.loadLote();
    }
  }

  loadLote(): void {
    if (!this.fragmentSetId.trim() && !this.processExecutionId.trim()) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.api.mt101Lote({
      fragmentSetId: this.fragmentSetId,
      processExecutionId: this.processExecutionId,
      connectionRef: this.connectionRef,
    }).subscribe({
      next: (header) => {
        this.lote.set(header);
        if (header?.fragmentSetId) {
          this.fragmentSetId = header.fragmentSetId;
          this.correctiveSetId = `${header.fragmentSetId}-FIX`;
        }
        this.list();
      },
      error: () => {
        this.error.set('No se pudo resolver el lote.');
        this.loading.set(false);
      },
    });
  }

  readonly rows = signal<Mt101FailedRecord[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly summary = signal<Mt101FragmentSetSummary | null>(null);
  readonly lote = signal<Mt101LoteHeader | null>(null);
  readonly selectedRow = signal<number | null>(null);
  readonly timeline = signal<Mt101RowTimelineEntry[]>([]);
  readonly timelineLoading = signal(false);
  readonly correctingRow = signal<number | null>(null);
  correctionPayload = '';

  toggleCorrect(row: Mt101FailedRecord): void {
    if (this.correctingRow() === row.sourceRecordNumber) {
      this.correctingRow.set(null);
      return;
    }
    this.correctionPayload = '';
    this.correctingRow.set(row.sourceRecordNumber);
  }

  saveCorrection(row: Mt101FailedRecord): void {
    if (row.sourceRecordNumber === null || !this.correctionPayload.trim()) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.api.mt101CorrectStagingRow({
      fragmentSetId: this.fragmentSetId,
      recordNumber: row.sourceRecordNumber,
      payload: this.correctionPayload,
      connectionRef: this.connectionRef,
    }).subscribe({
      next: () => {
        this.message.set(`Fila ${row.sourceRecordNumber} corregida en staging. Ya puedes reprocesar.`);
        this.correctingRow.set(null);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo corregir la fila en staging.');
        this.loading.set(false);
      },
    });
  }
  readonly pendingCount = computed(() => this.rows().filter((r) => r.status === 'QUARANTINED').length);

  toggleTimeline(row: Mt101FailedRecord): void {
    if (this.selectedRow() === row.sourceRecordNumber) {
      this.selectedRow.set(null);
      return;
    }
    if (row.sourceRecordNumber === null) {
      return;
    }
    this.selectedRow.set(row.sourceRecordNumber);
    this.timeline.set([]);
    this.timelineLoading.set(true);
    // Timeline operacional: instantáneo desde staging/fragmento/cuarentena (no cold store).
    this.api.mt101RowTimeline({
      fragmentSetId: this.fragmentSetId,
      recordNumber: row.sourceRecordNumber,
      connectionRef: this.connectionRef,
    }).subscribe({
      next: (entries) => {
        this.timeline.set(entries);
        this.timelineLoading.set(false);
      },
      error: () => this.timelineLoading.set(false),
    });
  }
  readonly statusEntries = computed(() => {
    const s = this.summary();
    return s ? Object.entries(s.byStatus).map(([status, count]) => ({ status, count })) : [];
  });

  private loadSummary(): void {
    if (!this.fragmentSetId.trim()) {
      return;
    }
    this.api.mt101FragmentSetSummary({
      fragmentSetId: this.fragmentSetId,
      connectionRef: this.connectionRef,
    }).subscribe({
      next: (s) => this.summary.set(s),
      error: () => this.summary.set(null),
    });
  }

  list(): void {
    if (!this.fragmentSetId.trim()) {
      return;
    }
    this.loadSummary();
    this.loading.set(true);
    this.error.set(null);
    this.api.mt101FailedRecords({
      fragmentSetId: this.fragmentSetId,
      connectionRef: this.connectionRef,
    }).subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo listar la cuarentena.');
        this.loading.set(false);
      },
    });
  }

  buildQuarantine(): void {
    if (!this.fragmentSetId.trim()) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.api.mt101BuildQuarantine({
      fragmentSetId: this.fragmentSetId,
      connectionRef: this.connectionRef,
    }).subscribe({
      next: (result) => {
        this.message.set(`${result.quarantined} fila(s) encoladas en cuarentena.`);
        this.list();
      },
      error: () => {
        this.error.set('No se pudo construir la cuarentena.');
        this.loading.set(false);
      },
    });
  }

  rebuild(): void {
    if (!this.fragmentSetId.trim() || !this.correctiveSetId.trim()) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.api.mt101RebuildQuarantine({
      fragmentSetId: this.fragmentSetId,
      correctiveSetId: this.correctiveSetId,
      connectionRef: this.connectionRef,
    }).subscribe({
      next: (result) => {
        this.message.set(
          `Set correctivo ${result.correctiveSetId}: ${result.rebuiltRows} fila(s) reconstruida(s), ` +
          `${result.supersededFragments} fragmento(s) superseded, ${result.fragmentCount} fragmento(s) nuevo(s).`,
        );
        this.list();
      },
      error: () => {
        this.error.set('No se pudo reprocesar. Verifica que las filas esten corregidas en staging y el set correctivo sea distinto.');
        this.loading.set(false);
      },
    });
  }
}
