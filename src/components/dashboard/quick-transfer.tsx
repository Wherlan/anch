"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  SendIcon,
  LoaderCircleIcon,
  CheckCircle2Icon,
  ArrowRightIcon,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import type { AccountWithCard } from "@/lib/data"

type SendState = "idle" | "sending" | "success"

export function QuickTransfer({ accounts }: { accounts: AccountWithCard[] }) {
  const router = useRouter()
  const active = accounts.filter((a) => a.isActive)
  const [fromId, setFromId] = useState(active[0]?.id ?? "")
  const [toId, setToId] = useState(active[1]?.id ?? "")
  const [amount, setAmount] = useState("")
  const [sendState, setSendState] = useState<SendState>("idle")
  const [error, setError] = useState<string | null>(null)

  const fromAccount = active.find((a) => a.id === fromId)
  const toAccount = active.find((a) => a.id === toId)
  const parsedAmount = parseFloat(amount)

  const canSend =
    fromId &&
    toId &&
    fromId !== toId &&
    !Number.isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    (fromAccount ? parsedAmount <= fromAccount.balance : false)

  const handleSend = async () => {
    if (!canSend || sendState !== "idle") return
    setSendState("sending")
    setError(null)

    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromAccountId: fromId, toAccountId: toId, amount: parsedAmount }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Transfer failed.")
        setSendState("idle")
        return
      }
      setSendState("success")
      setTimeout(() => {
        setSendState("idle")
        setAmount("")
        router.refresh()
      }, 1500)
    } catch {
      setError("Couldn't reach the server.")
      setSendState("idle")
    }
  }

  if (active.length < 2) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Quick Transfer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Open a second account to move money between your own accounts here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">Quick Transfer</CardTitle>
        <p className="text-xs text-muted-foreground">Between your own accounts</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          {sendState === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-2 py-6"
            >
              <CheckCircle2Icon className="size-10 text-[#3F6B4E]" />
              <p className="text-sm font-semibold">
                ${parsedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} moved
              </p>
              <p className="text-xs text-muted-foreground">
                {fromAccount?.nickname} → {toAccount?.nickname}
              </p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="flex items-center gap-2">
                <Select value={fromId} onValueChange={(v) => v && setFromId(v)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="From" />
                  </SelectTrigger>
                  <SelectContent>
                    {active.map((a) => (
                      <SelectItem key={a.id} value={a.id} disabled={a.id === toId}>
                        {a.nickname} (${a.balance.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
                <Select value={toId} onValueChange={(v) => v && setToId(v)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="To" />
                  </SelectTrigger>
                  <SelectContent>
                    {active.map((a) => (
                      <SelectItem key={a.id} value={a.id} disabled={a.id === fromId}>
                        {a.nickname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs text-muted-foreground">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={sendState === "sending"}
                      className="h-10 pl-7 text-lg font-semibold tabular-nums"
                    />
                  </div>
                </div>
                <Button
                  className="h-10 gap-2 px-6"
                  disabled={!canSend || sendState === "sending"}
                  onClick={handleSend}
                >
                  {sendState === "sending" ? (
                    <LoaderCircleIcon className="size-4 animate-spin" />
                  ) : (
                    <SendIcon className="size-4" />
                  )}
                  {sendState === "sending" ? "Sending..." : "Move"}
                </Button>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
