# Use Maven image for building
FROM maven:3.8.6-openjdk-17 AS build

WORKDIR /app
COPY backend/pom.xml backend/pom.xml
COPY backend/src backend/src

# Build the application
RUN cd backend && mvn clean package -DskipTests

# Use OpenJDK for running
FROM openjdk:17-jdk-slim-bullseye AS runtime

WORKDIR /app
COPY --from=build /app/backend/target/product-review-backend-0.0.1-SNAPSHOT.jar app.jar

# Expose port
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "app.jar"]
