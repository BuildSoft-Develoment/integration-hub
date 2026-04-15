import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ConnectionRef, ProcessRecord, ReaderRef, SourceRef } from './process.models';
import { DbWriteColumnRef, DbWriteSchemaRef, DbWriteTableRef } from './process-db-write.models';
import { DbRoutineParameterRef, DbRoutineRef } from './process-db-routine.models';

@Injectable({ providedIn: 'root' })
export class ProcessApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/process-definitions';

  list(): Observable<ProcessRecord[]> {
    return this.http.get<ProcessRecord[]>(this.baseUrl);
  }

  create(payload: {
    name: string;
    description: string;
    active: boolean;
    scheduled: boolean;
    scheduleEvery: string;
    flowLayoutJson: string | null;
    tasks: Array<{
      taskOrder: number;
      taskType: string;
      sourceDefinitionId: number | null;
      readerDefinitionId: number | null;
      configurationJson: string;
    }>;
  }): Observable<ProcessRecord> {
    return this.http.post<ProcessRecord>(this.baseUrl, payload);
  }

  update(processDefinitionId: number, payload: {
    name: string;
    description: string;
    active: boolean;
    scheduled: boolean;
    scheduleEvery: string;
    flowLayoutJson: string | null;
    tasks: Array<{
      taskOrder: number;
      taskType: string;
      sourceDefinitionId: number | null;
      readerDefinitionId: number | null;
      configurationJson: string;
    }>;
  }): Observable<ProcessRecord> {
    return this.http.put<ProcessRecord>(`${this.baseUrl}/${processDefinitionId}`, payload);
  }

  setActive(processDefinitionId: number, active: boolean): Observable<ProcessRecord> {
    return this.http.post<ProcessRecord>(`${this.baseUrl}/${processDefinitionId}/activation/${active}`, {});
  }

  execute(processDefinitionId: number): Observable<unknown> {
    return this.http.post(`/api/process-executions/${processDefinitionId}`, {});
  }

  listSources(): Observable<SourceRef[]> {
    return this.http.get<SourceRef[]>('/api/source-definitions');
  }

  listReaders(): Observable<ReaderRef[]> {
    return this.http.get<ReaderRef[]>('/api/reader-definitions');
  }

  listConnections(): Observable<ConnectionRef[]> {
    return this.http.get<ConnectionRef[]>('/api/connection-definitions');
  }

  listConnectionSchemas(connectionDefinitionId: number): Observable<DbWriteSchemaRef[]> {
    return this.http.get<DbWriteSchemaRef[]>(`/api/connection-definitions/${connectionDefinitionId}/jdbc-metadata/schemas`);
  }

  listConnectionTables(connectionDefinitionId: number, options: { schema?: string; query?: string }): Observable<DbWriteTableRef[]> {
    let params = new HttpParams();
    if (options.schema) {
      params = params.set('schema', options.schema);
    }
    if (options.query) {
      params = params.set('q', options.query);
    }
    return this.http.get<DbWriteTableRef[]>(`/api/connection-definitions/${connectionDefinitionId}/jdbc-metadata/tables`, { params });
  }

  listConnectionColumns(connectionDefinitionId: number, options: { schema?: string; table: string }): Observable<DbWriteColumnRef[]> {
    let params = new HttpParams().set('table', options.table);
    if (options.schema) {
      params = params.set('schema', options.schema);
    }
    return this.http.get<DbWriteColumnRef[]>(`/api/connection-definitions/${connectionDefinitionId}/jdbc-metadata/columns`, { params });
  }

  listConnectionProcedures(connectionDefinitionId: number, options: { schema?: string; query?: string }): Observable<DbRoutineRef[]> {
    let params = new HttpParams();
    if (options.schema) {
      params = params.set('schema', options.schema);
    }
    if (options.query) {
      params = params.set('q', options.query);
    }
    return this.http.get<DbRoutineRef[]>(`/api/connection-definitions/${connectionDefinitionId}/jdbc-metadata/procedures`, { params });
  }

  listConnectionProcedureParameters(connectionDefinitionId: number, options: { schema?: string; procedure: string }): Observable<DbRoutineParameterRef[]> {
    let params = new HttpParams().set('procedure', options.procedure);
    if (options.schema) {
      params = params.set('schema', options.schema);
    }
    return this.http.get<DbRoutineParameterRef[]>(`/api/connection-definitions/${connectionDefinitionId}/jdbc-metadata/procedure-parameters`, { params });
  }

  listConnectionFunctions(connectionDefinitionId: number, options: { schema?: string; query?: string }): Observable<DbRoutineRef[]> {
    let params = new HttpParams();
    if (options.schema) {
      params = params.set('schema', options.schema);
    }
    if (options.query) {
      params = params.set('q', options.query);
    }
    return this.http.get<DbRoutineRef[]>(`/api/connection-definitions/${connectionDefinitionId}/jdbc-metadata/functions`, { params });
  }

  listConnectionFunctionParameters(connectionDefinitionId: number, options: { schema?: string; function: string }): Observable<DbRoutineParameterRef[]> {
    let params = new HttpParams().set('function', options.function);
    if (options.schema) {
      params = params.set('schema', options.schema);
    }
    return this.http.get<DbRoutineParameterRef[]>(`/api/connection-definitions/${connectionDefinitionId}/jdbc-metadata/function-parameters`, { params });
  }
}
