use actix_web::HttpResponse;
use actix_web::http::Error;
use sqlx::SqlitePool;
use uuid::Uuid;
use chrono::Utc;
use crate::models::{AddResponseGroups, AddUserGroups, CreateGroupRequest, CreateGroupResponse, DeleteGroups, ResponseGetApiKeyInGroups, ResponseGetAccountInGroups, GetAccountResponse, GetAllGroups, GetApiKeyResponse, User};
use crate::crypto::CryptoService;
pub struct GroupService;
// Initialize database tables
pub async fn init_tables(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS add_api_key (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            title TEXT NOT NULL UNIQUE,
            api_key TEXT NOT NULL,
            created_at TEXT NOT NULL
        )"
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS add_account (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            title TEXT NOT NULL UNIQUE,
            user_account TEXT NOT NULL,
            password_account TEXT NOT NULL,
            url TEXT NOT NULL,
            created_at TEXT NOT NULL
        )"
    )
    .execute(pool)
    .await?;
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS api_key_in_groups (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL UNIQUE,
            api_key TEXT NOT NULL,
            group_name TEXT NOT NULL,
            created_at TEXT NOT NULL
        )"
    )
    .execute(pool)
    .await?;
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        )"
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS user_groups (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            group_name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            UNIQUE(username, group_name)
        )"
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS account_in_groups (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL UNIQUE,
            user_account TEXT NOT NULL,
            password_account TEXT NOT NULL,
            url TEXT NOT NULL,
            group_name TEXT NOT NULL,
            created_at TEXT NOT NULL
        )"
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS admin (
            id TEXT PRIMARY KEY,
            admin_username TEXT NOT NULL UNIQUE,
            admin_password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'admin',
            created_at TEXT NOT NULL
        )"
    )
    .execute(pool)
    .await?;
    
    log::info!("Database tables initialized successfully");
    Ok(())
}

// API Key operations avec chiffrement
pub async fn insert_api_key(
    pool: &SqlitePool,
    api_key: &str,
    title: &str,
    username: &str,
    crypto: &CryptoService,
) -> Result<(String, String), sqlx::Error> {
    let id = Uuid::new_v4().to_string();
    let created_at = Utc::now().to_rfc3339();
    
    // Chiffre la clé API
    let encrypted_api_key = crypto.encrypt_and_encode(api_key)
        .map_err(|e| sqlx::Error::Protocol(format!("Encryption failed: {}", e)))?;
   
    sqlx::query("INSERT INTO add_api_key (id, username, title, api_key, created_at) VALUES (?, ?, ?, ?, ?)")
        .bind(&id)
        .bind(username)
        .bind(title)
        .bind(&encrypted_api_key)
        .bind(&created_at)
        .execute(pool)
        .await?;
   
    Ok((id, created_at))
}

// Account operations avec chiffrement
pub async fn insert_account(
    pool: &SqlitePool,
    user_account: &str,
    password_account: &str,
    title: &str,
    url: &str,
    username: &str,
    crypto: &CryptoService,
) -> Result<(String, String), sqlx::Error> {
    let id = Uuid::new_v4().to_string();
    let created_at = Utc::now().to_rfc3339();
    
    // Chiffre le mot de passe
    let encrypted_password = crypto.encrypt_and_encode(password_account)
        .map_err(|e| sqlx::Error::Protocol(format!("Encryption failed: {}", e)))?;
   
    sqlx::query(
        "INSERT INTO add_account (id, username, title, user_account, password_account, url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(username)
    .bind(title)
    .bind(user_account)
    .bind(&encrypted_password)
    .bind(url)
    .bind(&created_at)
    .execute(pool)
    .await?;
   
    Ok((id, created_at))
}

pub async fn delete_api_key_by_title(
    pool: &SqlitePool,
    id: &str,
) -> Result<String, sqlx::Error> {
    let result = sqlx::query("DELETE FROM add_api_key WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?;

    Ok(format!("{} row(s) affected", result.rows_affected()))
}

pub async fn delete_account_by_title(
    pool: &SqlitePool,
    id: &str,
) -> Result<String, sqlx::Error> {
    let result = sqlx::query("DELETE FROM add_account WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?;

    Ok(format!("{} row(s) affected", result.rows_affected()))
}

pub async fn insert_user(
    pool: &SqlitePool,
    username: &str,
    password_hash: &str,
) -> Result<(String, String), sqlx::Error> {
    let id = Uuid::new_v4().to_string();
    let created_at = Utc::now().to_rfc3339();

    sqlx::query(
        "INSERT INTO users (id, username, password_hash, created_at)
         VALUES (?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(username)
    .bind(password_hash)
    .bind(&created_at)
    .execute(pool)
    .await?;

    Ok((id, created_at))
}

pub async fn delete_user(
    pool: &SqlitePool, 
    id: &str
) -> Result<u64, sqlx::Error> {
    let result = sqlx::query("DELETE FROM users WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected())
}

pub async fn get_account_by_username(
    pool: &SqlitePool,
    username: &str,
    crypto: &CryptoService,
) -> Result<Vec<GetAccountResponse>, sqlx::Error> {
    let rows = sqlx::query_as::<_, GetAccountResponse>(
        r#"
        SELECT id, username, title, user_account, password_account, url, created_at
        FROM add_account
        WHERE username = ?
        "#
    )
    .bind(username)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        log::error!("Database query failed for get_account_by_username: {:?}", e);
        e
    })?;

    // Déchiffre chaque mot de passe
    let mut accounts = Vec::new();
    for mut row in rows {
        row.password_account = crypto.decode_and_decrypt(&row.password_account)
            .map_err(|e| {
                log::error!("Decryption failed for account {}: {}", row.title, e);
                sqlx::Error::Protocol(format!("Decryption failed: {}", e))
            })?;
        
        accounts.push(row);
    }

    Ok(accounts)
}

pub async fn get_api_key_by_username(
    pool: &SqlitePool,
    username: &str,
    crypto: &CryptoService,
) -> Result<Vec<GetApiKeyResponse>, sqlx::Error> {
    let rows = sqlx::query_as::<_, GetApiKeyResponse>(
        r#"
        SELECT id, username, title, api_key, created_at
        FROM add_api_key
        WHERE username = ?
        "#
    )
    .bind(username)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        log::error!("Database query failed for get_api_key_by_username: {:?}", e);
        e
    })?;

    // Déchiffre chaque clé API
    let mut api_keys = Vec::new();
    for mut row in rows {
        row.api_key = crypto.decode_and_decrypt(&row.api_key)
            .map_err(|e| {
                log::error!("Decryption failed for API key {}: {}", row.title, e);
                sqlx::Error::Protocol(format!("Decryption failed: {}", e))
            })?;
        
        api_keys.push(row);
    }

    Ok(api_keys)
}

pub async fn get_all_accounts(
    pool: &SqlitePool,
) -> Result<Vec<User>, sqlx::Error> {
    let rows = sqlx::query_as::<_, User>(
        r#"
            SELECT * FROM users;
        "#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| {
        log::error!("Database query failed for get_all_accounts: {:?}", e);
        e
    })?;
    
    Ok(rows)
}

pub async fn create_group(
    pool: &SqlitePool,
    body: CreateGroupRequest,
) -> Result<CreateGroupResponse, String> {
    let group_name = body.group_name.trim();
    
    // Vérification du nom vide
    if group_name.is_empty() {
        return Err("Le nom du groupe ne peut pas être vide.".to_string());
    }
    
    // Vérification si le groupe existe déjà
    let check = sqlx::query("SELECT id FROM user_groups WHERE group_name = ?")
        .bind(group_name)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?;
    
    if check.is_some() {
        return Err("Le groupe existe déjà".to_string());
    }
    
    let group_id = Uuid::new_v4().to_string();
    let created_at = Utc::now().to_rfc3339();
    
    // Insertion des utilisateurs dans le groupe
    for username in &body.usernames {
        let id = Uuid::new_v4().to_string();
        sqlx::query("INSERT INTO user_groups (id, username, group_name, created_at) VALUES (?, ?, ?, ?)")
            .bind(&id)
            .bind(username)
            .bind(group_name)
            .bind(&created_at)
            .execute(pool)
            .await
            .map_err(|e| e.to_string())?;
    }
    
    Ok(CreateGroupResponse {
        id: group_id,
        created_at,
        message: "Groupe créé avec succès".to_string(),
    })
}

pub async fn add_account(
    pool: &SqlitePool, 
    body: AddUserGroups
) -> Result<AddResponseGroups, String> {
    // Vérifie si le groupe existe
    let group_exists = sqlx::query("SELECT group_name FROM user_groups WHERE group_name = ?")
        .bind(&body.group_name)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?;
    
    if group_exists.is_none() {
        return Err("Le groupe n'existe pas.".to_string());
    }
    
    // Vérifie si l'utilisateur est déjà dans le groupe
    let user_exists = sqlx::query("SELECT id FROM user_groups WHERE group_name = ? AND username = ?")
        .bind(&body.group_name)
        .bind(&body.username)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?;
    
    if user_exists.is_some() {
        return Err("L'utilisateur est déjà dans le groupe".to_string());
    }
    
    // Ajoute l'utilisateur dans le groupe
    let id = Uuid::new_v4().to_string();
    let created_at = Utc::now().to_rfc3339();
    
    sqlx::query("INSERT INTO user_groups (id, username, group_name, created_at) VALUES (?, ?, ?, ?)")
        .bind(&id)
        .bind(&body.username)
        .bind(&body.group_name)
        .bind(&created_at)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(AddResponseGroups {
        id,
        username: body.username,
        group_name: body.group_name,
        created_at,
        message: "Utilisateur ajouté au groupe avec succès".to_string(),
    })
}

pub async fn fetch_groups(pool: &SqlitePool) -> Result<Vec<GetAllGroups>, sqlx::Error> {
    let groups = sqlx::query_as::<_, GetAllGroups>(
        r#"
        SELECT 
            group_name AS name,
            COUNT(DISTINCT username) AS member_count,
            MIN(created_at) AS created_at,
            '' AS description
        FROM user_groups
        GROUP BY group_name
        ORDER BY created_at DESC
        "#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| {
        log::error!("Database query failed for fetch_groups: {:?}", e);
        e
    })?;

    Ok(groups)
}

pub async fn delete_groups(pool: &SqlitePool, body: DeleteGroups) -> Result<DeleteGroups, String> {
    // Vérifie si le groupe existe
    let group_exists = sqlx::query("SELECT group_name FROM user_groups WHERE group_name = ?")
        .bind(&body.group_name)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?;
    
    if group_exists.is_none() {
        return Err("Le groupe n'existe pas.".to_string());
    }
    
    // Supprime tous les utilisateurs du groupe
    let result = sqlx::query("DELETE FROM user_groups WHERE group_name = ?")
        .bind(&body.group_name)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;
    
    if result.rows_affected() == 0 {
        return Err("Aucun membre trouvé dans le groupe.".to_string());
    }
    
    log::info!("Groupe '{}' supprimé avec {} membre(s)", body.group_name, result.rows_affected());
    
    Ok(body)
}

pub async fn get_groups_by_username(
    pool: &SqlitePool,
    username: &str,
) -> Result<Vec<GetAllGroups>, sqlx::Error> {
    let groups = sqlx::query_as::<_, GetAllGroups>(
        r#"
        SELECT 
            group_name AS name,
            COUNT(DISTINCT username) AS member_count,
            MIN(created_at) AS created_at,
            '' AS description
        FROM user_groups
        WHERE group_name IN (
            SELECT DISTINCT group_name 
            FROM user_groups 
            WHERE username = ?
        )
        GROUP BY group_name
        ORDER BY created_at DESC
        "#
    )
    .bind(username)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        log::error!("Database query failed for get_groups_by_username: {:?}", e);
        e
    })?;

    Ok(groups)
}

/// Ajoute un compte dans un groupe avec chiffrement
pub async fn insert_account_in_group(
    pool: &SqlitePool,
    user_account: &str,
    password_account: &str,
    title: &str,
    url: &str,
    group_name: &str,
    crypto: &CryptoService,
) -> Result<(String, String), sqlx::Error> {
    // Vérifie si le groupe existe
    let group_exists = sqlx::query("SELECT group_name FROM user_groups WHERE group_name = ?")
        .bind(group_name)
        .fetch_optional(pool)
        .await?;
    
    if group_exists.is_none() {
        return Err(sqlx::Error::Protocol("Group does not exist".into()));
    }

    let id = Uuid::new_v4().to_string();
    let created_at = Utc::now().to_rfc3339();
    
    // Chiffre le mot de passe
    let encrypted_password = crypto.encrypt_and_encode(password_account)
        .map_err(|e| sqlx::Error::Protocol(format!("Encryption failed: {}", e)))?;
   
    sqlx::query(
        "INSERT INTO account_in_groups (id, title, user_account, password_account, url, group_name, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(title)
    .bind(user_account)
    .bind(&encrypted_password)
    .bind(url)
    .bind(group_name)
    .bind(&created_at)
    .execute(pool)
    .await?;
   
    Ok((id, created_at))
}

/// Ajoute une clé API dans un groupe avec chiffrement
pub async fn insert_api_key_in_group(
    pool: &SqlitePool,
    api_key: &str,
    title: &str,
    group_name: &str,
    crypto: &CryptoService,
) -> Result<(String, String), sqlx::Error> {
    // Vérifie si le groupe existe
    let group_exists = sqlx::query("SELECT group_name FROM user_groups WHERE group_name = ?")
        .bind(group_name)
        .fetch_optional(pool)
        .await?;
    
    if group_exists.is_none() {
        return Err(sqlx::Error::Protocol("Group does not exist".into()));
    }

    // Vérifie d'abord si une table existe pour les API keys de groupe
    // Si elle n'existe pas, il faudra la créer dans init_tables
    let id = Uuid::new_v4().to_string();
    let created_at = Utc::now().to_rfc3339();
    
    // Chiffre la clé API
    let encrypted_api_key = crypto.encrypt_and_encode(api_key)
        .map_err(|e| sqlx::Error::Protocol(format!("Encryption failed: {}", e)))?;
   
    sqlx::query(
        "INSERT INTO api_key_in_groups (id, title, api_key, group_name, created_at) 
         VALUES (?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(title)
    .bind(&encrypted_api_key)
    .bind(group_name)
    .bind(&created_at)
    .execute(pool)
    .await?;
   
    Ok((id, created_at))
}

/// Récupère tous les comptes d'un groupe (avec mot de passe déchiffré)

pub async fn get_account_by_group_name(
    pool: &SqlitePool,
    group_name: &str,
    crypto: &CryptoService,
) -> Result<Vec<ResponseGetAccountInGroups>, sqlx::Error> {
    let rows = sqlx::query_as::<_, ResponseGetAccountInGroups>(
        r#"
        SELECT group_name, title, user_account, password_account, url
        FROM account_in_groups
        WHERE group_name = ?
        "#
    )
    .bind(group_name)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        log::error!("Database query failed for get_account_by_group_name: {:?}", e);
        e
    })?;

    let mut accounts = Vec::new();

    for mut row in rows {
        match crypto.decode_and_decrypt(&row.password_account) {
            Ok(decrypted) => {
                row.password_account = decrypted;
                accounts.push(row);
            }
            Err(e) => {
                log::error!("Decryption failed for account '{}': {}", row.title, e);
            }
        }
    }

    Ok(accounts)
}

/// Récupère toutes les clés API d'un groupe (déchiffrées)
pub async fn get_api_key_by_group_name(
    pool: &SqlitePool,
    group_name: &str,
    crypto: &CryptoService,
) -> Result<Vec<ResponseGetApiKeyInGroups>, sqlx::Error> {
    // On récupère toutes les lignes correspondant au nom du groupe
    let rows = sqlx::query_as::<_, ResponseGetApiKeyInGroups>(
        r#"
        SELECT group_name, title, api_key
        FROM api_key_in_groups
        WHERE group_name = ?
        "#
    )
    .bind(group_name)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        log::error!("Database query failed for get_api_key_by_group_name: {:?}", e);
        e
    })?;

    // Déchiffre chaque clé API
    let mut api_keys = Vec::new();

    for mut row in rows {
        match crypto.decode_and_decrypt(&row.api_key) {
            Ok(decrypted) => {
                row.api_key = decrypted;
                api_keys.push(row);
            }
            Err(e) => {
                log::error!("Decryption failed for API key '{}': {}", row.title, e);
            }
        }
    }

    Ok(api_keys)
}