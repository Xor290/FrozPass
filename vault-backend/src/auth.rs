use actix_web::{web, HttpResponse, HttpRequest};
use sqlx::SqlitePool;
use uuid::Uuid;
use bcrypt::{hash, verify, DEFAULT_COST};
use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey};
use chrono::{Utc, Duration};
use crate::models::{Claims, ErrorResponse, User, RegisterRequest, LoginRequest, LoginResponse};

const JWT_SECRET: &[u8] = b"your-secret-key-change-in-production";
const JWT_EXPIRATION_HOURS: i64 = 24;

/// Créer un nouvel utilisateur (Register)
pub async fn register(
    pool: web::Data<SqlitePool>,
    credentials: web::Json<RegisterRequest>,
) -> HttpResponse {
    // Valider les entrées
    if let Err(response) = validate_credentials(&credentials.username, &credentials.password) {
        return response;
    }

    // Vérifier si l'utilisateur existe déjà
    let existing_user = sqlx::query_as::<_, User>(
        "SELECT id, username, password_hash, created_at FROM users WHERE username = ?"
    )
    .bind(&credentials.username)
    .fetch_optional(pool.get_ref())
    .await;

    match existing_user {
        Ok(Some(_)) => {
            return HttpResponse::Conflict().json(ErrorResponse {
                error: "Username already registered".to_string(),
            });
        }
        Ok(None) => {}
        Err(e) => {
            log::error!("Database error during registration check: {}", e);
            return HttpResponse::InternalServerError().json(ErrorResponse {
                error: "Database error".to_string(),
            });
        }
    }

    // Hasher le mot de passe avec Bcrypt
    let password_hash = match hash(&credentials.password, DEFAULT_COST) {
        Ok(h) => h,
        Err(e) => {
            log::error!("Failed to hash password: {}", e);
            return HttpResponse::InternalServerError().json(ErrorResponse {
                error: "Failed to process password".to_string(),
            });
        }
    };

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    // Insérer l'utilisateur
    match sqlx::query(
        "INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&credentials.username)
    .bind(&password_hash)
    .bind(&now)
    .execute(pool.get_ref())
    .await
    {
        Ok(_) => {
            let token = generate_jwt(&id, &credentials.username);
            let expires_at = (Utc::now() + Duration::hours(JWT_EXPIRATION_HOURS)).to_rfc3339();
            
            HttpResponse::Created().json(LoginResponse {
                id,
                username: credentials.username.to_string(),
                token,
                expires_at,
            })
        }
        Err(e) => {
            log::error!("Failed to create user: {}", e);
            HttpResponse::InternalServerError().json(ErrorResponse {
                error: "Failed to register user".to_string(),
            })
        }
    }
}

/// Connexion utilisateur (Login)
pub async fn login(
    pool: web::Data<SqlitePool>,
    credentials: web::Json<LoginRequest>,
) -> HttpResponse {
    // Valider les entrées
    if let Err(response) = validate_credentials(&credentials.username, &credentials.password) {
        return response;
    }

    // Récupérer l'utilisateur
    let user = match sqlx::query_as::<_, User>(
        "SELECT id, username, password_hash, created_at FROM users WHERE username = ?"
    )
    .bind(&credentials.username)
    .fetch_optional(pool.get_ref())
    .await
    {
        Ok(Some(user)) => user,
        Ok(None) => {
            return HttpResponse::Unauthorized().json(ErrorResponse {
                error: "Invalid username or password".to_string(),
            });
        }
        Err(e) => {
            log::error!("Database error during login: {}", e);
            return HttpResponse::InternalServerError().json(ErrorResponse {
                error: "Database error".to_string(),
            });
        }
    };

    // Vérifier le mot de passe
    match verify(&credentials.password, &user.password_hash) {
        Ok(true) => {
            let token = generate_jwt(&user.id, &user.username);
            let expires_at = (Utc::now() + Duration::hours(JWT_EXPIRATION_HOURS)).to_rfc3339();
            
            HttpResponse::Ok().json(LoginResponse {
                id: user.id,
                username: user.username,
                token,
                expires_at,
            })
        }
        Ok(false) => {
            HttpResponse::Unauthorized().json(ErrorResponse {
                error: "Invalid username or password".to_string(),
            })
        }
        Err(e) => {
            log::error!("Failed to verify password: {}", e);
            HttpResponse::InternalServerError().json(ErrorResponse {
                error: "Authentication error".to_string(),
            })
        }
    }
}

/// Vérifier l'authentification
pub async fn verify_token(req: HttpRequest) -> HttpResponse {
    match extract_token_from_header(&req) {
        Ok(token) => match verify_jwt(&token) {
            Ok(claims) => HttpResponse::Ok().json(serde_json::json!({
                "valid": true,
                "user_id": claims.sub,
                "username": claims.username,
            })),
            Err(_) => HttpResponse::Unauthorized().json(ErrorResponse {
                error: "Invalid or expired token".to_string(),
            }),
        },
        Err(response) => response,
    }
}

// ============= Fonctions Utilitaires =============

/// Générer un JWT token
fn generate_jwt(user_id: &str, username: &str) -> String {
    let now = Utc::now();
    let exp = (now + Duration::hours(JWT_EXPIRATION_HOURS)).timestamp();

    let claims = Claims {
        sub: user_id.to_string(),
        username: username.to_string(),
        exp,
        iat: now.timestamp(),
    };

    match encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(JWT_SECRET),
    ) {
        Ok(token) => token,
        Err(e) => {
            log::error!("Failed to encode JWT: {}", e);
            String::new()
        }
    }
}

/// Vérifier et décoder un JWT token
pub fn verify_jwt(token: &str) -> Result<Claims, String> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(JWT_SECRET),
        &Validation::default(),
    )
    .map(|data| data.claims)
    .map_err(|e| format!("Token verification failed: {}", e))
}

/// Extraire le token du header Authorization
pub fn extract_token_from_header(req: &HttpRequest) -> Result<String, HttpResponse> {
    match req.headers().get("Authorization") {
        Some(auth_header) => {
            match auth_header.to_str() {
                Ok(auth_str) => {
                    if auth_str.starts_with("Bearer ") {
                        Ok(auth_str[7..].to_string())
                    } else {
                        Err(HttpResponse::BadRequest().json(ErrorResponse {
                            error: "Invalid authorization header format".to_string(),
                        }))
                    }
                }
                Err(_) => Err(HttpResponse::BadRequest().json(ErrorResponse {
                    error: "Invalid authorization header".to_string(),
                })),
            }
        }
        None => Err(HttpResponse::Unauthorized().json(ErrorResponse {
            error: "Missing authorization header".to_string(),
        })),
    }
}

/// Valider les credentials
fn validate_credentials(username: &str, password: &str) -> Result<(), HttpResponse> {
    if username.is_empty() {
        return Err(HttpResponse::BadRequest().json(ErrorResponse {
            error: "Username is required".to_string(),
        }));
    }

    if password.is_empty() {
        return Err(HttpResponse::BadRequest().json(ErrorResponse {
            error: "Password is required".to_string(),
        }));
    }

    if password.len() < 8 {
        return Err(HttpResponse::BadRequest().json(ErrorResponse {
            error: "Password must be at least 8 characters".to_string(),
        }));
    }

    Ok(())
}