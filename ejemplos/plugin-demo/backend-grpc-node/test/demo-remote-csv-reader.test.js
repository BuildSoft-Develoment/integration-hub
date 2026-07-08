import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readRemoteCsv, READER_TYPE } from '../src/demo-remote-csv-reader.js';

test('reads remote csv pages using HTTP Range cursor', async () => {
  const csv = Buffer.from('ana,10\nluis,20\nzoe,30', 'utf8');
  const server = createServer((req, res) => {
    const range = req.headers.range || '';
    const start = range.startsWith('bytes=') ? Number.parseInt(range.slice(6), 10) : 0;
    const safeStart = Number.isFinite(start) && start > 0 ? start : 0;
    const body = csv.subarray(safeStart);
    res.writeHead(safeStart > 0 ? 206 : 200, {
      'content-type': 'text/csv',
      'content-length': body.length,
    });
    res.end(body);
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const { port } = server.address();
    const baseRequest = {
      artifactRef: { uri: `http://127.0.0.1:${port}/data.csv`, method: 'GET' },
      configuration: { columns: ['name', 'amount'] },
    };

    const first = await readRemoteCsv({ ...baseRequest, batchSize: 2 });
    assert.deepEqual(first.records, [
      { name: 'ana', amount: '10' },
      { name: 'luis', amount: '20' },
    ]);
    assert.equal(first.nextCursor, '15');

    const second = await readRemoteCsv({ ...baseRequest, batchSize: 2, cursor: first.nextCursor });
    assert.deepEqual(second.records, [{ name: 'zoe', amount: '30' }]);
    assert.equal(second.nextCursor, undefined);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('rejects non GET artifact refs', async () => {
  await assert.rejects(
    () => readRemoteCsv({ artifactRef: { uri: 'http://localhost/data.csv', method: 'POST' } }),
    new RegExp(`${READER_TYPE} requires artifactRef.method=GET`),
  );
});
