use actix_web::{web, App, HttpServer, middleware};
use sqlx::sqlite::{SqlitePool, SqliteConnectOptions};
use std::str::FromStr;
use actix_cors::Cors;
use actix_web::http::header;

mod models;
mod handlers;
mod db;
mod auth;
mod middleware_mod;
mod auth_admin;
mod delete_user;
mod crypto;
mod handlers_admin;

use auth::{register, login, verify_token};
use auth_admin::{register_admin, login_admin, verify_token_admin};
use handlers::{add_api_key, delete_api_key, add_account, delete_account, get_account,
     get_api_key, get_me, get_groups_by_name, add_api_key_in_group, add_account_in_group,
     get_account_in_group, get_api_key_in_group, get_api_key_by_title
    };
use middleware_mod::auth_middleware::AuthMiddleware;
use middleware_mod::auth_middleware_admin::AuthMiddlewareAdmin;
use delete_user::{delete_user};
use handlers_admin::{get_users, create_groups,add_groups, get_groups,delete_groups}; 
use crypto::CryptoService;  

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    dotenv::dotenv().ok();
    
    log::info!("Initializing vault backend...");
    
    // ✅ NOUVEAU: Initialize crypto service
    let master_password = std::env::var("MASTER_PASSWORD")
        .unwrap_or_else(|_| {
            log::warn!("⚠️  MASTER_PASSWORD not set in .env, using default (INSECURE FOR PRODUCTION!)");
            "change_this_secure_master_password_minimum_32_characters".to_string()
        });
    
    let crypto = CryptoService::new(&master_password)
        .expect("❌ Failed to initialize crypto service");
    
    log::info!("✅ Crypto service initialized successfully");
    
    // Create data directory if it doesn't exist
    std::fs::create_dir_all("data").ok();
    
    // Database connection
    let database_url = "sqlite:data/vault.db?mode=rwc";
    let connect_options = SqliteConnectOptions::from_str(database_url)
        .expect("Failed to parse database URL")
        .create_if_missing(true);
    
    let pool = SqlitePool::connect_with(connect_options)
        .await
        .expect("Failed to connect to database");
    
    // Initialize database tables
    db::init_tables(&pool)
        .await
        .expect("Failed to initialize database tables");
    
    log::info!("✅ Database initialized successfully");
    println!("🚀 Starting server on http://192.168.1.40:30080");
    
    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin("http://IP:NodePort") 
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
            .allowed_headers(vec![header::CONTENT_TYPE, header::AUTHORIZATION])
            .supports_credentials()
            .max_age(3600);
                
        App::new()
            .app_data(web::Data::new(pool.clone()))
            .app_data(web::Data::new(crypto.clone()))  // ✅ CRITICAL: Add crypto service
            .wrap(cors)
            .wrap(middleware::Logger::default())
           
            .service(
                web::scope("/api/auth")
                    .route("/register", web::post().to(register))
                    .route("/login", web::post().to(login))
                    .route("/verify", web::get().to(verify_token))
            )
           
            .service(
                web::scope("/api/admin/auth")
                    .route("/register", web::post().to(register_admin))
                    .route("/login", web::post().to(login_admin))
                    .route("/verify", web::post().to(verify_token_admin))
            )
           
            .service(
                web::scope("/api/secure")
                    .wrap(AuthMiddleware)
                    .route("/me", web::post().to(get_me))
                    .route("/add/api-key", web::post().to(add_api_key))
                    .route("/delete/api-key", web::delete().to(delete_api_key))
                    .route("/add/account", web::post().to(add_account))
                    .route("/delete/account", web::delete().to(delete_account))
                    .route("/get/account", web::post().to(get_account))
                    .route("/get/api-key", web::post().to(get_api_key))
                    .route("/get/groups-by-name", web::post().to(get_groups_by_name))
                    .route("/add/account/groups", web::post().to(add_account_in_group))
                    .route("/add/api-key/groups", web::post().to(add_api_key_in_group))
                    .route("/get/api-key-by-title", web::post().to(get_api_key_by_title))
                    .route("/get/account/groups", web::post().to(get_account_in_group))
                    .route("/get/api-key/groups", web::post().to(get_api_key_in_group))
            )
           
            .service(
                web::scope("/api/admin/secure")
                    .wrap(AuthMiddlewareAdmin)
                    .route("/delete/user", web::delete().to(delete_user))
                    .route("/get/users", web::post().to(get_users))
                    .route("/get/groups", web::get().to(get_groups))
                    .route("/add/groups", web::post().to(add_groups))
                    .route("/create/groups", web::post().to(create_groups))
                    .route("/delete/groups", web::delete().to(delete_groups))
            )
    })
    .bind("0.0.0.0:8000")?
    .run()
    .await
}