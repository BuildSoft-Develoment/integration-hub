/**
 * Reimplementacion del checksum de migraciones de Flyway 12.0.0.
 *
 * ALGORITMO, leido del bytecode de `org.flywaydb.core.internal.resolver.ChecksumCalculator`
 * (`calculateChecksumForResource`): se abre un BufferedReader sobre el recurso, se leen lineas con
 * `readLine()`, a la PRIMERA se le quita el BOM con `BomFilter.FilterBomFromString`, y de cada linea
 * se hace `CRC32.update(linea.getBytes(UTF_8))`. El resultado sale como int con signo.
 *
 * Tres consecuencias que importan y estan medidas:
 *
 *  - EL TERMINADOR DE LINEA NUNCA ENTRA AL CRC, porque `readLine()` lo consume y no lo devuelve. Por
 *    eso CRLF y LF dan el MISMO checksum. Es la propiedad que hace viable un manifiesto commiteado:
 *    este repo tiene `core.autocrlf=true` y ningun `.gitattributes`, asi que el working tree en
 *    Windows es CRLF (83 de 104 ficheros) y el CI de Linux ve LF. Un hash de bytes daria 104 falsos
 *    positivos al cruzar de plataforma; este da 0. Verificado: convertir CRLF->LF en los 104 .sql
 *    del repo cambia 0 checksums, y el valor calculado desde un blob de git (LF) coincide al entero
 *    con el que el binario nativo -construido en Windows desde CRLF- dejo en flyway_schema_history.
 *
 *  - EL BOM SE FILTRA SOLO EN LA PRIMERA LINEA. En el bytecode el back-edge del bucle salta por
 *    detras de la llamada a FilterBomFromString, asi que un BOM a mitad de fichero SI cuenta. El
 *    unico fichero del repo con BOM lo tiene al principio, que es el caso soportado.
 *
 *  - LAS LINEAS EN BLANCO SON INVISIBLES (un `update` con array vacio no altera el CRC), pero los
 *    ESPACIOS AL FINAL DE LINEA NO se ignoran. Hoy no hay ninguno en el repo; un formateador que los
 *    recortara cambiaria checksums de migraciones ya aplicadas.
 *
 * Equivale a: quitar el BOM inicial, borrar todos los bytes CR y LF, y CRC32 de lo que queda.
 * Comprobado contra el ChecksumCalculator real sobre las 104 migraciones: 104 coincidencias, 0 divergencias.
 */

import { crc32 } from "node:zlib";

/** @param {Buffer|string} contenido @returns {number} checksum de Flyway (int32 con signo) */
export function flywayChecksum(contenido) {
  let texto = Buffer.isBuffer(contenido) ? contenido.toString("utf8") : String(contenido);
  if (texto.charCodeAt(0) === 0xfeff) texto = texto.slice(1);
  return crc32(Buffer.from(texto.replace(/[\r\n]/g, ""), "utf8")) | 0;
}
