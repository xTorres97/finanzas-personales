import { createClient } from '@/lib/supabase/server'
import { getHouseholdId } from '@/lib/get-household'
import type { Debt, DebtPayment } from '@/lib/types'
import { ConfirmDeleteButton } from '@/components/confirm-delete-button'
import { addDebt, addDebtPayment, deleteDebt } from './actions'

export default async function DebtsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const householdId = await getHouseholdId()
  const supabase = await createClient()

  const { data: debts } = await supabase
    .from('debts')
    .select('*')
    .eq('household_id', householdId ?? '')
    .order('created_at')

  const rows: Debt[] = debts ?? []

  const { data: payments } = rows.length
    ? await supabase
        .from('debt_payments')
        .select('*')
        .in('debt_id', rows.map((d) => d.id))
        .order('created_at', { ascending: false })
    : { data: [] as DebtPayment[] }

  const paymentsByDebt = new Map<string, DebtPayment[]>()
  for (const p of payments ?? []) {
    const list = paymentsByDebt.get(p.debt_id) ?? []
    list.push(p)
    paymentsByDebt.set(p.debt_id, list)
  }

  return (
    <main className="content-width px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl" style={{ color: 'var(--negative)' }}>Deudas</h1>
        <p className="text-sm text-[var(--muted)]">Préstamos, compras a cuotas y lo que debas, con su historial de pagos.</p>
      </header>

      {error && (
        <p className="mb-6 rounded-lg px-3 py-2 text-sm" style={{ background: '#fbeae6', color: 'var(--negative)' }}>
          {error}
        </p>
      )}

      <NewDebtForm />

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-[var(--muted)]" style={{ borderColor: 'var(--border)' }}>
          No tenés deudas cargadas.
        </p>
      ) : (
        <div className="space-y-4">
          {rows.map((debt) => (
            <DebtCard key={debt.id} debt={debt} payments={paymentsByDebt.get(debt.id) ?? []} />
          ))}
        </div>
      )}
    </main>
  )
}

function NewDebtForm() {
  return (
    <form
      action={addDebt}
      className="mb-8 space-y-3 rounded-xl border p-4"
      style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
    >
      <p className="text-sm font-medium">Nueva deuda</p>
      <p className="text-xs text-[var(--muted)]">
        Se guarda aparte, igual que las metas de ahorro — no genera movimientos ni afecta tu balance o tus
        reportes, es solo un seguimiento de cuánto debés y cuánto vas pagando.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <input
          name="name"
          type="text"
          required
          placeholder="Ej: Préstamo para la nevera"
          className="min-w-[200px] flex-1 rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--border)' }}
        />
        <input
          name="principal"
          type="number"
          step="0.01"
          min="1"
          required
          placeholder="Monto (USD)"
          className="w-36 rounded-lg border px-3 py-2 text-sm tabular-nums"
          style={{ borderColor: 'var(--border)' }}
        />
        <input name="dueDate" type="date" className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }} />
        <button
          type="submit"
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ background: 'var(--income)', color: 'var(--background)' }}
        >
          Agregar
        </button>
      </div>
    </form>
  )
}

function DebtCard({ debt, payments }: { debt: Debt; payments: DebtPayment[] }) {
  const paid = payments.reduce((s, p) => s + p.amount, 0)
  const remaining = Math.max(0, debt.principal_amount - paid)
  const pct = debt.principal_amount > 0 ? Math.min(100, Math.round((paid / debt.principal_amount) * 100)) : 0
  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: debt.currency })

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="font-medium">{debt.name}</p>
          {debt.due_date && (
            <p className="text-xs text-[var(--muted)]">
              Vence {new Date(debt.due_date).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
        <form action={deleteDebt}>
          <input type="hidden" name="id" value={debt.id} />
          <ConfirmDeleteButton
            confirmMessage={`¿Eliminar la deuda "${debt.name}"? Se borra también su historial de pagos. No se puede deshacer.`}
            className="text-xs"
            style={{ color: 'var(--negative)' }}
          >
            Eliminar
          </ConfirmDeleteButton>
        </form>
      </div>

      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="tabular-nums">
          {fmt(remaining)} <span className="text-[var(--muted)]">pendiente de {fmt(debt.principal_amount)}</span>
        </span>
        <span className="text-[var(--muted)]">{pct}% pagado</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--balance)' }} />
      </div>

      {remaining > 0 && (
        <form action={addDebtPayment} className="mt-3 flex items-center gap-2">
          <input type="hidden" name="debtId" value={debt.id} />
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Monto del pago"
            className="w-36 rounded-lg border px-2 py-1.5 text-sm tabular-nums"
            style={{ borderColor: 'var(--border)' }}
          />
          <button type="submit" className="text-xs underline" style={{ color: 'var(--negative)' }}>
            Registrar pago
          </button>
        </form>
      )}

      {payments.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-[var(--muted)]">
            Historial de pagos ({payments.length})
          </summary>
          <ul className="mt-2 space-y-1 border-t pt-2" style={{ borderColor: 'var(--border)' }}>
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-xs">
                <span className="text-[var(--muted)]">
                  {new Date(p.created_at).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <span className="tabular-nums font-medium" style={{ color: 'var(--negative)' }}>
                  −{fmt(p.amount)}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}