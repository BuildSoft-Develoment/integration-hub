"""Tests de la logica pura (no requieren gRPC ni stubs). Correr: python -m pytest src/test_transform.py"""
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

import pytest

from demo_remote_csv_reader import READER_TYPE, read_remote_csv
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


def test_remote_csv_reader_uses_http_range_cursor():
    csv = b"ana,10\nluis,20\nzoe,30"

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            range_header = self.headers.get("Range", "")
            start = int(range_header[6:]) if range_header.startswith("bytes=") else 0
            body = csv[start:]
            self.send_response(206 if start > 0 else 200)
            self.send_header("Content-Type", "text/csv")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, _format, *args):
            return

    server = HTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        base = {
            "artifactRef": {"uri": f"http://127.0.0.1:{server.server_port}/data.csv", "method": "GET"},
            "configuration": {"columns": ["name", "amount"]},
        }
        first = read_remote_csv({**base, "batchSize": 2})
        assert first["records"] == [
            {"name": "ana", "amount": "10"},
            {"name": "luis", "amount": "20"},
        ]
        assert first["nextCursor"] == "15"

        second = read_remote_csv({**base, "batchSize": 2, "cursor": first["nextCursor"]})
        assert second["records"] == [{"name": "zoe", "amount": "30"}]
        assert "nextCursor" not in second
    finally:
        server.shutdown()
        server.server_close()


def test_remote_csv_reader_rejects_non_get_artifact_ref():
    with pytest.raises(ValueError, match=f"{READER_TYPE} requires artifactRef.method=GET"):
        read_remote_csv({"artifactRef": {"uri": "http://localhost/data.csv", "method": "POST"}})
