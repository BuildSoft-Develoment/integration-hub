import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** Estado del feature de despacho async en el entorno (`GET /api/messaging/async-status`). */
export interface AsyncStatus {
  executionEnabled: boolean;
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
