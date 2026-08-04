/**
 * Punto de entrada ESTRECHO del vertical: solo su vocabulario.
 *
 * <h3>Por que existe</h3>
 * Las etiquetas de MT101 las materializa `provideSwiftMt101I18n()`, y ese proveedor estaba cableado
 * unicamente en las rutas del propio vertical y en el catalogo de procesos. Overview, ejecuciones y
 * auditoria muestran datos de MT101 pero no lo instalaban, asi que en una entrada en frio a
 * `#/audit/events` se leia `MT101_PAY` y, despues de pasar por `/processes`, se leia "Pagar MT101".
 * La misma fila, dos textos, en la misma sesion — porque el registro es acumulativo y global.
 *
 * <h3>Por que un fichero aparte y no el barril de siempre</h3>
 * `@integration-hub/features/swift-mt101` reexporta la consola entera. Importarlo desde las rutas
 * del motor solo para conseguir un mapa de cadenas arrastraria los componentes del vertical al
 * chunk de esas rutas, que es exactamente lo contrario de la regla de carga perezosa de la casa.
 *
 * Este fichero no exporta ningun componente, y esa restriccion es el punto: mientras siga asi, las
 * rutas del motor pagan el vocabulario y nada mas. Anadir aqui un componente romperia en silencio
 * la separacion, por eso lo vigila `swift-mt101-vocabulary-entrypoint.spec.ts`.
 */
export { SWIFT_MT101_MESSAGES, provideSwiftMt101I18n } from './lib/swift-mt101-i18n';
