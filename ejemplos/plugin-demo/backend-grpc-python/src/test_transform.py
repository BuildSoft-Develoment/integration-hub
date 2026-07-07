"""Tests de la logica pura (no requieren gRPC ni stubs). Correr: python -m pytest src/test_transform.py"""
from transform import transform


def test_upper_transforms_and_reports_engine():
    o = transform({"text": "hola mundo", "op": "upper"})
    assert o["success"] is True
    assert o["outputs"]["result"] == "HOLA MUNDO"
    assert o["outputs"]["engine"] == "python"
    assert o["outputs"]["op"] == "upper"


def test_reverse_transforms():
    o = transform({"text": "abc", "op": "reverse"})
    assert o["success"] is True
    assert o["outputs"]["result"] == "cba"


def test_missing_op_defaults_to_identity():
    o = transform({"text": "abc"})
    assert o["success"] is True
    assert o["outputs"]["result"] == "abc"
    assert o["outputs"]["op"] == "identity"


def test_missing_text_fails_loud():
    o = transform({"op": "upper"})
    assert o["success"] is False


def test_unknown_op_fails_loud():
    o = transform({"text": "abc", "op": "explode"})
    assert o["success"] is False
