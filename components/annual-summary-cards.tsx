'use client'

interface Props {
  income: number
  expenses: number
}

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

export function AnnualSummaryCards({ income, expenses }: Props) {
  const balance = income - expenses
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card label="Ingresos" value={fmt(income)} color="var(--positive)" />
      <Card label="Gastos" value={fmt(expenses)} color="var(--negative)" />
      <Card label="Balance" value={fmt(balance)} color="var(--balance)" />
      <Card label="Tasa de ahorro" value={`${savingsRate}%`} color="var(--balance)" />
    </div>
  )
}

function Card({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums sm:text-xl" style={{ color }}>
        {value}
      </p>
    </div>
  )
}