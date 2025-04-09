'use client'

import { AppHero } from '../ui/ui-layout'

export default function DashboardFeature() {
  return (
    <div>
      <AppHero title="gm" subtitle="An implementation of a simple oracle netword on Solana." />
      <div className="max-w-xl mx-auto py-6 sm:px-6 lg:px-8 text-center">
        <div className="space-y-2">
          <p>Please refer to the document sent by email to get started.</p>
          <p>Or simply click on 'Oracles' and connect your wallet to get started.</p>
        </div>
      </div>
    </div>
  )
}
