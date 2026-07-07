// Logica de negocio PURA del task DEMO_TRANSFORM_NODE. Sin gRPC ni I/O: recibe la
// configuracion ya deserializada y devuelve { success, details, outputs }. Facil de testear.
//
// Config esperada (de configuration_json): { "text": "hola", "op": "upper" }
//   op ∈ upper | lower | reverse | identity (default)
// Outputs (a outputs_json): { "result": "...", "op": "...", "engine": "node" }

export function transform(configuration) {
  const cfg = configuration || {};
  const text = stringValue(cfg.text);
  if (text === null) {
    // Fail-loud: sin texto la tarea falla; no devuelve un exito vacio.
    return { success: false, details: "DEMO_TRANSFORM_NODE requires a non-empty 'text' in configuration", outputs: { engine: 'node' } };
  }
  const rawOp = stringValue(cfg.op);
  const op = rawOp === null ? 'identity' : rawOp.toLowerCase();
  let result;
  switch (op) {
    case 'upper': result = text.toUpperCase(); break;
    case 'lower': result = text.toLowerCase(); break;
    case 'reverse': result = [...text].reverse().join(''); break;
    case 'identity': result = text; break;
    default: result = null;
  }
  if (result === null) {
    return { success: false, details: `Unknown op '${rawOp}' (expected upper|lower|reverse|identity)`, outputs: { engine: 'node' } };
  }
  return { success: true, details: `transformed '${text}' with op=${op}`, outputs: { result, op, engine: 'node' } };
}

function stringValue(value) {
  if (value === undefined || value === null) return null;
  const text = String(value);
  return text.trim().length === 0 ? null : text;
}
