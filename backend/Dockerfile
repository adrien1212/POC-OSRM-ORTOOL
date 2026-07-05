# Étape 1 : Compilation
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Étape 2 : Déploiement
FROM eclipse-temurin:25-jre
COPY --from=build /app/target/*.jar /app/app.jar
CMD ["java", "-jar", "/app/app.jar"]
