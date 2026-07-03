import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

/** Estado del feature de despacho async en el entorno (`GET /api/messaging/async-status`). */
export interface AsyncStatus {
  executionEnabled: boolean;
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
}
