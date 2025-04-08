use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum Stage {
    Commit,
    Reveal,
    Claim,
}

#[account]
pub struct Oracle {
    // Metadata
    pub owner: Pubkey,
    pub uuid: [u8; 32], // Question UUID
    pub bump: u8,

    // Vault
    pub collateral_mint: Pubkey,
    pub collateral_vault: Pubkey,
    pub collateral_amount: u64, // Amount of collateral each user has to pay to join the oracle network

    // Internal state
    pub stage: Stage,
    pub count_joined: u64,
    pub count_resolution_true: u64,
    pub count_resolution_false: u64,
    pub count_slashed: u64,

    // External oracle state
    pub is_resolved: bool,
    pub is_tie: bool, // This will be true if the amount of true and false commitments are the same (or there are no commitments)
    pub resolution_bit: bool, // This is the resolution of the oracle - ONLY VALID IF is_tie is false

    // Amount of money that can be claimed by the winners
    pub amount_winners: u64,
}

impl Oracle {
    pub const INIT_SPACE: usize = 32 * 8 + 8 + (8 * 5) + 1 + 1 + 2 + 64;
}