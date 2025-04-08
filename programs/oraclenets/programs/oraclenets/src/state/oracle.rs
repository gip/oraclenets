use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum Stage {
    Commit,
    Reveal,
    Claim,
}

#[account]
pub struct Oracle {
    pub owner: Pubkey,
    pub uuid: [u8; 32],
    pub bump: u8,

    // Vault
    pub collateral_mint: Pubkey,
    pub collateral_amount: u64,
    pub collateral_vault: Pubkey,

    // Internal state
    pub count_joined: u64,
    pub count_resolution_true: u64,
    pub count_resolution_false: u64,
    pub count_slashed: u64,
    pub stage: Stage,

    // External state
    pub is_resolved: bool,
    pub resolution_bit: Option<bool>,

    // 
    pub amount_winners: u64,
}

impl Oracle {
    pub const INIT_SPACE: usize = 32 * 8 + 8 + (8 * 5) + 1 + 1 + 2 + 64;
}