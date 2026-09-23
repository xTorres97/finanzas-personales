import { createClient } from '@/lib/supabase/server'
import { getHouseholdId } from '@/lib/get-household'
import { TransactionForm } from '@/components/transaction-form'
import { deleteTransaction } from './actions'
import type { Category, Subcategory, TransactionWithCategory } from '@/lib/types'

export default async function TransactionsPage() {
  const householdId = await getHouseholdId()
  const supabase = await createClient()

  const [{ data: categories }, { data: subcategories }, { data: transactions }] = await Promise.all([
    supabase.from('categories').select('*').eq('household_id', householdId ?? '').order('type').order('sort_order'),
    supabase.from('subcategories').select('*').order('sort_order'),
    supabase
      .from('transactions')
      .select('*, categories(name, type, color)')
      .eq('household_id', householdId ?? '')
      .order('date', { ascending: false })
      .returns<TransactionWithCategory[]>(),
  ])

  const cats: Category[] = categories ?? []
  const subs: Subcategory[] = subcategories ?? []
  const rows: TransactionWithCategory[] = transactions ?? []

  return (
    <main className="content-width px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Movimientos</h1>
        <p className="text-sm text-[var(--muted)]">Cargá y revisá todos tus ingresos y gastos.</p>
      </header>

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
        <h2 className="mb-3 text-lg font-medium">Historial</h2>
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-[var(--muted)]" style={{ borderColor: 'var(--border)' }}>
            Todavía no cargaste ningún movimiento.
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
                    <button type="submit" className="text-xs" style={{ color: 'var(--muted)' }}>
                      Eliminar
                    </button>
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