"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { StaffUserRow, StaffTransactionRow } from "@/lib/data"

export function StaffClient({
  users,
  transactions,
}: {
  users: StaffUserRow[]
  transactions: StaffTransactionRow[]
}) {
  const router = useRouter()
  const [accountId, setAccountId] = useState("")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const allAccounts = users.flatMap((u) =>
    u.accounts.map((a) => ({ ...a, owner: u.name }))
  )

  async function submit() {
    setBusy(true)
    setMsg(null)
    const res = await fetch("/api/staff/adjust-balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, amount: parseFloat(amount), reason }),
    })
    const data = await res.json()
    setMsg(res.ok ? "Adjustment applied." : (data.error ?? "Failed."))
    setBusy(false)
    if (res.ok) {
      setAmount("")
      setReason("")
      router.refresh()
    }
  }

  return (
    <div className="space-y-8 font-mono text-xs">
      {/* Balance adjustment — always creates a visible transaction, never a silent edit */}
      <section className="rounded border border-zinc-800 p-4">
        <h2 className="mb-3 text-sm font-semibold">Adjust Account Balance</h2>
        <p className="mb-3 text-zinc-500">
          Every adjustment creates a real transaction on the customer&apos;s own statement and notifies them. There is no way to change a balance silently.
        </p>
        <div className="flex flex-wrap gap-2">
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5"
          >
            <option value="">Select account…</option>
            {allAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.owner} — {a.label} (****{a.accountNumber.slice(-4)}) ${a.balance.toFixed(2)}
              </option>
            ))}
          </select>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (+/-)"
            className="w-32 rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5"
          />
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (required)"
            className="flex-1 min-w-[180px] rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5"
          />
          <button
            onClick={submit}
            disabled={busy || !accountId || !amount || reason.length < 5}
            className="rounded bg-amber-500 px-3 py-1.5 font-semibold text-zinc-950 disabled:opacity-40"
          >
            {busy ? "Applying…" : "Apply"}
          </button>
        </div>
        {msg && <p className="mt-2 text-zinc-400">{msg}</p>}
      </section>

      {/* Users */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">Users ({users.length})</h2>
        <div className="overflow-x-auto rounded border border-zinc-800">
          <table className="w-full text-left">
            <thead className="border-b border-zinc-800 text-zinc-500">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Role</th>
                <th className="p-2">KYC</th>
                <th className="p-2">Accounts</th>
                <th className="p-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-zinc-900">
                  <td className="p-2">{u.name}</td>
                  <td className="p-2 text-zinc-400">{u.email}</td>
                  <td className="p-2">{u.role}</td>
                  <td className="p-2">{u.kycStatus}</td>
                  <td className="p-2 text-zinc-400">
                    {u.accounts.map((a) => `${a.label}: $${a.balance.toFixed(2)}`).join(" · ")}
                  </td>
                  <td className="p-2 text-zinc-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Transaction log */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">Recent Transactions ({transactions.length})</h2>
        <div className="overflow-x-auto rounded border border-zinc-800">
          <table className="w-full text-left">
            <thead className="border-b border-zinc-800 text-zinc-500">
              <tr>
                <th className="p-2">Type</th>
                <th className="p-2">From</th>
                <th className="p-2">To</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Status</th>
                <th className="p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-zinc-900">
                  <td className="p-2">{t.type}</td>
                  <td className="p-2 text-zinc-400">{t.fromLabel}</td>
                  <td className="p-2 text-zinc-400">{t.toLabel}</td>
                  <td className="p-2">${t.amount.toFixed(2)}</td>
                  <td className="p-2">{t.status}</td>
                  <td className="p-2 text-zinc-500">{new Date(t.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
