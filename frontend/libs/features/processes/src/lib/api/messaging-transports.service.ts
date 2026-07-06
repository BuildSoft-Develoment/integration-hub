import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** Estado compuesto del feature de despacho async (`GET /api/messaging/async-status`). */
export type AsyncState = 'DISABLED' | 'DEGRADED' | 'READY';

/**
 * Espejo del backend `AsyncAvailabilityService.AsyncAvailability`. `state` es el estado compuesto que la UI debería
 * usar (tratar `!== 'READY'` como no operativo); `consumerLive` refleja si el canal consumer está conectado EN VIVO.
 * `executionEnabled` se conserva por compatibilidad con la UI previa. NOTA: hoy la UI solo lee `executionEnabled`;
 * consumir `state` es una mejora frontend pendiente.
 */
export interface AsyncStatus {
  executionEnabled: boolean;
  state?: AsyncState;
  dispatchEnabled?: boolean;
  consumerEnabled?: boolean;
  consumerLive?: boolean;
  brokersRegistered?: boolean;
}

/** Capacidad de offload async de un tipo de tarea (espejo del backend `AsyncOffloadSupport`). */
export type AsyncOffloadSupport = 'SUPPORTED' | 'SLICE_ONLY' | 'UNSUPPORTED';

interface TaskTypeCatalogItem {
  type: string;
  asyncOffload?: AsyncOffloadSupport;
}

interface TaskTypeCatalogResponse {
  taskTypes: TaskTypeCatalogItem[];
}

/**
 * Mensajería para la UI de tareas asíncronas (ADR-015): lista de transportes (brokers) para el selector
 * y estado del feature async para avisar cuando `async:true` no tomará efecto (correría síncrono).
 */
@Injectable({ providedIn: 'root' })
export class MessagingTransportsService {
  private readonly http = inject(HttpClient);

  list(): Observable<string[]> {
    return this.http.get<string[]>('/api/messaging/transports');
  }

  asyncStatus(): Observable<AsyncStatus> {
    return this.http.get<AsyncStatus>('/api/messaging/async-status');
  }

  /**
   * Capacidad de offload async por tipo de tarea (`GET /api/task-types`), normalizada a un mapa
   * `{ TIPO: capacidad }` en MAYÚSCULAS. La UI la usa para gatear el toggle async por tarea.
   */
  asyncCapabilities(): Observable<Record<string, AsyncOffloadSupport>> {
    return this.http.get<TaskTypeCatalogResponse>('/api/task-types').pipe(
      map((response) =>
        (response?.taskTypes ?? []).reduce<Record<string, AsyncOffloadSupport>>((acc, item) => {
          if (item?.type) {
            acc[item.type.toUpperCase()] = item.asyncOffload ?? 'UNSUPPORTED';
          }
          return acc;
        }, {})
      )
    );
  }
}
