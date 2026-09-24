import { createClient } from '@/lib/supabase/server'
import { getHouseholdId } from '@/lib/get-household'
import { getMonthBounds, getQuarterBounds, groupByWeekOfMonth, groupByMonthRange } from '@/lib/monthly-summary'
import { PeriodBarChart } from '@/components/period-bar-chart'
import { AnnualSummaryCards } from '@/components/annual-summary-cards'
import { CategoryBreakdown } from '@/components/category-breakdown'
import type { TransactionWithCategory } from '@/lib/types'
import type { PeriodPoint } from '@/lib/monthly-summary'

type Period = 'month' | 'quarter' | 'year'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; y?: string; m?: string; q?: string }>
}) {
  const params = await searchParams
  // Default: Mensual
  const period: Period = (params.period as Period) ?? 'month'

  const householdId = await getHouseholdId()
  const supabase = await createClient()

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // 1-12
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1

  const year = params.y ? Number(params.y) : currentYear
  const month = params.m ? Number(params.m) : currentMonth
  const quarter = params.q ? Number(params.q) : currentQuarter

  let from: string
  let to: string
  let rangeLabel: string
  let subtitle: string
  let isCurrentPeriod: boolean

  if (period === 'month') {
    ;({ from, to } = getMonthBounds(year, month))
    rangeLabel = new Date(year, month - 1, 1).toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })
    subtitle = `Evolución semana a semana de ${rangeLabel}.`
    isCurrentPeriod = year === currentYear && month === currentMonth
  } else if (period === 'quarter') {
    ;({ from, to } = getQuarterBounds(year, quarter))
    rangeLabel = `T${quarter} ${year}`
    subtitle = `Evolución mes a mes del trimestre ${rangeLabel}.`
    isCurrentPeriod = year === currentYear && quarter === currentQuarter
  } else {
    from = `${year}-01-01`
    to = `${year}-12-31`
    rangeLabel = String(year)
    subtitle = `Evolución mes a mes de ${rangeLabel}.`
    isCurrentPeriod = year === currentYear
  }

  let prevHref = ''
  let nextHref = ''
  if (period === 'month') {
    const prevM = month === 1 ? 12 : month - 1
    const prevY = month === 1 ? year - 1 : year
    const nextM = month === 12 ? 1 : month + 1
    const nextY = month === 12 ? year + 1 : year
    prevHref = `/reports?period=month&y=${prevY}&m=${prevM}`
    nextHref = `/reports?period=month&y=${nextY}&m=${nextM}`
  } else if (period === 'quarter') {
    const prevQ = quarter === 1 ? 4 : quarter - 1
    const prevY = quarter === 1 ? year - 1 : year
    const nextQ = quarter === 4 ? 1 : quarter + 1
    const nextY = quarter === 4 ? year + 1 : year
    prevHref = `/reports?period=quarter&y=${prevY}&q=${prevQ}`
    nextHref = `/reports?period=quarter&y=${nextY}&q=${nextQ}`
  } else {
    prevHref = `/reports?period=year&y=${year - 1}`
    nextHref = `/reports?period=year&y=${year + 1}`
  }

  const { data: periodTransactions } = await supabase
    .from('transactions')
    .select('*, categories(name, type, color)')
    .eq('household_id', householdId ?? '')
    .gte('date', from)
    .lte('date', to)
    .returns<TransactionWithCategory[]>()

  const rows: TransactionWithCategory[] = periodTransactions ?? []

  // Bucketing del gráfico según el período
  let chartData: PeriodPoint[]
  if (period === 'month') {
    chartData = groupByWeekOfMonth(rows, year, month)
  } else if (period === 'quarter') {
    chartData = groupByMonthRange(rows, year, (quarter - 1) * 3, 3)
  } else {
    chartData = groupByMonthRange(rows, year, 0, 12)
  }

  const income = rows.filter((t) => t.categories?.type === 'ingreso').reduce((s, t) => s + t.amount_usd, 0)
  const expenses = rows.filter((t) => t.categories?.type === 'gasto').reduce((s, t) => s + t.amount_usd, 0)

  const periodLabels: Record<Period, string> = { month: 'Mensual', quarter: 'Trimestral', year: 'Anual' }

  return (
    <main className="content-width px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Reportes</h1>
        <p className="text-sm text-[var(--muted)]">{subtitle}</p>
      </header>

      {/* Selector de período */}
      <div className="mb-4 flex gap-1 rounded-lg border p-1" style={{ borderColor: 'var(--border)', width: 'fit-content' }}>
        {(['month', 'quarter', 'year'] as Period[]).map((p) => (
          <a
            key={p}
            href={`/reports?period=${p}`}
            className="rounded-md px-3 py-1.5 text-sm"
            style={
              p === period
                ? { background: 'var(--foreground)', color: 'var(--background)' }
                : { color: 'var(--muted)' }
            }
          >
            {periodLabels[p]}
          </a>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-medium capitalize">{rangeLabel}</h2>
        <div className="flex items-center gap-3 text-sm">
          <a href={prevHref} className="text-[var(--muted)] underline">
            ← Anterior
          </a>
          {!isCurrentPeriod && (
            <a href={nextHref} className="text-[var(--muted)] underline">
              Siguiente →
            </a>
          )}
        </div>
      </div>

      <PeriodBarChart data={chartData} />

      <section className="mt-8">
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-[var(--muted)]" style={{ borderColor: 'var(--border)' }}>
            No hay movimientos cargados en este período.
          </p>
        ) : (
          <>
            <AnnualSummaryCards income={income} expenses={expenses} />
            <div className="mt-4">
              <a
                href={`/transactions?from=${from}&to=${to}&label=${encodeURIComponent(rangeLabel)}`}
                className="inline-block rounded-lg border px-4 py-2 text-sm font-medium"
                style={{ borderColor: 'var(--border)' }}
              >
                Ver movimientos de este período →
              </a>
            </div>
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-medium text-[var(--muted)]">Gastos por categoría</h3>
              <CategoryBreakdown transactions={rows} />
            </div>
          </>
        )}
      </section>
    </main>
  )
}