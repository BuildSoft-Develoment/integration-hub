"""Logica de negocio PURA del task DEMO_TRANSFORM_PY.

Sin gRPC ni I/O: recibe la configuracion ya deserializada (dict) y devuelve un dict
{success, details, outputs}. Facil de testear de forma aislada.

Config esperada (de configuration_json): {"text": "hola", "op": "upper"}
  op in upper | lower | reverse | identity (default)
Outputs (a outputs_json): {"result": "...", "op": "...", "engine": "python"}
"""


def transform(configuration):
    cfg = configuration or {}
    text = _string_value(cfg.get("text"))
    if text is None:
        # Fail-loud: sin texto la tarea falla; no devuelve un exito vacio.
        return {
            "success": False,
            "details": "DEMO_TRANSFORM_PY requires a non-empty 'text' in configuration",
            "outputs": {"engine": "python"},
        }
    raw_op = _string_value(cfg.get("op"))
    op = "identity" if raw_op is None else raw_op.lower()
    if op == "upper":
        result = text.upper()
    elif op == "lower":
        result = text.lower()
    elif op == "reverse":
        result = text[::-1]
    elif op == "identity":
        result = text
    else:
        return {
            "success": False,
            "details": f"Unknown op '{raw_op}' (expected upper|lower|reverse|identity)",
            "outputs": {"engine": "python"},
        }
    return {
        "success": True,
        "details": f"transformed '{text}' with op={op}",
        "outputs": {"result": result, "op": op, "engine": "python"},
    }


def _string_value(value):
    if value is None:
        return None
    text = str(value)
    return None if text.strip() == "" else text
