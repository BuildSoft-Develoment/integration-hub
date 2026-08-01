// ci/scripts/_lib/strict-mode.mjs (v12.59)
//
// Resuelve el modo "strict" de un validador desde 3 fuentes, en orden de
// prioridad descendente:
//   1. --warn          (flag explicito) -> SIEMPRE false (override duro)
//   2. --strict        (flag explicito) -> true
//   3. CHECK_STRICT=1  (variable de entorno) -> true
//   4. defaultStrict   (valor por defecto del validador)
//
// Cierra el gap real reportado: antes los validadores solo leian --strict y
// CHECK_STRICT=1 no tenia efecto (exit 0 aunque hubiera hallazgos). Ahora
// CHECK_STRICT=1 funciona en TODOS los validadores que usan este helper.
//
// Uso en cada validador:
//   import { resolveStrict } from "./_lib/strict-mode.mjs";
//   const strict = resolveStrict(args);                  // BLOQUEANTE (default)
//   const strict = resolveStrict(args, false);           // solo informa — hay que JUSTIFICARLO
//
// v12.148 — EL DEFAULT SE INVIRTIO, Y ES EL CAMBIO MAS IMPORTANTE DE ESTE FICHERO.
//
// Antes el default era `false` (informar sin bloquear). Medido sobre este repo: de las 53
// invocaciones que componen check:all, DIECIOCHO eran estructuralmente incapaces de devolver !=0,
// entre ellas check-phase-contract y el propio meta-validador check-validation-coverage. Y
// .github/workflows/ci.yml corre `npm run check:all` sin exportar CHECK_STRICT, asi que en CI
// ninguna podia romper el build.
//
// El efecto no era "somos permisivos", era peor: tres validadores llevaban imprimiendo hallazgos
// con `x` y saliendo 0 en cada corrida. Un gate que grita y no bloquea entrena a todo el mundo a
// no leer la salida — y cuando por fin aparece el hallazgo que importa, ya nadie mira. Dos de esos
// tres, ademas, gritaban en falso (comparaban CRLF contra LF), lo que acelera el mismo aprendizaje.
//
// Ahora bloquear es lo normal y NO bloquear es la excepcion que hay que escribir a mano, con su
// razon al lado. Un `resolveStrict(args, false)` en el codigo es una decision visible en el diff;
// un default permisivo era una decision que nadie tomo y que nadie veia.

export function resolveStrict(args, defaultStrict = true) {
  // --warn fuerza no-strict (override duro para CI de aprendizaje).
  if (args && args.warn) return false;
  // --strict flag.
  if (args && args.strict) return true;
  // CHECK_STRICT env var (1, true, yes).
  const env = (process.env.CHECK_STRICT || "").toLowerCase();
  if (env === "1" || env === "true" || env === "yes") return true;
  return defaultStrict;
}

/**
 * Helper para imprimir el modo activo de forma consistente.
 */
export function strictLabel(strict) {
  return strict ? "[STRICT — exit 1 si hay hallazgos]" : "[WARN — exit 0, solo reporta]";
}
