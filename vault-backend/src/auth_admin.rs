use actix_web::{web, HttpResponse, HttpRequest};
use sqlx::SqlitePool;
use uuid::Uuid;
use bcrypt::{hash, verify, DEFAULT_COST};
use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey};
use chrono::{Utc, Duration};
use serde::{Deserialize, Serialize};
use crate::models::{Admin, ClaimsAdmin, ErrorResponse, LoginRequestAdmin, LoginResponseAdmin, RegisterRequestAdmin};

const JWT_SECRET: &[u8] = b"your-secret-key-change-in-production";
const JWT_EXPIRATION_HOURS: i64 = 24;

pub async fn register_admin(
    pool: web::Data<SqlitePool>,
    credentials: web::Json<RegisterRequestAdmin>,
) -> HttpResponse {
    if let Err(response) = validate_credentials(&credentials.admin_username, &credentials.admin_password) {
        return response;
    }

    let existing_admin = sqlx::query_as::<_, Admin>(
        "SELECT id, admin_username, admin_password_hash, role, created_at FROM admin WHERE admin_username = ?"
    )
    .bind(&credentials.admin_username)
    .fetch_optional(pool.get_ref())
    .await;

    match existing_admin {
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

    let admin_password_hash = match hash(&credentials.admin_password, DEFAULT_COST) {
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
    let role = "admin";

    match sqlx::query(
        "INSERT INTO admin (id, admin_username, admin_password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&credentials.admin_username)
    .bind(&admin_password_hash)
    .bind(role)
    .bind(&now)
    .execute(pool.get_ref())
    .await
    {
        Ok(_) => {
            let admin_token = generate_jwt(&id, &credentials.admin_username, role);
            let expires_at = (Utc::now() + Duration::hours(JWT_EXPIRATION_HOURS)).to_rfc3339();

            HttpResponse::Created().json(LoginResponseAdmin {
                id,
                admin_username: credentials.admin_username.to_string(),
                admin_token,
                role: "admin".to_string(),
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

pub async fn login_admin(
    pool: web::Data<SqlitePool>,
    credentials: web::Json<LoginRequestAdmin>,
) -> HttpResponse {
    if let Err(response) = validate_credentials(&credentials.admin_username, &credentials.admin_password) {
        return response;
    }

    let admin = match sqlx::query_as::<_, Admin>(
        "SELECT id, admin_username, admin_password_hash, role, created_at FROM admin WHERE admin_username = ?"
    )
    .bind(&credentials.admin_username)
    .fetch_optional(pool.get_ref())
    .await
    {
        Ok(Some(admin)) => admin,
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

    match verify(&credentials.admin_password, &admin.admin_password_hash) {
        Ok(true) => {
            let admin_token = generate_jwt(&admin.id, &admin.admin_username, &admin.role);
            let expires_at = (Utc::now() + Duration::hours(JWT_EXPIRATION_HOURS)).to_rfc3339();
            
            HttpResponse::Ok().json(LoginResponseAdmin {
                id: admin.id,
                admin_username: admin.admin_username,
                admin_token,
                role: "admin".to_string(),
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

pub async fn verify_token_admin(req: HttpRequest) -> HttpResponse {
    match extract_token_from_header_admin(&req) {
        Ok(admin_token) => match verify_jwt_admin(&admin_token) {
            Ok(claims) => HttpResponse::Ok().json(serde_json::json!({
                "valid": true,
                "user_id": claims.sub,
                "admin_username": claims.admin_username,
                "role": claims.role,
            })),
            Err(_) => HttpResponse::Unauthorized().json(ErrorResponse {
                error: "Invalid or expired token".to_string(),
            }),
        },
        Err(response) => response,
    }
}

fn validate_credentials(admin_username: &str, admin_password: &str) -> Result<(), HttpResponse> {
    if admin_username.is_empty() {
        return Err(HttpResponse::BadRequest().json(ErrorResponse {
            error: "Username is required".to_string(),
        }));
    }

    if admin_password.is_empty() {
        return Err(HttpResponse::BadRequest().json(ErrorResponse {
            error: "Password is required".to_string(),
        }));
    }

    if admin_password.len() < 8 {
        return Err(HttpResponse::BadRequest().json(ErrorResponse {
            error: "Password must be at least 8 characters".to_string(),
        }));
    }

    Ok(())
}

fn generate_jwt(id: &str, admin_username: &str, role: &str) -> String {
    let now = Utc::now();
    let iat = now.timestamp();
    let expiration = now
        .checked_add_signed(Duration::hours(JWT_EXPIRATION_HOURS))
        .expect("valid timestamp")
        .timestamp();

    let claims_admin = ClaimsAdmin {
        sub: id.to_string(),
        admin_username: admin_username.to_string(),
        exp: expiration as i64,
        role: role.to_string(),
        iat: iat as i64,
    };

    encode(
        &Header::default(),
        &claims_admin,
        &EncodingKey::from_secret(JWT_SECRET),
    )
    .expect("Failed to generate token")
}

pub fn verify_jwt_admin(token: &str) -> Result<ClaimsAdmin, jsonwebtoken::errors::Error> {
    let validation = Validation::default();
    let token_data = decode::<ClaimsAdmin>(
        token,
        &DecodingKey::from_secret(JWT_SECRET),
        &validation,
    )?;
    Ok(token_data.claims)
}

pub fn extract_token_from_header_admin(req: &HttpRequest) -> Result<String, HttpResponse> {
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok());

    match auth_header {
        Some(header) if header.starts_with("Bearer ") => {
            Ok(header[7..].to_string())
        }
        _ => Err(HttpResponse::Unauthorized().json(ErrorResponse {
            error: "Missing or invalid Authorization header".to_string(),
        })),
    }
}