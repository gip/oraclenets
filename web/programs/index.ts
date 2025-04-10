// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import OraclenetsIDL from './oraclenets.json'
import type { Oraclenets } from './oraclenets'

// Re-export the generated IDL and type
export { Oraclenets, OraclenetsIDL }

// The programId is imported from the program IDL.
export const COUNTER_PROGRAM_ID = new PublicKey(OraclenetsIDL.address)

// This is a helper function to get the Counter Anchor program.
export function getOraclenetsProgram(provider: AnchorProvider, address?: PublicKey) {
  return new Program({ ...OraclenetsIDL, address: address ? address.toBase58() : OraclenetsIDL.address } as Oraclenets, provider)
}

// This is a helper function to get the program ID for the Counter program depending on the cluster.
export function getOraclenetsProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Counter program on devnet and testnet.
      // return new PublicKey('GB7w5vu4TfeXVDmcJpRTY1Rr9mHFcURVmN2AiAcHNNpW')
      return new PublicKey('7QJjHQAsytvvrNmqPJajKYKXwZXtVHd8T3t9bBVvxtMY')
    case 'mainnet-beta':
    default:
      return COUNTER_PROGRAM_ID
  }
}