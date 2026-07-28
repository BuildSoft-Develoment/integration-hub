import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DbWriteColumnRef, DbWriteSchemaRef, DbWriteTableRef } from '../models/process-db-write.models';
import { DbRoutineParameterRef, DbRoutineRef } from '../models/process-db-routine.models';

/**
 * ADR-021: introspeccion JDBC de una conexion (esquemas, tablas, columnas, rutinas).
 *
 * <p>Estaba dentro de `ProcessApiService`, que mezclaba dos cosas distintas: el CRUD de procesos
 * (de la feature) y esta introspeccion, que la usan SOLO los formularios de tarea — los del motor y
 * los de un vertical por igual. Mientras vivio ahi, un formulario de vertical tenia que importar
 * `features/processes`, o sea otra feature: prohibido por las fronteras Nx.</p>
 *
 * <p>No consulta `/api/process-definitions`: pega a `/api/connection-definitions/{id}/jdbc-metadata`,
 * que no es de procesos. Estaba mal ubicado desde el principio.</p>
 */
@Injectable({ providedIn: 'root' })
export class ConnectionIntrospectionApiService {
  private readonly http = inject(HttpClient);

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
