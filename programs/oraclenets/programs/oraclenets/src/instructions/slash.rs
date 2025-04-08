use super::*;

use anchor_lang::system_program;
use anchor_spl::token;

use crate::state::oracle::Oracle;
use crate::state::commitment::Commitment;
use crate::error::OracleError;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct SlashArgs {
    pub commit_nonce: u64,
}

#[derive(Accounts)]
pub struct Slash<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub oracle: Box<Account<'info, Oracle>>,

    /// CHECK: By design, this is a raw account info
    pub target: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [b"commitment", oracle.key().as_ref(), target.key().as_ref()],
        bump
    )]
    pub commitment: Account<'info, Commitment>,

    pub system_program: Program<'info, System>,
}

impl Slash<'_> {
    pub fn handle(ctx: Context<Self>, args: SlashArgs) -> Result<()> {
        require!(ctx.accounts.oracle.stage == Stage::Reveal, OracleError::WrongStage);
        let oracle = &mut ctx.accounts.oracle;     
        let commitment = &mut ctx.accounts.commitment;
        let check = check_commitment(oracle.uuid, args.commit_nonce, commitment.commit_hash);
        match check {
            Some(_) => {
                commitment.revealed = true;
                commitment.slashed = true;
                oracle.count_slashed += 1;
                msg!("Slashed commitment");
            },
            None => {
                return Err(error!(OracleError::InvalidHash));
            }
        };
        Ok(())
    }
}