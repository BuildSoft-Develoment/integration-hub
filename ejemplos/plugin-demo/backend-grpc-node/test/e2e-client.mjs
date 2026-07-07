// Cliente gRPC de verificacion: invoca Execute igual que la plataforma (RemotePluginService).
// Uso: node test/e2e-client.mjs <host:port> <taskType>
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROTO = join(__dirname, '..', 'proto', 'remote_plugin.proto');
const [target, taskType] = [process.argv[2], process.argv[3]];

const def = protoLoader.loadSync(PROTO, { keepCase: false, longs: String, enums: String, defaults: true, oneofs: true });
const proto = grpc.loadPackageDefinition(def).integrationhub.plugin.v1;
const client = new proto.RemotePluginService(target, grpc.credentials.createInsecure());

const request = {
  pluginId: 'demo-transform', pluginVersion: '1.0.0', spiVersion: '1.0.0',
  taskType, processExecutionId: 42, taskDefinitionId: 7,
  attributesJson: '{}', configurationJson: JSON.stringify({ text: 'hola mundo', op: 'upper' }),
};

client.Execute(request, (err, res) => {
  if (err) { console.error(`[FAIL] ${target} ${taskType}: ${err.message}`); process.exit(1); }
  const outputs = JSON.parse(res.outputsJson || '{}');
  const ok = res.success === true && outputs.result === 'HOLA MUNDO';
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${target} ${taskType} -> success=${res.success} result=${JSON.stringify(outputs.result)} engine=${outputs.engine} details="${res.details}"`);
  process.exit(ok ? 0 : 1);
});
