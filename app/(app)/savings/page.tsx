import { createClient } from '@/lib/supabase/server'
import { getHouseholdId } from '@/lib/get-household'
import type { TransactionWithCategory } from '@/lib/types'

interface SavingsRow extends TransactionWithCategory {
  subcategories: { name: string } | null
}

export default async function SavingsPage() {
  const householdId = await getHouseholdId()
  const supabase = await createClient()

  const { data: savingsCategories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('household_id', householdId ?? '')
    .eq('is_savings', true)

  const categoryIds = (savingsCategories ?? []).map((c) => c.id)

  const { data: transactions } = categoryIds.length
    ? await supabase
        .from('transactions')
        .select('*, categories(name, type, color), subcategories(name)')
        .in('category_id', categoryIds)
        .order('date', { ascending: false })
        .returns<SavingsRow[]>()
    : { data: [] as SavingsRow[] }

  const rows: SavingsRow[] = transactions ?? []
  const total = rows.reduce((s, t) => s + t.amount_usd, 0)

  const bySubcategory = new Map<string, number>()
  for (const t of rows) {
    const key = t.subcategories?.name ?? 'General'
    bySubcategory.set(key, (bySubcategory.get(key) ?? 0) + t.amount_usd)
  }
  const breakdown = [...bySubcategory.entries()].sort((a, b) => b[1] - a[1])

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

  return (
    <main className="content-width px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ahorros</h1>
        <p className="text-sm text-[var(--muted)]">
          Todo lo que cargaste en categorías marcadas como ahorro, separado del resto de tus gastos.
        </p>
      </header>

      {categoryIds.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-[var(--muted)]" style={{ borderColor: 'var(--border)' }}>
          Todavía no tenés ninguna categoría marcada como ahorro. Marcá una (o creá una nueva) desde Categorías.
        </p>
      ) : (
        <>
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <p className="text-xs text-[var(--muted)]">Total ahorrado</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums" style={{ color: 'var(--balance)' }}>
              {fmt(total)}
            </p>
          </div>

          {breakdown.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-3 text-sm font-medium text-[var(--muted)]">Por subcategoría</h2>
              <div className="space-y-3">
                {breakdown.map(([name, amount]) => {
                  const pct = total > 0 ? Math.round((amount / total) * 100) : 0
                  return (
                    <div key={name}>
                      <div className="mb-1 flex items-baseline justify-between text-sm">
                        <span>{name}</span>
                        <span className="tabular-nums text-[var(--muted)]">
                          {fmt(amount)} · {pct}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--border)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--balance)' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-6">
            <h2 className="mb-3 text-sm font-medium text-[var(--muted)]">Historial</h2>
            {rows.length === 0 ? (
              <p className="rounded-xl border border-dashed p-6 text-center text-sm text-[var(--muted)]" style={{ borderColor: 'var(--border)' }}>
                Todavía no cargaste movimientos en tus categorías de ahorro.
              </p>
            ) : (
              <ul className="divide-y overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                {rows.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.description || t.categories?.name}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {t.subcategories?.name ?? t.categories?.name} ·{' '}
                        {new Date(t.date).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums" style={{ color: 'var(--balance)' }}>
                      {fmt(t.amount_usd)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </main>
  )
}