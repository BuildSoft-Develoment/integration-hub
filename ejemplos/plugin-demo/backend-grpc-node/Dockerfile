# Plugin gRPC DEMO_TRANSFORM_NODE — independiente del monorepo.
FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY proto ./proto
COPY src ./src
ENV PLUGIN_GRPC_PORT=50062
EXPOSE 50062
CMD ["node", "src/server.js"]
