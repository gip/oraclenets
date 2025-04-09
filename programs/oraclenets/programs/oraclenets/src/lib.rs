#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

pub mod instructions;
pub mod state;
pub mod error;

use instructions::*;
use state::oracle::*;

declare_id!("7QJjHQAsytvvrNmqPJajKYKXwZXtVHd8T3t9bBVvxtMY");

#[program]
pub mod oraclenets {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, args: InitializeArgs) -> Result<()> {
        Initialize::handle(ctx, args)
    }

    pub fn commit(ctx: Context<Commit>, args: CommitArgs) -> Result<()> {
        Commit::handle(ctx, args)
    }

    pub fn revealize(ctx: Context<Revealize>) -> Result<()> {
        Revealize::handle(ctx)
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

    pub fn close(ctx: Context<Close>) -> Result<()> {
        Close::handle(ctx)
    }
}
