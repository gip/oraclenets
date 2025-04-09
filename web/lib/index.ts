import { createHash } from "crypto"

export const hash = (s: string): number[] => {
    const raw = createHash('sha256').update(s).digest('hex')
    return Array.from(Buffer.from(raw, 'hex'))
}
  