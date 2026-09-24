'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { fetchRateBySource, toUsd, type RateSource } from '@/lib/exchange-rate'
import type { Category, CurrencyCode, Subcategory } from '@/lib/types'

interface Props {
  categories: Category[]
  subcategories: Subcategory[]
  householdId: string
}

const RATE_LABELS: Record<RateSource, string> = {
  bcv: 'BCV',
  paralelo: 'Paralelo',
  euro: 'Euro BCV',
}

export function TransactionForm({ categories, subcategories, householdId }: Props) {
  const router = useRouter()
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<CurrencyCode>('USD')
  const [rateSource, setRateSource] = useState<RateSource>('bcv')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))

  const [rate, setRate] = useState<number | null>(null)
  const [rateError, setRateError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (currency !== 'VES') return
    setRate(null)
    setRateError(null)
    fetchRateBySource(rateSource)
      .then((r) => setRate(r.rate))
      .catch(() => setRateError(`No pudimos traer la tasa ${RATE_LABELS[rateSource]}. Probá de nuevo.`))
  }, [currency, rateSource])

  const availableSubcategories = subcategories.filter((s) => s.category_id === categoryId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const numericAmount = Number(amount)
    if (!numericAmount || numericAmount <= 0) {
      setError('Ingresá un monto válido.')
      return
    }
    if (currency === 'VES' && !rate) {
      setError('Esperando la tasa, probá de nuevo en un segundo.')
      return
    }

    setSaving(true)
    const amountUsd = currency === 'USD' ? numericAmount : toUsd(numericAmount, rate!)

    const supabase = createClient()
    const { error: insertError } = await supabase.from('transactions').insert({
      household_id: householdId,
      category_id: categoryId,
      subcategory_id: subcategoryId || null,
      amount: numericAmount,
      currency,
      exchange_rate: currency === 'VES' ? rate : null,
      amount_usd: amountUsd,
      description: description || null,
      date,
    })
    setSaving(false)

    if (insertError) {
      setError('No se pudo guardar. Intentá de nuevo.')
      return
    }

    setAmount('')
    setDescription('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Categoría">
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value)
              setSubcategoryId('')
            }}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border)' }}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Subcategoría">
          <select
            value={subcategoryId}
            onChange={(e) => setSubcategoryId(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border)' }}
            disabled={availableSubcategories.length === 0}
          >
            <option value="">—</option>
            {availableSubcategories.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <Field label="Monto">
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border px-3 py-2 text-sm tabular-nums"
            style={{ borderColor: 'var(--border)' }}
          />
        </Field>
        <Field label="Moneda">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border)' }}
          >
            <option value="USD">USD</option>
            <option value="VES">VES</option>
          </select>
        </Field>
      </div>

      {currency === 'VES' && (
        <div className="space-y-1">
          <div className="flex gap-1 rounded-lg border p-1" style={{ borderColor: 'var(--border)', width: 'fit-content' }}>
            {(['bcv', 'paralelo', 'euro'] as RateSource[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRateSource(s)}
                className="rounded-md px-2.5 py-1 text-xs"
                style={
                  s === rateSource
                    ? { background: 'var(--foreground)', color: 'var(--background)' }
                    : { color: 'var(--muted)' }
                }
              >
                {RATE_LABELS[s]}
              </button>
            ))}
          </div>
          <p className="text-xs text-[var(--muted)]">
            {rateError ? rateError : rate ? `Tasa ${RATE_LABELS[rateSource]}: ${rate.toFixed(2)} Bs/USD` : 'Buscando tasa…'}
          </p>
        </div>
      )}

      <Field label="Descripción (opcional)">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--border)' }}
        />
      </Field>

      <Field label="Fecha">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--border)' }}
        />
      </Field>

      {error && <p className="text-sm" style={{ color: 'var(--negative)' }}>{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg py-2.5 text-sm font-medium disabled:opacity-60"
        style={{ background: 'var(--income)', color: 'var(--background)' }}
      >
        {saving ? 'Guardando…' : 'Guardar movimiento'}
      </button>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-[var(--muted)]">{label}</span>
      {children}
    </label>
  )
}