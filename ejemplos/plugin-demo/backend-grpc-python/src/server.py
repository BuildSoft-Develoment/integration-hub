"""Servidor gRPC del plugin DEMO_TRANSFORM_PY.

Los stubs (remote_plugin_pb2*.py) se generan con grpc_tools.protoc en el Dockerfile
(o con `python -m grpc_tools.protoc ...`, ver README). Responsabilidad: transporte
gRPC <-> logica pura de transform.py.
"""
import json
import logging
import os
from concurrent import futures

import grpc

import remote_plugin_pb2 as pb
import remote_plugin_pb2_grpc as pb_grpc
from transform import transform

logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger("demo-transform-py")

SUPPORTED_TASK_TYPES = {"DEMO_TRANSFORM_PY"}


class RemotePluginService(pb_grpc.RemotePluginServiceServicer):
    def Execute(self, request, context):
        LOG.info(
            "Execute task_type=%s plugin=%s/%s execId=%s",
            request.task_type, request.plugin_id, request.plugin_version, request.process_execution_id,
        )

        if request.task_type not in SUPPORTED_TASK_TYPES:
            context.abort(
                grpc.StatusCode.INVALID_ARGUMENT,
                f"Unsupported task_type '{request.task_type}'; this plugin serves {SUPPORTED_TASK_TYPES}",
            )

        try:
            configuration = _parse_json(request.configuration_json)
        except ValueError as err:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, f"configuration_json is not valid JSON: {err}")

        outcome = transform(configuration)
        return pb.GrpcRemoteTaskResult(
            success=outcome["success"],
            suspended=False,
            details=outcome["details"],
            outputs_json=json.dumps(outcome.get("outputs", {})),
            suspended_state_json="",
        )


def _parse_json(raw):
    if not raw or raw.strip() == "":
        return {}
    return json.loads(raw)


def serve():
    port = os.environ.get("PLUGIN_GRPC_PORT", "50063")
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    pb_grpc.add_RemotePluginServiceServicer_to_server(RemotePluginService(), server)
    server.add_insecure_port(f"0.0.0.0:{port}")
    server.start()
    LOG.info("DEMO_TRANSFORM_PY gRPC plugin listening on port %s", port)
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
