# ────────────────
# 1️⃣ Étape : Build (nightly)
# ────────────────
FROM rustlang/rust:nightly-slim AS builder

# Installer dépendances nécessaires pour compiler Rust + SQLite + OpenSSL
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    libssl-dev \
    libsqlite3-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/vault-backend

# Copier Cargo.toml et Cargo.lock pour cache des dépendances
COPY Cargo.toml Cargo.lock ./

# Étape de cache (pour accélérer les rebuilds)
RUN mkdir src && echo 'fn main() {}' > src/main.rs
RUN cargo +nightly build --release || true
RUN rm -rf src

# Copier le code complet
COPY . .

# Compiler le projet en release avec nightly
RUN cargo +nightly build --release

# ────────────────
# 2️⃣ Étape : Runtime
# ────────────────
FROM debian:bookworm-slim AS runtime

# Installer librairies runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    libsqlite3-0 \
    && rm -rf /var/lib/apt/lists/*

# Créer utilisateur non-root
RUN useradd -m appuser
WORKDIR /home/appuser

# Copier le binaire depuis le builder
COPY --from=builder /usr/src/vault-backend/target/release/vault-backend /usr/local/bin/vault-backend

# Copier le dossier data si nécessaire
COPY data /home/appuser/data

# Donner les droits
RUN chown -R appuser:appuser /home/appuser

USER appuser

# Expose le port du serveur
EXPOSE 8000

# Variables d'environnement par défaut
ENV RUST_LOG=info \
    DATABASE_URL="sqlite:/home/appuser/data/vault.db?mode=rwc" \
    BIND_ADDR="0.0.0.0:8000"

# Commande de démarrage
CMD ["/usr/local/bin/vault-backend"]
