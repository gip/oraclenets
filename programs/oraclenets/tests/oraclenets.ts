import * as anchor from "@coral-xyz/anchor"
import { Program } from "@coral-xyz/anchor"
import { Oraclenets } from "../target/types/oraclenets"
import { 
  TOKEN_PROGRAM_ID, 
  createMint, 
  getOrCreateAssociatedTokenAccount,
  mintTo,
  Account
} from "@solana/spl-token"

describe("oraclenets", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env())
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const connection = provider.connection;

  const program = anchor.workspace.Oraclenets as Program<Oraclenets>

  const questionUuid = [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7];
  const payer = (provider.wallet as anchor.Wallet).payer;
  
  let usdcMint: anchor.web3.PublicKey
  const [oraclePda, bump] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("oracle"), 
      payer.publicKey.toBuffer(), 
      Buffer.from(questionUuid)
    ],
    program.programId
  );

  usdcMint = await createMint(
    connection,
    payer, // payer
    payer.publicKey, // mint authority
    null, // freeze authority (you can use null for this test)
    6 // decimals (USDC has 6 decimals)
  )

  const user100 = anchor.web3.Keypair.generate()
  let user100TokenAccount: Account

  it("Airdrop SOL to user100", async () => {
    const signature = await connection.requestAirdrop(user100.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await connection.confirmTransaction(signature);
    console.log("Airdropped 2 SOL to user100");
  });

  it("airdrop USDC to user100", async () => {    
    // Create a token account for user100
    user100TokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      user100, // payer 
      usdcMint, // mint
      user100.publicKey // owner
    );
    console.log("Created USDC account for user100:", user100TokenAccount.address.toBase58());
    
    // Mint 1000 test USDC to user100's account
    await mintTo(
      connection,
      payer, // payer
      usdcMint, // mint
      user100TokenAccount.address, // destination
      payer.publicKey, // authority
      1_000_000_000 // amount (1000 USDC with 6 decimals)
    );
    console.log("Minted 1000 test USDC to user100");
  });

  it("Initialized", async () => {
    const tx = await program.methods.initializeOracle({ questionUuid, collateralAmount: new anchor.BN(1_000_000) })
                                    .accounts({ collateralMint: usdcMint }).signers([payer]).rpc()  ;
    console.log("Your transaction signature", tx);
  })

  it("Commit", async () => {
    const tx = await program.methods.commit({ commitHash: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32] })
                                    .accounts({ payer: user100.publicKey, payerTokenAccount: user100TokenAccount.address, oracle: oraclePda }).signers([user100]).rpc();
    console.log("Your transaction signature", tx);
  })

  it("Reveal phase", async () => {
    const tx = await program.methods.revealPhase()
                                    .accounts({ oracle: oraclePda }).signers([payer]).rpc();

  })

  it("Reveal", async () => {
    const tx = await program.methods.reveal({ commitNonce: new anchor.BN(1) })
                                    .accounts({ payer: user100.publicKey, oracle: oraclePda }).signers([user100]).rpc();
    const oracleAccount = await program.account.oracle.fetch(oraclePda);
    console.log("Oracle account", oracleAccount);
  })

  it("Finalize", async () => {
    const tx = await program.methods.finalize()
                                    .accounts({ oracle: oraclePda }).signers([payer]).rpc();
    console.log("Your transaction signature", tx);
  })

  it("Claim", async () => {
    try {
      const tx = await program.methods.claim()
                                      .accounts({ claimant: user100.publicKey, claimantTokenAccount: user100TokenAccount.address, oracle: oraclePda }).signers([user100]).rpc();
      console.log("Your transaction signature", tx);
    } catch (error) {
      if (error.message.includes("Commitment slashed")) {
        console.log("Transaction failed as expected with error: CommitmentSlashed");
      } else {
        console.error("Unexpected error:", error);
        throw error;
      }
    }
  })
})