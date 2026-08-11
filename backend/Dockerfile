# Stage 1: Build the Spring Boot application using Maven with Java 17
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder
WORKDIR /app

# Copy pom.xml and resolve dependencies first to optimize Docker layer caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy application source code and compile production JAR
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Production Runtime Environment using lightweight OpenJDK 17 JRE
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create unprivileged system group and user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy compiled JAR artifact from build stage
COPY --from=builder /app/target/*.jar app.jar

# Set file permissions for the app user
RUN chown appuser:appgroup app.jar

# Switch to non-root user
USER appuser

# Expose default port (Render dynamically overrides PORT via environment variable)
EXPOSE 8085

# Execute Spring Boot application with non-blocking entropy source
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
