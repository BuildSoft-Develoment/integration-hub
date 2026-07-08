"""Remote CSV reader demo for Python.

The platform passes artifactRef as plain JSON in configuration_json. This module
keeps the parsing logic independent from the generated gRPC stubs so it can be
unit-tested without running a plugin server.
"""
from urllib import request as urlrequest

READER_TYPE = "DEMO_REMOTE_CSV_PY"
READER_TASK_TYPE = f"READER_READ:{READER_TYPE}"


def read_remote_csv(payload):
    artifact_ref = _object(payload.get("artifactRef"), "artifactRef")
    uri = _required(artifact_ref.get("uri"), "artifactRef.uri is required")
    if str(artifact_ref.get("method", "")).upper() != "GET":
        raise ValueError(f"{READER_TYPE} requires artifactRef.method=GET")

    configuration = payload.get("configuration") if isinstance(payload.get("configuration"), dict) else {}
    delimiter = _text(configuration.get("delimiter"), ",")
    columns = [str(item).strip() for item in configuration.get("columns", []) if str(item).strip()] \
        if isinstance(configuration.get("columns"), list) else []
    batch_size = _positive_int(payload.get("batchSize"), 100)
    cursor = _positive_int(payload.get("cursor"), 0)

    http_request = urlrequest.Request(uri, method="GET")
    if cursor > 0:
        http_request.add_header("Range", f"bytes={cursor}-")

    records = []
    bytes_read = 0
    reached_eof = False
    with urlrequest.urlopen(http_request, timeout=30) as response:
        status = getattr(response, "status", response.getcode())
        if status not in (200, 206):
            raise ValueError(f"artifact GET failed: HTTP {status}")
        while len(records) < batch_size:
            raw_line = response.readline()
            if not raw_line:
                reached_eof = True
                break
            bytes_read += len(raw_line)
            _add_line(records, raw_line, delimiter, columns)

        if len(records) < batch_size:
            reached_eof = True

    outputs = {"records": records, "skippedRows": []}
    if records and not reached_eof:
        outputs["nextCursor"] = str(cursor + bytes_read)
    return outputs


def _add_line(records, raw_line, delimiter, columns):
    line = raw_line.decode("utf-8").rstrip("\n").rstrip("\r")
    if not line.strip():
        return
    values = line.split(delimiter)
    record = {}
    for index, value in enumerate(values):
        key = columns[index] if index < len(columns) else f"c{index + 1}"
        record[key] = value.strip()
    records.append(record)


def _object(value, field):
    if not isinstance(value, dict):
        raise ValueError(f"{field} must be an object")
    return value


def _required(value, message):
    text = "" if value is None else str(value).strip()
    if not text:
        raise ValueError(message)
    return text


def _text(value, fallback):
    text = "" if value is None else str(value).strip()
    return text or fallback


def _positive_int(value, fallback):
    text = "" if value is None else str(value).strip()
    if not text:
        return fallback
    return max(0, int(text))
