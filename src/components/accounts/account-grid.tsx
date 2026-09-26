"use client"

import { useState } from "react"
import { LandmarkIcon, CreditCardIcon, SnowflakeIcon, EyeIcon, EyeOffIcon } from "lucide-react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import type { AccountWithCard } from "@/lib/data"

interface AccountCardProps {
  account: AccountWithCard
  index: number
  onSelect?: (account: AccountWithCard) => void
}

const fmt = (n: number) =>
  `$${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)}`

function maskAccountNumber(accountNumber: string) {
  return `••••${accountNumber.slice(-4)}`
}

export function AccountCard({ account, index, onSelect }: AccountCardProps) {
  const isSavings = account.type === "SAVINGS"
  const [showAccountNumber, setShowAccountNumber] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={() => onSelect?.(account)}
      className="group relative cursor-pointer overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 transition-shadow hover:shadow-md"
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          isSavings ? "bg-[#3F6B4E]" : "bg-accent"
        )}
      />

      <div className="p-4 pl-5">
        {/* Institution row */}
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <LandmarkIcon className="size-4" />
          </div>
          <span className="text-xs text-muted-foreground">
            {isSavings ? "Savings" : "Checking"}
            {!account.isActive && (
              <span className="ml-1.5 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                Inactive
              </span>
            )}
          </span>
        </div>

        {/* Account name + number */}
        <div className="mt-3">
          <p className="text-sm font-semibold">
            {account.nickname || (isSavings ? "Savings" : "Checking")}
          </p>
          <div className="flex items-center gap-2">
            <p className="font-mono text-xs text-muted-foreground">
              {showAccountNumber ? account.accountNumber : maskAccountNumber(account.accountNumber)}
            </p>
            <button
              type="button"
              onClick={() => setShowAccountNumber((shown) => !shown)}
              className="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={showAccountNumber ? "Hide account number" : "Show account number"}
              title={showAccountNumber ? "Hide account number" : "Show account number"}
            >
              {showAccountNumber ? <EyeOffIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
            </button>
          </div>
        </div>

        {/* Balance */}
        <p className="mt-3 tabular-nums text-xl font-bold font-display tracking-tight">
          {fmt(account.balance)}
        </p>

        {/* Card status */}
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            {account.card ? (
              <>
                {account.card.frozen ? (
                  <SnowflakeIcon className="size-3" />
                ) : (
                  <CreditCardIcon className="size-3" />
                )}
                <span>
                  Card •••• {account.card.last4}
                  {account.card.frozen && " — frozen"}
                </span>
              </>
            ) : (
              <span>No card linked</span>
            )}
          </div>
          <a
            href={`/api/statements?accountId=${account.id}&month=${new Date().toISOString().slice(0, 7)}`}
            className="font-medium text-accent hover:underline"
          >
            Statement
          </a>
        </div>
      </div>
    </motion.div>
  )
}
