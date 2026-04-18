import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReaderRecord } from '../models/reader.models';

export interface ReaderPageResponse {
  total: number;
  items: ReaderRecord[];
}

export interface ReaderQueryParams {
  search?: string;
  type?: string;
  status?: string;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class ReaderApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/reader-definitions';

  list(params: ReaderQueryParams): Observable<ReaderPageResponse> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 0))
      .set('size', String(params.size ?? 8));

    if (params.search?.trim()) {
      httpParams = httpParams.set('q', params.search.trim());
    }
    if (params.type && params.type !== 'ALL') {
      httpParams = httpParams.set('type', params.type);
    }
    if (params.status && params.status !== 'ALL') {
      httpParams = httpParams.set('status', params.status);
    }

    return this.http.get<ReaderPageResponse>('/api/query/reader-definitions', {
      params: httpParams,
    });
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
