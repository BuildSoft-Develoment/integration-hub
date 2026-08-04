import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from './dictionaries/en';
import { es } from './dictionaries/es';
import { VocabularyKind, vocabularyKey, vocabularyTone } from './domain-vocabulary';

/**
 * Exhaustividad del vocabulario de dominio.
 *
 * <h3>Por que lee el backend en vez de una lista</h3>
 * Una lista de estados copiada a mano en el test envejece en silencio: alguien anade
 * `NEEDS_RECONCILIATION` en Java, la UI lo recibe, lo pinta crudo, y el test sigue verde porque
 * nunca supo que ese valor existia. Aqui el dominio se DERIVA del codigo que lo emite, de modo que
 * un estado nuevo pone rojo este fichero hasta que alguien decida como se llama en pantalla.
 *
 * <h3>Que exige</h3>
 * Que cada valor que el backend puede emitir tenga clave en los DOS idiomas. Faltar en uno solo es
 * peor que faltar en ambos, porque el defecto se vuelve invisible para quien prueba en el otro.
 */

// process.cwd() es `frontend/` cuando corre el runner de Angular.
const REPO = join(process.cwd(), '..');

function leer(rel: string): string {
  return readFileSync(join(REPO, rel), 'utf8');
}

/**
 * Constantes de un enum Java.
 *
 * Los comentarios se quitan ANTES de buscar el final de la lista. Sin eso, un `;` dentro de un
 * javadoc corta el parseo por la mitad y el test deriva un dominio incompleto — es decir, pasa a
 * verde por no mirar. Paso de verdad: el javadoc de `SUSPENDED` contiene `{@code suspended_state};`
 * y se perdian los dos ultimos estados, entre ellos `NEEDS_RECONCILIATION`.
 */
function valoresDeEnum(rel: string, nombreEnum: string): string[] {
  const src = leer(rel)
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ');
  const cuerpo = src.slice(src.indexOf(`enum ${nombreEnum}`));
  const fin = cuerpo.indexOf(';');
  const listaDeConstantes = cuerpo.slice(0, fin === -1 ? cuerpo.length : fin);
  return [...listaDeConstantes.matchAll(/\b([A-Z][A-Z0-9_]{2,})\b/g)]
    .map((m) => m[1])
    .filter((v) => v !== nombreEnum.toUpperCase());
}

/** `public static final String X = "VALOR";` — el patron que usan las entidades sin enum. */
function constantesString(rel: string): string[] {
  return [...leer(rel).matchAll(/public static final String\s+[A-Z_]+\s*=\s*"([A-Z0-9_]+)"/g)]
    .map((m) => m[1]);
}

/** Tipos de evento de auditoria realmente emitidos: tercer argumento de `record(...)`. */
function eventTypesEmitidos(): string[] {
  const fuentes = [
    'platform-app/src/main/java/com/integrationhub/platform/service/execution/ProcessExecutionStateService.java',
    'platform-app/src/main/java/com/integrationhub/platform/service/execution/ProcessExecutionService.java',
    'platform-app/src/main/java/com/integrationhub/platform/provider/task/NotificationTaskProvider.java',
  ];
  const encontrados = new Set<string>();
  for (const f of fuentes) {
    let src: string;
    try {
      src = leer(f);
    } catch {
      continue; // Un fichero movido no debe romper el test; lo que importa es lo que SI existe.
    }
    for (const m of src.matchAll(/\brecord\(\s*[^;]{0,200}?"([A-Z][A-Z0-9_]{3,})"/g)) {
      encontrados.add(m[1]);
    }
  }
  return [...encontrados];
}

const DOMINIO: ReadonlyArray<{ kind: VocabularyKind; origen: string; valores: string[] }> = [
  {
    kind: 'executionStatus',
    origen: 'ExecutionStatus.java',
    valores: valoresDeEnum(
      'platform-spi/src/main/java/com/integrationhub/platform/spi/execution/ExecutionStatus.java',
      'ExecutionStatus',
    ),
  },
  {
    kind: 'inboxStatus',
    origen: 'TaskInbox.java',
    valores: constantesString('platform-app/src/main/java/com/integrationhub/platform/entity/TaskInbox.java'),
  },
  {
    kind: 'spoolStatus',
    origen: 'AuditSpool.java',
    valores: constantesString('platform-app/src/main/java/com/integrationhub/platform/entity/AuditSpool.java'),
  },
  {
    kind: 'auditEvent',
    origen: 'llamadas a AuditService.record(...)',
    valores: eventTypesEmitidos(),
  },
];

describe('vocabulario de dominio · exhaustividad contra el backend', () => {
  it('deriva valores reales del backend (si no, el resto del fichero no probaria nada)', () => {
    for (const familia of DOMINIO) {
      expect(familia.valores.length, `no se pudo derivar el dominio de ${familia.origen}`)
        .toBeGreaterThan(0);
    }
    // Ancla concreta: si el parseo se rompe, esto lo dice antes que un fallo difuso.
    const estados = DOMINIO.find((d) => d.kind === 'executionStatus')!.valores;
    expect(estados).toContain('NEEDS_RECONCILIATION');
  });

  for (const { kind, origen, valores } of DOMINIO) {
    it(`cada valor de ${kind} (${origen}) tiene etiqueta en es y en`, () => {
      const sinClave: string[] = [];
      for (const valor of valores) {
        const key = vocabularyKey(kind, valor);
        if (!(key in es)) sinClave.push(`es: ${key}`);
        if (!(key in en)) sinClave.push(`en: ${key}`);
      }
      expect(sinClave, `valores que la UI no sabe nombrar y pintaria marcados:\n  ${sinClave.join('\n  ')}`)
        .toEqual([]);
    });
  }
});

describe('vocabulario de dominio · tono', () => {
  it('ningun estado de ejecucion cae a neutral por descuido', () => {
    // `neutral` es legitimo para PENDING (no ha pasado nada aun). Para el resto, gris significa
    // "no lo he clasificado", y asi es como NEEDS_RECONCILIATION se paso meses invisible.
    const estados = DOMINIO.find((d) => d.kind === 'executionStatus')!.valores;
    const grises = estados.filter((s) => s !== 'PENDING' && vocabularyTone('executionStatus', s) === 'neutral');
    expect(grises, `estados sin tono propio: ${grises.join(', ')}`).toEqual([]);
  });

  it('separa "no sabemos" de "salio mal": ambar no es rojo', () => {
    // Es la regla que impide que un operador reenvie un pago que quiza ya salio.
    expect(vocabularyTone('executionStatus', 'NEEDS_RECONCILIATION')).toBe('warning');
    expect(vocabularyTone('executionStatus', 'FAILED')).toBe('danger');
    expect(vocabularyTone('payDispatchStatus', 'UNCERTAIN')).toBe('warning');
    expect(vocabularyTone('payDispatchStatus', 'REJECTED')).toBe('danger');
    // INVALIDATED no salio al banco: no puede leerse como un rechazo del banco.
    expect(vocabularyTone('payDispatchStatus', 'INVALIDATED')).not.toBe('danger');
  });
});
