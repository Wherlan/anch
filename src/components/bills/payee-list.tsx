"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ReceiptTextIcon, LoaderIcon, TrashIcon, CheckIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import type { PayeeRow } from "@/lib/data"

const frequencyLabel: Record<string, string> = {
  ONCE: "One time",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n)

export function PayeeList({ payees }: { payees: PayeeRow[] }) {
  const router = useRouter()
  const [payingId, setPayingId] = useState<string | null>(null)
  const [paidId, setPaidId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handlePay(payeeId: string) {
    setPayingId(payeeId)
    setError(null)
    try {
      const res = await fetch("/api/payees/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payeeId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Payment failed.")
        setPayingId(null)
        return
      }
      setPaidId(payeeId)
      setTimeout(() => {
        setPaidId(null)
        setPayingId(null)
        router.refresh()
      }, 1200)
    } catch {
      setError("Couldn't reach the server.")
      setPayingId(null)
    }
  }

  async function handleDelete(payeeId: string) {
    setDeletingId(payeeId)
    try {
      await fetch(`/api/payees/${payeeId}`, { method: "DELETE" })
      router.refresh()
    } finally {
      setDeletingId(null)
    }
  }

  if (payees.length === 0) {
    return (
      <EmptyState
        variant="generic"
        title="No payees yet"
        description="Add a payee to start paying bills from your account."
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-xs text-destructive">{error}</p>}
      {payees.map((payee) => (
        <Card key={payee.id} className="ring-1 ring-foreground/10">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ReceiptTextIcon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{payee.name}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="text-[10px]">{frequencyLabel[payee.frequency]}</Badge>
                <span className="text-[11px] text-muted-foreground">from {payee.sourceAccountNickname}</span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="tabular-nums text-sm font-semibold">{fmt(payee.amount)}</p>
            </div>
            <Button
              size="sm"
              className="shrink-0"
              onClick={() => handlePay(payee.id)}
              disabled={payingId === payee.id}
            >
              {paidId === payee.id ? (
                <CheckIcon className="size-4" />
              ) : payingId === payee.id ? (
                <LoaderIcon className="size-4 animate-spin" />
              ) : (
                "Pay now"
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(payee.id)}
              disabled={deletingId === payee.id}
            >
              <TrashIcon className="size-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
