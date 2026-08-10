// ci/scripts/_lib/code-roots.mjs (v12.149)
//
// Deriva del repositorio las rutas donde vive el CODIGO, para que el contrato de fases pueda
// hablar de "el backend" sin escribir a mano una lista que se queda vieja.
//
// POR QUE EXISTE. `phase-contracts.mjs` declaraba las rutas de codigo como `src/**`,
// `backend/**`, `apps/**`, `services/**`, `libs/**`, `tests/**` y `db/migration/**`. Son los globs
// de la plantilla generica, pensados para un proyecto de una sola aplicacion. Este es un monolito
// modular de siete modulos Maven, asi que en la raiz `src/` y `tests/` contienen un README y nada
// mas: el codigo esta en `platform-app/src` (616 ficheros), `vertical-swift-mt101/src` (218),
// `platform-spi/src` (57) y cuatro modulos mas.
//
// El desajuste rompia la guarda EN LAS DOS DIRECCIONES:
//   - como `touchAllow` de la fase de Construccion, permitia `src/**`, o sea nada: encenderla
//     habria bloqueado la fase entera
//   - como `touchForbid` de las otras ocho, prohibia `src/**`, o sea nada: durante una fase de
//     analisis se podia reescribir el motor sin que la politica lo notara
//
// Y no era teorico. El commit que edito cinco migraciones YA APLICADAS -y dejo sin arrancar
// cualquier instalacion existente- se audito contra la fase 6, que declara
// `touchForbid: db/migration/**`. Las migraciones reales estan en
// `platform-app/src/main/resources/db/migration`, que no matchea, asi que las cinco pasaron como
// avisos corrientes entre 165. La guarda que existia para eso no lo vio.
//
// SE DERIVA, NO SE ESCRIBE. La lista sale de los <module> del pom raiz. Si manana entra un octavo
// modulo y la lista estuviera escrita a mano, ese modulo caeria fuera de TODA guarda en silencio,
// que es exactamente el modo de fallo que produjo esto.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** Modulos Maven declarados en el pom raiz. */
export function mavenModules(root) {
  const pom = join(root, "pom.xml");
  if (!existsSync(pom)) return [];
  return [...readFileSync(pom, "utf8").matchAll(/<module>([^<]+)<\/module>/g)]
    .map((m) => m[1].trim())
    .filter(Boolean);
}

/**
 * Raiz del frontend.
 *
 * Devuelve la RAIZ, no los workspaces de Nx. Enumerar `frontend/apps` y `frontend/libs` parecia
 * mas preciso y dejaba un agujero: `frontend/**` ya los cubre, mientras que la lista de
 * workspaces deja fuera lo que cuelga de la raiz —`package.json`, `angular.json`, `nx.json`—
 * que tambien es frontend. Como `touchForbid`, prohibir el codigo de las apps pero no el fichero
 * que declara sus dependencias no prohibe nada: se cambia la version de una libreria y pasa.
 *
 * Sigue siendo funcion, y no una constante, porque es el punto donde entra un frontend que no
 * viva en `frontend/` — y donde este comentario queda a la vista de quien lo intente otra vez.
 *
 * Devuelve la ruta SIN sufijo de glob, igual que el resto de derivadores de este fichero: quien
 * la consume ya trae su propio sufijo en el glob del contrato.
 */
export function frontendRoots() {
  return ["frontend"];
}

/**
 * Expande los tokens de codigo de un glob del contrato.
 * Devuelve SIEMPRE un array (un token puede expandir a varias rutas, una por modulo).
 *
 * Tokens soportados:
 *   <backend>      codigo de produccion de cada modulo Maven
 *   <backend-test> pruebas de cada modulo Maven
 *   <migrations>   migraciones Flyway de cualquier modulo (incluye `migration-<vertical>`)
 *   <frontend>     workspaces del frontend
 *   <frontend-test> specs del frontend
 */
export function expandCodeTokens(glob, root) {
  if (!/<(backend|backend-test|migrations|frontend|frontend-test)>/.test(glob)) return [glob];
  const modulos = mavenModules(root);
  const salida = [];
  for (const token of ["<backend>", "<backend-test>", "<migrations>", "<frontend>", "<frontend-test>"]) {
    if (!glob.includes(token)) continue;
    if (token === "<frontend>") {
      for (const f of frontendRoots()) salida.push(glob.replace(token, f));
    } else if (token === "<frontend-test>") {
      salida.push(glob.replace(token, "frontend/**/*.spec.ts"));
    } else if (token === "<migrations>") {
      // Solo los modulos que TIENEN migraciones. Expandir a los siete generaria cinco globs que no
      // describen nada; no rompen el matching, pero ensucian el diagnostico y hacen indistinguible
      // un glob inofensivo de uno roto — que es justo lo que habia que arreglar aqui.
      // Se detecta por sistema de ficheros, asi que el dia que un modulo estrene migraciones entra solo.
      for (const m of modulos) {
        const base = join(root, m, "src/main/resources/db");
        if (!existsSync(base)) continue;
        let dirs = [];
        try { dirs = readdirSync(base).filter((d) => d.startsWith("migration")); } catch { continue; }
        for (const d of dirs) salida.push(glob.replace(token, `${m}/src/main/resources/db/${d}`));
      }
    } else {
      const sufijo = token === "<backend>" ? "src/main" : "src/test";
      for (const m of modulos) salida.push(glob.replace(token, `${m}/${sufijo}`));
    }
  }
  return salida.length > 0 ? salida : [glob];
}

/** Aplica expandCodeTokens a una lista completa de globs. */
export function expandCodePaths(globs, root) {
  return (globs || []).flatMap((g) => expandCodeTokens(g, root));
}

/**
 * Diagnostico: globs del contrato que no matchean NADA en el repo.
 * Un glob que no describe ninguna ruta existente no guarda ni permite nada, y es indistinguible
 * de una guarda que funciona hasta que alguien la prueba.
 */
export function globsMuertos(globs, root) {
  return globsSinDestino(globs, root).map((x) => x.glob);
}

/**
 * Igual que globsMuertos pero diciendo POR QUE, que es lo que decide la accion:
 *   - "inexistente": la ruta no esta. O se crea, o sobra en el contrato.
 *   - "vacio": la carpeta esta pero no contiene nada, asi que el glob no describe ningun fichero.
 *     Es estrictamente peor que "solo-readme" y antes no se reportaba.
 *   - "solo-readme": la carpeta existe con un README que explica su regla. Puede ser correcto —
 *     `diagramas/` declara en su propio README que guarda exportaciones y que el modelo maestro
 *     vive en `likec4/`—, o puede ser una puerta documental a una estructura que ya no existe,
 *     como lo era `src/`, cuyo README decia "equivalente a src/ del template, adaptada a la
 *     estructura real del proyecto" mientras el contrato seguia apuntando ahi.
 * La diferencia no es decidible por codigo: una carpeta de salida vacia y una ruta obsoleta se ven
 * igual. Por eso esto informa y no bloquea.
 */
export function globsSinDestino(globs, root) {
  const salida = [];
  for (const g of globs || []) {
    if (/<[a-z-]+>/.test(g)) continue; // sin expandir: no se juzga aqui
    const raiz = g.split("*")[0].replace(/\/$/, "");
    if (!raiz) continue;
    if (!existsSync(join(root, raiz))) { salida.push({ glob: g, motivo: "inexistente" }); continue; }
    try {
      const hijos = readdirSync(join(root, raiz));
      if (hijos.length === 0) { salida.push({ glob: g, motivo: "vacio" }); continue; }
      if (hijos.every((h) => /^readme\.md$/i.test(h))) {
        salida.push({ glob: g, motivo: "solo-readme" });
      }
    } catch { /* fichero suelto: vale */ }
  }
  return salida;
}
