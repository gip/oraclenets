use super::*;

use crate::state::oracle::Oracle;
use crate::error::OracleError;

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        close = payer,
    )]
    pub oracle: Account<'info, Oracle>,

    pub system_program: Program<'info, System>,
}

impl Close<'_> {
    pub fn handle(ctx: Context<Self>) -> Result<()> {
        require!(ctx.accounts.oracle.stage == Stage::Claim, OracleError::WrongStage);
        Ok(())
    }
}