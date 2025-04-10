use super::*;

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
    pub oracle: Account<'info, Oracle>,

    #[account(
        mut,
        seeds = [b"collateral_vault", oracle.key().as_ref()],
        bump
    )]
    pub collateral_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        close = claimant,
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
        require!(commitment.is_revealed, OracleError::CommitmentNotRevealed);
        require!(!commitment.is_claimed, OracleError::AlreadyClaimed);
        require!(!commitment.is_slashed, OracleError::CommitmentSlashed);
        require!(oracle.is_tie || oracle.resolution_bit == commitment.resolution_bit, OracleError::InvalidResolution);

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
        commitment.is_claimed = true;
        Ok(())
    }
}