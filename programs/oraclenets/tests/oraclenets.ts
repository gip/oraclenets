import * as anchor from "@coral-xyz/anchor"
import { Program } from "@coral-xyz/anchor"
import { Oraclenets } from "../target/types/oraclenets"
import { createHash } from "crypto"
import { 
  createMint, 
  getOrCreateAssociatedTokenAccount,
  mintTo,
  Account
} from "@solana/spl-token"
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

const hash = (s: string): number[] => {
  const raw = createHash('sha256').update(s).digest('hex')
  return Array.from(Buffer.from(raw, 'hex'))
}

const assertTransactionFailed = async (action, expectedError: string) => {
  try {
    await action()
  } catch (error) {
    if (error.message.includes(expectedError)) {
      // console.log("Transaction failed as expected with error: ", expectedError);
    } else {
      console.error("Unexpected error:", error)
      throw error
    }
  }
}


describe("oraclenets", () => {
  anchor.setProvider(anchor.AnchorProvider.env())
  const provider = anchor.getProvider() as anchor.AnchorProvider
  const connection = provider.connection

  const program = anchor.workspace.Oraclenets as Program<Oraclenets>

  const question = "Question1"
  const questionArray = Buffer.from(question)
  const questionUuidRaw = createHash('sha256').update(question).digest('hex')
  const questionUuid: Array<number> = Array.from(Buffer.from(questionUuidRaw, 'hex'))
  const questionUuidBase58 = bs58.encode(questionUuid)

  const payer = (provider.wallet as anchor.Wallet).payer
  
  let usdcMint: anchor.web3.PublicKey
  const [oraclePda, bump] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("oracle"), 
      payer.publicKey.toBuffer(), 
      Buffer.from(questionUuid)
    ],
    program.programId
  )

  it("Create mint", async () => {
    usdcMint = await createMint(
      connection,
      payer,
      payer.publicKey,
      null,
        6
      )
  })

  const createUser = async () => {
    const user = anchor.web3.Keypair.generate()
    const signature = await connection.requestAirdrop(user.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
    await connection.confirmTransaction(signature)
    const userTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      user, // payer 
      usdcMint, // mint
      user.publicKey // owner
    )
    await mintTo(
      connection,
      payer,
      usdcMint,
      userTokenAccount.address,
      payer.publicKey,
      1_000_000_000
    )
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
    await program.methods.initialize({ question: questionArray, questionUuid, collateralAmount: new anchor.BN(1_000_001) })
                         .accounts({ collateralMint: usdcMint }).signers([payer]).rpc()
  })

  it("Commit", async () => {
    const c001 = hash(`${questionUuidBase58}-10-true`)
    const c002 = hash(`${questionUuidBase58}-20-false`)
    const c003 = hash(`${questionUuidBase58}-30-false`)
    const c004 = hash(`${questionUuidBase58}-40-bad`)
    const c005 = hash(`${questionUuidBase58}-50-true`)
    await program.methods.commit({ commitHash: c001 })
                         .accounts({ payer: user001.publicKey, payerTokenAccount: userTokenAccount001.address, oracle: oraclePda }).signers([user001]).rpc()
    await program.methods.commit({ commitHash: c002 })
                         .accounts({ payer: user002.publicKey, payerTokenAccount: userTokenAccount002.address, oracle: oraclePda }).signers([user002]).rpc()
    await program.methods.commit({ commitHash: c003 })
                         .accounts({ payer: user003.publicKey, payerTokenAccount: userTokenAccount003.address, oracle: oraclePda }).signers([user003]).rpc()
    await program.methods.commit({ commitHash: c004 })
                         .accounts({ payer: user004.publicKey, payerTokenAccount: userTokenAccount004.address, oracle: oraclePda }).signers([user004]).rpc()
    await program.methods.commit({ commitHash: c005 })
                         .accounts({ payer: user005.publicKey, payerTokenAccount: userTokenAccount005.address, oracle: oraclePda }).signers([user005]).rpc()
  })

  it("Reveal phase", async () => {
    await program.methods.revealize()
                         .accounts({ oracle: oraclePda }).signers([payer]).rpc()

  })

  it("Reveal", async () => {
    await program.methods.reveal({ commitNonce: new anchor.BN(10) })
                         .accounts({ payer: user001.publicKey, oracle: oraclePda }).signers([user001]).rpc()
    await program.methods.reveal({ commitNonce: new anchor.BN(20) })
                         .accounts({ payer: user002.publicKey, oracle: oraclePda }).signers([user002]).rpc()
    await program.methods.reveal({ commitNonce: new anchor.BN(30) })
                         .accounts({ payer: user003.publicKey, oracle: oraclePda }).signers([user003]).rpc()
    await program.methods.reveal({ commitNonce: new anchor.BN(40) })
                         .accounts({ payer: user004.publicKey, oracle: oraclePda }).signers([user004]).rpc()

    await program.methods.slash({ commitNonce: new anchor.BN(50) })
                         .accounts({ payer: user001.publicKey, 
                                     oracle: oraclePda,
                                     target: user005.publicKey }).signers([user001]).rpc()

    await assertTransactionFailed(
      () => program.methods.slash({ commitNonce: new anchor.BN(9999999) })
                           .accounts({ payer: user001.publicKey, 
                                       oracle: oraclePda,
                                       target: user004.publicKey }).signers([user001]).rpc(),
      "Invalid hash"
    )

    // const oracleAccount = await program.account.oracle.fetch(oraclePda);
    // console.log("Oracle account", oracleAccount);
  })

  it("Finalize", async () => {
    await program.methods.finalize()
                         .accounts({ oracle: oraclePda }).signers([payer]).rpc()
    const oracleAccount = await program.account.oracle.fetch(oraclePda);
    console.log("Oracle account", oracleAccount);
  })

  it("Claim", async () => {

    await assertTransactionFailed(
      () => program.methods.claim()
                           .accounts({ claimant: user001.publicKey, claimantTokenAccount: userTokenAccount001.address, oracle: oraclePda }).signers([user001]).rpc(),
      "Invalid resolution"
    )

    await program.methods.claim()
                         .accounts({ claimant: user002.publicKey, claimantTokenAccount: userTokenAccount002.address, oracle: oraclePda }).signers([user002]).rpc()
    await program.methods.claim()
                         .accounts({ claimant: user003.publicKey, claimantTokenAccount: userTokenAccount003.address, oracle: oraclePda }).signers([user003]).rpc()

    await assertTransactionFailed(
      () => program.methods.claim()
                           .accounts({ claimant: user004.publicKey, claimantTokenAccount: userTokenAccount004.address, oracle: oraclePda }).signers([user004]).rpc(),
      "Commitment slashed"
    )

    await assertTransactionFailed(
      () => program.methods.claim()
                           .accounts({ claimant: user005.publicKey, claimantTokenAccount: userTokenAccount005.address, oracle: oraclePda }).signers([user005]).rpc(),
      "Commitment slashed"
    )

    // const userTokenAccount001Balance = await connection.getTokenAccountBalance(userTokenAccount001.address);
    // console.log("User token account 001 balance", userTokenAccount001Balance);
  })
})