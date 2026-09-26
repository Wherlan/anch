import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const createPayeeSchema = z.object({
  name: z.string().min(1).max(60),
  accountRef: z.string().min(1).max(60),
  sourceAccountId: z.string().min(1),
  amount: z.number().positive().max(1_000_000),
  frequency: z.enum(["ONCE", "WEEKLY", "MONTHLY"]),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createPayeeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { name, accountRef, sourceAccountId, amount, frequency } = parsed.data

  // Ownership check: the paying account must belong to this user.
  const account = await prisma.account.findUnique({ where: { id: sourceAccountId } })
  if (!account || account.userId !== session.user.id) {
    return NextResponse.json({ error: "Source account not found" }, { status: 404 })
  }

  const payee = await prisma.payee.create({
    data: {
      userId: session.user.id,
      name,
      accountRef,
      sourceAccountId,
      amount,
      frequency,
    },
  })

  return NextResponse.json({ success: true, payeeId: payee.id })
}
