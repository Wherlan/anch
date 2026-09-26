// ---------------------------------------------------------------------------
// Seed data – realistic fintech dashboard mock data
// ---------------------------------------------------------------------------

// Avatar URLs (local)
const avatar = (id: number) => `/avatars/${id}.jpg`

// ── Contacts (Quick Transfer) ──────────────────────────────────────────────
export const contacts = [
  { id: "1", name: "Sarah Chen", avatar: avatar(1) },
  { id: "2", name: "Marcus Johnson", avatar: avatar(3) },
  { id: "3", name: "Elena Rodriguez", avatar: avatar(5) },
  { id: "4", name: "James Wilson", avatar: avatar(8) },
  { id: "5", name: "Aisha Patel", avatar: avatar(9) },
  { id: "6", name: "David Kim", avatar: avatar(11) },
  { id: "7", name: "Olivia Brown", avatar: avatar(16) },
  { id: "8", name: "Liam Murphy", avatar: avatar(12) },
]

// ── Account Cards ──────────────────────────────────────────────────────────
export type AccountCard = {
  id: string
  label: string
  balance: string
  currency: string
  variant: "default" | "dark" | "primary"
}

export const accountCards: AccountCard[] = [
  {
    id: "1",
    label: "Euro Account",
    balance: "42,500",
    currency: "€",
    variant: "default",
  },
  {
    id: "2",
    label: "Crypto Wallet",
    balance: "1.24",
    currency: "BTC",
    variant: "dark",
  },
  {
    id: "3",
    label: "Investment Portfolio",
    balance: "28,300",
    currency: "$",
    variant: "primary",
  },
]

// ── Wallet Balance ─────────────────────────────────────────────────────────
export const walletBalance = {
  amount: 84765.0,
  changePercent: 12.4,
  changeDirection: "up" as const,
}

// ── Monthly Spending Limit ─────────────────────────────────────────────────
export const spendingLimit = {
  budget: 3000,
  spent: 2180,
  remaining: 920,
  currency: "USD",
  periodStart: "Apr 01",
  periodEnd: "Apr 30",
}

// ── Money Movement ─────────────────────────────────────────────────────────
export const moneyMovement7d = [
  { label: "Sun", moneyIn: 2400, moneyOut: 1800 },
  { label: "Mon", moneyIn: 3200, moneyOut: 2100 },
  { label: "Tue", moneyIn: 2800, moneyOut: 1600 },
  { label: "Wed", moneyIn: 4100, moneyOut: 3120 },
  { label: "Thu", moneyIn: 3600, moneyOut: 2400 },
  { label: "Fri", moneyIn: 4250, moneyOut: 3120 },
  { label: "Sat", moneyIn: 1900, moneyOut: 1200 },
]

export const moneyMovement30d = [
  { label: "Week 1", moneyIn: 12400, moneyOut: 8900 },
  { label: "Week 2", moneyIn: 15800, moneyOut: 11200 },
  { label: "Week 3", moneyIn: 9600, moneyOut: 7400 },
  { label: "Week 4", moneyIn: 18200, moneyOut: 13500 },
]

export const moneyMovement90d = [
  { label: "Jan", moneyIn: 42500, moneyOut: 31200 },
  { label: "Feb", moneyIn: 38900, moneyOut: 29800 },
  { label: "Mar", moneyIn: 51200, moneyOut: 37400 },
  { label: "Apr", moneyIn: 46800, moneyOut: 34100 },
  { label: "May", moneyIn: 55300, moneyOut: 41200 },
  { label: "Jun", moneyIn: 48700, moneyOut: 35800 },
  { label: "Jul", moneyIn: 52100, moneyOut: 38900 },
  { label: "Aug", moneyIn: 44600, moneyOut: 33200 },
  { label: "Sep", moneyIn: 49800, moneyOut: 36500 },
  { label: "Oct", moneyIn: 53400, moneyOut: 39100 },
  { label: "Nov", moneyIn: 47200, moneyOut: 34800 },
  { label: "Dec", moneyIn: 56000, moneyOut: 41000 },
]

export const moneyMovementByPeriod = {
  "7d": moneyMovement7d,
  "30d": moneyMovement30d,
  "90d": moneyMovement90d,
} as const

// ── Logo helper ────────────────────────────────────────────────────────────
export const logo = (domain: string) =>
  `/logos/${domain.replace(/\./g, "-")}.png`

// ── Recent Transactions ────────────────────────────────────────────────────
export type Transaction = {
  id: string
  merchant: string
  transactionId: string
  amount: number
  date: string
  logo: string
  category: string
}

export const recentTransactions: Transaction[] = [
  {
    id: "1",
    merchant: "Spotify",
    transactionId: "INV_920076",
    amount: -9.99,
    date: "Apr 10, 2026",
    logo: logo("spotify.com"),
    category: "Entertainment",
  },
  {
    id: "2",
    merchant: "AWS Cloud Services",
    transactionId: "INV_918263",
    amount: -120.0,
    date: "Apr 09, 2026",
    logo: "/logos/aws-amazon-com.svg",
    category: "Technology",
  },
  {
    id: "3",
    merchant: "Stripe Payout",
    transactionId: "TXN_847291",
    amount: 4250.0,
    date: "Apr 08, 2026",
    logo: logo("stripe.com"),
    category: "Income",
  },
  {
    id: "4",
    merchant: "Figma Pro",
    transactionId: "INV_773920",
    amount: -15.0,
    date: "Apr 07, 2026",
    logo: logo("figma.com"),
    category: "Design",
  },
  {
    id: "5",
    merchant: "ChatGPT Plus",
    transactionId: "INV_920077",
    amount: -20.0,
    date: "Apr 06, 2026",
    logo: logo("openai.com"),
    category: "AI Tools",
  },
  {
    id: "6",
    merchant: "Google Workspace",
    transactionId: "INV_661204",
    amount: -12.0,
    date: "Apr 05, 2026",
    logo: logo("google.com"),
    category: "Productivity",
  },
  {
    id: "7",
    merchant: "Client Payment",
    transactionId: "TXN_559831",
    amount: 8500.0,
    date: "Apr 04, 2026",
    logo: logo("paypal.com"),
    category: "Income",
  },
]


// ══════════════════════════════════════════════════════════════════════════════
// PAGE DATA: Analytics
// ══════════════════════════════════════════════════════════════════════════════

export type SpendingHeatmapDay = { date: string; amount: number }

// Generate 365 days of spending data programmatically
function generateHeatmap(): SpendingHeatmapDay[] {
  const data: SpendingHeatmapDay[] = []
  const start = new Date(2025, 3, 14) // Apr 14, 2025
  for (let i = 0; i < 365; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const dayOfWeek = d.getDay()
    // Weekdays spend more, weekends less, some zero days
    const base = dayOfWeek === 0 || dayOfWeek === 6 ? 40 : 120
    const noise = Math.sin(i * 0.3) * 60 + Math.cos(i * 0.7) * 40
    const amount = Math.max(0, Math.round(base + noise + (i % 7) * 15))
    data.push({
      date: d.toISOString().split("T")[0],
      amount: Math.random() > 0.1 ? amount : 0, // 10% zero days
    })
  }
  return data
}

export const spendingHeatmapData = generateHeatmap()

export type CategoryBreakdown = {
  category: string
  amount: number
  color: string
  subcategories: { name: string; amount: number }[]
}

export const categoryBreakdowns: CategoryBreakdown[] = [
  { category: "Food & Dining", amount: 820, color: "var(--color-chart-1)", subcategories: [{ name: "Restaurants", amount: 420 }, { name: "Groceries", amount: 280 }, { name: "Coffee", amount: 120 }] },
  { category: "Transport", amount: 450, color: "var(--color-chart-2)", subcategories: [{ name: "Uber/Lyft", amount: 180 }, { name: "Gas", amount: 150 }, { name: "Public Transit", amount: 120 }] },
  { category: "Entertainment", amount: 340, color: "var(--color-chart-3)", subcategories: [{ name: "Streaming", amount: 45 }, { name: "Games", amount: 120 }, { name: "Events", amount: 175 }] },
  { category: "Shopping", amount: 560, color: "var(--color-chart-4)", subcategories: [{ name: "Clothing", amount: 280 }, { name: "Electronics", amount: 180 }, { name: "Home", amount: 100 }] },
  { category: "Subscriptions", amount: 215, color: "var(--color-chart-5)", subcategories: [{ name: "SaaS Tools", amount: 95 }, { name: "Media", amount: 45 }, { name: "Cloud", amount: 75 }] },
  { category: "Health", amount: 180, color: "var(--color-chart-1)", subcategories: [{ name: "Gym", amount: 50 }, { name: "Pharmacy", amount: 80 }, { name: "Supplements", amount: 50 }] },
  { category: "Travel", amount: 634, color: "var(--color-chart-2)", subcategories: [{ name: "Flights", amount: 389 }, { name: "Hotels", amount: 245 }] },
  { category: "Education", amount: 250, color: "var(--color-chart-3)", subcategories: [{ name: "Courses", amount: 150 }, { name: "Books", amount: 100 }] },
]

export type RecurringCharge = {
  id: string
  merchant: string
  logo: string
  amount: number
  frequency: "monthly" | "yearly"
  nextDate: string
  status: "wanted" | "review" | "unset"
  category: string
}

export const recurringCharges: RecurringCharge[] = [
  { id: "r1", merchant: "Spotify", logo: logo("spotify.com"), amount: 9.99, frequency: "monthly", nextDate: "May 10, 2026", status: "wanted", category: "Entertainment" },
  { id: "r2", merchant: "Netflix", logo: logo("netflix.com"), amount: 15.99, frequency: "monthly", nextDate: "May 02, 2026", status: "wanted", category: "Entertainment" },
  { id: "r3", merchant: "ChatGPT Plus", logo: logo("openai.com"), amount: 20.00, frequency: "monthly", nextDate: "May 06, 2026", status: "wanted", category: "AI Tools" },
  { id: "r4", merchant: "Figma Pro", logo: logo("figma.com"), amount: 15.00, frequency: "monthly", nextDate: "May 07, 2026", status: "wanted", category: "Design" },
  { id: "r5", merchant: "Adobe CC", logo: logo("adobe.com"), amount: 54.99, frequency: "monthly", nextDate: "Apr 29, 2026", status: "review", category: "Design" },
  { id: "r6", merchant: "AWS", logo: "/logos/aws-amazon-com.svg", amount: 120.00, frequency: "monthly", nextDate: "May 09, 2026", status: "wanted", category: "Technology" },
  { id: "r7", merchant: "Google Workspace", logo: logo("google.com"), amount: 12.00, frequency: "monthly", nextDate: "May 05, 2026", status: "wanted", category: "Productivity" },
  { id: "r8", merchant: "Slack", logo: logo("slack.com"), amount: 8.75, frequency: "monthly", nextDate: "Apr 28, 2026", status: "review", category: "Productivity" },
  { id: "r9", merchant: "GitHub Pro", logo: logo("github.com"), amount: 4.00, frequency: "monthly", nextDate: "Apr 27, 2026", status: "wanted", category: "Technology" },
  { id: "r10", merchant: "Notion", logo: logo("notion.so"), amount: 10.00, frequency: "monthly", nextDate: "Apr 26, 2026", status: "unset", category: "Productivity" },
  { id: "r11", merchant: "LinkedIn Premium", logo: logo("linkedin.com"), amount: 29.99, frequency: "monthly", nextDate: "Apr 24, 2026", status: "review", category: "Productivity" },
  { id: "r12", merchant: "iCloud+", logo: logo("apple.com"), amount: 2.99, frequency: "monthly", nextDate: "Apr 23, 2026", status: "wanted", category: "Technology" },
]

export type MonthComparison = { category: string; thisMonth: number; lastMonth: number }

export const monthComparisons: MonthComparison[] = [
  { category: "Food & Dining", thisMonth: 820, lastMonth: 690 },
  { category: "Transport", thisMonth: 450, lastMonth: 520 },
  { category: "Entertainment", thisMonth: 340, lastMonth: 280 },
  { category: "Shopping", thisMonth: 560, lastMonth: 410 },
  { category: "Subscriptions", thisMonth: 215, lastMonth: 215 },
  { category: "Health", thisMonth: 180, lastMonth: 200 },
  { category: "Travel", thisMonth: 634, lastMonth: 0 },
  { category: "Education", thisMonth: 250, lastMonth: 300 },
]

export type AiInsight = {
  id: string
  text: string
  trend: "up" | "down" | "neutral"
  percentChange: number
  category: string
}

export const aiInsights: AiInsight[] = [
  { id: "ai1", text: "Your dining spending is up 19% this month — mostly DoorDash orders on weeknights.", trend: "up", percentChange: 19, category: "Food & Dining" },
  { id: "ai2", text: "Transport costs dropped 13% — great job using public transit more.", trend: "down", percentChange: 13, category: "Transport" },
  { id: "ai3", text: "You have 3 subscriptions flagged for review totaling $93.74/month.", trend: "neutral", percentChange: 0, category: "Subscriptions" },
  { id: "ai4", text: "Shopping jumped 37% — a $245 Airbnb booking and $90 Amazon order drove most of it.", trend: "up", percentChange: 37, category: "Shopping" },
  { id: "ai5", text: "You're on track to save $1,200 this month if spending stays consistent.", trend: "down", percentChange: 8, category: "Savings" },
]

// ══════════════════════════════════════════════════════════════════════════════
// PAGE DATA: Budgets
// ══════════════════════════════════════════════════════════════════════════════

export type BudgetCategory = {
  id: string
  category: string
  iconName: string
  budget: number
  spent: number
  color: string
}

export const budgetCategories: BudgetCategory[] = [
  { id: "b1", category: "Food & Dining", iconName: "utensils", budget: 800, spent: 820, color: "text-orange-500" },
  { id: "b2", category: "Transport", iconName: "car", budget: 400, spent: 310, color: "text-blue-500" },
  { id: "b3", category: "Entertainment", iconName: "gamepad-2", budget: 300, spent: 340, color: "text-purple-500" },
  { id: "b4", category: "Shopping", iconName: "shopping-bag", budget: 500, spent: 560, color: "text-pink-500" },
  { id: "b5", category: "Subscriptions", iconName: "repeat", budget: 200, spent: 215, color: "text-cyan-500" },
  { id: "b6", category: "Health & Fitness", iconName: "heart-pulse", budget: 150, spent: 95, color: "text-emerald-500" },
  { id: "b7", category: "Education", iconName: "graduation-cap", budget: 250, spent: 150, color: "text-amber-500" },
  { id: "b8", category: "Travel", iconName: "plane", budget: 600, spent: 634, color: "text-rose-500" },
]

export type SavingsGoal = {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string
  iconName: string
  monthlyContribution: number
}

export const savingsGoals: SavingsGoal[] = [
  { id: "g1", name: "Vacation Fund", targetAmount: 5000, currentAmount: 2400, deadline: "Aug 2026", iconName: "palm-tree", monthlyContribution: 400 },
  { id: "g2", name: "Emergency Fund", targetAmount: 15000, currentAmount: 8200, deadline: "Dec 2026", iconName: "shield", monthlyContribution: 850 },
  { id: "g3", name: "New Car", targetAmount: 35000, currentAmount: 12500, deadline: "Jun 2027", iconName: "car", monthlyContribution: 1500 },
  { id: "g4", name: "Home Down Payment", targetAmount: 60000, currentAmount: 24000, deadline: "Dec 2027", iconName: "home", monthlyContribution: 2000 },
]

export type DailySpending = { date: string; amount: number }

export const dailySpending: DailySpending[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(2026, 3, i + 1) // April 2026
  const dayOfWeek = d.getDay()
  const base = dayOfWeek === 0 || dayOfWeek === 6 ? 45 : 95
  const amount = Math.round(base + Math.sin(i * 0.8) * 40 + Math.random() * 30)
  return { date: d.toISOString().split("T")[0], amount: i < 13 ? amount : 0 }
})


// ══════════════════════════════════════════════════════════════════════════════
// WIDGET DATA: Financial Health Score
// ══════════════════════════════════════════════════════════════════════════════

export type HealthFactor = {
  id: string
  label: string
  score: number
  maxScore: number
  status: "excellent" | "good" | "fair" | "poor"
  description: string
}

export const financialHealthScore = {
  overall: 78,
  trend: "up" as const,
  trendDelta: 3,
  factors: [
    { id: "hf1", label: "Savings Rate", score: 85, maxScore: 100, status: "excellent" as const, description: "You save 28% of your income — well above the 20% target" },
    { id: "hf2", label: "Spending Habits", score: 72, maxScore: 100, status: "good" as const, description: "Mostly within budget. Dining out is slightly over." },
    { id: "hf3", label: "Debt Ratio", score: 90, maxScore: 100, status: "excellent" as const, description: "Debt-to-income ratio of 8% — very healthy" },
    { id: "hf4", label: "Investment Growth", score: 68, maxScore: 100, status: "good" as const, description: "Portfolio up 12.4% YTD. Diversification is solid." },
    { id: "hf5", label: "Emergency Fund", score: 55, maxScore: 100, status: "fair" as const, description: "3.2 months of expenses covered — aim for 6 months" },
    { id: "hf6", label: "Bill Payments", score: 95, maxScore: 100, status: "excellent" as const, description: "All bills paid on time for 12 consecutive months" },
  ] as HealthFactor[],
}

