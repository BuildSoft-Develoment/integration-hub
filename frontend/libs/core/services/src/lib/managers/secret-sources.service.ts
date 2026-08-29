import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

// @trace ADR-031 D1, D3, D7 (que fuentes resuelve este despliegue, y que claves existen en ellas)

/** Una fuente de secreto que ESTE despliegue resuelve (`GET /api/secret-sources`). */
export interface SecretSource {
  readonly source: string;
  readonly enumerable: boolean;
}

interface SecretSourceCatalogResponse {
  readonly sources: readonly SecretSource[];
}

/** Un secreto que existe en la boveda: donde esta y como se llaman sus campos. Nunca su valor. */
export interface SecretEntry {
  readonly path: string;
  readonly fields: readonly string[];
}

interface SecretEnumerationResponse {
  readonly source: string;
  readonly entries: readonly SecretEntry[];
  /** `false` si el recorrido se corto por sus topes: la lista NO es todo lo que hay. */
  readonly complete: boolean;
}

/** Lo enumerado de una fuente, tal y como lo pinta el desplegable. */
export interface SecretEntries {
  readonly entries: readonly SecretEntry[];
  readonly complete: boolean;
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

  /** Lo enumerado por fuente. Se pide una vez por fuente y se reutiliza. */
  private readonly entradas = signal<Record<string, SecretEntries>>({});

  /**
   * Los secretos de una fuente, o vacio mientras no se hayan pedido.
   *
   * <p>Vacio y "no pedido todavia" se ven igual a proposito: en los dos casos el desplegable no
   * tiene nada que ofrecer y el campo sigue aceptando texto libre (D2). Distinguirlos obligaria a
   * la pantalla a pintar un estado de carga para una ayuda opcional.</p>
   */
  entriesOf(source: string): SecretEntries {
    return this.entradas()[source] ?? { entries: [], complete: true };
  }

  /**
   * Pide los secretos de una fuente enumerable. Idempotente por fuente.
   *
   * <p>No se pide en la carga del catalogo sino cuando hace falta: enumerar recorre la boveda, y
   * ADR-031 D5 lo trata como un acto que deja rastro. Hacerlo en cada pintado de pantalla llenaria
   * la traza de ruido y no diria nada de quien de verdad fue a mirar.</p>
   */
  async loadEntries(source: string): Promise<void> {
    if (!this.http || !source || source in this.entradas()) {
      return;
    }
    this.entradas.update((actual) => ({ ...actual, [source]: { entries: [], complete: true } }));
    try {
      const respuesta = await firstValueFrom(
        this.http.get<SecretEnumerationResponse>(
          `/api/secret-sources/${encodeURIComponent(source)}/entries`,
        ),
      );
      this.entradas.update((actual) => ({
        ...actual,
        [source]: { entries: respuesta?.entries ?? [], complete: respuesta?.complete ?? true },
      }));
    } catch {
      // Sin permiso -este endpoint pide el rol de editar conexiones- o sin boveda, el desplegable se
      // queda sin claves y el campo sigue aceptando texto libre. Se permite reintentar.
      this.entradas.update((actual) => {
        const copia = { ...actual };
        delete copia[source];
        return copia;
      });
    }
  }

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
