// Remote CSV reader demo for Node. It is intentionally independent from platform-contract:
// the platform passes artifactRef as plain JSON in configurationJson.

export const READER_TYPE = 'DEMO_REMOTE_CSV_NODE';
export const READER_TASK_TYPE = `READER_READ:${READER_TYPE}`;

export async function readRemoteCsv(request) {
  const artifactRef = objectMap(request?.artifactRef, 'artifactRef');
  const uri = required(artifactRef.uri, 'artifactRef.uri is required');
  if (String(artifactRef.method || '').toUpperCase() !== 'GET') {
    throw new Error(`${READER_TYPE} requires artifactRef.method=GET`);
  }

  const configuration = request?.configuration && typeof request.configuration === 'object'
    ? request.configuration
    : {};
  const delimiter = stringOrDefault(configuration.delimiter, ',');
  const columns = Array.isArray(configuration.columns)
    ? configuration.columns.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const batchSize = positiveInt(request?.batchSize, 100);
  const cursor = positiveInt(request?.cursor, 0);

  const headers = {};
  if (cursor > 0) headers.Range = `bytes=${cursor}-`;
  const response = await fetch(uri, { method: 'GET', headers });
  if (response.status !== 200 && response.status !== 206) {
    throw new Error(`artifact GET failed: HTTP ${response.status}`);
  }
  if (!response.body) {
    throw new Error('artifact GET did not return a response body');
  }

  const records = [];
  let bytesRead = 0;
  let lineBytes = [];
  let endedAtEof = false;
  const streamReader = response.body.getReader();
  try {
    while (records.length < batchSize) {
      const { done, value } = await streamReader.read();
      if (done) {
        endedAtEof = true;
        if (lineBytes.length > 0) {
          addLine(records, lineBytes, delimiter, columns);
          lineBytes = [];
        }
        break;
      }
      for (const byte of value) {
        bytesRead++;
        if (byte === 10) {
          addLine(records, lineBytes, delimiter, columns);
          lineBytes = [];
          if (records.length >= batchSize) break;
        } else {
          lineBytes.push(byte);
        }
      }
    }
  } finally {
    await streamReader.cancel().catch(() => {});
  }

  const outputs = { records, skippedRows: [] };
  if (!endedAtEof && records.length > 0) {
    outputs.nextCursor = String(cursor + bytesRead);
  }
  return outputs;
}

function addLine(records, bytes, delimiter, columns) {
  let line = Buffer.from(bytes).toString('utf8');
  if (line.endsWith('\r')) line = line.slice(0, -1);
  if (line.trim().length === 0) return;
  const values = line.split(delimiter);
  const record = {};
  values.forEach((value, index) => {
    const key = columns[index] || `c${index + 1}`;
    record[key] = value.trim();
  });
  records.push(record);
}

function objectMap(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${field} must be an object`);
  }
  return value;
}

function required(value, message) {
  const text = value === undefined || value === null ? '' : String(value).trim();
  if (!text) throw new Error(message);
  return text;
}

function stringOrDefault(value, fallback) {
  const text = value === undefined || value === null ? '' : String(value).trim();
  return text || fallback;
}

function positiveInt(value, fallback) {
  const text = value === undefined || value === null ? '' : String(value).trim();
  if (!text) return fallback;
  return Math.max(0, Number.parseInt(text, 10));
}
