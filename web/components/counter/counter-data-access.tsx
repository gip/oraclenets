'use client'

import { getOraclenetsProgram, getOraclenetsProgramId } from '@project/anchor'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'
import { BN } from '@coral-xyz/anchor'

export function useCounterProgram() {
  const { publicKey, signTransaction, signAllTransactions } = useWallet()
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getOraclenetsProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getOraclenetsProgram(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['counter', 'all', { cluster }],
    queryFn: () => program.account.oracle.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const initialize = useMutation({
    mutationKey: ['counter', 'initialize', { cluster }],
    mutationFn: async () => {
      console.log('AAA')
      const usdcMint = new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr')
      const questionUuid = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 
                            18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]
      // return program.methods.initialize({ questionUuid, collateralAmount: new BN(1_000_001) })
      //                       .accounts({ collateralMint: usdcMint }).signers([keypair]).rpc()

      const [oraclePDA, oracleBump] = 
        PublicKey.findProgramAddressSync([Buffer.from("oracle"), publicKey!.toBuffer(), Buffer.from(questionUuid)], programId);
      console.log('programId: ', programId.toBase58())
      console.log('AAD, oracle: ', oraclePDA.toBase58(), 'oracleBump: ', oracleBump)

      const transaction = await program.methods
        .initialize({ questionUuid, collateralAmount: new BN(1_000_001) })
        .accounts({ 
            collateralMint: usdcMint,
          }).transaction();
    
      console.log('AAB')
      if (!signTransaction) throw new Error('Wallet not connected');

      const blockhash = (await connection.getLatestBlockhash('finalized')).blockhash
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey!
      const signedTransaction = await signTransaction(transaction);
      console.log('AAC')
      
      // Send the signed transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      // Wait for confirmation
      await connection.confirmTransaction(signature);
    
      return signature;
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

  const accountQuery = useQuery({
    queryKey: ['counter', 'fetch', { cluster, account }],
    queryFn: () => program.account.oracle.fetch(account),
  })

  const closeMutation = useMutation({
    mutationKey: ['counter', 'close', { cluster, account }],
    mutationFn: () => program.methods.close().accounts({ counter: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accounts.refetch()
    },
  })

  const decrementMutation = useMutation({
    mutationKey: ['counter', 'decrement', { cluster, account }],
    mutationFn: () => program.methods.decrement().accounts({ counter: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const incrementMutation = useMutation({
    mutationKey: ['counter', 'increment', { cluster, account }],
    mutationFn: () => program.methods.increment().accounts({ counter: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const setMutation = useMutation({
    mutationKey: ['counter', 'set', { cluster, account }],
    mutationFn: (value: number) => program.methods.set(value).accounts({ counter: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  return {
    accountQuery,
    closeMutation,
    decrementMutation,
    incrementMutation,
    setMutation,
  }
}
