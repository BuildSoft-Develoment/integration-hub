/**
 * Raices de codigo fuente que los gates de gobernanza escanean.
 *
 * POR QUE EXISTE ESTE FICHERO
 * La lista estaba cableada por separado en cuatro sitios (check-trace-drift, ai-framework-agent,
 * roadmap-status x2) y se quedo en ["src","backend","frontend","tests","platform-app"], que era el
 * reparto del repositorio cuando habia UN solo modulo de backend. Desde entonces el proyecto se partio
 * en siete modulos Maven, y los gates siguieron mirando solo al motor.
 *
 * El efecto no era un fallo: era un VERDE FALSO. Las 82 anotaciones @trace de los verticales, el SPI y
 * el audit-consumer -72 de ellas en el vertical del money-path- eran invisibles para el harvest, asi que
 * el gate de trazabilidad daba por cubierto justo el codigo que mueve dinero. Un gate ciego que pasa es
 * peor que no tener gate, porque sostiene una confianza que no existe.
 *
 * Al anadir un modulo nuevo al reactor, anadirlo AQUI. Es el unico sitio.
 */

/** Modulos Maven del reactor con codigo Java. Debe coincidir con la seccion <modules> de pom.xml. */
export const JAVA_MODULES = [
  'platform-contract',
  'platform-spi',
  'platform-app',
  'vertical-swift-mt101',
  'vertical-iso20022',
  'audit-consumer',
  // El septimo modulo del reactor. Faltaba pese a que el comentario de arriba declara que esta lista
  // debe coincidir con <modules>. Hoy no cambia la cobertura -sus 7 ficheros Java no llevan ninguna
  // anotacion de trazabilidad, medido-, pero la primera que se anadiera habria sido invisible: el
  // mismo verde falso que motivo este fichero, a menor escala.
  'ejemplos/backend-plugin-sidecar',
];

/**
 * Raices que se escanean en busca de anotaciones de trazabilidad (@trace / @covers / @implements).
 * Incluye los modulos Java, el frontend y las carpetas historicas del andamiaje del framework.
 */
export const SOURCE_ROOTS = ['src', 'backend', 'frontend', 'tests', ...JAVA_MODULES];

/** Raices con tests, para los gates que miden cobertura de pruebas. */
export const TEST_ROOTS = ['tests', 'qa/automated', 'src', 'backend', 'frontend', ...JAVA_MODULES];

/**
 * Prefijos desde los que la DOCUMENTACION escribe rutas de codigo.
 *
 * La casa tiene una convencion consistente y deliberada: una clase Java se cita relativa a la raiz de
 * su paquete (`domain/TaskType.java`, `api/security/PlatformRoles.java`) y el frontend relativo a
 * `frontend/` (`libs/core/services/...`). Escribir la ruta completa
 * -`platform-app/src/main/java/com/integrationhub/platform/domain/TaskType.java`- en cada mencion
 * haria los ADR ilegibles, que es justo lo contrario de para lo que existen.
 *
 * El validador de rutas en backticks no conocia esas raices y marcaba 59 referencias VALIDAS como
 * rotas. Esto NO relaja el gate: la ruta se sigue verificando contra el disco, solo que tambien desde
 * las raices documentadas. Una clase borrada sigue fallando bajo todas ellas.
 *
 * Se derivan del arbol en vez de cablearse: la raiz de paquete de un modulo se obtiene bajando
 * mientras haya un unico subdirectorio y ningun .java, asi que anadir un modulo a JAVA_MODULES basta.
 */
export function docPathRoots(rootDir, fs, path) {
  // El frontend es un monorepo Nx y sus dos raices se citan indistintamente: unas veces con el
  // prefijo (`libs/core/...`, tal como lo escribe ADR-021) y otras sin el (`core/providers/...`,
  // como en el plan de UX). Ambas formas nombran el mismo fichero.
  const roots = ['frontend', 'frontend/libs', 'frontend/apps/web/src'];
  for (const moduleName of JAVA_MODULES) {
    const javaBase = path.join(rootDir, moduleName, 'src/main/java');
    if (fs.existsSync(javaBase)) {
      // Se registra CADA nivel desde `com/integrationhub` hasta la raiz de paquete del modulo, no
      // solo el ultimo: la misma clase se cita a distinta altura segun el documento
      // -`spi/task/AsyncOffloadSupport.java` cuelga de `.../platform`, mientras que
      // `Mt101PayTaskProvider` se cita desde la raiz del vertical-. Sin los niveles intermedios,
      // media docena de referencias validas se marcaban como rotas.
      let current = javaBase;
      for (;;) {
        const entries = fs.readdirSync(current, { withFileTypes: true });
        const dirs = entries.filter((e) => e.isDirectory());
        const javas = entries.filter((e) => e.name.endsWith('.java'));
        if (dirs.length !== 1 || javas.length > 0) break;
        current = path.join(current, dirs[0].name);
        const relative = path.relative(rootDir, current);
        // Desde `com/integrationhub` hacia abajo. Los dos primeros niveles (`com`, `com/integrationhub`)
        // no los cita nadie y solo anadirian ruido.
        if (relative.split(/[/\\]/).includes('integrationhub')) roots.push(relative);
      }
    }
    // Migraciones y recursos se citan igual de cortos: `db/migration/V23__...sql`.
    const resources = path.join(rootDir, moduleName, 'src/main/resources');
    if (fs.existsSync(resources)) roots.push(path.relative(rootDir, resources));
  }
  return roots;
}
