import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notify } from "@/lib/notify"

const adjustSchema = z.object({
  accountId: z.string().min(1),
  amount: z.number().finite().refine((n) => n !== 0, "Amount cannot be zero"),
  reason: z.string().min(5).max(200),
})

export async function POST(req: Request) {
  const session = await auth()
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!session?.user?.id || role !== "STAFF") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = adjustSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    )
  }

  const { accountId, amount, reason } = parsed.data
  const isCredit = amount > 0
  const absAmount = Math.abs(Math.round(amount * 100) / 100)

  try {
    await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({ where: { id: accountId } })
      if (!account) throw new Error("Account not found")

      if (isCredit) {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { increment: absAmount } },
        })
      } else {
        const debit = await tx.account.updateMany({
          where: { id: accountId, balance: { gte: absAmount } },
          data: { balance: { decrement: absAmount } },
        })
        if (debit.count === 0) throw new Error("Insufficient balance for this adjustment")
      }

      // Every adjustment is a real, visible transaction on the customer's
      // own statement — never a silent balance edit. This is what makes a
      // legitimate internal tool different from a fraudulent "admin panel"
      // that fakes balances behind the scenes.
      await tx.transaction.create({
        data: {
          type: isCredit ? "DEPOSIT" : "WITHDRAWAL",
          status: "COMPLETED",
          amount: absAmount,
          category: "Staff Adjustment",
          description: `Staff adjustment: ${reason}`,
          destinationAccountId: isCredit ? accountId : undefined,
          sourceAccountId: isCredit ? undefined : accountId,
          completedAt: new Date(),
        },
      })

      await notify(tx, {
        userId: account.userId,
        title: "Account adjustment",
        body: `${isCredit ? "+" : "-"}$${absAmount.toFixed(2)} — ${reason}`,
        type: "TRANSACTION",
      })
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Adjustment failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
