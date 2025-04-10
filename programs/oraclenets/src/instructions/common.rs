use sha2::{Sha256, Digest};
use bs58::encode;

pub fn sha256_hash(data: &[u8]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(data);
    hasher.finalize().into()
}

pub fn check_commitment(uuid: [u8; 32], nonce: u64, commitment_hash: [u8; 32]) -> Option<bool> {
    let uuid_str = encode(uuid).into_string();
    let hash_if_true = format!("{}-{}-{}", uuid_str, nonce, "true");
    let mut hasher = Sha256::new();
    hasher.update(hash_if_true.as_bytes());
    let hash_if_true_bytes = hasher.finalize();
    if hash_if_true_bytes == commitment_hash.into() {
        return Some(true)
    };
    let hash_if_false = format!("{}-{}-{}", uuid_str, nonce, "false");
    let mut hasher = Sha256::new();
    hasher.update(hash_if_false.as_bytes());
    let hash_if_false_bytes = hasher.finalize();
    if hash_if_false_bytes == commitment_hash.into() {
        return Some(false)
    };
    None
}