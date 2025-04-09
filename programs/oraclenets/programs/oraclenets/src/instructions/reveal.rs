use super::*;

use crate::state::oracle::Oracle;
use crate::state::commitment::Commitment;
use crate::error::OracleError;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct RevealArgs {
    pub commit_nonce: u64,
}

#[derive(Accounts)]
pub struct Reveal<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub oracle: Account<'info, Oracle>,

    #[account(
        mut,
        seeds = [b"commitment", oracle.key().as_ref(), payer.key().as_ref()],
        bump
    )]
    pub commitment: Account<'info, Commitment>,

    pub system_program: Program<'info, System>,
}

impl Reveal<'_> {
    pub fn handle(ctx: Context<Self>, args: RevealArgs) -> Result<()> {
        require!(ctx.accounts.oracle.stage == Stage::Reveal, OracleError::WrongStage);
        require!(!ctx.accounts.commitment.is_revealed, OracleError::CommitmentAlreadyRevealed);
        let oracle = &mut ctx.accounts.oracle;     
        let commitment = &mut ctx.accounts.commitment;
        let check = check_commitment(oracle.uuid, args.commit_nonce, commitment.commit_hash);
        match check {
            Some(true) => {
                oracle.count_resolution_true += 1;
                commitment.resolution_bit = true;
            },
            Some(false) => {
                oracle.count_resolution_false += 1;
                commitment.resolution_bit = false;
            }
            None => {
                oracle.count_slashed += 1;
                commitment.is_slashed = true;
            }
        };
        commitment.is_revealed = true;
        Ok(())
    }
}