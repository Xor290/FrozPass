// src/crypto.rs
// Module de chiffrement AES-256-GCM pour le gestionnaire de mots de passe

use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use argon2::{Argon2, PasswordHasher};
use argon2::password_hash::SaltString;
use base64::{Engine as _, engine::general_purpose};
use rand::RngCore;

/// Représente les données chiffrées avec le nonce
#[derive(Debug, Clone)]
pub struct EncryptedData {
    pub ciphertext: Vec<u8>,
    pub nonce: [u8; 12],
}

/// Structure pour gérer le chiffrement
/// Utilise AES-256-GCM pour la sécurité et l'authentification
#[derive(Clone)]
pub struct CryptoService {
    cipher: Aes256Gcm,
}

impl CryptoService {
    /// Crée une nouvelle instance avec une clé dérivée du master password
    /// 
    /// # Arguments
    /// * `master_password` - Le mot de passe maître utilisé pour dériver la clé de chiffrement
    /// 
    /// # Retourne
    /// * `Result<Self, String>` - Instance du service ou erreur
    /// 
    /// # Exemple
    /// ```
    /// let crypto = CryptoService::new("mon_password_super_secret")?;
    /// ```
    pub fn new(master_password: &str) -> Result<Self, String> {
        if master_password.is_empty() {
            return Err("Master password cannot be empty".to_string());
        }

        // Dérivation de la clé à partir du master password
        let key = Self::derive_key(master_password)?;
        let cipher = Aes256Gcm::new(&key.into());
        
        Ok(Self { cipher })
    }

    /// Dérive une clé de 256 bits à partir du master password en utilisant Argon2
    /// 
    /// # Arguments
    /// * `password` - Le mot de passe à dériver
    /// 
    /// # Retourne
    /// * `Result<[u8; 32], String>` - Clé de 32 bytes ou erreur
    fn derive_key(password: &str) -> Result<[u8; 32], String> {
        // IMPORTANT: En production, utilisez un salt stocké de manière sécurisée
        // Ce salt fixe est utilisé ici pour permettre le déchiffrement avec le même master password
        // Dans un système de production, considérez l'utilisation de HSM ou d'un gestionnaire de secrets
        let salt_b64 = "VotreSaltSecuriseIci1234567890AB";
        
        let salt = SaltString::from_b64(salt_b64)
            .map_err(|e| format!("Salt error: {}", e))?;
        
        let argon2 = Argon2::default();
        let password_hash = argon2
            .hash_password(password.as_bytes(), &salt)
            .map_err(|e| format!("Key derivation failed: {}", e))?;
        
        // Extraire les 32 premiers octets du hash pour la clé AES-256
        let hash_bytes = password_hash.hash.ok_or("No hash generated")?;
        let hash_slice = hash_bytes.as_bytes();
        
        if hash_slice.len() < 32 {
            return Err("Generated hash too short".to_string());
        }
        
        let mut key = [0u8; 32];
        key.copy_from_slice(&hash_slice[..32]);
        
        Ok(key)
    }

    /// Chiffre des données en texte clair
    /// 
    /// # Arguments
    /// * `plaintext` - Le texte à chiffrer
    /// 
    /// # Retourne
    /// * `Result<EncryptedData, String>` - Données chiffrées ou erreur
    /// 
    /// # Exemple
    /// ```
    /// let encrypted = crypto.encrypt("mon_secret")?;
    /// ```
    pub fn encrypt(&self, plaintext: &str) -> Result<EncryptedData, String> {
        if plaintext.is_empty() {
            return Err("Plaintext cannot be empty".to_string());
        }

        // Génère un nonce aléatoire unique pour cette opération
        let mut nonce_bytes = [0u8; 12];
        rand::thread_rng().fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        // Chiffrement avec authentification
        let ciphertext = self.cipher
            .encrypt(nonce, plaintext.as_bytes())
            .map_err(|e| format!("Encryption failed: {}", e))?;

        Ok(EncryptedData {
            ciphertext,
            nonce: nonce_bytes,
        })
    }

    /// Déchiffre des données
    /// 
    /// # Arguments
    /// * `encrypted` - Les données chiffrées à déchiffrer
    /// 
    /// # Retourne
    /// * `Result<String, String>` - Texte déchiffré ou erreur
    /// 
    /// # Exemple
    /// ```
    /// let decrypted = crypto.decrypt(&encrypted)?;
    /// ```
    pub fn decrypt(&self, encrypted: &EncryptedData) -> Result<String, String> {
        let nonce = Nonce::from_slice(&encrypted.nonce);
        
        let plaintext = self.cipher
            .decrypt(nonce, encrypted.ciphertext.as_ref())
            .map_err(|e| format!("Decryption failed: {}", e))?;

        String::from_utf8(plaintext)
            .map_err(|e| format!("Invalid UTF-8: {}", e))
    }

    /// Encode les données chiffrées en Base64 pour stockage en DB
    /// 
    /// # Arguments
    /// * `encrypted` - Les données chiffrées
    /// 
    /// # Retourne
    /// * `String` - Représentation Base64 (nonce + ciphertext)
    pub fn encode_to_base64(encrypted: &EncryptedData) -> String {
        // Format: nonce(12 bytes) + ciphertext
        let mut combined = encrypted.nonce.to_vec();
        combined.extend_from_slice(&encrypted.ciphertext);
        general_purpose::STANDARD.encode(&combined)
    }

    /// Décode depuis Base64 et extrait nonce + ciphertext
    /// 
    /// # Arguments
    /// * `encoded` - La chaîne Base64 à décoder
    /// 
    /// # Retourne
    /// * `Result<EncryptedData, String>` - Données chiffrées extraites ou erreur
    pub fn decode_from_base64(encoded: &str) -> Result<EncryptedData, String> {
        let combined = general_purpose::STANDARD
            .decode(encoded)
            .map_err(|e| format!("Base64 decode failed: {}", e))?;

        if combined.len() < 12 {
            return Err("Invalid encrypted data format".to_string());
        }

        let mut nonce = [0u8; 12];
        nonce.copy_from_slice(&combined[..12]);
        let ciphertext = combined[12..].to_vec();

        Ok(EncryptedData { ciphertext, nonce })
    }

    /// Fonction helper: chiffre et encode en une étape
    /// 
    /// # Arguments
    /// * `plaintext` - Le texte à chiffrer
    /// 
    /// # Retourne
    /// * `Result<String, String>` - Chaîne Base64 encodée ou erreur
    /// 
    /// # Exemple
    /// ```
    /// let encoded = crypto.encrypt_and_encode("my_password")?;
    /// // Retourne quelque chose comme: "rKz9mP2vN8... (base64)"
    /// ```
    pub fn encrypt_and_encode(&self, plaintext: &str) -> Result<String, String> {
        let encrypted = self.encrypt(plaintext)?;
        Ok(Self::encode_to_base64(&encrypted))
    }

    /// Fonction helper: décode et déchiffre en une étape
    /// 
    /// # Arguments
    /// * `encoded` - La chaîne Base64 encodée
    /// 
    /// # Retourne
    /// * `Result<String, String>` - Texte déchiffré ou erreur
    /// 
    /// # Exemple
    /// ```
    /// let decrypted = crypto.decode_and_decrypt("rKz9mP2vN8...")?;
    /// ```
    pub fn decode_and_decrypt(&self, encoded: &str) -> Result<String, String> {
        let encrypted = Self::decode_from_base64(encoded)?;
        self.decrypt(&encrypted)
    }
}