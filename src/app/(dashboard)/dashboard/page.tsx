import { redirect } from "next/navigation"
import { auth } from "@/auth"
import {
  getAccountsForUser,
  getBalanceHistoryForUser,
  getDashboardSummary,
  getRecentTransactionsForUser,
} from "@/lib/data"
import { DashboardCustomizer } from "@/components/dashboard/dashboard-customizer"

export default async function Page() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/sign-in")
  }

  const [balanceHistory, summary, transactions, accounts] = await Promise.all([
    getBalanceHistoryForUser(session.user.id),
    getDashboardSummary(session.user.id),
    getRecentTransactionsForUser(session.user.id, 8),
    getAccountsForUser(session.user.id),
  ])

  return (
    <DashboardCustomizer
      balanceHistory={balanceHistory}
      summary={summary}
      transactions={transactions}
      accounts={accounts}
    />
  )
}
