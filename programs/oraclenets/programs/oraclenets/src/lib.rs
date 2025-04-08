#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer},
};

pub mod instructions;
pub mod state;
pub mod error;

use instructions::*;
use state::oracle::*;
use state::commitment::*;
use error::OracleError;

declare_id!("GB7w5vu4TfeXVDmcJpRTY1Rr9mHFcURVmN2AiAcHNNpW");

pub static USDC_MINT_PUBKEY: Pubkey = pubkey!("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");

#[program]
pub mod oraclenets {
    use super::*;

    pub fn initialize_oracle(ctx: Context<InitializeOracle>, args: InitializeOracleArgs) -> Result<()> {
        InitializeOracle::handle(ctx, args)
    }

    pub fn commit(ctx: Context<Commit>, args: CommitArgs) -> Result<()> {
        Commit::handle(ctx, args)
    }

    pub fn reveal_phase(ctx: Context<RevealPhase>) -> Result<()> {
        RevealPhase::handle(ctx)
    }

    pub fn reveal(ctx: Context<Reveal>, args: RevealArgs) -> Result<()> {
        Reveal::handle(ctx, args)
    }

    pub fn slash(ctx: Context<Slash>, args: SlashArgs) -> Result<()> {
        Slash::handle(ctx, args)
    }

    pub fn finalize(ctx: Context<Finalize>) -> Result<()> {
        Finalize::handle(ctx)
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        Claim::handle(ctx)
    }
}
