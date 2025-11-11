use actix_web::{web, HttpResponse, HttpRequest, HttpMessage};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use crate::models::{ClaimsAdmin, AddUser, DeleteUser, ErrorResponse, AddUserResponse, DeleteUserResponse};
use crate::db;

fn get_admin_id(reqAdmin: &HttpRequest) -> Result<String, HttpResponse> {
    let extensions = reqAdmin.extensions();
    match extensions.get::<ClaimsAdmin>() {
        Some(c) => Ok(c.sub.clone()),
        None => Err(HttpResponse::Unauthorized().json(ErrorResponse {
            error: "Missing authentication".into(),
        })),
    }
}

pub async fn delete_user(
    req_admin: HttpRequest,
    pool: web::Data<SqlitePool>,
    body: web::Json<DeleteUser>,
) -> HttpResponse {
    // Vérifie que le token JWT appartient à un admin
    let admin_id = match get_admin_id(&req_admin) {
        Ok(id) => id,
        Err(response) => return response,
    };

    match crate::db::delete_user(pool.get_ref(), &body.id).await {
        Ok(rows_affected) => {
            if rows_affected == 0 {
                return HttpResponse::NotFound().json(ErrorResponse {
                    error: "User not found".into(),
                });
            }

            log::info!("Admin {} deleted user {}", admin_id, body.id);
            HttpResponse::Ok().json(DeleteUserResponse {
                id: body.id.clone(),
                message: "User deleted successfully".into(),
            })
        }
        Err(e) => {
            log::error!("Failed to delete user: {}", e);
            HttpResponse::InternalServerError().json(ErrorResponse {
                error: "Failed to delete user".into(),
            })
        }
    }
}