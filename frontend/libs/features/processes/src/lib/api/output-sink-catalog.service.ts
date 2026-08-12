import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { catchError, of, tap } from 'rxjs';

/**
 * Tipos de fuente a los que el motor sabe ENTREGAR (`GET /api/output-sinks`).
 *
 * <p>El catálogo de fuentes admite ocho tipos de entrada y la salida sólo escribe en dos, así que
 * `direction: OUTPUT` no basta para saber si un destino sirve: dice que la fuente *quiere* ser
 * destino, no que el motor *pueda* escribir en ella. Sin este dato el selector ofrece destinos que
 * fallan al ejecutar, con el proceso ya publicado.</p>
 *
 * <p>Se carga una vez y se cachea: la lista sólo cambia con un despliegue.</p>
 */
@Injectable({ providedIn: 'root' })
export class OutputSinkCatalogService {
  private readonly http = inject(HttpClient);
  private readonly types = signal<readonly string[] | null>(null);
  private cargando = false;

  /** `null` mientras no se sabe. Quien lo consuma no debe filtrar hasta tener respuesta. */
  readonly deliverableTypes = this.types.asReadonly();

  load(): void {
    if (this.cargando || this.types() !== null) {
      return;
    }
    this.cargando = true;
    this.http
      .get<{ deliverableTypes: string[] }>('/api/output-sinks')
      // Si el catálogo no responde no se puede afirmar que un tipo NO sea entregable: se deja pasar
      // y decide el backend al guardar. Esconder destinos válidos por un fallo de red sería peor.
      .pipe(
        catchError(() => of({ deliverableTypes: [] as string[] })),
        tap(() => (this.cargando = false)),
      )
      .subscribe((response) =>
        this.types.set(response.deliverableTypes.map((type) => type.toUpperCase())),
      );
  }

  /** `true` si no se sabe todavía, o si el tipo tiene sink. */
  canDeliverTo(sourceType?: string): boolean {
    const known = this.types();
    if (known === null || known.length === 0) {
      return true;
    }
    return sourceType != null && known.includes(sourceType.toUpperCase());
  }
}
