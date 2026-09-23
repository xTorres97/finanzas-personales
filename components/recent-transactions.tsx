'use client'

import type { TransactionWithCategory } from '@/lib/types'

interface Props {
  transactions: TransactionWithCategory[]
}

export function RecentTransactions({ transactions }: Props) {
  if (transactions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-[var(--muted)]" style={{ borderColor: 'var(--border)' }}>
        Todavía no cargaste movimientos este mes.
      </p>
    )
  }

  return (
    <ul className="divide-y overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      {transactions.map((t) => (
        <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {t.description || t.categories?.name || 'Sin descripción'}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {t.categories?.name} · {new Date(t.date).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })}
            </p>
          </div>
          <p
            className="shrink-0 text-sm font-semibold tabular-nums"
            style={{ color: t.categories?.type === 'ingreso' ? 'var(--positive)' : 'var(--negative)' }}
          >
            {t.categories?.type === 'ingreso' ? '+' : '−'}
            {t.amount_usd.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </p>
        </li>
      ))}
    </ul>
  )
}