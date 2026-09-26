import crypto from "crypto"

export function generateVerificationToken() {
  return crypto.randomBytes(32).toString("hex")
}

export const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
