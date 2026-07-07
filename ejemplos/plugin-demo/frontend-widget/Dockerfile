# --- build stage ---
# El widget se construye SIN el monorepo: el UI kit se instala desde el tarball local
# vendorizado (vendor/*.tgz), no desde un registry publico ni desde el workspace Nx.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
COPY vendor ./vendor
RUN npm install --no-audit --no-fund
COPY angular.json tsconfig.json tsconfig.app.json federation.config.js ./
COPY src ./src
COPY public ./public
RUN npx ng build

# --- run stage ---
# nginx sirve el remote (remoteEntry.json + chunks) con CORS para la shell del host.
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/browser /usr/share/nginx/html
EXPOSE 80
