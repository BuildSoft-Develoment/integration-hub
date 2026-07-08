// Servidor gRPC del plugin DEMO_TRANSFORM_NODE. Carga el .proto de forma dinamica
// (proto-loader), no hay codegen. Responsabilidad: transporte gRPC <-> logica pura.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import { readRemoteCsv, READER_TASK_TYPE } from './demo-remote-csv-reader.js';
import { transform } from './transform.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROTO_PATH = join(__dirname, '..', 'proto', 'remote_plugin.proto');

const SUPPORTED_TASK_TYPES = new Set(['DEMO_TRANSFORM_NODE', READER_TASK_TYPE]);

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false, longs: String, enums: String, defaults: true, oneofs: true,
});
const proto = grpc.loadPackageDefinition(packageDef).integrationhub.plugin.v1;

function execute(call, callback) {
  const req = call.request;
  console.log(`Execute task_type=${req.taskType} plugin=${req.pluginId}/${req.pluginVersion} execId=${req.processExecutionId}`);

  if (!SUPPORTED_TASK_TYPES.has(req.taskType)) {
    callback({ code: grpc.status.INVALID_ARGUMENT,
      message: `Unsupported task_type '${req.taskType}'; this plugin serves ${[...SUPPORTED_TASK_TYPES]}` });
    return;
  }

  let configuration;
  try {
    configuration = parseJson(req.configurationJson);
  } catch (err) {
    callback({ code: grpc.status.INVALID_ARGUMENT, message: `configuration_json is not valid JSON: ${err.message}` });
    return;
  }

  if (req.taskType === READER_TASK_TYPE) {
    readRemoteCsv(configuration)
      .then((outputs) => callback(null, {
        success: true,
        suspended: false,
        details: `${READER_TASK_TYPE} page read`,
        outputsJson: JSON.stringify(outputs),
        suspendedStateJson: '',
      }))
      .catch((err) => callback(null, {
        success: false,
        suspended: false,
        details: err.message,
        outputsJson: '{}',
        suspendedStateJson: '',
      }));
    return;
  }

  const outcome = transform(configuration);
  callback(null, {
    success: outcome.success,
    suspended: false,
    details: outcome.details,
    outputsJson: JSON.stringify(outcome.outputs || {}),
    suspendedStateJson: '',
  });
}

function parseJson(json) {
  if (!json || json.trim().length === 0) return {};
  return JSON.parse(json);
}

function main() {
  const port = process.env.PLUGIN_GRPC_PORT || '50062';
  const server = new grpc.Server();
  server.addService(proto.RemotePluginService.service, { Execute: execute });
  server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err) => {
    if (err) { console.error(err); process.exit(1); }
    console.log(`DEMO_TRANSFORM_NODE gRPC plugin listening on port ${port}`);
  });
}

main();
