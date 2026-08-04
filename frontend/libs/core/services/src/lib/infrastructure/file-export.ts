/**
 * Exportacion de datos a fichero desde el navegador.
 *
 * <h3>Por que vive en core</h3>
 * `downloadText` estaba duplicado casi byte a byte en `features/audit` y en `features/executions`,
 * y ninguna de las dos copias podia borrarse en favor de la otra: la frontera Nx prohibe que una
 * feature importe a otra. El sitio comun de dos features es core o shared, nunca una de ellas.
 *
 * <h3>Por que tambien el armado del CSV</h3>
 * Las dos copias emitian dialectos distintos: una citaba solo cuando el contenido lo exigia y
 * separaba filas con CRLF, la otra citaba siempre y separaba con LF. Es el mismo defecto que las
 * cabeceras en dos idiomas — un solo producto hablando de dos maneras — asi que el formato tambien
 * se decide en un unico sitio.
 */

export function downloadText(content: string, fileName: string, mimeType = 'text/csv;charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Campo CSV segun RFC 4180: se cita solo cuando el contenido lo exige.
 *
 * El CR entra en la condicion a proposito. Un mensaje de error de la BD trae CRLF, y un CR suelto
 * dentro de un campo sin comillas parte la fila al abrirla en la hoja de calculo.
 */
export function csvEscape(value: unknown): string {
  const text = value == null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Documento CSV completo, cabecera incluida. CRLF entre filas (RFC 4180). */
export function toCsv(header: readonly string[], rows: readonly (readonly unknown[])[]): string {
  return [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\r\n');
}
