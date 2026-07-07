# --- build stage ---
# Imagen estandar de Maven: el plugin se construye SIN el monorepo (no hay parent pom,
# no se necesita ./mvnw de la plataforma). protobuf-maven-plugin descarga protoc.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
# Cachea dependencias antes de copiar el codigo para builds incrementales rapidos.
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B package

# --- run stage ---
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/target/backend-grpc-java-1.0.0.jar app.jar
ENV PLUGIN_GRPC_PORT=50061
EXPOSE 50061
ENTRYPOINT ["java", "-jar", "app.jar"]
