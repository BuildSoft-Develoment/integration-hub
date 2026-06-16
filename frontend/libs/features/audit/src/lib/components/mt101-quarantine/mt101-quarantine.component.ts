// @trace SWIFT-MT101: cuarentena por fila + rebuild selectivo (reprocesar solo lo necesario)
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuditApiService } from '../../api/audit-api.service';
import { Mt101FailedRecord } from '../../models/audit.models';

@Component({
  selector: 'ih-mt101-quarantine',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styles: [`
    .q { display:flex; flex-direction:column; gap:1rem; }
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
    .q__link { color:var(--ih-accent, #4c6ef5); text-decoration:none; white-space:nowrap; }
    .q__link:hover { text-decoration:underline; }
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
      <div>
        <h2 class="ih-section-title">Cuarentena MT101 por fila</h2>
        <p class="ih-muted">Ubica la fila exacta del archivo que fallo validacion, corrigela en staging y reprocesa SOLO esa fila (rebuild selectivo) sin regenerar el lote.</p>
      </div>

      <div class="q__search">
        <div class="q__field">
          <label>Fragment set</label>
          <input [(ngModel)]="fragmentSetId" placeholder="E2E-123" (keyup.enter)="list()" />
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
          <button type="button" (click)="buildQuarantine()" [disabled]="loading() || !fragmentSetId.trim()">Construir cuarentena</button>
          <button type="button" (click)="list()" [disabled]="loading() || !fragmentSetId.trim()">Listar</button>
          <button type="button" class="q__primary" (click)="rebuild()" [disabled]="loading() || !fragmentSetId.trim() || !correctiveSetId.trim()">Reprocesar filas corregidas</button>
        </div>
      </div>

      @if (message()) {
        <p class="q__ok">{{ message() }}</p>
      }
      @if (loading()) {
        <p class="q__empty">Procesando...</p>
      } @else if (error()) {
        <p class="q__error">{{ error() }}</p>
      } @else if (rows().length === 0) {
        <p class="q__empty">Sin filas en cuarentena. Ingresa el fragment set y pulsa "Construir cuarentena".</p>
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
                    @if (row.sourceFileHash && row.sourceRecordNumber !== null) {
                      <a class="q__link" [routerLink]="['/audit/record-lineage']" [queryParams]="{ sourceFileHash: row.sourceFileHash, recordNumber: row.sourceRecordNumber }">Ver timeline</a>
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
export class Mt101QuarantineComponent {
  private readonly api = inject(AuditApiService);
  private readonly route = inject(ActivatedRoute);

  fragmentSetId = '';
  connectionRef = '';
  correctiveSetId = '';

  constructor() {
    // Llega prellenado desde el lookup de fragmentos (?fragmentSetId=...) -> auto-lista.
    const presetSet = this.route.snapshot.queryParamMap.get('fragmentSetId');
    if (presetSet) {
      this.fragmentSetId = presetSet;
      this.correctiveSetId = `${presetSet}-FIX`;
      this.list();
    }
  }

  readonly rows = signal<Mt101FailedRecord[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly pendingCount = computed(() => this.rows().filter((r) => r.status === 'QUARANTINED').length);

  list(): void {
    if (!this.fragmentSetId.trim()) {
      return;
    }
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
