use super::*;

use crate::state::oracle::Oracle;
use crate::error::OracleError;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeArgs {
    pub question_uuid: [u8; 32],
    pub collateral_amount: u64,
    pub question: Vec<u8>,
}

#[derive(Accounts)]
#[instruction(args: InitializeArgs)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = 8 + Oracle::INIT_SPACE,
        seeds = [b"oracle", payer.key().as_ref(), args.question_uuid.as_ref()],
        bump
    )]
    pub oracle: Account<'info, Oracle>,

    pub collateral_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = payer,
        token::mint = collateral_mint,
        token::authority = oracle,
        seeds = [b"collateral_vault", oracle.key().as_ref()],
        bump
    )]
    pub collateral_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, anchor_spl::token::Token>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
}

impl Initialize<'_> {
    pub fn handle(ctx: Context<Self>, args: InitializeArgs) -> Result<()> {
        require_gte!(args.collateral_amount, 10_000, OracleError::InvalidCollateralAmount);
        require!(args.question.len() < 64, OracleError::QuestionTooLong);
        let question_hash = sha256_hash(&args.question);
        require!(question_hash == args.question_uuid, OracleError::InvalidUuid);
        let oracle = &mut ctx.accounts.oracle;
        oracle.owner = ctx.accounts.payer.key();
        oracle.uuid = args.question_uuid;
        oracle.collateral_amount = 0;
        oracle.count_joined = 0;
        oracle.count_resolution_true = 0;
        oracle.count_resolution_false = 0;
        oracle.count_slashed = 0;
        oracle.stage = crate::state::oracle::Stage::Commit;
        oracle.is_resolved = false;
        oracle.is_tie = false;
        oracle.resolution_bit = false;
        oracle.collateral_amount = args.collateral_amount;
        oracle.collateral_mint = ctx.accounts.collateral_mint.key();
        oracle.collateral_vault = ctx.accounts.collateral_vault.key();
        oracle.bump = ctx.bumps.oracle;
        oracle.question = args.question;
        Ok(())
    }
}