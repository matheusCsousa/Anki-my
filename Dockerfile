FROM node:22-bookworm-slim AS frontend
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM rust:1-bookworm AS backend
WORKDIR /build/backend
COPY backend/ ./
RUN cargo build --release --locked

FROM debian:bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/* && useradd --system --uid 10001 app
WORKDIR /app
COPY backend/Rocket.toml /app/Rocket.toml
COPY --from=backend /build/backend/target/release/backend /app/backend
COPY --from=frontend /build/frontend/dist /app/frontend
ENV ROCKET_ADDRESS=0.0.0.0 FRONTEND_DIST=/app/frontend
USER app
EXPOSE 8000
CMD ["/app/backend"]
