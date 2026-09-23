import { createClient } from '@/lib/supabase/server'
import { MonthSummaryCards } from '@/components/month-summary-cards'
import { CategoryBreakdown } from '@/components/category-breakdown'
import { RecentTransactions } from '@/components/recent-transactions'
import type { TransactionWithCategory } from '@/lib/types'

// Server Component: trae el mes actual y delega el render a client components
// más chicos (así los gráficos, que necesitan interactividad, se hidratan
// aparte sin bloquear el resto de la página).
export default async function DashboardPage() {
  const supabase = await createClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, categories(name, type, color)')
    .gte('date', startOfMonth)
    .lte('date', endOfMonth)
    .order('date', { ascending: false })
    .returns<TransactionWithCategory[]>()

  const rows: TransactionWithCategory[] = transactions ?? []
  const totalIncome = rows
    .filter((t: TransactionWithCategory) => t.categories?.type === 'ingreso')
    .reduce((sum: number, t: TransactionWithCategory) => sum + t.amount_usd, 0)
  const totalExpenses = rows
    .filter((t: TransactionWithCategory) => t.categories?.type === 'gasto')
    .reduce((sum: number, t: TransactionWithCategory) => sum + t.amount_usd, 0)

  return (
    <main className="content-width px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {now.toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })}
        </h1>
        <p className="text-sm text-[var(--muted)]">Resumen del mes en curso</p>
      </header>

      <MonthSummaryCards income={totalIncome} expenses={totalExpenses} />

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-medium">Por categoría</h2>
        <CategoryBreakdown transactions={rows} />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-medium">Últimos movimientos</h2>
        <RecentTransactions transactions={rows.slice(0, 8)} />
      </section>
    </main>
  )
}
