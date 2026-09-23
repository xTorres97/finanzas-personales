'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { fetchBcvRate, toUsd } from '@/lib/exchange-rate'
import type { Category, CurrencyCode, Subcategory } from '@/lib/types'

interface Props {
  categories: Category[]
  subcategories: Subcategory[]
  householdId: string
}

export function TransactionForm({ categories, subcategories, householdId }: Props) {
  const router = useRouter()
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<CurrencyCode>('USD')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [bcvRate, setBcvRate] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (currency === 'VES' && bcvRate === null) {
      fetchBcvRate()
        .then((r) => setBcvRate(r.rate))
        .catch(() => setError('No pudimos traer la tasa BCV. Probá de nuevo.'))
    }
  }, [currency, bcvRate])

  const availableSubcategories = subcategories.filter((s) => s.category_id === categoryId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const numericAmount = Number(amount)
    if (!numericAmount || numericAmount <= 0) {
      setError('Ingresá un monto válido.')
      return
    }
    if (currency === 'VES' && !bcvRate) {
      setError('Esperando la tasa BCV, probá de nuevo en un segundo.')
      return
    }

    setSaving(true)
    const amountUsd =
      currency === 'USD' ? numericAmount : toUsd(numericAmount, 'VES', bcvRate!)

    const supabase = createClient()
    const { error: insertError } = await supabase.from('transactions').insert({
      household_id: householdId,
      category_id: categoryId,
      subcategory_id: subcategoryId || null,
      amount: numericAmount,
      currency,
      exchange_rate: currency === 'VES' ? bcvRate : null,
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
        <p className="text-xs text-[var(--muted)]">
          {bcvRate ? `Tasa BCV: ${bcvRate.toFixed(2)} Bs/USD` : 'Buscando tasa BCV…'}
        </p>
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

      {error && <p className="text-sm" style={{ color: 'var(--expense)' }}>{error}</p>}

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