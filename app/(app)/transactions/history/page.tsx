import { createClient } from '@/lib/supabase/server'
import { getHouseholdId } from '@/lib/get-household'
import { ConfirmDeleteButton } from '@/components/confirm-delete-button'
import { deleteTransaction } from '../actions'
import type { TransactionWithCategory } from '@/lib/types'

export default async function TransactionsHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; label?: string; all?: string }>
}) {
  const { from, to, label, all } = await searchParams
  const householdId = await getHouseholdId()
  const supabase = await createClient()

  const showAll = all === '1'
  const hasCustomRange = Boolean(from && to)

  let query = supabase
    .from('transactions')
    .select('*, categories(name, type, color)')
    .eq('household_id', householdId ?? '')
    .order('date', { ascending: false })

  let heading = 'Historial completo'
  if (hasCustomRange) {
    query = query.gte('date', from!).lte('date', to!)
    heading = label ? `Movimientos de ${label}` : 'Movimientos del período'
  } else if (!showAll) {
    // Sin filtros ni ?all=1: no debería pasar navegando desde la app,
    // pero por las dudas mostramos todo en vez de una pantalla vacía.
    heading = 'Historial completo'
  }

  const { data: transactions } = await query.returns<TransactionWithCategory[]>()
  const rows: TransactionWithCategory[] = transactions ?? []

  return (
    <main className="content-width px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6">
        <a href="/transactions" className="mb-2 inline-block text-xs underline" style={{ color: 'var(--muted)' }}>
          ← Volver a Movimientos
        </a>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{heading}</h1>
        <p className="text-sm text-[var(--muted)]">Solo consulta, para cargar un movimiento nuevo, vuelve a Movimientos.</p>
      </header>

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
    </main>
  )
}