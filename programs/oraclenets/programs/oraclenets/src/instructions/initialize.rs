use super::*;

use anchor_lang::system_program;
use anchor_spl::token;

use crate::state::oracle::Oracle;
use crate::error::OracleError;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeArgs {
    pub question_uuid: [u8; 32],
    pub collateral_amount: u64,
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
    pub oracle: Box<Account<'info, Oracle>>,

    pub collateral_mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = payer,
        token::mint = collateral_mint,
        token::authority = oracle,
        seeds = [b"collateral_vault", oracle.key().as_ref()],
        bump
    )]
    pub collateral_vault: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, anchor_spl::token::Token>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
}

impl Initialize<'_> {
    pub fn handle(ctx: Context<Self>, args: InitializeArgs) -> Result<()> {
        require_gte!(args.collateral_amount, 1_000_000, OracleError::InvalidCollateralAmount);
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
        oracle.resolution_bit = None;
        oracle.collateral_amount = args.collateral_amount;
        oracle.collateral_mint = ctx.accounts.collateral_mint.key();
        oracle.collateral_vault = ctx.accounts.collateral_vault.key();
        oracle.bump = ctx.bumps.oracle;
        Ok(())
    }
}