import { randomInt } from "node:crypto"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()
const testBalance = 10_000
const routingNumber = "021000021"

function getConfiguredPasswords() {
  const tonyPassword = process.env.TONY_DAVIS_PASSWORD
  const staffPassword = process.env.STAFF_PASSWORD
  if (!tonyPassword || !staffPassword) {
    console.warn("Test accounts skipped: configure TONY_DAVIS_PASSWORD and STAFF_PASSWORD to seed them.")
    return null
  }
  if (tonyPassword.length < 12 || staffPassword.length < 12) {
    console.warn("Test accounts skipped: both test passwords must be at least 12 characters.")
    return null
  }
  return { tonyPassword, staffPassword }
}

function generateAccountNumber() {
  return randomInt(1_000_000_000, 10_000_000_000).toString()
}

async function main() {
  const passwords = getConfiguredPasswords()
  if (!passwords) return

  const tonyEmail = (process.env.TONY_DAVIS_EMAIL || "tony.davis@example.test").trim().toLowerCase()
  const staffEmail = (process.env.STAFF_EMAIL || "admin@example.test").trim().toLowerCase()
  if (tonyEmail === staffEmail) {
    console.warn("Test accounts skipped: TONY_DAVIS_EMAIL and STAFF_EMAIL must be different.")
    return
  }

  const [tonyPassword, staffPassword] = await Promise.all([
    bcrypt.hash(passwords.tonyPassword, 10),
    bcrypt.hash(passwords.staffPassword, 10),
  ])

  const tony = await prisma.user.upsert({
    where: { email: tonyEmail },
    update: {
      firstName: "Tony",
      lastName: "Davis",
      passwordHash: tonyPassword,
      role: "USER",
      emailVerified: true,
      kycStatus: "VERIFIED",
    },
    create: {
      email: tonyEmail,
      passwordHash: tonyPassword,
      firstName: "Tony",
      lastName: "Davis",
      dateOfBirth: new Date("1990-01-01"),
      address: "Test account",
      role: "USER",
      emailVerified: true,
      kycStatus: "VERIFIED",
    },
  })

  const tonyChecking = await prisma.account.findFirst({
    where: { userId: tony.id, type: "CHECKING" },
    select: { id: true, balance: true },
  })

  if (!tonyChecking) {
    await prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: {
          userId: tony.id,
          type: "CHECKING",
          nickname: "Tony Davis Checking",
          accountNumber: generateAccountNumber(),
          routingNumber,
          balance: testBalance,
        },
      })
      await tx.transaction.create({
        data: {
          type: "DEPOSIT",
          status: "COMPLETED",
          amount: testBalance,
          category: "Test funding",
          description: "Initial demo account balance",
          destinationAccountId: account.id,
          completedAt: new Date(),
        },
      })
    })
  } else {
    const initialFunding = await prisma.transaction.findFirst({
      where: {
        destinationAccountId: tonyChecking.id,
        type: "DEPOSIT",
        description: "Initial demo account balance",
      },
      select: { id: true },
    })
    const topUp = Math.max(0, testBalance - Number(tonyChecking.balance))

    if (!initialFunding && topUp > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.account.update({
          where: { id: tonyChecking.id },
          data: { balance: { increment: topUp } },
        })
        await tx.transaction.create({
          data: {
            type: "DEPOSIT",
            status: "COMPLETED",
            amount: topUp,
            category: "Test funding",
            description: "Initial demo account balance",
            destinationAccountId: tonyChecking.id,
            completedAt: new Date(),
          },
        })
      })
    }
  }

  await prisma.user.upsert({
    where: { email: staffEmail },
    update: {
      firstName: "Anchor",
      lastName: "Admin",
      passwordHash: staffPassword,
      role: "STAFF",
      emailVerified: true,
      kycStatus: "VERIFIED",
    },
    create: {
      email: staffEmail,
      passwordHash: staffPassword,
      firstName: "Anchor",
      lastName: "Admin",
      dateOfBirth: new Date("1990-01-01"),
      address: "Internal test account",
      role: "STAFF",
      emailVerified: true,
      kycStatus: "VERIFIED",
    },
  })

  console.log(`Test accounts ready: ${tonyEmail} and ${staffEmail}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
