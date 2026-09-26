import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notify } from "@/lib/notify"

const paySchema = z.object({
  payeeId: z.string().min(1),
  amount: z.number().positive().max(1_000_000).optional(),
})

class PayError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }
  const userId = session.user.id

  const body = await req.json()
  const parsed = paySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const payee = await tx.payee.findUnique({ where: { id: parsed.data.payeeId } })
      if (!payee || payee.userId !== userId) {
        throw new PayError("Payee not found", 404)
      }

      const account = await tx.account.findUnique({ where: { id: payee.sourceAccountId } })
      if (!account || account.userId !== userId) {
        throw new PayError("Source account not found", 404)
      }
      if (!account.isActive) {
        throw new PayError("Source account is inactive", 400)
      }

      const amount = parsed.data.amount ?? Number(payee.amount)
      const cents = Math.round(amount * 100)
      const safeAmount = cents / 100

      const debit = await tx.account.updateMany({
        where: { id: account.id, balance: { gte: safeAmount } },
        data: { balance: { decrement: safeAmount } },
      })
      if (debit.count === 0) {
        throw new PayError("Insufficient funds", 400)
      }

      const transaction = await tx.transaction.create({
        data: {
          type: "BILL_PAYMENT",
          status: "COMPLETED",
          amount: safeAmount,
          category: "Bill Payment",
          description: `Payment to ${payee.name}`,
          counterpartyName: payee.name,
          sourceAccountId: account.id,
          completedAt: new Date(),
        },
      })

      await notify(tx, {
        userId,
        title: "Bill paid",
        body: `$${safeAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} sent to ${payee.name}.`,
        type: "TRANSACTION",
      })

      return { transactionId: transaction.id }
    })

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    if (err instanceof PayError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error("Bill payment failed:", err)
    return NextResponse.json({ error: "Payment failed. Please try again." }, { status: 500 })
  }
}
