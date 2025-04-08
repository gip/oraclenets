use super::*;

use anchor_lang::system_program;
use anchor_spl::token;

use crate::state::oracle::Oracle;
use crate::error::OracleError;

#[derive(Accounts)]
pub struct Revealize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: This is the owner account
    pub owner: AccountInfo<'info>,

    #[account(mut, has_one = owner)]
    pub oracle: Box<Account<'info, Oracle>>,

    pub system_program: Program<'info, System>,
}

impl Revealize<'_> {
    pub fn handle(ctx: Context<Self>) -> Result<()> {
        require!(ctx.accounts.oracle.stage == Stage::Commit, OracleError::WrongStage);
        let oracle = &mut ctx.accounts.oracle;     
        oracle.stage = Stage::Reveal;
        Ok(())
    }
}