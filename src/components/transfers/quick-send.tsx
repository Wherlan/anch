"use client"

import { useState, useEffect } from "react"
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
import { SendIcon, LoaderCircleIcon, CheckCircle2Icon, UserCheckIcon, CircleAlertIcon } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import type { AccountWithCard } from "@/lib/data"

type SendState = "idle" | "sending" | "success"
type LookupState = "idle" | "checking" | "found" | "not-found"

export function QuickSend({ accounts }: { accounts: AccountWithCard[] }) {
  const router = useRouter()
  const active = accounts.filter((a) => a.isActive)
  const [fromId, setFromId] = useState(active[0]?.id ?? "")
  const [toAccountNumber, setToAccountNumber] = useState("")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [sendState, setSendState] = useState<SendState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [lookupState, setLookupState] = useState<LookupState>("idle")
  const [recipientName, setRecipientName] = useState<string | null>(null)

  // Debounced "name enquiry" — confirms who you're sending to before you can
  // send, the same way real bank transfer forms work.
  useEffect(() => {
    const num = toAccountNumber.trim()
    if (num.length < 6) return
    // Starting the "checking" state here is correct: it marks the moment
    // this debounced lookup begins, which can't be derived from render-time
    // values alone (unlike the idle/reset case above).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLookupState("checking")
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/accounts/lookup?accountNumber=${encodeURIComponent(num)}`)
        const data = await res.json()
        if (res.ok) {
          setRecipientName(data.name)
          setLookupState("found")
        } else {
          setRecipientName(null)
          setLookupState("not-found")
        }
      } catch {
        setRecipientName(null)
        setLookupState("not-found")
      }
    }, 500)
    return () => clearTimeout(handle)
  }, [toAccountNumber])

  const effectiveLookupState: LookupState = toAccountNumber.trim().length < 6 ? "idle" : lookupState

  const fromAccount = active.find((a) => a.id === fromId)
  const parsedAmount = parseFloat(amount)
  const canSend =
    fromId &&
    effectiveLookupState === "found" &&
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
        body: JSON.stringify({
          fromAccountId: fromId,
          toAccountNumber: toAccountNumber.trim(),
          amount: parsedAmount,
          description: note || undefined,
        }),
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
        setNote("")
        setToAccountNumber("")
        setLookupState("idle")
        setRecipientName(null)
        router.refresh()
      }, 1500)
    } catch {
      setError("Couldn't reach the server.")
      setSendState("idle")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Send to Another Account</CardTitle>
        <p className="text-xs text-muted-foreground">
          Send to any Anchor account using their account number
        </p>
      </CardHeader>
      <CardContent>
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
                ${parsedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} sent
              </p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">From</label>
                <Select value={fromId} onValueChange={(v) => v && setFromId(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {active.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.nickname} (${a.balance.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Recipient account number</label>
                <Input
                  value={toAccountNumber}
                  onChange={(e) => setToAccountNumber(e.target.value)}
                  placeholder="10-digit account number"
                  disabled={sendState === "sending"}
                />
                {effectiveLookupState === "checking" && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <LoaderCircleIcon className="size-3 animate-spin" /> Looking up account…
                  </p>
                )}
                {effectiveLookupState === "found" && recipientName && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-[#3F6B4E]">
                    <UserCheckIcon className="size-3.5" /> {recipientName} · Anchor
                  </p>
                )}
                {effectiveLookupState === "not-found" && (
                  <p className="flex items-center gap-1.5 text-xs text-destructive">
                    <CircleAlertIcon className="size-3.5" /> No Anchor account found with that number.
                  </p>
                )}
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
                  {sendState === "sending" ? "Sending..." : "Send"}
                </Button>
              </div>

              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note (optional)"
                disabled={sendState === "sending"}
              />

              {error && <p className="text-xs text-destructive">{error}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
