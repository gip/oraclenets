'use client'

import { Keypair, PublicKey } from '@solana/web3.js'
import { useMemo } from 'react'
import { ellipsify } from '../ui/ui-layout'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useCounterProgram, useCounterProgramAccount } from './counter-data-access'
import { useWallet } from '@solana/wallet-adapter-react'
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes'

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
          <h2 className={'text-2xl'}>Nothing there yet</h2>
          No oracles found. Create one above to get started.
        </div>
      )}
    </div>
  )
}

function CounterCard({ account, owner }: { account: PublicKey, owner: PublicKey }) {
  const { accountQuery, commitMutation, revealMutation, slashMutation, revealizeMutation, finalizeMutation, claimMutation, closeMutation } = useCounterProgramAccount({
    account,
  })

  const stage = useMemo(() => Object.keys(accountQuery.data?.stage || {})[0]?.charAt(0).toUpperCase() + Object.keys(accountQuery.data?.stage || {})[0]?.slice(1), [accountQuery.data?.stage])
  const question = useMemo(() => accountQuery.data?.question.toString(), [accountQuery.data?.question])
  const questionUuid = useMemo(() => accountQuery.data?.uuid, [accountQuery.data?.uuid])
  const questionUuid58 = useMemo(() => questionUuid && bs58.encode(questionUuid), [questionUuid])
  const amOwner = useMemo(() => owner.toBase58() === accountQuery.data?.owner.toBase58(), [owner, accountQuery.data?.owner])
  const stake = useMemo(() => accountQuery.data?.collateralAmount.toString(), [accountQuery.data?.collateralAmount])
  const countJoined = useMemo(() => accountQuery.data?.countJoined ?? 0, [accountQuery.data?.countJoined])
  const countSlashed = useMemo(() => accountQuery.data?.countSlashed ?? 0, [accountQuery.data?.countSlashed])
  const countResolutionTrue = useMemo(() => accountQuery.data?.countResolutionTrue ?? 0, [accountQuery.data?.countResolutionTrue])
  const countResolutionFalse = useMemo(() => accountQuery.data?.countResolutionFalse ?? 0, [accountQuery.data?.countResolutionFalse])
  const isTie = useMemo(() => accountQuery.data?.isTie ?? 0, [accountQuery.data?.isTie])
  const resolutionBit = useMemo(() => accountQuery.data?.resolutionBit ?? 0, [accountQuery.data?.resolutionBit])

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
      <p>Slashed: {countSlashed.toString()}</p>
      {questionUuid58 && localStorage.getItem(questionUuid58) && localStorage.getItem(questionUuid58) && <p>Nonce: stored locally</p>}
      {!(questionUuid58 && localStorage.getItem(questionUuid58) && localStorage.getItem(questionUuid58)) && <p>Nonce: unknown</p>}
      {(stage === 'Claim' || stage === 'Reveal') && <p>True {countResolutionTrue.toString()} vs False {countResolutionFalse.toString()}</p>}
      {stage === 'Claim' && <p>Tie: {isTie ? 'Yes' : 'No'}</p>}
      {stage === 'Claim' && !isTie&& <p>Resolution: {resolutionBit ? 'True' : 'False'}</p>}
      <div className="card-body items-center text-center">
        <div className="space-y-6">
          <div className="card-actions justify-around">
            {stage === 'Commit' && (
              <>
                <button
                  className="btn btn-xs lg:btn-md btn-outline text-xs"
                  onClick={() => {
                    commitMutation.mutateAsync({ response: true, questionUuid58: questionUuid58!, questionUuid: accountQuery.data?.uuid!, payer: accountQuery.data?.owner! })
                  }}
                  disabled={commitMutation.isPending}
                >
                  Commit True
                </button>
                <button
                  className="btn btn-xs lg:btn-md btn-outline"
                  onClick={() => {
                    commitMutation.mutateAsync({ response: false, questionUuid58: questionUuid58!, questionUuid: accountQuery.data?.uuid!, payer: accountQuery.data?.owner! })
                  }}
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
                  onClick={() => {
                    revealMutation.mutateAsync({ response: false, questionUuid58: questionUuid58!, questionUuid: accountQuery.data?.uuid!, payer: accountQuery.data?.owner! })
                  }}
                  disabled={revealizeMutation.isPending}
                >
                  Reveal
                </button>
                <button
                  className="btn btn-xs lg:btn-md btn-outline"
                  onClick={() => {
                    const target = window.prompt('Enter the target address')
                    const nonce = window.prompt('Enter the nonce')
                    if (target && nonce) {
                      slashMutation.mutateAsync({ target: new PublicKey(target), nonce, questionUuid58: questionUuid58!, questionUuid: accountQuery.data?.uuid!, payer: accountQuery.data?.owner! })
                    }
                  }}
                  disabled={revealizeMutation.isPending}
                >
                  Slash
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
            {stage === 'Claim' && amOwner && (
              <button
                className="btn btn-xs lg:btn-md btn-outline text-xs"
                onClick={() => closeMutation.mutateAsync({ response: true, questionUuid: accountQuery.data?.uuid!, payer: accountQuery.data?.owner! })}
                disabled={closeMutation.isPending}
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
