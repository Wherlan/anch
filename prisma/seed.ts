import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

function randomAccountNumber() {
  return Math.floor(1_000_000_000 + Math.random() * 8_999_999_999).toString()
}

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10)

  const user = await prisma.user.upsert({
    where: { email: "demo@anchor.bank" },
    update: {},
    create: {
      email: "demo@anchor.bank",
      passwordHash,
      firstName: "Jordan",
      lastName: "Ade",
      dateOfBirth: new Date("1994-03-12"),
      address: "12 Ledger Street, Lagos, NG",
      role: "USER",
      kycStatus: "VERIFIED",
      emailVerified: true,
    },
  })

  const existingAccounts = await prisma.account.findFirst({ where: { userId: user.id } })
  if (existingAccounts) {
    console.log("Seed skipped: demo user already has accounts.", { user: user.email })
    return
  }

  const checking = await prisma.account.create({
    data: {
      userId: user.id,
      type: "CHECKING",
      nickname: "Everyday Checking",
      accountNumber: randomAccountNumber(),
      routingNumber: "021000021",
      balance: 4820.55,
    },
  })

  const savings = await prisma.account.create({
    data: {
      userId: user.id,
      type: "SAVINGS",
      nickname: "Rainy Day Savings",
      accountNumber: randomAccountNumber(),
      routingNumber: "021000021",
      balance: 12500.0,
    },
  })

  await prisma.card.create({
    data: {
      accountId: checking.id,
      last4: "4821",
      expiryMonth: 11,
      expiryYear: 2029,
      spendLimit: 5000,
    },
  })

  await prisma.transaction.createMany({
    data: [
      {
        type: "DEPOSIT",
        status: "COMPLETED",
        amount: 2500.0,
        category: "Payroll",
        description: "Payroll deposit",
        destinationAccountId: checking.id,
        completedAt: new Date(),
      },
      {
        type: "TRANSFER_INTERNAL",
        status: "COMPLETED",
        amount: 500.0,
        category: "Transfer",
        description: "Checking to Savings",
        sourceAccountId: checking.id,
        destinationAccountId: savings.id,
        completedAt: new Date(),
      },
      {
        type: "WITHDRAWAL",
        status: "COMPLETED",
        amount: 84.2,
        category: "Groceries",
        description: "Groceries",
        sourceAccountId: checking.id,
        completedAt: new Date(),
      },
    ],
  })

  console.log("Seed complete:", { user: user.email, checking: checking.accountNumber, savings: savings.accountNumber })

  await prisma.user.upsert({
    where: { email: "staff@anchor.bank" },
    update: {},
    create: {
      email: "staff@anchor.bank",
      passwordHash,
      firstName: "Staff",
      lastName: "Account",
      dateOfBirth: new Date("1990-01-01"),
      address: "Internal",
      role: "STAFF",
      kycStatus: "VERIFIED",
      emailVerified: true,
    },
  })
  console.log("Staff login: staff@anchor.bank / Password123!")

  const tony = await prisma.user.upsert({
    where: { email: "tony@anchor.bank" },
    update: {},
    create: {
      email: "tony@anchor.bank",
      passwordHash,
      firstName: "Tony",
      lastName: "Stark",
      dateOfBirth: new Date("1970-05-29"),
      address: "10880 Malibu Point, Malibu, CA",
      role: "USER",
      kycStatus: "VERIFIED",
      emailVerified: true,
    },
  })
  const existingTonyAccounts = await prisma.account.findFirst({ where: { userId: tony.id } })
  if (!existingTonyAccounts) {
    const tonyChecking = await prisma.account.create({
      data: {
        userId: tony.id, type: "CHECKING", nickname: "Stark Industries Operating",
        accountNumber: randomAccountNumber(), routingNumber: "021000021", balance: 4820000.55,
      },
    })
    const tonySavings = await prisma.account.create({
      data: {
        userId: tony.id, type: "SAVINGS", nickname: "Personal Reserve",
        accountNumber: randomAccountNumber(), routingNumber: "021000021", balance: 12500000.0,
      },
    })
    await prisma.card.create({
      data: { accountId: tonyChecking.id, last4: "0079", network: "MASTERCARD", expiryMonth: 12, expiryYear: 2030, spendLimit: 100000 },
    })
    await prisma.transaction.createMany({
      data: [
        { type: "DEPOSIT", status: "COMPLETED", amount: 4820000.55, category: "Welcome Deposit", description: "Anchor opening deposit", destinationAccountId: tonyChecking.id, completedAt: new Date() },
        { type: "DEPOSIT", status: "COMPLETED", amount: 12500000.0, category: "Welcome Deposit", description: "Anchor opening deposit", destinationAccountId: tonySavings.id, completedAt: new Date() },
      ],
    })
  }
  console.log("Tony Stark login: tony@anchor.bank / Password123!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
