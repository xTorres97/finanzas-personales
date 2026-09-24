import { createClient } from '@/lib/supabase/server'
import { getHouseholdId } from '@/lib/get-household'
import { TransactionForm } from '@/components/transaction-form'
import { TransactionHistoryList } from '@/components/transaction-history-list'
import type { Category, Subcategory, TransactionWithCategory } from '@/lib/types'

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const householdId = await getHouseholdId()
  const supabase = await createClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  const currentMonthLabel = now.toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })

  const [{ data: categories }, { data: subcategories }, { data: transactions }] = await Promise.all([
    supabase.from('categories').select('*').eq('household_id', householdId ?? '').order('type').order('sort_order'),
    supabase.from('subcategories').select('*').order('sort_order'),
    supabase
      .from('transactions')
      .select('*, categories(name, type, color)')
      .eq('household_id', householdId ?? '')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)
      .order('date', { ascending: false })
      .range(0, 9)
      .returns<TransactionWithCategory[]>(),
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
          <h2 className="text-lg font-medium">Movimientos de {currentMonthLabel}</h2>
          <a href="/transactions/history?all=1" className="text-xs underline" style={{ color: 'var(--muted)' }}>
            Ver historial completo →
          </a>
        </div>
        <TransactionHistoryList initial={rows} />
      </section>
    </main>
  )
}