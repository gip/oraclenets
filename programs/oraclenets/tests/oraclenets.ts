import * as anchor from "@coral-xyz/anchor"
import { Program } from "@coral-xyz/anchor"
import { Oraclenets } from "../target/types/oraclenets"
const { createHash } = require('crypto');
import { 
  createMint, 
  getOrCreateAssociatedTokenAccount,
  mintTo,
  Account
} from "@solana/spl-token"
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

const hash = (s: string) => {
  const raw = createHash('sha256').update(s).digest('hex')
  return Array.from(Buffer.from(raw, 'hex'))
}


describe("oraclenets", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env())
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const connection = provider.connection;

  const program = anchor.workspace.Oraclenets as Program<Oraclenets>

  const questionUuidRaw = createHash('sha256').update("Question1").digest('hex');
  const questionUuid: Array<number> = Array.from(Buffer.from(questionUuidRaw, 'hex'));
  const questionUuidBase58 = bs58.encode(questionUuid);

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

  it("Create mint", async () => {
    usdcMint = await createMint(
      connection,
      payer, // payer
      payer.publicKey, // mint authority
      null, // freeze authority (you can use null for this test)
        6 // decimals (USDC has 6 decimals)
      )
  })

  const createUser = async () => {
    const user = anchor.web3.Keypair.generate()
    const signature = await connection.requestAirdrop(user.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await connection.confirmTransaction(signature);
    const userTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      user, // payer 
      usdcMint, // mint
      user.publicKey // owner
    );
    await mintTo(
      connection,
      payer, // payer
      usdcMint, // mint
      userTokenAccount.address, // destination
      payer.publicKey, // authority
      1_000_000_000 // amount (1000 USDC with 6 decimals)
    );
    return { user, userTokenAccount }
  }

  let user001, userTokenAccount001
  let user002, userTokenAccount002
  let user003, userTokenAccount003
  let user004, userTokenAccount004
  let user005, userTokenAccount005
  it("Create users", async () => {
    ({ user: user001, userTokenAccount: userTokenAccount001 } = await createUser());
    ({ user: user002, userTokenAccount: userTokenAccount002 } = await createUser());
    ({ user: user003, userTokenAccount: userTokenAccount003 } = await createUser());
    ({ user: user004, userTokenAccount: userTokenAccount004 } = await createUser());
    ({ user: user005, userTokenAccount: userTokenAccount005 } = await createUser());
  })

  it("Initialized", async () => {
    const tx = await program.methods.initializeOracle({ questionUuid, collateralAmount: new anchor.BN(1_000_001) })
                                    .accounts({ collateralMint: usdcMint }).signers([payer]).rpc()  ;
    console.log("Your transaction signature", tx);
  })

  it("Commit", async () => {

    const c001 = hash(`${questionUuidBase58}-1-true`);
    const c002 = hash(`${questionUuidBase58}-2-false`);
    const c003 = hash(`${questionUuidBase58}-3-false`);
    const c004 = hash(`${questionUuidBase58}-4-bad`);
    const c005 = hash(`${questionUuidBase58}-5-true`);
    await program.methods.commit({ commitHash: c001 })
                         .accounts({ payer: user001.publicKey, payerTokenAccount: userTokenAccount001.address, oracle: oraclePda }).signers([user001]).rpc();
    await program.methods.commit({ commitHash: c002 })
                         .accounts({ payer: user002.publicKey, payerTokenAccount: userTokenAccount002.address, oracle: oraclePda }).signers([user002]).rpc();
    await program.methods.commit({ commitHash: c003 })
                         .accounts({ payer: user003.publicKey, payerTokenAccount: userTokenAccount003.address, oracle: oraclePda }).signers([user003]).rpc();
    await program.methods.commit({ commitHash: c004 })
                         .accounts({ payer: user004.publicKey, payerTokenAccount: userTokenAccount004.address, oracle: oraclePda }).signers([user004]).rpc();
    await program.methods.commit({ commitHash: c005 })
                         .accounts({ payer: user005.publicKey, payerTokenAccount: userTokenAccount005.address, oracle: oraclePda }).signers([user005]).rpc();
  })

  it("Reveal phase", async () => {
    const tx = await program.methods.revealize()
                                    .accounts({ oracle: oraclePda }).signers([payer]).rpc();

  })

  it("Reveal", async () => {
    await program.methods.reveal({ commitNonce: new anchor.BN(1) })
                         .accounts({ payer: user001.publicKey, oracle: oraclePda }).signers([user001]).rpc();
    await program.methods.reveal({ commitNonce: new anchor.BN(2) })
                         .accounts({ payer: user002.publicKey, oracle: oraclePda }).signers([user002]).rpc();
    await program.methods.reveal({ commitNonce: new anchor.BN(3) })
                         .accounts({ payer: user003.publicKey, oracle: oraclePda }).signers([user003]).rpc();
    await program.methods.reveal({ commitNonce: new anchor.BN(4) })
                         .accounts({ payer: user004.publicKey, oracle: oraclePda }).signers([user004]).rpc();

    await program.methods.slash({ commitNonce: new anchor.BN(5) })
                         .accounts({ payer: user001.publicKey, 
                                     oracle: oraclePda,
                                     target: user005.publicKey }).signers([user001]).rpc();

    const oracleAccount = await program.account.oracle.fetch(oraclePda);
    console.log("Oracle account", oracleAccount);
  })

  it("Finalize", async () => {
    await program.methods.finalize()
                         .accounts({ oracle: oraclePda }).signers([payer]).rpc();
    const oracleAccount = await program.account.oracle.fetch(oraclePda);
    console.log("Oracle account", oracleAccount);
  })

  it("Claim", async () => {
    try {
      await program.methods.claim()
                           .accounts({ claimant: user001.publicKey, claimantTokenAccount: userTokenAccount001.address, oracle: oraclePda }).signers([user001]).rpc();
    } catch (error) {
      if (error.message.includes("Invalid resolution")) {
        console.log("Transaction failed as expected with error: Invalid resolution");
      } else {
        console.error("Unexpected error:", error);
        throw error;
      }
    }
    await program.methods.claim()
                         .accounts({ claimant: user002.publicKey, claimantTokenAccount: userTokenAccount002.address, oracle: oraclePda }).signers([user002]).rpc();
    await program.methods.claim()
                         .accounts({ claimant: user003.publicKey, claimantTokenAccount: userTokenAccount003.address, oracle: oraclePda }).signers([user003]).rpc();
  })
})