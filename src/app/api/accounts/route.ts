import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { generateAccountNumber, SANDBOX_ROUTING_NUMBER, generateCardLast4, defaultCardExpiry, DEFAULT_SPEND_LIMIT } from "@/lib/accounts"

const openAccountSchema = z.object({
  type: z.enum(["CHECKING", "SAVINGS"]),
  nickname: z.string().min(1).max(40),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = openAccountSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const account = await prisma.account.create({
    data: {
      userId: session.user.id,
      type: parsed.data.type,
      nickname: parsed.data.nickname,
      accountNumber: generateAccountNumber(),
      routingNumber: SANDBOX_ROUTING_NUMBER,
      balance: 0,
      ...(parsed.data.type === "CHECKING"
        ? {
            card: {
              create: {
                last4: generateCardLast4(),
                network: "VISA",
                ...defaultCardExpiry(),
                spendLimit: DEFAULT_SPEND_LIMIT,
              },
            },
          }
        : {}),
    },
  })

  return NextResponse.json({ success: true, accountId: account.id })
}
