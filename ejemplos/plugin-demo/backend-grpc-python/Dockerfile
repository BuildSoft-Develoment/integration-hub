# Plugin gRPC DEMO_TRANSFORM_PY — independiente del monorepo.
FROM python:3.12-slim
WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY proto ./proto
COPY src ./src

# Genera los stubs a partir del .proto copiado (sin depender de nada del monorepo).
RUN python -m grpc_tools.protoc \
      -I proto \
      --python_out=src \
      --grpc_python_out=src \
      proto/remote_plugin.proto

ENV PLUGIN_GRPC_PORT=50063
EXPOSE 50063
WORKDIR /app/src
CMD ["python", "server.py"]
