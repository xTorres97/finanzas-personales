'use client'

import { useState } from 'react'
import type { TransactionWithCategory } from '@/lib/types'

interface Props {
  transactions: TransactionWithCategory[]
}

export function CategoryBreakdown({ transactions }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const expenses = transactions.filter((t) => t.categories?.type === 'gasto')
  const total = expenses.reduce((sum, t) => sum + t.amount_usd, 0)

  const byCategory = new Map<string, { name: string; total: number; color: string }>()
  for (const t of expenses) {
    const key = t.categories?.name ?? 'Otros'
    const existing = byCategory.get(key)
    const color = t.categories?.color ?? 'var(--expense)'
    if (existing) {
      existing.total += t.amount_usd
    } else {
      byCategory.set(key, { name: key, total: t.amount_usd, color })
    }
  }

  const rows = [...byCategory.values()].sort((a, b) => b.total - a.total)

  if (rows.length === 0 || total === 0) {
    return <p className="text-sm text-[var(--muted)]">Sin gastos registrados este mes.</p>
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const pct = Math.round((row.total / total) * 100)
        const isOpen = expanded === row.name
        const rowTransactions = expenses
          .filter((t) => (t.categories?.name ?? 'Otros') === row.name)
          .sort((a, b) => b.date.localeCompare(a.date))

        return (
          <div key={row.name}>
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : row.name)}
              className="block w-full text-left"
            >
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className="flex items-center gap-1">
                  {row.name}
                  <span
                    className="text-xs transition-transform"
                    style={{ color: 'var(--muted)', transform: isOpen ? 'rotate(90deg)' : 'none' }}
                  >
                    ›
                  </span>
                </span>
                <span className="tabular-nums text-[var(--muted)]">
                  {row.total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} · {pct}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--border)' }}>
                <div
                  className="h-full rounded-full transition-[width]"
                  style={{ width: `${pct}%`, background: row.color }}
                />
              </div>
            </button>

            {isOpen && (
              <ul
                className="mt-2 space-y-1 rounded-lg border p-2"
                style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
              >
                {rowTransactions.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 px-1 py-1 text-xs">
                    <div className="min-w-0">
                      <p className="truncate">{t.description || t.categories?.name}</p>
                      <p className="text-[var(--muted)]">
                        {new Date(t.date).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                    <span className="shrink-0 tabular-nums font-medium">
                      {t.amount_usd.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}