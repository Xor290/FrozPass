FROM rustlang/rust:nightly-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    libssl-dev \
    libsqlite3-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/vault-backend

COPY Cargo.toml Cargo.lock ./

RUN mkdir src && echo 'fn main() {}' > src/main.rs
RUN cargo +nightly build --release || true
RUN rm -rf src

COPY . .

RUN cargo +nightly build --release

FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    libsqlite3-0 \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m appuser
WORKDIR /home/appuser

COPY --from=builder /usr/src/vault-backend/target/release/vault-backend /usr/local/bin/vault-backend

COPY data /home/appuser/data

RUN chown -R appuser:appuser /home/appuser

USER appuser

EXPOSE 8000

ENV RUST_LOG=info \
    DATABASE_URL="sqlite:/home/appuser/data/vault.db?mode=rwc" \
    BIND_ADDR="0.0.0.0:8000"

CMD ["/usr/local/bin/vault-backend"]
