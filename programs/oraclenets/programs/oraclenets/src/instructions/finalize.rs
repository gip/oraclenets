use super::*;

use crate::state::oracle::Oracle;
use crate::error::OracleError;

#[derive(Accounts)]
pub struct Finalize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: This is the owner account
    pub owner: AccountInfo<'info>,

    #[account(mut, has_one = owner)]
    pub oracle: Box<Account<'info, Oracle>>,

    pub system_program: Program<'info, System>,
}

impl Finalize<'_> {
    pub fn handle(ctx: Context<Self>) -> Result<()> {
        require!(ctx.accounts.oracle.stage == Stage::Reveal, OracleError::WrongStage);
        let oracle = &mut ctx.accounts.oracle;
        let count_false = oracle.count_resolution_false;
        let count_true = oracle.count_resolution_true;
        
        let count_winners;
        if count_false == count_true {
            count_winners = count_false + count_true;
            oracle.is_tie = true;
        } else {
            let has_true_won = count_true > count_false;
            oracle.is_tie = false;
            oracle.resolution_bit = has_true_won;
            count_winners = if has_true_won { count_true } else { count_false };
        }

        let full_amount = oracle.count_joined.checked_mul(oracle.collateral_amount).ok_or(OracleError::MathOverflow)?;
        let amount_winners = if oracle.count_joined > 0 { full_amount / count_winners } else { 0 }; // Rounding down - some money may be lost
        oracle.amount_winners = amount_winners;

        oracle.is_resolved = true;
        oracle.stage = Stage::Claim;
        Ok(())
    }
}