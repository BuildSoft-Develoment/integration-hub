import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReaderRecord } from './reader.models';

@Injectable({ providedIn: 'root' })
export class ReaderApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/reader-definitions';

  list(): Observable<ReaderRecord[]> {
    return this.http.get<ReaderRecord[]>(this.baseUrl);
  }

  create(payload: {
    name: string;
    readerType: string;
    active: boolean;
    configurationJson: string;
  }): Observable<ReaderRecord> {
    return this.http.post<ReaderRecord>(this.baseUrl, payload, {
      context: new HttpContext(),
    });
  }

  update(
    readerDefinitionId: number,
    payload: {
      name: string;
      readerType: string;
      active: boolean;
      configurationJson: string;
    }
  ): Observable<ReaderRecord> {
    return this.http.put<ReaderRecord>(`${this.baseUrl}/${readerDefinitionId}`, payload, {
      context: new HttpContext(),
    });
  }

  setActive(readerDefinitionId: number, active: boolean): Observable<ReaderRecord> {
    return this.http.post<ReaderRecord>(
      `${this.baseUrl}/${readerDefinitionId}/activation/${active}`,
      {}
    );
  }
}
