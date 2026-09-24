import { createClient } from '@/lib/supabase/server'
import { getHouseholdId } from '@/lib/get-household'
import { withdrawSavings } from './actions'

interface SavingsTxRow {
  id: string
  amount_usd: number
  description: string | null
  date: string
  subcategory_id: string | null
  categories: { type: 'ingreso' | 'gasto'; name: string } | null
  subcategories: { name: string } | null
}

export default async function SavingsPage() {
  const householdId = await getHouseholdId()
  const supabase = await createClient()

  const { data: savingsCategories } = await supabase
    .from('categories')
    .select('id, name, type')
    .eq('household_id', householdId ?? '')
    .eq('is_savings', true)

  const categoryIds = (savingsCategories ?? []).map((c) => c.id)

  const { data: transactions } = categoryIds.length
    ? await supabase
        .from('transactions')
        .select('id, amount_usd, description, date, subcategory_id, categories(type, name), subcategories(name)')
        .in('category_id', categoryIds)
        .order('date', { ascending: false })
        .returns<SavingsTxRow[]>()
    : { data: [] as SavingsTxRow[] }

  const rows: SavingsTxRow[] = transactions ?? []

  // Neto por bucket (subcategoría, o "General" si no tiene)
  const buckets = new Map<string, { label: string; subcategoryId: string | null; net: number }>()
  for (const t of rows) {
    const key = t.subcategory_id ?? '__general__'
    const isDeposit = t.categories?.type === 'gasto'
    const signed = isDeposit ? t.amount_usd : -t.amount_usd
    const existing = buckets.get(key)
    if (existing) {
      existing.net += signed
    } else {
      buckets.set(key, {
        label: t.subcategories?.name ?? 'General',
        subcategoryId: t.subcategory_id,
        net: signed,
      })
    }
  }

  const breakdown = [...buckets.values()].sort((a, b) => b.net - a.net)
  const total = breakdown.reduce((s, b) => s + b.net, 0)
  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

  return (
    <main className="content-width px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ahorros</h1>
        <p className="text-sm text-[var(--muted)]">
          Todo lo que cargaste en categorías marcadas como ahorro, separado del resto de tus gastos.
        </p>
      </header>

      {categoryIds.length === 0 || rows.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-[var(--muted)]" style={{ borderColor: 'var(--border)' }}>
          Todavía no tenés movimientos en categorías de ahorro. Marcá una (o creá una nueva) desde Categorías.
        </p>
      ) : (
        <>
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <p className="text-xs text-[var(--muted)]">Total ahorrado</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums" style={{ color: 'var(--balance)' }}>
              {fmt(total)}
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <h2 className="text-sm font-medium text-[var(--muted)]">Por subcategoría</h2>
            {breakdown.map((b) => {
              const pct = total > 0 ? Math.round((b.net / total) * 100) : 0
              return (
                <div key={b.subcategoryId ?? '__general__'} className="rounded-xl border p-3" style={{ borderColor: 'var(--border)' }}>
                  <div className="mb-1 flex items-baseline justify-between text-sm">
                    <span className="font-medium">{b.label}</span>
                    <span className="tabular-nums text-[var(--muted)]">
                      {fmt(b.net)} {total > 0 && `· ${pct}%`}
                    </span>
                  </div>
                  <div className="mb-2 h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--border)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: 'var(--balance)' }}
                    />
                  </div>

                  {b.net > 0 && (
                    <form action={withdrawSavings} className="flex items-center gap-2">
                      <input type="hidden" name="subcategoryId" value={b.subcategoryId ?? ''} />
                      <input type="hidden" name="label" value={b.label} />
                      <input
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={b.net}
                        placeholder="Monto a retirar"
                        className="w-32 rounded-lg border px-2 py-1.5 text-xs tabular-nums"
                        style={{ borderColor: 'var(--border)' }}
                      />
                      <button type="submit" className="text-xs underline" style={{ color: 'var(--negative)' }}>
                        Retirar
                      </button>
                    </form>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-6">
            <h2 className="mb-3 text-sm font-medium text-[var(--muted)]">Historial</h2>
            <ul className="divide-y overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              {rows.map((t) => {
                const isDeposit = t.categories?.type === 'gasto'
                return (
                  <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.description || t.categories?.name}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {t.subcategories?.name ?? 'General'} ·{' '}
                        {new Date(t.date).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <p
                      className="shrink-0 text-sm font-semibold tabular-nums"
                      style={{ color: isDeposit ? 'var(--balance)' : 'var(--negative)' }}
                    >
                      {isDeposit ? '+' : '−'}
                      {fmt(t.amount_usd)}
                    </p>
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      )}
    </main>
  )
}