use actix_web::{web, HttpResponse, HttpRequest, HttpMessage};
use sqlx::SqlitePool;
use crate::models::{ClaimsAdmin, ErrorResponse,CreateGroupRequest,AddUserGroups,DeleteGroups};
use crate::db;

pub async fn get_users(
    req: HttpRequest,
    pool: web::Data<SqlitePool>,
) -> HttpResponse {
    // ✅ Récupération sécurisée des claims depuis les extensions
    let extensions = req.extensions();
    let claims = match extensions.get::<ClaimsAdmin>() {
        Some(c) => c,
        None => {
            return HttpResponse::Unauthorized().json(ErrorResponse {
                error: "Unauthorized: no valid admin token found".into(),
            });
        }
    };

    println!("🔐 Admin connecté : {}", claims.admin_username);

    // ✅ Vérification du rôle (optionnelle mais recommandée)
    if claims.role != "admin" {
        return HttpResponse::Forbidden().json(ErrorResponse {
            error: "Access denied: insufficient permissions".into(),
        });
    }

    // ✅ Lecture en base
    match db::get_all_accounts(pool.get_ref()).await {
        Ok(accounts) if !accounts.is_empty() => HttpResponse::Ok().json(accounts),
        Ok(_) => HttpResponse::NotFound().json(ErrorResponse {
            error: "No accounts found".into(),
        }),
        Err(e) => {
            eprintln!("❌ Database error while fetching users: {:?}", e);
            HttpResponse::InternalServerError().json(ErrorResponse {
                error: "Failed to retrieve accounts".into(),
            })
        }
    }
}

pub async fn create_groups(
    req: HttpRequest,
    pool: web::Data<SqlitePool>,
    body: web::Json<CreateGroupRequest>,
) -> HttpResponse {
    // ✅ Vérifie le token admin
    let extensions = req.extensions();
    let claims = match extensions.get::<ClaimsAdmin>() {
        Some(c) => c,
        None => {
            return HttpResponse::Unauthorized().json(ErrorResponse {
                error: "Unauthorized: no valid admin token found".into(),
            });
        }
    };

    println!("🔐 Admin connecté : {}", claims.admin_username);

    // ✅ Appel direct à la fonction de service
    match db::create_group(pool.get_ref(), body.into_inner()).await {
        Ok(response) => HttpResponse::Ok().json(response),
        Err(err) => HttpResponse::BadRequest().json(err),
    }

}

pub async fn add_groups(
    req: HttpRequest,
    pool: web::Data<SqlitePool>,
    body: web::Json<AddUserGroups>,
) -> HttpResponse {
    let extensions = req.extensions();
    let claims = match extensions.get::<ClaimsAdmin>() {
        Some(c) => c,
        None => {
            return HttpResponse::Unauthorized().json(ErrorResponse {
                error: "Unauthorized: no valid admin token found".into(),
            });
        }
    };

    println!("🔐 Admin connecté : {}", claims.admin_username);

    match db::add_account(pool.get_ref(), body.into_inner()).await {
        Ok(message) => HttpResponse::Ok().json(serde_json::json!({ "message": message })),
        Err(err) => HttpResponse::BadRequest().json(err),
    }
}

// routes/admin.rs (or similar)
pub async fn get_groups(
    req: HttpRequest,
    pool: web::Data<SqlitePool>,
) -> HttpResponse {
    let extensions = req.extensions();
    let claims = match extensions.get::<ClaimsAdmin>() {
        Some(c) => c,
        None => {
            return HttpResponse::Unauthorized().json(ErrorResponse {
                error: "Unauthorized: no valid admin token found".into(),
            });
        }
    };

    println!("🔐 Admin connecté : {}", claims.admin_username);

    match db::fetch_groups(pool.get_ref()).await {
        Ok(groups) => HttpResponse::Ok().json(groups),
        Err(err) => HttpResponse::InternalServerError().json(ErrorResponse {
            error: format!("Database error: {}", err),
        }),
    }
}

pub async fn delete_groups(
    req: HttpRequest,
    pool: web::Data<SqlitePool>,
    body: web::Json<DeleteGroups>,
) -> HttpResponse {
    let extensions = req.extensions();
    let claims = match extensions.get::<ClaimsAdmin>() {
        Some(c) => c,
        None => {
            return HttpResponse::Unauthorized().json(ErrorResponse {
                error: "Unauthorized: no valid admin token found".into(),
            });
        }
    };

    println!("🔐 Admin connecté : {}", claims.admin_username);

    match db::delete_groups(pool.get_ref(), body.into_inner()).await {
        Ok(groups) => HttpResponse::Ok().json(groups),
        Err(err) => HttpResponse::InternalServerError().json(ErrorResponse {
            error: format!("Database error: {}", err),
        }),
    }
}