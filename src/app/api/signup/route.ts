import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import {
  generateAccountNumber,
  SANDBOX_ROUTING_NUMBER,
  STARTING_CHECKING_BALANCE,
  STARTING_SAVINGS_BALANCE,
  generateCardLast4,
  defaultCardExpiry,
  DEFAULT_SPEND_LIMIT,
} from "@/lib/accounts"
import { generateVerificationToken, VERIFICATION_TOKEN_TTL_MS } from "@/lib/tokens"
import { sendVerificationEmail } from "@/lib/email"

const signupSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  dateOfBirth: z.string(), // ISO date string from the form
  address: z.string().min(1),
})

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = signupSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { firstName, lastName, password, dateOfBirth, address } = parsed.data
  const email = parsed.data.email.trim().toLowerCase()

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      passwordHash,
      dateOfBirth: new Date(dateOfBirth),
      address,
      accounts: {
        create: [
          {
            type: "CHECKING",
            nickname: "Everyday Checking",
            accountNumber: generateAccountNumber(),
            routingNumber: SANDBOX_ROUTING_NUMBER,
            balance: STARTING_CHECKING_BALANCE,
            card: {
              create: {
                last4: generateCardLast4(),
                network: "VISA",
                ...defaultCardExpiry(),
                spendLimit: DEFAULT_SPEND_LIMIT,
              },
            },
          },
          {
            type: "SAVINGS",
            nickname: "Savings",
            accountNumber: generateAccountNumber(),
            routingNumber: SANDBOX_ROUTING_NUMBER,
            balance: STARTING_SAVINGS_BALANCE,
          },
        ],
      },
    },
    select: {
      id: true,
      email: true,
      accounts: { select: { id: true, type: true } },
    },
  })

  // Every balance must be explained by a transaction — record the opening
  // deposits so the ledger reconciles from day one.
  const openingDeposits = user.accounts
    .map((account) => ({
      type: "DEPOSIT" as const,
      status: "COMPLETED" as const,
      amount: account.type === "CHECKING" ? STARTING_CHECKING_BALANCE : STARTING_SAVINGS_BALANCE,
      category: "Welcome Deposit",
      description: "Anchor opening deposit",
      destinationAccountId: account.id,
      completedAt: new Date(),
    }))
    .filter((t) => t.amount > 0)

  if (openingDeposits.length > 0) {
    await prisma.transaction.createMany({ data: openingDeposits })
  }

  await prisma.notification.create({
    data: {
      userId: user.id,
      type: "SYSTEM",
      title: "Welcome to Anchor",
      body: "Your checking and savings accounts are ready to go.",
    },
  })

  const token = generateVerificationToken()
  await prisma.verificationToken.create({
    data: {
      email: user.email,
      token,
      expires: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    },
  })

  const verifyUrl = `${process.env.AUTH_URL || "http://localhost:3000"}/api/verify-email?token=${token}`
  await sendVerificationEmail(user.email, verifyUrl)

  return NextResponse.json({ success: true, userId: user.id })
}
