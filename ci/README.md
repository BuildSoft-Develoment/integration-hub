# CI

[README principal](../README.md) | [Indice docs](../docs/README.md)

Carpeta para documentar el baseline de pipeline y release del proyecto cuando todavia no existe una implementacion concreta en `.github/workflows/` u otra plataforma.

## Artefactos disponibles

- [pipeline-baseline](pipeline-baseline.md)
- [scripts/check-docs.py](scripts/check-docs.py)

## Regla de uso

- Usar esta carpeta como puente entre arquitectura y operacion.
- Cuando el proyecto ya tenga workflows reales, mantener esta carpeta como guia o reemplazarla por referencias explicitas a la implementacion activa.
- Ejecutar `python ci/scripts/check-docs.py` antes de integrar cambios documentales relevantes.
