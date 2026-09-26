"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AccountWithCard } from "@/lib/data"

type CardInfo = NonNullable<AccountWithCard["card"]>

interface CardControlsProps {
  cardId: string
  card: CardInfo
  frozen: boolean
  onToggleFreeze: () => void
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function CardControls({ cardId, card, frozen, onToggleFreeze }: CardControlsProps) {
  const [spendLimit, setSpendLimit] = useState(card.spendLimit)
  const [saving, setSaving] = useState(false)

  async function saveSpendLimit(value: number) {
    setSaving(true)
    try {
      await fetch("/api/cards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, spendLimit: value }),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ── Freeze Toggle ── */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Card Status</p>
            <p className={cn("text-xs", frozen ? "text-destructive" : "text-muted-foreground")}>
              {frozen ? "Frozen" : "Active"}
            </p>
          </div>
          <Switch checked={frozen} onCheckedChange={() => onToggleFreeze()} />
        </div>

        {/* ── Spend Limit ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Spend Limit</p>
            <span className="text-sm font-medium tabular-nums">
              {formatCurrency(spendLimit)}
              {saving && <span className="ml-1.5 text-xs text-muted-foreground">saving…</span>}
            </span>
          </div>
          <Slider
            value={[spendLimit]}
            min={0}
            max={10000}
            step={100}
            onValueChange={(value) => {
              const v = Array.isArray(value) ? value[0] : value
              setSpendLimit(v)
            }}
            onValueCommitted={(value) => {
              const v = Array.isArray(value) ? value[0] : value
              saveSpendLimit(v)
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>$0</span>
            <span>$10,000</span>
          </div>
        </div>

        {/* ── Card Info ── */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Card Info</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="uppercase">
              {card.network}
            </Badge>
            <span className="text-xs text-muted-foreground tabular-nums">**** {card.last4}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
