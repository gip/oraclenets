use anchor_lang::prelude::*;

#[account]
pub struct Commitment {
    pub payer_token_account: Pubkey,
    pub commit_hash: [u8; 32],
    pub revealed: bool,
    pub resolution: bool, // Valid iff revealed is true
    pub slashed: bool,
    pub claimed: bool,
}