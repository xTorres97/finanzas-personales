import { createClient } from '@/lib/supabase/server'
import { getHouseholdId } from '@/lib/get-household'
import { TransactionForm } from '@/components/transaction-form'
import { ConfirmDeleteButton } from '@/components/confirm-delete-button'
import { deleteTransaction } from './actions'
import type { Category, Subcategory, TransactionWithCategory } from '@/lib/types'

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string; to?: string; label?: string; all?: string }>
}) {
  const { error, from, to, label, all } = await searchParams
  const householdId = await getHouseholdId()
  const supabase = await createClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  const currentMonthLabel = now.toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })

  const showAll = all === '1'
  const hasCustomRange = Boolean(from && to)

  let query = supabase
    .from('transactions')
    .select('*, categories(name, type, color)')
    .eq('household_id', householdId ?? '')
    .order('date', { ascending: false })

  let heading = `Historial de ${currentMonthLabel}`
  if (showAll) {
    heading = 'Historial completo'
  } else if (hasCustomRange) {
    query = query.gte('date', from!).lte('date', to!)
    heading = label ? `Movimientos de ${label}` : 'Movimientos del período'
  } else {
    query = query.gte('date', startOfMonth).lte('date', endOfMonth)
  }

  const [{ data: categories }, { data: subcategories }, { data: transactions }] = await Promise.all([
    supabase.from('categories').select('*').eq('household_id', householdId ?? '').order('type').order('sort_order'),
    supabase.from('subcategories').select('*').order('sort_order'),
    query.returns<TransactionWithCategory[]>(),
  ])

  const cats: Category[] = categories ?? []
  const subs: Subcategory[] = subcategories ?? []
  const rows: TransactionWithCategory[] = transactions ?? []

  return (
    <main className="content-width px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Movimientos</h1>
        <p className="text-sm text-[var(--muted)]">Cargá tus ingresos y gastos. Para meses anteriores, mirá Reportes.</p>
      </header>

      {error && (
        <p className="mb-6 rounded-lg px-3 py-2 text-sm" style={{ background: '#fbeae6', color: 'var(--negative)' }}>
          {error}
        </p>
      )}

      {cats.length === 0 ? (
        <p className="mb-8 rounded-xl border border-dashed p-6 text-center text-sm text-[var(--muted)]" style={{ borderColor: 'var(--border)' }}>
          Primero creá al menos una categoría en la sección Categorías.
        </p>
      ) : (
        <div className="mb-8">
          <TransactionForm categories={cats} subcategories={subs} householdId={householdId!} />
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">{heading}</h2>
          {showAll || hasCustomRange ? (
            <a href="/transactions" className="text-xs underline" style={{ color: 'var(--muted)' }}>
              Ver solo este mes
            </a>
          ) : (
            <a href="/transactions?all=1" className="text-xs underline" style={{ color: 'var(--muted)' }}>
              Ver historial completo
            </a>
          )}
        </div>
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-[var(--muted)]" style={{ borderColor: 'var(--border)' }}>
            No hay movimientos en este período.
          </p>
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            {rows.map((t) => (
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
                  <form action={deleteTransaction}>
                    <input type="hidden" name="id" value={t.id} />
                    <ConfirmDeleteButton
                      confirmMessage="¿Eliminar este movimiento? No se puede deshacer."
                      className="text-xs"
                      style={{ color: 'var(--muted)' }}
                    >
                      Eliminar
                    </ConfirmDeleteButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}