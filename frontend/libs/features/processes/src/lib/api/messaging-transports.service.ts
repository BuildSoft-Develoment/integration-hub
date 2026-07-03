import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Lista los transportes (brokers) disponibles para el despacho async de tareas
 * (`GET /api/messaging/transports`, ADR-015). Alimenta el selector de transporte del
 * `AsyncDispatchSectionComponent`. Devuelve los tipos registrados (p.ej. `['KAFKA', 'RABBITMQ']`).
 */
@Injectable({ providedIn: 'root' })
export class MessagingTransportsService {
  private readonly http = inject(HttpClient);

  list(): Observable<string[]> {
    return this.http.get<string[]>('/api/messaging/transports');
  }
}
