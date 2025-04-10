'use client'

import { getOraclenetsProgram, getOraclenetsProgramId } from '@project/anchor'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddress } from '@solana/spl-token'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'
import { BN } from '@coral-xyz/anchor'
import { hash } from '@/lib'
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes'

const usdcMint = new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr')

export function useCounterProgram() {
  const { publicKey, signTransaction, signAllTransactions } = useWallet()
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getOraclenetsProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getOraclenetsProgram(provider, programId), [provider, programId])

  const getStage = (account: any) => {
    return Object.keys(account.stage || {})[0]?.charAt(0).toUpperCase() + Object.keys(account.stage || {})[0]?.slice(1)
  }

  const accounts = useQuery({
    queryKey: ['counter', 'all', { cluster }],
    queryFn: () => program.account.oracle.all().then(accounts => accounts.reverse().sort((a, b) => getStage(a.account).localeCompare(getStage(b.account)))),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const initialize = useMutation({
    mutationKey: ['counter', 'initialize', { cluster }],
    mutationFn: async (question: string) => {
      const questionArray = Buffer.from(question)
      const questionUuid = hash(question)

      const [oraclePDA, oracleBump] = 
        PublicKey.findProgramAddressSync([Buffer.from("oracle"), publicKey!.toBuffer(), Buffer.from(questionUuid)], programId);

      const transaction = await program.methods
        .initialize({question: questionArray, questionUuid, collateralAmount: new BN(1_000_001) })
        .accounts({ 
            collateralMint: usdcMint,
          }).transaction();
    
      if (!signTransaction) throw new Error('Wallet not connected');

      const blockhash = (await connection.getLatestBlockhash('finalized')).blockhash
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey!
      const signedTransaction = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(signature);
      return signature
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: () => toast.error('Failed to initialize account'),
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
  }
}

export function useCounterProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useCounterProgram()
  const { connection } = useConnection()
  const { publicKey, signTransaction, signAllTransactions } = useWallet()
  const programId = useMemo(() => getOraclenetsProgramId(cluster.network as Cluster), [cluster])

  const accountQuery = useQuery({
    queryKey: ['counter', 'fetch', { cluster, account }],
    queryFn: () => program.account.oracle.fetch(account),
  })

  const commitMutation = useMutation({
    mutationKey: ['counter', 'decrement', { cluster, account }],
    mutationFn: async ({ response, questionUuid58, questionUuid, payer }: { response: boolean, questionUuid58: string, questionUuid: number[], payer: PublicKey }) => {
      const [oraclePDA, oracleBump] = 
        PublicKey.findProgramAddressSync([Buffer.from("oracle"), payer.toBuffer(), Buffer.from(questionUuid)], programId);
      console.log('oraclePDA', oraclePDA.toBase58())
      const payerTokenAccount = await getAssociatedTokenAddress(usdcMint, publicKey!)
      const nonce = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
      console.log('questionUuid', questionUuid58);
      window.alert(`A random will be used: ${nonce.toString()}`)
      localStorage.setItem(questionUuid58, nonce.toString())
      const commitHash = hash(`${questionUuid58}-${nonce.toString()}-${response ? 'true' : 'false'}`)
      const transaction = await program.methods
        .commit({ commitHash })
        .accounts({
          payer: publicKey!,
          payerTokenAccount: payerTokenAccount,
          oracle: oraclePDA,
        }).transaction();

      const blockhash = (await connection.getLatestBlockhash('finalized')).blockhash
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey!
      const signedTransaction = await signTransaction!(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(signature);
      return signature
    },
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const revealMutation = useMutation({
    mutationKey: ['counter', 'decrement', { cluster, account }],
    mutationFn: async ({ response, questionUuid58, questionUuid, payer }: { response: boolean, questionUuid58: string, questionUuid: number[], payer: PublicKey }) => {
      const [oraclePDA, oracleBump] = 
        PublicKey.findProgramAddressSync([Buffer.from("oracle"), payer.toBuffer(), Buffer.from(questionUuid)], programId);
      console.log('oraclePDA', oraclePDA.toBase58())
      console.log('questionUuid', questionUuid58);
      const commitNonce: BN = new BN(localStorage.getItem(questionUuid58) || '0')
      console.log('commitNonce', commitNonce.toString())
      const transaction = await program.methods
        .reveal({ commitNonce })
        .accounts({
          payer: publicKey!,
          oracle: oraclePDA,
        }).transaction();

      const blockhash = (await connection.getLatestBlockhash('finalized')).blockhash
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey!
      const signedTransaction = await signTransaction!(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(signature);
      return signature
    },
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const slashMutation = useMutation({
    mutationKey: ['counter', 'decrement', { cluster, account }],
    mutationFn: async ({ target, nonce, questionUuid58, questionUuid, payer }: { target: PublicKey, nonce: string, questionUuid58: string, questionUuid: number[], payer: PublicKey }) => {
      const [oraclePDA, oracleBump] = 
        PublicKey.findProgramAddressSync([Buffer.from("oracle"), payer.toBuffer(), Buffer.from(questionUuid)], programId);
      console.log('oraclePDA', oraclePDA.toBase58())
      console.log('questionUuid', questionUuid58);
      const commitNonce: BN = new BN(nonce)
      console.log('commitNonce', commitNonce.toString())
      const transaction = await program.methods
        .slash({ commitNonce })
        .accounts({
          payer: publicKey!,
          target,
          oracle: oraclePDA,
        }).transaction();

      const blockhash = (await connection.getLatestBlockhash('finalized')).blockhash
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey!
      const signedTransaction = await signTransaction!(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(signature);
      return signature
    },
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })  

  const revealizeMutation = useMutation({
    mutationKey: ['counter', 'decrement', { cluster, account }],
    mutationFn: async ({ questionUuid, payer }: { response: boolean, questionUuid: number[], payer: PublicKey }) => {
      const [oraclePDA, oracleBump] = 
        PublicKey.findProgramAddressSync([Buffer.from("oracle"), payer.toBuffer(), Buffer.from(questionUuid)], programId);
      const transaction = await program.methods
        .revealize()
        .accounts({
          oracle: oraclePDA,
        }).transaction();

      const blockhash = (await connection.getLatestBlockhash('finalized')).blockhash
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey!
      const signedTransaction = await signTransaction!(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(signature);
      return signature
    },
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const finalizeMutation = useMutation({
    mutationKey: ['counter', 'decrement', { cluster, account }],
    mutationFn: async ({ questionUuid, payer }: { response: boolean, questionUuid: number[], payer: PublicKey }) => {
      const [oraclePDA, oracleBump] = 
        PublicKey.findProgramAddressSync([Buffer.from("oracle"), payer.toBuffer(), Buffer.from(questionUuid)], programId);
      const transaction = await program.methods
        .finalize()
        .accounts({
          oracle: oraclePDA,
        }).transaction();

      const blockhash = (await connection.getLatestBlockhash('finalized')).blockhash
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey!
      const signedTransaction = await signTransaction!(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(signature);
      return signature
    },
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const claimMutation = useMutation({
    mutationKey: ['counter', 'decrement', { cluster, account }],
    mutationFn: async ({ response, questionUuid, payer }: { response: boolean, questionUuid: number[], payer: PublicKey }) => {
      const [oraclePDA, oracleBump] = 
        PublicKey.findProgramAddressSync([Buffer.from("oracle"), payer.toBuffer(), Buffer.from(questionUuid)], programId);
      const payerTokenAccount = await getAssociatedTokenAddress(usdcMint, publicKey!)
      const transaction = await program.methods
        .claim()
        .accounts({
          claimant: publicKey!,
          claimantTokenAccount: payerTokenAccount,
          oracle: oraclePDA,
        }).transaction();

      const blockhash = (await connection.getLatestBlockhash('finalized')).blockhash
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey!
      const signedTransaction = await signTransaction!(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(signature);
      return signature
    },
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const closeMutation = useMutation({
    mutationKey: ['counter', 'decrement', { cluster, account }],
    mutationFn: async ({ questionUuid, payer }: { response: boolean, questionUuid: number[], payer: PublicKey }) => {
      const [oraclePDA, oracleBump] = 
        PublicKey.findProgramAddressSync([Buffer.from("oracle"), payer.toBuffer(), Buffer.from(questionUuid)], programId);
      const transaction = await program.methods
        .close()
        .accounts({
          oracle: oraclePDA,
        }).transaction();

      const blockhash = (await connection.getLatestBlockhash('finalized')).blockhash
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey!
      const signedTransaction = await signTransaction!(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(signature);
      return signature
    },
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })  

  return {
    accountQuery,
    commitMutation,
    revealMutation,
    slashMutation,
    revealizeMutation,
    finalizeMutation,
    claimMutation,
    closeMutation
  }
}
