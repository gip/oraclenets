use super::*;

#[error_code]
pub enum OracleError {
    #[msg("Invalid collateral amount.")]
    InvalidCollateralAmount,

    #[msg("Math overflow.")]
    MathOverflow,

    #[msg("Wrong stage.")]
    WrongStage,

    #[msg("Commitment already revealed.")]
    CommitmentAlreadyRevealed,

    #[msg("Invalid hash.")]
    InvalidHash,

    #[msg("Already claimed.")]
    AlreadyClaimed,

    #[msg("Commitment slashed.")]
    CommitmentSlashed,

    #[msg("Commitment not revealed.")]
    CommitmentNotRevealed,

    #[msg("Invalid resolution.")]
    InvalidResolution,

    #[msg("Oracle not resolved.")]
    OracleNotResolved,

    #[msg("Question too long.")]
    QuestionTooLong,

    #[msg("Unauthorized.")]
    Unauthorized,

    #[msg("Invalid UUID.")]
    InvalidUuid,
}
