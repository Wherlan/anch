import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notify } from "@/lib/notify"

const transferSchema = z.object({
  fromAccountId: z.string().min(1),
  // Either an internal destination account id (own account) or an external
  // account number (P2P, another Anchor user) — never both.
  toAccountId: z.string().min(1).optional(),
  toAccountNumber: z.string().min(1).optional(),
  amount: z.number().positive().finite().max(1_000_000),
  description: z.string().max(140).optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }
  const userId = session.user.id

  const body = await req.json()
  const parsed = transferSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { fromAccountId, toAccountId, toAccountNumber, amount, description } = parsed.data

  if (!toAccountId && !toAccountNumber) {
    return NextResponse.json({ error: "A destination account is required" }, { status: 400 })
  }
  if (toAccountId && toAccountNumber) {
    return NextResponse.json({ error: "Provide only one destination" }, { status: 400 })
  }

  // Round to cents to avoid floating point drift before it ever touches the DB.
  const cents = Math.round(amount * 100)
  const safeAmount = cents / 100

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Ownership check: the source account MUST belong to the logged-in
      // user. Never trust the client for this — it's the whole ballgame
      // for preventing one user from draining another user's account.
      const fromAccount = await tx.account.findUnique({ where: { id: fromAccountId } })
      if (!fromAccount || fromAccount.userId !== userId) {
        throw new TransferError("Source account not found", 404)
      }
      if (!fromAccount.isActive) {
        throw new TransferError("Source account is inactive", 400)
      }

      // Resolve the destination account.
      const toAccount = toAccountId
        ? await tx.account.findUnique({ where: { id: toAccountId } })
        : await tx.account.findUnique({ where: { accountNumber: toAccountNumber! } })

      if (!toAccount) {
        throw new TransferError("Destination account not found", 404)
      }
      if (!toAccount.isActive) {
        throw new TransferError("Destination account is inactive", 400)
      }
      if (toAccount.id === fromAccount.id) {
        throw new TransferError("Cannot transfer to the same account", 400)
      }

      const isInternal = toAccount.userId === fromAccount.userId
      // If the caller said "P2P" (toAccountNumber) but it actually resolved
      // to one of their own accounts, that's fine — just treat it as
      // internal. But if they said "internal" (toAccountId) and it does NOT
      // belong to them, that's not allowed via this path.
      if (toAccountId && !isInternal) {
        throw new TransferError("That account does not belong to you", 403)
      }

      // Atomic, race-safe debit: only succeeds if the balance is still
      // sufficient AT THE MOMENT OF UPDATE, even under concurrent requests.
      const debit = await tx.account.updateMany({
        where: { id: fromAccount.id, balance: { gte: safeAmount } },
        data: { balance: { decrement: safeAmount } },
      })
      if (debit.count === 0) {
        throw new TransferError("Insufficient funds", 400)
      }

      await tx.account.update({
        where: { id: toAccount.id },
        data: { balance: { increment: safeAmount } },
      })

      const transaction = await tx.transaction.create({
        data: {
          type: isInternal ? "TRANSFER_INTERNAL" : "TRANSFER_P2P",
          status: "COMPLETED",
          amount: safeAmount,
          category: "Transfer",
          description: description || (isInternal ? "Transfer between accounts" : "Transfer to another user"),
          sourceAccountId: fromAccount.id,
          destinationAccountId: toAccount.id,
          completedAt: new Date(),
        },
      })

      const amountLabel = `$${safeAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
      await notify(tx, {
        userId,
        title: isInternal ? "Transfer completed" : "Money sent",
        body: `${amountLabel} moved from ${fromAccount.nickname ?? "your account"}.`,
        type: "TRANSACTION",
      })
      if (!isInternal) {
        await notify(tx, {
          userId: toAccount.userId,
          title: "Money received",
          body: `${amountLabel} was deposited into ${toAccount.nickname ?? "your account"}.`,
          type: "TRANSACTION",
        })
      }

      return { transactionId: transaction.id }
    })

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    if (err instanceof TransferError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error("Transfer failed:", err)
    return NextResponse.json({ error: "Transfer failed. Please try again." }, { status: 500 })
  }
}

class TransferError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}
