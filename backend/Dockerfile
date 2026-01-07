# Use official Maven image for build
FROM maven:3.9-openjdk-17 AS build

WORKDIR /app

# Copy pom.xml first for better caching
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Use OpenJDK for runtime
FROM openjdk:17-jdk-slim

WORKDIR /app

# Copy the built jar
COPY --from=build /app/target/product-review-backend-0.0.1-SNAPSHOT.jar app.jar

# Expose port (Render.com uses PORT env var)
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "app.jar"]
