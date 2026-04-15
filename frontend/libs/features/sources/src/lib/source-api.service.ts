import { HttpClient } from '@angular/common/http';
import { HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SKIP_GLOBAL_ERROR_FEEDBACK } from '@integration-hub/core/services';
import { SourceRecord, SourceTestResult } from './source.models';

@Injectable({ providedIn: 'root' })
export class SourceApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/source-definitions';

  list(): Observable<SourceRecord[]> {
    return this.http.get<SourceRecord[]>(this.baseUrl);
  }

  create(payload: {
    name: string;
    sourceType: string;
    active: boolean;
    configurationJson: string;
  }): Observable<SourceRecord> {
    return this.http.post<SourceRecord>(this.baseUrl, payload, {
      context: new HttpContext().set(SKIP_GLOBAL_ERROR_FEEDBACK, false),
    });
  }

  update(
    sourceDefinitionId: number,
    payload: {
      name: string;
      sourceType: string;
      active: boolean;
      configurationJson: string;
    }
  ): Observable<SourceRecord> {
    return this.http.put<SourceRecord>(
      `${this.baseUrl}/${sourceDefinitionId}`,
      payload,
      {
        context: new HttpContext().set(SKIP_GLOBAL_ERROR_FEEDBACK, false),
      }
    );
  }

  setActive(sourceDefinitionId: number, active: boolean): Observable<SourceRecord> {
    return this.http.post<SourceRecord>(
      `${this.baseUrl}/${sourceDefinitionId}/activation/${active}`,
      {}
    );
  }

  test(payload: {
    name: string;
    sourceType: string;
    active: boolean;
    configurationJson: string;
  }): Observable<SourceTestResult> {
    return this.http.post<SourceTestResult>(`${this.baseUrl}/test`, payload, {
      context: new HttpContext().set(SKIP_GLOBAL_ERROR_FEEDBACK, true),
    });
  }
}
