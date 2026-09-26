export function generateAccountNumber() {
  return Math.floor(1_000_000_000 + Math.random() * 8_999_999_999).toString()
}

// Sandbox routing number — not a real ABA routing number. Swap this for a
// real one only once connected to a licensed BaaS provider.
export const SANDBOX_ROUTING_NUMBER = "021000021"

// Starting balance every new sandbox account opens with, so the app has
// something to demo immediately after signup.
export const STARTING_CHECKING_BALANCE = 0
export const STARTING_SAVINGS_BALANCE = 0

export function generateCardLast4() {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

// Sandbox cards never carry a real, usable PAN or CVV — only the last 4
// digits are stored/shown, matching how real bank apps display cards after
// issuance (full number is never persistently visible).
export function defaultCardExpiry() {
  const now = new Date()
  return { expiryMonth: now.getMonth() + 1, expiryYear: now.getFullYear() + 4 }
}

export const DEFAULT_SPEND_LIMIT = 5000
