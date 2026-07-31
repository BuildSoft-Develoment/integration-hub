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
];

/**
 * Raices que se escanean en busca de anotaciones de trazabilidad (@trace / @covers / @implements).
 * Incluye los modulos Java, el frontend y las carpetas historicas del andamiaje del framework.
 */
export const SOURCE_ROOTS = ['src', 'backend', 'frontend', 'tests', ...JAVA_MODULES];

/** Raices con tests, para los gates que miden cobertura de pruebas. */
export const TEST_ROOTS = ['tests', 'qa/automated', 'src', 'backend', 'frontend', ...JAVA_MODULES];
