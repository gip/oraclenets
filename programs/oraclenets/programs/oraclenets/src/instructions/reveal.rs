use super::*;

use anchor_lang::system_program;
use anchor_spl::token;

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
    pub oracle: Box<Account<'info, Oracle>>,

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
        require!(!ctx.accounts.commitment.revealed, OracleError::CommitmentAlreadyRevealed);
        let oracle = &mut ctx.accounts.oracle;     
        let commitment = &mut ctx.accounts.commitment;
        let check = check_commitment(oracle.uuid, args.commit_nonce, commitment.commit_hash);
        match check {
            Some(true) => {
                oracle.count_resolution_true += 1;
                commitment.resolution = true;
            },
            Some(false) => {
                oracle.count_resolution_false += 1;
                commitment.resolution = false;
            }
            None => {
                oracle.count_slashed += 1;
                commitment.slashed = true;
            }
        };
        commitment.revealed = true;
        Ok(())
    }
}