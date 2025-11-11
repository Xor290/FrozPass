use actix_web::{web, HttpResponse, HttpRequest, HttpMessage};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use crate::models::{
    Claims, ErrorResponse, AddApiKeyRequest, UsernameRequest, AccountInGroupResponse, ApiKeyInGroupResponse, RequestGetAccountInGroups,
    AddAccountRequest, DeleteRequest, AccountResponse, ApiKeyResponse, MeResponse, AddApiKeyInGroup, AddAccountInGroup, RequestGetApiKeyInGroups
};
use crate::db;
use crate::crypto::CryptoService;

// ==================== ACCOUNTS ====================

/// Récupère tous les comptes d'un utilisateur (avec mot de passe déchiffré)
pub async fn get_account(
    _req: HttpRequest,
    pool: web::Data<SqlitePool>,
    body: web::Json<UsernameRequest>,
    crypto: web::Data<CryptoService>,
) -> HttpResponse {
    let username = &body.username;

    match db::get_account_by_username(pool.get_ref(), username, crypto.get_ref()).await {
        Ok(accounts) if !accounts.is_empty() => {
            log::info!("User {} retrieved {} account(s)", username, accounts.len());
            HttpResponse::Ok().json(accounts)
        }
        Ok(_) => {
            log::warn!("No account found for user: {}", username);
            HttpResponse::NotFound().json(ErrorResponse {
                error: "No account found for this user".into(),
            })
        }
        Err(e) => {
            log::error!("Failed to retrieve account for {}: {}", username, e);
            HttpResponse::InternalServerError().json(ErrorResponse {
                error: "Failed to retrieve account".into(),
            })
        }
    }
}

/// Ajoute un nouveau compte (chiffre le mot de passe)
pub async fn add_account(
    _req: HttpRequest,
    pool: web::Data<SqlitePool>,
    body: web::Json<AddAccountRequest>,
    crypto: web::Data<CryptoService>,
) -> HttpResponse {
    // Validation des champs
    if body.username.trim().is_empty() {
        return HttpResponse::BadRequest().json(ErrorResponse {
            error: "Username cannot be empty".into(),
        });
    }
    if body.title.trim().is_empty() {
        return HttpResponse::BadRequest().json(ErrorResponse {
            error: "Title cannot be empty".into(),
        });
    }
    if body.user_account.trim().is_empty() {
        return HttpResponse::BadRequest().json(ErrorResponse {
            error: "User account cannot be empty".into(),
        });
    }
    if body.password_account.trim().is_empty() {
        return HttpResponse::BadRequest().json(ErrorResponse {
            error: "Password cannot be empty".into(),
        });
    }

    match db::insert_account(
        pool.get_ref(),
        &body.user_account,
        &body.password_account,
        &body.title,
        &body.url,
        &body.username,
        crypto.get_ref()
    ).await {
        Ok((id, created_at)) => {
            log::info!("Account '{}' added by user {}: {}", body.title, body.username, id);
            HttpResponse::Created().json(AccountResponse {
                id,
                created_at,
                message: "Account stored successfully".into(),
            })
        }
        Err(e) => {
            // Gestion des erreurs spécifiques
            let error_msg = e.to_string();
            if error_msg.contains("UNIQUE constraint failed") {
                log::warn!("Duplicate account title '{}' for user {}", body.title, body.username);
                return HttpResponse::Conflict().json(ErrorResponse {
                    error: format!("An account with title '{}' already exists", body.title),
                });
            }
            
            log::error!("Failed to add account for {}: {}", body.username, e);
            HttpResponse::InternalServerError().json(ErrorResponse {
                error: "Failed to store account".into(),
            })
        }
    }
}

/// Supprime un compte par son ID
pub async fn delete_account(
    _req: HttpRequest,
    pool: web::Data<SqlitePool>,
    body: web::Json<DeleteRequest>,
) -> HttpResponse {
    if body.id.trim().is_empty() {
        return HttpResponse::BadRequest().json(ErrorResponse {
            error: "Account ID cannot be empty".into(),
        });
    }

    match db::delete_account_by_title(pool.get_ref(), &body.id).await {
        Ok(message) => {
            if message.starts_with("0") {
                log::warn!("Account not found for deletion: {}", body.id);
                return HttpResponse::NotFound().json(ErrorResponse {
                    error: "Account not found".into(),
                });
            }
            log::info!("Account {} deleted successfully", body.id);
            HttpResponse::Ok().json(serde_json::json!({
                "message": "Account deleted successfully",
                "id": body.id,
                "details": message
            }))
        }
        Err(e) => {
            log::error!("Failed to delete account {}: {}", body.id, e);
            HttpResponse::InternalServerError().json(ErrorResponse {
                error: "Failed to delete account".into(),
            })
        }
    }
}

// ==================== API KEYS ====================

/// Récupère toutes les clés API d'un utilisateur (déchiffrées)
pub async fn get_api_key(
    _req: HttpRequest,
    pool: web::Data<SqlitePool>,
    body: web::Json<UsernameRequest>,
    crypto: web::Data<CryptoService>,
) -> HttpResponse {
    let username = &body.username;

    match db::get_api_key_by_username(pool.get_ref(), username, crypto.get_ref()).await {
        Ok(api_keys) if !api_keys.is_empty() => {
            log::info!("User {} retrieved {} API key(s)", username, api_keys.len());
            HttpResponse::Ok().json(api_keys)
        }
        Ok(_) => {
            log::warn!("No API key found for user: {}", username);
            HttpResponse::NotFound().json(ErrorResponse {
                error: "No API key found for this user".into(),
            })
        }
        Err(e) => {
            log::error!("Failed to retrieve API key for {}: {}", username, e);
            HttpResponse::InternalServerError().json(ErrorResponse {
                error: "Failed to retrieve API key".into(),
            })
        }
    }
}

/// Ajoute une nouvelle clé API (chiffrée)
pub async fn add_api_key(
    _req: HttpRequest,
    pool: web::Data<SqlitePool>,
    body: web::Json<AddApiKeyRequest>,
    crypto: web::Data<CryptoService>,
) -> HttpResponse {
    // Validation des champs
    if body.username.trim().is_empty() {
        return HttpResponse::BadRequest().json(ErrorResponse {
            error: "Username cannot be empty".into(),
        });
    }
    if body.title.trim().is_empty() {
        return HttpResponse::BadRequest().json(ErrorResponse {
            error: "Title cannot be empty".into(),
        });
    }
    if body.api_key.trim().is_empty() {
        return HttpResponse::BadRequest().json(ErrorResponse {
            error: "API key cannot be empty".into(),
        });
    }

    match db::insert_api_key(
        pool.get_ref(), 
        &body.api_key, 
        &body.title, 
        &body.username,
        crypto.get_ref()
    ).await {
        Ok((id, created_at)) => {
            log::info!("API key '{}' added by user {}: {}", body.title, body.username, id);
            HttpResponse::Created().json(ApiKeyResponse {
                id,
                created_at,
                message: "API key stored successfully".into(),
            })
        }
        Err(e) => {
            // Gestion des erreurs spécifiques
            let error_msg = e.to_string();
            if error_msg.contains("UNIQUE constraint failed") {
                log::warn!("Duplicate API key title '{}' for user {}", body.title, body.username);
                return HttpResponse::Conflict().json(ErrorResponse {
                    error: format!("An API key with title '{}' already exists", body.title),
                });
            }

            log::error!("Failed to add API key for {}: {}", body.username, e);
            HttpResponse::InternalServerError().json(ErrorResponse {
                error: "Failed to store API key".into(),
            })
        }
    }
}

/// Supprime une clé API par son ID
pub async fn delete_api_key(
    _req: HttpRequest,
    pool: web::Data<SqlitePool>,
    body: web::Json<DeleteRequest>,
) -> HttpResponse {
    if body.id.trim().is_empty() {
        return HttpResponse::BadRequest().json(ErrorResponse {
            error: "API key ID cannot be empty".into(),
        });
    }

    match db::delete_api_key_by_title(pool.get_ref(), &body.id).await {
        Ok(message) => {
            if message.starts_with("0") {
                log::warn!("API key not found for deletion: {}", body.id);
                return HttpResponse::NotFound().json(ErrorResponse {
                    error: "API key not found".into(),
                });
            }
            log::info!("API key {} deleted successfully", body.id);
            HttpResponse::Ok().json(serde_json::json!({
                "message": "API key deleted successfully",
                "id": body.id,
                "details": message
            }))
        }
        Err(e) => {
            log::error!("Failed to delete API key {}: {}", body.id, e);
            HttpResponse::InternalServerError().json(ErrorResponse {
                error: "Failed to delete API key".into(),
            })
        }
    }
}

// ==================== USER INFO ====================

/// Récupère les informations de l'utilisateur connecté
pub async fn get_me(req: HttpRequest) -> HttpResponse {
    let extensions = req.extensions();

    let claims = match extensions.get::<Claims>() {
        Some(c) => c,
        None => {
            log::warn!("Unauthorized access attempt to /me endpoint");
            return HttpResponse::Unauthorized().json(ErrorResponse {
                error: "Missing or invalid authentication".into(),
            });
        }
    };

    log::debug!("User {} accessed /me endpoint", claims.username);
    
    let me = MeResponse {
        username: claims.username.clone(),
    };

    HttpResponse::Ok().json(me)
}

/// Récupère les groupes d'un utilisateur
pub async fn get_groups_by_name(
    req: HttpRequest,
    pool: web::Data<SqlitePool>,
    body: web::Json<UsernameRequest>,  // ✅ CHANGÉ: UsernameRequest au lieu de DeleteGroups
) -> HttpResponse {
    let extensions = req.extensions();

    let claims = match extensions.get::<Claims>() {
        Some(c) => c,
        None => {
            log::warn!("Unauthorized access attempt to /get_groups_by_name endpoint");
            return HttpResponse::Unauthorized().json(ErrorResponse {
                error: "Missing or invalid authentication".into(),
            });
        }
    };

    let username = &body.username;
    
    if username.trim().is_empty() {
        return HttpResponse::BadRequest().json(ErrorResponse {
            error: "Username cannot be empty".into(),
        });
    }

    log::debug!("User {} requesting their groups", claims.username);

    match db::get_groups_by_username(pool.get_ref(), username).await {  // ✅ Nouvelle fonction
        Ok(groups) if !groups.is_empty() => {
            log::info!("User '{}' has {} group(s)", username, groups.len());
            HttpResponse::Ok().json(groups)
        }
        Ok(_) => {
            log::warn!("No groups found for user: {}", username);
            HttpResponse::NotFound().json(ErrorResponse {
                error: "No groups found for this user".into(),
            })
        }
        Err(e) => {
            log::error!("Failed to retrieve groups for {}: {}", username, e);
            HttpResponse::InternalServerError().json(ErrorResponse {
                error: "Failed to retrieve groups".into(),
            })
        }
    }
}

// ==================== HEALTH CHECK ====================

/// Endpoint de santé pour vérifier que l'API fonctionne
pub async fn health_check() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "service": "password-manager-api",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}


/// Ajoute un compte dans un groupe (chiffré)
pub async fn add_account_in_group(
    _req: HttpRequest,
    pool: web::Data<SqlitePool>,
    body: web::Json<AddAccountInGroup>,
    crypto: web::Data<CryptoService>,
) -> HttpResponse {
    // Validation des champs
    if body.group_name.trim().is_empty() {
        return HttpResponse::BadRequest().json(ErrorResponse {
            error: "Group name cannot be empty".into(),
        });
    }
    if body.title.trim().is_empty() {
        return HttpResponse::BadRequest().json(ErrorResponse {
            error: "Title cannot be empty".into(),
        });
    }
    if body.user_account.trim().is_empty() {
        return HttpResponse::BadRequest().json(ErrorResponse {
            error: "User account cannot be empty".into(),
        });
    }
    if body.password_account.trim().is_empty() {
        return HttpResponse::BadRequest().json(ErrorResponse {
            error: "Password cannot be empty".into(),
        });
    }

    match db::insert_account_in_group(
        pool.get_ref(),
        &body.user_account,
        &body.password_account,
        &body.title,
        &body.url,
        &body.group_name,
        crypto.get_ref()
    ).await {
        Ok((id, created_at)) => {
            log::info!("Account '{}' added to group '{}': {}", body.title, body.group_name, id);
            HttpResponse::Created().json(AccountInGroupResponse {
                id,
                created_at,
                group_name: body.group_name.clone(),
                message: "Account added to group successfully".into(),
            })
        }
        Err(e) => {
            let error_msg = e.to_string();
            if error_msg.contains("UNIQUE constraint failed") {
                log::warn!("Duplicate account title '{}' in group '{}'", body.title, body.group_name);
                return HttpResponse::Conflict().json(ErrorResponse {
                    error: format!("An account with title '{}' already exists in this group", body.title),
                });
            }
            
            log::error!("Failed to add account to group '{}': {}", body.group_name, e);
            HttpResponse::InternalServerError().json(ErrorResponse {
                error: "Failed to add account to group".into(),
            })
        }
    }
}

/// Ajoute une clé API dans un groupe (chiffrée)
pub async fn add_api_key_in_group(
    _req: HttpRequest,
    pool: web::Data<SqlitePool>,
    body: web::Json<AddApiKeyInGroup>,
    crypto: web::Data<CryptoService>,
) -> HttpResponse {
    // Validation des champs
    if body.group_name.trim().is_empty() {
        return HttpResponse::BadRequest().json(ErrorResponse {
            error: "Group name cannot be empty".into(),
        });
    }
    if body.title.trim().is_empty() {
        return HttpResponse::BadRequest().json(ErrorResponse {
            error: "Title cannot be empty".into(),
        });
    }
    if body.api_key.trim().is_empty() {
        return HttpResponse::BadRequest().json(ErrorResponse {
            error: "API key cannot be empty".into(),
        });
    }

    match db::insert_api_key_in_group(
        pool.get_ref(),
        &body.api_key,
        &body.title,
        &body.group_name,
        crypto.get_ref()
    ).await {
        Ok((id, created_at)) => {
            log::info!("API key '{}' added to group '{}': {}", body.title, body.group_name, id);
            HttpResponse::Created().json(ApiKeyInGroupResponse {
                id,
                created_at,
                group_name: body.group_name.clone(),
                message: "API key added to group successfully".into(),
            })
        }
        Err(e) => {
            let error_msg = e.to_string();
            if error_msg.contains("UNIQUE constraint failed") {
                log::warn!("Duplicate API key title '{}' in group '{}'", body.title, body.group_name);
                return HttpResponse::Conflict().json(ErrorResponse {
                    error: format!("An API key with title '{}' already exists in this group", body.title),
                });
            }

            log::error!("Failed to add API key to group '{}': {}", body.group_name, e);
            HttpResponse::InternalServerError().json(ErrorResponse {
                error: "Failed to add API key to group".into(),
            })
        }
    }
}

pub async fn get_account_in_group(
    _req: HttpRequest,
    pool: web::Data<SqlitePool>,
    body: web::Json<RequestGetAccountInGroups>,
    crypto: web::Data<CryptoService>,
) -> HttpResponse {
    let group_name = &body.group_name;
    if group_name.trim().is_empty() {
        return HttpResponse::BadRequest().json(ErrorResponse {
            error: "Group name cannot be empty".into(),
        });
    }

    match db::get_account_by_group_name(pool.get_ref(), group_name, crypto.get_ref()).await {
        Ok(accounts) if !accounts.is_empty() => {
            log::info!("Group '{}' retrieved {} account(s)", body.group_name, accounts.len());
            HttpResponse::Ok().json(accounts)
        }
        Ok(_) => {
            log::warn!("No accounts found for group: {}", body.group_name);
            HttpResponse::NotFound().json(ErrorResponse {
                error: "No accounts found for this group".into(),
            })
        }
        Err(e) => {
            log::error!("Failed to retrieve accounts for group '{}': {}", body.group_name, e);
            HttpResponse::InternalServerError().json(ErrorResponse {
                error: "Failed to retrieve accounts".into(),
            })
        }
    }
}

pub async fn get_api_key_in_group(
    _req: HttpRequest,
    pool: web::Data<SqlitePool>,
    body: web::Json<RequestGetApiKeyInGroups>,
    crypto: web::Data<CryptoService>,
) -> HttpResponse {
    let group_name = &body.group_name;
    if group_name.trim().is_empty() {
        return HttpResponse::BadRequest().json(ErrorResponse {
            error: "Group name cannot be empty".into(),
        });
    }
    match db::get_api_key_by_group_name(pool.get_ref(), group_name, crypto.get_ref()).await {
                Ok(accounts) if !accounts.is_empty() => {
            log::info!("Group '{}' retrieved {} account(s)", body.group_name, accounts.len());
            HttpResponse::Ok().json(accounts)
        }
        Ok(_) => {
            log::warn!("No accounts found for group: {}", body.group_name);
            HttpResponse::NotFound().json(ErrorResponse {
                error: "No accounts found for this group".into(),
            })
        }
        Err(e) => {
            log::error!("Failed to retrieve accounts for group '{}': {}", body.group_name, e);
            HttpResponse::InternalServerError().json(ErrorResponse {
                error: "Failed to retrieve accounts".into(),
            })
        }
    }
}
