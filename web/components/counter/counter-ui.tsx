'use client'

import { Keypair, PublicKey } from '@solana/web3.js'
import { useMemo } from 'react'
import { ellipsify } from '../ui/ui-layout'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useCounterProgram, useCounterProgramAccount } from './counter-data-access'
import { useWallet } from '@solana/wallet-adapter-react'

export function CounterCreate() {
  const { initialize, accounts, programId } = useCounterProgram()
  const { publicKey } = useWallet()

  return (
    <><button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => {
        const question = window.prompt('What is the question you would like the oracle to answer?')
        if (question) {
          initialize.mutateAsync(question.substring(0, 63))
        }
      }}
      disabled={initialize.isPending}
    >
      Create {initialize.isPending && '...'}
    </button>
    </>
  )
}

export function CounterList({ owner }: { owner: PublicKey }) {
  const { accounts, getProgramAccount } = useCounterProgram()

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>Program account not found. Make sure you have deployed the program and are on the correct cluster.</span>
      </div>
    )
  }
  return (
    <div className={'space-y-6'}>
      {accounts.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : accounts.data?.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {accounts.data?.map((account) => (
            <CounterCard key={account.publicKey.toString()} owner={owner} account={account.publicKey} />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={'text-2xl'}>No accounts</h2>
          No accounts found. Create one above to get started.
        </div>
      )}
    </div>
  )
}

function CounterCard({ account, owner }: { account: PublicKey, owner: PublicKey }) {
  const { accountQuery, commitMutation, revealizeMutation, finalizeMutation, claimMutation } = useCounterProgramAccount({
    account,
  })

  const stage = useMemo(() => Object.keys(accountQuery.data?.stage || {})[0]?.charAt(0).toUpperCase() + Object.keys(accountQuery.data?.stage || {})[0]?.slice(1), [accountQuery.data?.stage])
  const question = useMemo(() => accountQuery.data?.question.toString(), [accountQuery.data?.question])
  const amOwner = useMemo(() => owner.toBase58() === accountQuery.data?.owner.toBase58(), [owner, accountQuery.data?.owner])
  const stake = useMemo(() => accountQuery.data?.collateralAmount.toString(), [accountQuery.data?.collateralAmount])
  const countJoined = useMemo(() => accountQuery.data?.countJoined ?? 0, [accountQuery.data?.countJoined])
  const countResolutionTrue = useMemo(() => accountQuery.data?.countResolutionTrue ?? 0, [accountQuery.data?.countResolutionTrue])
  const countResolutionFalse = useMemo(() => accountQuery.data?.countResolutionFalse ?? 0, [accountQuery.data?.countResolutionFalse])

  return accountQuery.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <div className="card card-bordered border-base-300 border-4 text-neutral-content p-2" style={{ width: '350px' }}>
      <div className="flex justify-between">
        <span>
          <span className="bg-blue-100 text-blue-800 text-sm font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-blue-900 dark:text-blue-300">{stage}</span>
          {amOwner && (
            <span className="bg-green-100 text-green-800 text-sm font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-green-900 dark:text-green-300">Owner</span>
          )}
        </span>
        <ExplorerLink path={`account/${account}`} label={ellipsify(account.toString())} />
      </div>
      <div className="card-title text-2xl flex justify-center p-2">{question || '<No question>'}</div>
      <p>Joined: {countJoined.toString()}</p>
      <p>Owner: {amOwner ? 'Yes' : 'No'}</p>
      <p>Stake: {stake}</p>
      <p>True {countResolutionTrue.toString()} vs False {countResolutionFalse.toString()}</p>
      <div className="card-body items-center text-center">
        <div className="space-y-6">
          <div className="card-actions justify-around">
            {stage === 'Commit' && (
              <>
                <button
                  className="btn btn-xs lg:btn-md btn-outline text-xs"
                  onClick={() => commitMutation.mutateAsync({ response: true, questionUuid: accountQuery.data?.uuid!, payer: accountQuery.data?.owner! })}
                  disabled={commitMutation.isPending}
                >
                  Commit True
                </button>
                <button
                  className="btn btn-xs lg:btn-md btn-outline"
                  onClick={() => commitMutation.mutateAsync({ response: false, questionUuid: accountQuery.data?.uuid!, payer: accountQuery.data?.owner! })}
                  disabled={commitMutation.isPending}
                >
                  Commit False
                </button>
                {amOwner && (
                  <button
                    className="btn btn-xs lg:btn-md btn-outline"
                    onClick={() => revealizeMutation.mutateAsync({ response: false, questionUuid: accountQuery.data?.uuid!, payer: accountQuery.data?.owner! })}
                    disabled={revealizeMutation.isPending}
                  >
                    Revealize
                  </button>
                )}
              </>
            )}
            
            {stage === 'Reveal' && (
              <>
                <button
                  className="btn btn-xs lg:btn-md btn-outline"
                  onClick={() => revealizeMutation.mutateAsync({ response: false, questionUuid: accountQuery.data?.uuid!, payer: accountQuery.data?.owner! })}
                  disabled={revealizeMutation.isPending}
                >
                  Reveal
                </button>
                {amOwner && (
                  <button
                    className="btn btn-xs lg:btn-md btn-outline"
                    onClick={() => finalizeMutation.mutateAsync({ response: false, questionUuid: accountQuery.data?.uuid!, payer: accountQuery.data?.owner! })}
                    disabled={finalizeMutation.isPending}
                  >
                    Finalize
                  </button>
                )}
              </>
            )}
            
            {stage === 'Claim' && (
              <button
                className="btn btn-xs lg:btn-md btn-outline text-xs"
                onClick={() => claimMutation.mutateAsync({ response: true, questionUuid: accountQuery.data?.uuid!, payer: accountQuery.data?.owner! })}
                disabled={claimMutation.isPending}
              >
                Claim
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
