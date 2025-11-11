use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterRequestAdmin {
    pub admin_username: String,
    pub admin_password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequestAdmin {
    pub admin_username: String,
    pub admin_password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponseAdmin {
    pub id: String,
    pub admin_username: String,
    pub admin_token: String,
    pub role: String,
    pub expires_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub id: String,
    pub username: String,
    pub token: String,
    pub expires_at: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub id: String,
    pub username: String,
    pub password_hash: String,
    pub created_at: String,
}


#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Admin {
    pub id: String,
    pub admin_username: String,
    pub admin_password_hash: String,
    pub role: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,           // user id
    pub username: String,
    pub exp: i64,              // expiration time
    pub iat: i64,              // issued at
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClaimsAdmin {
    pub sub: String,
    pub admin_username: String,
    pub exp: i64,
    pub role: String,
    pub iat: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorResponse {
    pub error: String,
}

#[derive(Deserialize)]
pub struct AddApiKeyRequest {
    pub username: String,
    pub api_key: String,
    pub title: String,
}

#[derive(Deserialize)]
pub struct UsernameRequest {
    pub username: String,
}


#[derive(Deserialize)]
pub struct AddAccountRequest {
    pub username: String,
    pub user_account: String,
    pub password_account: String,
    pub title: String,
    pub url: String,
}

#[derive(Serialize)]
pub struct AccountResponse {
    pub id: String,
    pub created_at: String,
    pub message: String,
}

#[derive(FromRow, Serialize, Deserialize)]
pub struct GetAccountResponse {
    pub id: String,
    pub username: String,
    pub title: String,
    pub user_account: String,
    pub password_account: String,
    pub url: String,
    pub created_at: String,
}

#[derive(FromRow, Serialize, Deserialize)]
pub struct GetApiKeyResponse {
    pub id: String,
    pub username: String,
    pub title: String,
    #[serde(rename = "apiKey")]  // ✅ Seulement pour JSON, pas pour SQL
    pub api_key: String,
    pub created_at: String,
}

#[derive(Deserialize)]
pub struct DeleteRequest {
    pub id: String,
}

#[derive(Deserialize)]
pub struct CreateGroupRequest {
    pub group_name: String,
    pub usernames: Vec<String>, // liste des utilisateurs à inclure
}

#[derive(Serialize)]
pub struct CreateGroupResponse {
    pub id: String,
    pub created_at: String,
    pub message: String,
}

#[derive(Deserialize)]
pub struct AddUserGroups {
    pub username: String,
    pub group_name: String,
}

#[derive(Serialize,Deserialize)]
pub struct DeleteGroups {
    pub group_name: String,
}

#[derive(Debug, Serialize, FromRow)]
pub struct GetAllGroups {
    pub name: String,
    pub member_count: i64,
    pub created_at: String,
    pub description: String,
}
#[derive(Debug, Serialize)]
pub struct AddResponseGroups {
    pub id: String,
    pub username: String,
    pub group_name: String,
    pub created_at: String,
    pub message: String,
}
#[derive(Serialize)]
pub struct ApiKeyResponse {
    pub id: String,
    pub created_at: String,
    pub message: String,
}

#[derive(Deserialize)]
pub struct AddUser {
    pub username: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct DeleteUser {
    pub id: String,
}

#[derive(serde::Serialize)]
pub struct DeleteUserResponse {
    pub id: String,
    pub message: String,
}

#[derive(Serialize)]
pub struct AddUserResponse {
    pub id: String,
    pub created_at: String,
    pub message: String,
}

#[derive(Serialize, Deserialize)]
pub struct MeResponse {
    pub username: String,
}

#[derive(Debug, Deserialize)]
pub struct AddAccountInGroup {
    pub group_name: String,
    pub title: String,
    pub user_account: String,
    pub password_account: String,
    pub url: String,
}

#[derive(Debug, Serialize)]
pub struct AccountInGroupResponse {
    pub id: String,
    pub created_at: String,
    pub group_name: String,
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct AddApiKeyInGroup {
    pub group_name: String,
    pub title: String,
    pub api_key: String,
}

#[derive(Debug, Serialize)]
pub struct ApiKeyInGroupResponse {
    pub id: String,
    pub created_at: String,
    pub group_name: String,
    pub message: String,
}

#[derive(Deserialize)]
pub struct RequestGetAccountInGroups {
    pub group_name: String,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct ResponseGetAccountInGroups {
    pub group_name: String,
    pub title: String,
    pub user_account: String,
    pub password_account: String,
    pub url: String,
}

#[derive(Deserialize)]
pub struct RequestGetApiKeyInGroups {
    pub group_name: String,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct ResponseGetApiKeyInGroups {
    pub group_name: String,
    pub title: String,
    pub api_key: String,
}

#[derive(Deserialize)]
pub struct RequestGetApiKeyInTitle {
    pub title: String,
    pub username: String,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct ResponseGetApiKeyInTitle {
    pub api_key: String,
}