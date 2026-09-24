import { createClient } from '@/lib/supabase/server'
import { getHouseholdId } from '@/lib/get-household'
import { withdrawSavings } from './actions'

interface DepositRow {
  id: string
  amount_usd: number
  description: string | null
  date: string
  category_id: string
  subcategory_id: string | null
  categories: { name: string } | null
  subcategories: { name: string } | null
}

interface WithdrawalRow {
  id: string
  amount: number
  created_at: string
  category_id: string
  subcategory_id: string | null
  subcategories: { name: string } | null
}

interface HistoryItem {
  id: string
  date: string
  label: string
  bucketLabel: string
  amount: number
  kind: 'deposit' | 'withdrawal'
}

export default async function SavingsPage() {
  const householdId = await getHouseholdId()
  const supabase = await createClient()

  const { data: savingsCategories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('household_id', householdId ?? '')
    .eq('is_savings', true)
    .eq('type', 'gasto')

  const categoryIds = (savingsCategories ?? []).map((c) => c.id)

  const [{ data: deposits }, { data: withdrawals }] = categoryIds.length
    ? await Promise.all([
        supabase
          .from('transactions')
          .select('id, amount_usd, description, date, category_id, subcategory_id, categories(name), subcategories(name)')
          .in('category_id', categoryIds)
          .order('date', { ascending: false })
          .returns<DepositRow[]>(),
        supabase
          .from('savings_withdrawals')
          .select('id, amount, created_at, category_id, subcategory_id, subcategories(name)')
          .in('category_id', categoryIds)
          .order('created_at', { ascending: false })
          .returns<WithdrawalRow[]>(),
      ])
    : [{ data: [] as DepositRow[] }, { data: [] as WithdrawalRow[] }]

  const depositRows = deposits ?? []
  const withdrawalRows = withdrawals ?? []

  // Neto por bucket (categoryId + subcategoryId, "General" si no tiene subcategoría)
  const buckets = new Map<
    string,
    { label: string; categoryId: string; subcategoryId: string | null; net: number }
  >()

  for (const d of depositRows) {
    const key = `${d.category_id}:${d.subcategory_id ?? '__general__'}`
    const existing = buckets.get(key)
    if (existing) existing.net += d.amount_usd
    else buckets.set(key, { label: d.subcategories?.name ?? 'General', categoryId: d.category_id, subcategoryId: d.subcategory_id, net: d.amount_usd })
  }
  for (const w of withdrawalRows) {
    const key = `${w.category_id}:${w.subcategory_id ?? '__general__'}`
    const existing = buckets.get(key)
    if (existing) existing.net -= w.amount
    else buckets.set(key, { label: w.subcategories?.name ?? 'General', categoryId: w.category_id, subcategoryId: w.subcategory_id, net: -w.amount })
  }

  const breakdown = [...buckets.values()].sort((a, b) => b.net - a.net)
  const total = breakdown.reduce((s, b) => s + b.net, 0)
  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

  const history: HistoryItem[] = [
    ...depositRows.map((d) => ({
      id: `d-${d.id}`,
      date: d.date,
      label: d.description || d.categories?.name || 'Ahorro',
      bucketLabel: d.subcategories?.name ?? 'General',
      amount: d.amount_usd,
      kind: 'deposit' as const,
    })),
    ...withdrawalRows.map((w) => ({
      id: `w-${w.id}`,
      date: w.created_at,
      label: 'Retiro',
      bucketLabel: w.subcategories?.name ?? 'General',
      amount: w.amount,
      kind: 'withdrawal' as const,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <main className="content-width px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl" style={{ color: 'var(--positive)' }}>Ahorros</h1>
        <p className="text-sm text-[var(--muted)]">
          Todo lo que cargaste en categorías marcadas como ahorro, separado del resto de tus gastos.
        </p>
      </header>

      {categoryIds.length === 0 || (depositRows.length === 0 && withdrawalRows.length === 0) ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-[var(--muted)]" style={{ borderColor: 'var(--border)' }}>
          Todavía no tienes movimientos en categorías de ahorro. Marcá una (o creá una nueva) desde Categorías.
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
              const key = `${b.categoryId}:${b.subcategoryId ?? '__general__'}`
              return (
                <div key={key} className="rounded-xl border p-3" style={{ borderColor: 'var(--border)' }}>
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
                      <input type="hidden" name="categoryId" value={b.categoryId} />
                      <input type="hidden" name="subcategoryId" value={b.subcategoryId ?? ''} />
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
              {history.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{h.label}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {h.bucketLabel} · {new Date(h.date).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <p
                    className="shrink-0 text-sm font-semibold tabular-nums"
                    style={{ color: h.kind === 'deposit' ? 'var(--balance)' : 'var(--negative)' }}
                  >
                    {h.kind === 'deposit' ? '+' : '−'}
                    {fmt(h.amount)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </main>
  )
}