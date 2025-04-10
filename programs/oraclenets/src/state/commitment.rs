use anchor_lang::prelude::*;

#[account]
pub struct Commitment {
    pub payer_token_account: Pubkey,
    pub commit_hash: [u8; 32],
    pub is_revealed: bool,
    pub resolution_bit: bool, // Valid iff revealed is true
    pub is_slashed: bool,
    pub is_claimed: bool,
}