import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

// @trace ADR-031 D1, D7 (la ayuda deja de nombrar un prefijo fijo; lo dice el backend)

/** Una fuente de secreto que ESTE despliegue resuelve (`GET /api/secret-sources`). */
export interface SecretSource {
  readonly source: string;
  readonly enumerable: boolean;
}

interface SecretSourceCatalogResponse {
  readonly sources: readonly SecretSource[];
}

/**
 * Que prefijos de referencia de secreto funcionan en este despliegue.
 *
 * <p>Existe porque la pantalla recomendaba `${secret:...}` en todas partes. En integracion eso
 * funciona -hay un file-vault-; en la VM de produccion no lo hay, y esa referencia falla EN
 * EJECUCION con "Missing secret value". La validacion no lo detecta: acepta los ocho prefijos, asi
 * que la referencia valida, se guarda y revienta despues, en mitad de un proceso, con un mensaje
 * que parece "el secreto no existe".</p>
 *
 * <p>El frontend no estaba equivocado por descuido: <b>no tenia a quien preguntar</b>. Ahora si.</p>
 */
@Injectable({ providedIn: 'root' })
export class SecretSourcesService {
  private readonly http = inject(HttpClient, { optional: true });

  private readonly fuentes = signal<readonly SecretSource[]>([]);
  private readonly cargado = signal(false);

  /** Las fuentes resolubles aqui. Vacio mientras no se haya cargado. */
  readonly sources = this.fuentes.asReadonly();

  /**
   * Los prefijos listos para pintar: `${vaultkv:...}, ${config:...}`.
   *
   * <p>Se muestran TODOS los resolubles y no uno recomendado. El backend se niega expresamente a
   * opinar -devuelve el catalogo en orden alfabetico, no por preferencia- y la pantalla no es mejor
   * sitio para esconder esa opinion: quien elige es la persona que edita, que sabe donde dio de alta
   * el secreto.</p>
   *
   * <p>Mientras no haya respuesta devuelve cadena vacia, y el texto de ayuda se queda sin ejemplo en
   * vez de inventarse uno. Un ejemplo equivocado es lo que estamos arreglando.</p>
   */
  readonly prefijos = computed(() =>
    this.fuentes()
      .map((fuente) => `\${${fuente.source}:...}`)
      .join(', '),
  );

  /** Las que ademas se pueden enumerar (ADR-031 D2/D3). Hoy solo `vaultkv`. */
  readonly enumerables = computed(() => this.fuentes().filter((fuente) => fuente.enumerable));

  /**
   * Carga el catalogo una vez. Idempotente: las pantallas de fuentes, conexiones y tareas la
   * invocan sin coordinarse entre ellas (ADR-031 D6).
   */
  async load(): Promise<void> {
    if (this.cargado() || !this.http) {
      return;
    }
    this.cargado.set(true);
    try {
      const respuesta = await firstValueFrom(
        this.http.get<SecretSourceCatalogResponse>('/api/secret-sources'),
      );
      this.fuentes.set(respuesta?.sources ?? []);
    } catch {
      // Sin catalogo la ayuda pierde el ejemplo, y nada mas: el campo sigue aceptando texto libre
      // (ADR-031 D2) y la validacion de texto plano no depende de esto. Se permite reintentar.
      this.cargado.set(false);
    }
  }
}
