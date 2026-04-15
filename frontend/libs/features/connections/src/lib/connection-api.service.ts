import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SKIP_GLOBAL_ERROR_FEEDBACK } from '@integration-hub/core/services';
import { ConnectionRecord, ConnectionTestResult } from './connection.models';

@Injectable({ providedIn: 'root' })
export class ConnectionApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/connection-definitions';

  list(): Observable<ConnectionRecord[]> {
    return this.http.get<ConnectionRecord[]>(this.baseUrl);
  }

  create(payload: {
    name: string;
    connectionType: string;
    active: boolean;
    configurationJson: string;
  }): Observable<ConnectionRecord> {
    return this.http.post<ConnectionRecord>(this.baseUrl, payload);
  }

  update(
    connectionDefinitionId: number,
    payload: {
      name: string;
      connectionType: string;
      active: boolean;
      configurationJson: string;
    }
  ): Observable<ConnectionRecord> {
    return this.http.put<ConnectionRecord>(
      `${this.baseUrl}/${connectionDefinitionId}`,
      payload
    );
  }

  setActive(connectionDefinitionId: number, active: boolean): Observable<ConnectionRecord> {
    return this.http.post<ConnectionRecord>(
      `${this.baseUrl}/${connectionDefinitionId}/activation/${active}`,
      {}
    );
  }

  test(payload: {
    name: string;
    connectionType: string;
    active: boolean;
    configurationJson: string;
  }): Observable<ConnectionTestResult> {
    return this.http.post<ConnectionTestResult>(`${this.baseUrl}/test`, payload, {
      context: new HttpContext().set(SKIP_GLOBAL_ERROR_FEEDBACK, true),
    });
  }
}
