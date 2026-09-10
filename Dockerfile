# Stage 1: Build stage
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# Copy pom.xml and download dependencies (for caching layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build the application executable JAR
COPY src ./src
RUN mvn package -DskipTests -B

# Stage 2: Runtime stage
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create a non-root user for enhanced security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built artifact from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Set ownership to appuser
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

# Configure JVM memory limits and GC settings
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
