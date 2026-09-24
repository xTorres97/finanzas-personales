'use client'

import { useState, useTransition } from 'react'
import { loadMoreTransactions, deleteTransaction } from '@/app/(app)/transactions/actions'
import type { TransactionWithCategory } from '@/lib/types'

const PAGE_SIZE = 10

export function TransactionHistoryList({ initial }: { initial: TransactionWithCategory[] }) {
  const [items, setItems] = useState(initial)
  const [hasMore, setHasMore] = useState(initial.length === PAGE_SIZE)
  const [isPending, startTransition] = useTransition()

  function handleLoadMore() {
    startTransition(async () => {
      const next = await loadMoreTransactions(items.length)
      setItems((prev) => [...prev, ...next])
      setHasMore(next.length === PAGE_SIZE)
    })
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar este movimiento? No se puede deshacer.')) return
    startTransition(async () => {
      const formData = new FormData()
      formData.set('id', id)
      await deleteTransaction(formData)
      setItems((prev) => prev.filter((t) => t.id !== id))
    })
  }

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-[var(--muted)]" style={{ borderColor: 'var(--border)' }}>
        Todavía no cargaste ningún movimiento este mes.
      </p>
    )
  }

  return (
    <>
      <ul className="divide-y overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        {items.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {t.description || t.categories?.name || 'Sin descripción'}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {t.categories?.name} · {new Date(t.date).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}
                {t.currency === 'VES' && t.exchange_rate ? ` · Bs ${t.amount.toLocaleString('es-VE')} (tasa ${t.exchange_rate.toFixed(2)})` : ''}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <p
                className="text-sm font-semibold tabular-nums"
                style={{ color: t.categories?.type === 'ingreso' ? 'var(--positive)' : 'var(--negative)' }}
              >
                {t.categories?.type === 'ingreso' ? '+' : '−'}
                {t.amount_usd.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </p>
              <button
                onClick={() => handleDelete(t.id)}
                disabled={isPending}
                className="text-xs disabled:opacity-50"
                style={{ color: 'var(--muted)' }}
              >
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          onClick={handleLoadMore}
          disabled={isPending}
          className="mt-3 w-full rounded-lg border py-2 text-sm disabled:opacity-60"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
        >
          {isPending ? 'Cargando…' : 'Ver más'}
        </button>
      )}
    </>
  )
}