use super::*;

use anchor_lang::system_program;
use anchor_spl::token;

use crate::state::oracle::Oracle;
use crate::state::commitment::Commitment;
use crate::error::OracleError;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CommitArgs {
    pub commit_hash: [u8; 32],
}

#[derive(Accounts)]
pub struct Commit<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub payer_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub oracle: Box<Account<'info, Oracle>>,

    #[account(
        mut,
        seeds = [b"collateral_vault", oracle.key().as_ref()],
        bump
    )]
    pub collateral_vault: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 32 * 8 + 1 + 1,
        seeds = [b"join", oracle.key().as_ref(), payer.key().as_ref()],
        bump
    )]
    pub commitment: Account<'info, Commitment>,

    pub token_program: Program<'info, Token>,

    pub system_program: Program<'info, System>,
}

impl Commit<'_> {
    pub fn handle(ctx: Context<Self>, args: CommitArgs) -> Result<()> {
        require!(ctx.accounts.oracle.stage == Stage::Commit, OracleError::WrongStage);
        let oracle = &mut ctx.accounts.oracle;        
        let cpi_accounts = Transfer {
            from: ctx.accounts.payer_token_account.to_account_info(),
            to: ctx.accounts.collateral_vault.to_account_info(),
            authority: ctx.accounts.payer.to_account_info(),
        };
        let cpi_context = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);        
        token::transfer(cpi_context, oracle.collateral_amount)?;
        oracle.count_joined = oracle.count_joined.checked_add(1)
            .ok_or(error!(OracleError::MathOverflow))?;
        let commitment = &mut ctx.accounts.commitment;
        commitment.payer_token_account = ctx.accounts.payer_token_account.key();
        commitment.commit_hash = args.commit_hash;
        commitment.revealed = false;
        commitment.slashed = false;
        commitment.claimed = false;
        Ok(())
    }
}