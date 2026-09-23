'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'
import type { PeriodPoint } from '@/lib/monthly-summary'

interface Props {
  data: PeriodPoint[]
}

export function PeriodBarChart({ data }: Props) {
  if (data.length === 0 || data.every((d) => d.income === 0 && d.expenses === 0)) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-[var(--muted)]" style={{ borderColor: 'var(--border)' }}>
        Necesitás movimientos cargados para ver el gráfico.
      </p>
    )
  }

  return (
    // Barras en vez de líneas: con pocos puntos (1-3, como en la vista
    // mensual/trimestral) una línea no comunica nada — la altura de la
    // barra sí, sin importar cuántos puntos haya.
    <div className="h-64 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
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
            formatter={(value) => Number(value).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            contentStyle={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
            }}
            cursor={{ fill: 'var(--border)', opacity: 0.3 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="income" name="Ingresos" fill="var(--positive)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" name="Gastos" fill="var(--negative)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="balance" name="Balance" fill="var(--balance)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}