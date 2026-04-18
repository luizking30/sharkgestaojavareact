FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=build /app/target/assistencia-1.0.jar app.jar

EXPOSE 8080

# JAVA_OPTS vem do docker-compose (ex.: -Xms128m -Xmx256m). Shell expande a variável em runtime.
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
