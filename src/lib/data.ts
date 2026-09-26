import { prisma } from "@/lib/prisma"

export type AccountWithCard = {
  id: string
  type: "CHECKING" | "SAVINGS"
  nickname: string | null
  accountNumber: string
  routingNumber: string
  balance: number
  isActive: boolean
  createdAt: string
  card: {
    id: string
    last4: string
    network: "VISA" | "MASTERCARD"
    frozen: boolean
    spendLimit: number
    expiryMonth: number
    expiryYear: number
  } | null
}

export async function getAccountsForUser(userId: string): Promise<AccountWithCard[]> {
  const accounts = await prisma.account.findMany({
    where: { userId },
    include: { card: true },
    orderBy: { createdAt: "asc" },
  })

  // Prisma's Decimal type isn't plain-serializable across the Server ->
  // Client Component boundary, so convert to plain numbers/strings here.
  return accounts.map((a) => ({
    id: a.id,
    type: a.type,
    nickname: a.nickname,
    accountNumber: a.accountNumber,
    routingNumber: a.routingNumber,
    balance: Number(a.balance),
    isActive: a.isActive,
    createdAt: a.createdAt.toISOString(),
    card: a.card
      ? {
          id: a.card.id,
          last4: a.card.last4,
          network: a.card.network,
          frozen: a.card.frozen,
          spendLimit: Number(a.card.spendLimit),
          expiryMonth: a.card.expiryMonth,
          expiryYear: a.card.expiryYear,
        }
      : null,
  }))
}

export type TransactionRow = {
  id: string
  type: string
  status: string
  amount: number
  category: string | null
  description: string | null
  direction: "in" | "out"
  accountNickname: string | null
  createdAt: string
}

export async function getRecentTransactionsForUser(
  userId: string,
  limit = 10
): Promise<TransactionRow[]> {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { id: true, nickname: true, type: true },
  })
  const accountIds = accounts.map((a) => a.id)
  const nicknameById = new Map(
    accounts.map((a) => [a.id, a.nickname || (a.type === "CHECKING" ? "Checking" : "Savings")])
  )

  if (accountIds.length === 0) return []

  const transactions = await prisma.transaction.findMany({
    where: {
      OR: [
        { sourceAccountId: { in: accountIds } },
        { destinationAccountId: { in: accountIds } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  })

  return transactions.map((t) => {
    // A transfer between two of the user's own accounts still counts as
    // "out" from the source side for display purposes.
    const isIncoming = t.destinationAccountId ? accountIds.includes(t.destinationAccountId) : false
    const relevantAccountId = isIncoming ? t.destinationAccountId : t.sourceAccountId

    return {
      id: t.id,
      type: t.type,
      status: t.status,
      amount: Number(t.amount),
      category: t.category,
      description: t.description,
      direction: isIncoming ? "in" : "out",
      accountNickname: relevantAccountId ? nicknameById.get(relevantAccountId) ?? null : null,
      createdAt: t.createdAt.toISOString(),
    }
  })
}

export type BalancePoint = { date: string; balance: number }

export async function getBalanceHistoryForUser(userId: string): Promise<BalancePoint[]> {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { id: true },
  })
  const accountIds = accounts.map((a) => a.id)
  if (accountIds.length === 0) return []

  const transactions = await prisma.transaction.findMany({
    where: {
      status: "COMPLETED",
      OR: [
        { sourceAccountId: { in: accountIds } },
        { destinationAccountId: { in: accountIds } },
      ],
    },
    orderBy: { createdAt: "asc" },
  })

  // Reconstruct the running total balance across all of the user's accounts,
  // purely from real transaction history — no fabricated data. A transfer
  // between two of the user's own accounts nets to zero, as it should.
  let running = 0
  return transactions.map((t) => {
    const amount = Number(t.amount)
    const isIncoming = t.destinationAccountId ? accountIds.includes(t.destinationAccountId) : false
    const isOutgoing = t.sourceAccountId ? accountIds.includes(t.sourceAccountId) : false
    if (isIncoming) running += amount
    if (isOutgoing) running -= amount
    return { date: t.completedAt?.toISOString() ?? t.createdAt.toISOString(), balance: running }
  })
}

export type TransferRow = {
  id: string
  direction: "sent" | "received"
  amount: number
  status: string
  counterpartyLabel: string
  note: string | null
  createdAt: string
}

export async function getTransfersForUser(userId: string, limit = 50): Promise<TransferRow[]> {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { id: true, nickname: true, type: true },
  })
  const accountIds = accounts.map((a) => a.id)
  const nicknameById = new Map(
    accounts.map((a) => [a.id, a.nickname || (a.type === "CHECKING" ? "Checking" : "Savings")])
  )
  if (accountIds.length === 0) return []

  const transfers = await prisma.transaction.findMany({
    where: {
      type: { in: ["TRANSFER_INTERNAL", "TRANSFER_P2P", "TRANSFER_EXTERNAL"] },
      OR: [
        { sourceAccountId: { in: accountIds } },
        { destinationAccountId: { in: accountIds } },
      ],
    },
    include: {
      sourceAccount: { select: { id: true, nickname: true, type: true, user: { select: { firstName: true } } } },
      destinationAccount: { select: { id: true, nickname: true, type: true, user: { select: { firstName: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  })

  return transfers.map((t) => {
    const sentByMe = t.sourceAccountId ? accountIds.includes(t.sourceAccountId) : false
    const direction: "sent" | "received" = sentByMe ? "sent" : "received"

    const otherAccount = sentByMe ? t.destinationAccount : t.sourceAccount
    const isOwnAccount = otherAccount?.id ? accountIds.includes(otherAccount.id) : false

    let counterpartyLabel = "Anchor account"
    if (otherAccount) {
      counterpartyLabel = isOwnAccount
        ? nicknameById.get(otherAccount.id) ?? "Your account"
        : `${otherAccount.user.firstName}'s account`
    }

    return {
      id: t.id,
      direction,
      amount: Number(t.amount),
      status: t.status,
      counterpartyLabel,
      note: t.description,
      createdAt: t.createdAt.toISOString(),
    }
  })
}

export async function getAllTransactionsForUser(userId: string): Promise<TransactionRow[]> {
  return getRecentTransactionsForUser(userId, 500)
}

export type PayeeRow = {
  id: string
  name: string
  accountRef: string
  amount: number
  frequency: string
  isActive: boolean
  sourceAccountId: string
  sourceAccountNickname: string
}

export async function getPayeesForUser(userId: string): Promise<PayeeRow[]> {
  const payees = await prisma.payee.findMany({
    where: { userId },
    include: { sourceAccount: { select: { nickname: true, type: true } } },
    orderBy: { createdAt: "desc" },
  })

  return payees.map((p) => ({
    id: p.id,
    name: p.name,
    accountRef: p.accountRef,
    amount: Number(p.amount),
    frequency: p.frequency,
    isActive: p.isActive,
    sourceAccountId: p.sourceAccountId,
    sourceAccountNickname: p.sourceAccount.nickname || (p.sourceAccount.type === "CHECKING" ? "Checking" : "Savings"),
  }))
}

export type NotificationRow = {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

export async function getNotificationsForUser(userId: string): Promise<NotificationRow[]> {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }))
}

export type LoginActivityRow = {
  id: string
  device: string
  ipAddress: string | null
  success: boolean
  createdAt: string
}

function parseUserAgent(ua: string | null): string {
  if (!ua) return "Unknown device"
  const isMobile = /Mobile|Android|iPhone/i.test(ua)
  let browser = "Browser"
  if (ua.includes("Edg/")) browser = "Edge"
  else if (ua.includes("Chrome/")) browser = "Chrome"
  else if (ua.includes("Firefox/")) browser = "Firefox"
  else if (ua.includes("Safari/")) browser = "Safari"
  const os = ua.includes("Windows")
    ? "Windows"
    : ua.includes("Mac OS")
      ? "macOS"
      : ua.includes("Android")
        ? "Android"
        : ua.includes("iPhone") || ua.includes("iPad")
          ? "iOS"
          : ua.includes("Linux")
            ? "Linux"
            : ""
  return `${browser}${os ? ` on ${os}` : ""}${isMobile ? " (mobile)" : ""}`
}

export async function getLoginActivityForUser(userId: string, limit = 10): Promise<LoginActivityRow[]> {
  const activity = await prisma.loginActivity.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  })

  return activity.map((a) => ({
    id: a.id,
    device: parseUserAgent(a.userAgent),
    ipAddress: a.ipAddress,
    success: a.success,
    createdAt: a.createdAt.toISOString(),
  }))
}

export type StaffUserRow = {
  id: string
  name: string
  email: string
  role: string
  kycStatus: string
  createdAt: string
  accounts: { id: string; label: string; accountNumber: string; balance: number }[]
}

export async function getUsersForStaff(): Promise<StaffUserRow[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { accounts: { select: { id: true, nickname: true, type: true, accountNumber: true, balance: true } } },
    take: 200,
  })

  return users.map((u) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`,
    email: u.email,
    role: u.role,
    kycStatus: u.kycStatus,
    createdAt: u.createdAt.toISOString(),
    accounts: u.accounts.map((a) => ({
      id: a.id,
      label: a.nickname || (a.type === "CHECKING" ? "Checking" : "Savings"),
      accountNumber: a.accountNumber,
      balance: Number(a.balance),
    })),
  }))
}

export type StaffTransactionRow = {
  id: string
  type: string
  status: string
  amount: number
  description: string | null
  fromLabel: string
  toLabel: string
  createdAt: string
}

export async function getRecentTransactionsForStaff(limit = 50): Promise<StaffTransactionRow[]> {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      sourceAccount: { select: { nickname: true, type: true, user: { select: { firstName: true, lastName: true } } } },
      destinationAccount: { select: { nickname: true, type: true, user: { select: { firstName: true, lastName: true } } } },
    },
  })

  const label = (acc: (typeof transactions)[number]["sourceAccount"]) =>
    acc ? `${acc.user.firstName} ${acc.user.lastName} (${acc.nickname || acc.type})` : "External"

  return transactions.map((t) => ({
    id: t.id,
    type: t.type,
    status: t.status,
    amount: Number(t.amount),
    description: t.description,
    fromLabel: t.sourceAccount ? label(t.sourceAccount) : "—",
    toLabel: t.destinationAccount ? label(t.destinationAccount) : (t.counterpartyName ?? "—"),
    createdAt: t.createdAt.toISOString(),
  }))
}

export type DashboardSummary = {
  totalBalance: number
  checkingBalance: number
  savingsBalance: number
  accountCount: number
}

export async function getDashboardSummary(userId: string): Promise<DashboardSummary> {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { type: true, balance: true },
  })

  const checkingBalance = accounts
    .filter((a) => a.type === "CHECKING")
    .reduce((sum, a) => sum + Number(a.balance), 0)
  const savingsBalance = accounts
    .filter((a) => a.type === "SAVINGS")
    .reduce((sum, a) => sum + Number(a.balance), 0)

  return {
    totalBalance: checkingBalance + savingsBalance,
    checkingBalance,
    savingsBalance,
    accountCount: accounts.length,
  }
}
