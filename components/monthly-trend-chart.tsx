'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'
import type { MonthlyPoint } from '@/lib/monthly-summary'

interface Props {
  data: MonthlyPoint[]
}

export function MonthlyTrendChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-[var(--muted)]" style={{ borderColor: 'var(--border)' }}>
        Necesitás movimientos cargados para ver la evolución.
      </p>
    )
  }

  return (
    // Alto fijo chico + ancho 100% para que entre bien en pantallas
    // angostas (Infinix Hot 70 ~360px) sin necesitar scroll horizontal.
    <div className="h-64 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--muted)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--muted)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            formatter={(value) =>
              Number(value).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
            }
            contentStyle={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="income" name="Ingresos" stroke="var(--income)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="expenses" name="Gastos" stroke="var(--expense)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="balance" name="Balance" stroke="var(--savings)" strokeWidth={2} strokeDasharray="4 3" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}