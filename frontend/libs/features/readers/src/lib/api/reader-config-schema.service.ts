import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { SchemaFormSchema } from '@integration-hub/shared/ui';
import { Observable } from 'rxjs';

/**
 * Obtiene el schema de configuracion de un reader type del backend
 * (`GET /api/plugins/config-schema/{type}`). Habilita configurar en la UI un reader
 * aportado por un plugin (backend-only) sin formulario frontend hardcoded: el host lo
 * renderiza con `ih-schema-form`. Devuelve `{ fields: [] }` si el tipo no declara schema.
 */
@Injectable({ providedIn: 'root' })
export class ReaderConfigSchemaService {
  private readonly http = inject(HttpClient);

  schemaFor(type: string): Observable<SchemaFormSchema> {
    return this.http.get<SchemaFormSchema>(
      `/api/plugins/config-schema/${encodeURIComponent(type)}`
    );
  }
}
