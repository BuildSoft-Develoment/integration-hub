import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuditRecord } from './audit.models';

@Injectable({ providedIn: 'root' })
export class AuditApiService {
  private readonly http = inject(HttpClient);

  list(): Observable<AuditRecord[]> {
    const params = new HttpParams().set('page', '0').set('size', '200');
    return this.http.get<AuditRecord[]>('/api/query/audit-events', { params });
  }
}
