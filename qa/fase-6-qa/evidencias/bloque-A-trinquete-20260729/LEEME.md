# Bloque A — Trinquete de capacidades del money-path

Evidencia de que el trinquete introducido por `MoneyMovementCapabilityRatchetTest` **falla cuando
tiene que fallar**. Un trinquete verde que nunca puede ponerse rojo no protege nada, así que se
verificó por mutación.

## El riesgo que cubre

`TaskProvider.movesMoney()` es opt-in con default `false`. Un vertical nuevo que agregue una tarea de
pago y olvide el `@Override` no produce error, ni warning, ni test rojo — y la recuperación de
ejecuciones huérfanas re-encolaría esa ejecución a ciegas tras una caída de nodo, en vez de dejarla
en `NEEDS_RECONCILIATION`. **El modo inseguro era el silencioso.**

## Verificación por mutación

| Archivo | Estado del código | Resultado |
|---|---|---|
| `sin-mutar-verde.txt` | `Mt101PayTaskProvider.movesMoney()` → `true` (real) | `Tests run: 3, Failures: 0` · `BUILD SUCCESS` |
| `mutacion-movesMoney-false.txt` | mutado a `return false` | `Tests run: 3, Failures: 3` · `BUILD FAILURE` |

La mutación simula exactamente el olvido que preocupa. Los tres tests caen, y cada uno da un
diagnóstico distinto y accionable:

1. **Mapa congelado** — detecta el cambio de capacidad:
   `MT101_PAY: congelado movesMoney=true producesConsumableRecords=false, declarado movesMoney=false`
2. **Regla por nombre** — detecta el patrón léxico:
   `Estos tipos se llaman como una tarea de pago pero no declaran movesMoney()`
3. **Prueba negativa** — ancla el caso concreto:
   `MT101_PAY entrega la orden al banco: tiene que declarar movesMoney()`

La mutación se revirtió tras la medición; `git diff` sobre el provider queda limpio.

## Por qué dos reglas y no una

- El **mapa congelado** es la autoridad: atrapa *cualquier* tipo nuevo, sin importar cómo se llame.
  Una regla puramente léxica no cubriría a un vertical que nombre su tarea `SBS_ENVIO`.
- La **regla por nombre** se conserva porque da un diagnóstico específico en el caso común, en vez del
  genérico "hay un tipo que no conozco, agrégalo a la lista" — que invita a agregarlo con `false` sin
  pensarlo.

Ambas listas de excepción (`SUENAN_A_PAGO_PERO_NO_MUEVEN_DINERO` y el propio mapa) están vacías o
completas a propósito: llenarlas tiene que ser una decisión visible en el diff, igual que el
freeze-store de `VerticalBoundaryArchTest`.
