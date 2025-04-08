use super::*;

use anchor_lang::system_program;
use anchor_spl::token;

use crate::state::oracle::Oracle;
use crate::state::commitment::Commitment;
use crate::error::OracleError;

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub claimant: Signer<'info>,

    #[account(mut)]
    pub claimant_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub oracle: Box<Account<'info, Oracle>>,

    #[account(
        mut,
        seeds = [b"collateral_vault", oracle.key().as_ref()],
        bump
    )]
    pub collateral_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"commitment", oracle.key().as_ref(), claimant.key().as_ref()],
        bump
    )]
    pub commitment: Account<'info, Commitment>,

    pub token_program: Program<'info, Token>,

    pub system_program: Program<'info, System>,
}

impl Claim<'_> {
    pub fn handle(ctx: Context<Self>) -> Result<()> {
        let oracle = &ctx.accounts.oracle;
        let amount = oracle.amount_winners;
        let commitment = &mut ctx.accounts.commitment;
        require!(oracle.stage == Stage::Claim, OracleError::WrongStage);
        require!(oracle.is_resolved, OracleError::OracleNotResolved);
        require!(commitment.revealed, OracleError::CommitmentNotRevealed);
        require!(!commitment.claimed, OracleError::AlreadyClaimed);
        require!(!commitment.slashed, OracleError::CommitmentSlashed);
        require!(oracle.resolution_bit.is_some() && oracle.resolution_bit.unwrap() == commitment.resolution, OracleError::InvalidResolution);

        let seeds: &[&[u8]] = &[
            b"oracle",
            oracle.owner.as_ref(),
            oracle.uuid.as_ref(),
            &[oracle.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            to: ctx.accounts.claimant_token_account.to_account_info(),
            from: ctx.accounts.collateral_vault.to_account_info(),
            authority: ctx.accounts.oracle.to_account_info(),
        };

        let cpi_context = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts).with_signer(signer);
        token::transfer(cpi_context, amount)?;

        // Mark the commitment as claimed.
        commitment.claimed = true;
        Ok(())
    }
}