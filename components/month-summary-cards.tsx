'use client'

interface Props {
  income: number
  expenses: number
}

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

export function MonthSummaryCards({ income, expenses }: Props) {
  const balance = income - expenses

  return (
    // 1 columna en mobile chico (evita que 3 tarjetas se aplasten en un
    // Infinix Hot 70 de ~360px de ancho), 3 columnas desde sm (~390px+,
    // cubre iPhone 13 Pro y en adelante)
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card label="Ingresos" value={fmt(income)} color="var(--positive)" />
      <Card label="Gastos" value={fmt(expenses)} color="var(--negative)" />
      <Card label="Balance" value={fmt(balance)} color="var(--balance)" />
    </div>
  )
}

function Card({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl" style={{ color }}>
        {value}
      </p>
    </div>
  )
}