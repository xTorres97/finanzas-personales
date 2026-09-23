import { createClient } from '@/lib/supabase/server'
import { getHouseholdId } from '@/lib/get-household'
import type { GoalContribution, SavingsGoal } from '@/lib/types'
import { addGoal, addContribution, deleteGoal } from './actions'

export default async function GoalsPage() {
  const householdId = await getHouseholdId()
  const supabase = await createClient()

  const { data: goals } = await supabase
    .from('savings_goals')
    .select('*')
    .eq('household_id', householdId ?? '')
    .order('created_at')

  const rows: SavingsGoal[] = goals ?? []

  const { data: contributions } = rows.length
    ? await supabase
        .from('goal_contributions')
        .select('*')
        .in('goal_id', rows.map((g) => g.id))
        .order('created_at', { ascending: false })
    : { data: [] as GoalContribution[] }

  const contributionsByGoal = new Map<string, GoalContribution[]>()
  for (const c of contributions ?? []) {
    const list = contributionsByGoal.get(c.goal_id) ?? []
    list.push(c)
    contributionsByGoal.set(c.goal_id, list)
  }

  return (
    <main className="content-width px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Metas de ahorro</h1>
        <p className="text-sm text-[var(--muted)]">Definí objetivos y llevá el progreso de cada uno.</p>
      </header>

      <NewGoalForm />

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-[var(--muted)]" style={{ borderColor: 'var(--border)' }}>
          Todavía no creaste ninguna meta.
        </p>
      ) : (
        <div className="space-y-4">
          {rows.map((goal) => (
            <GoalCard key={goal.id} goal={goal} contributions={contributionsByGoal.get(goal.id) ?? []} />
          ))}
        </div>
      )}
    </main>
  )
}

function NewGoalForm() {
  return (
    <form
      action={addGoal}
      className="mb-8 space-y-3 rounded-xl border p-4"
      style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
    >
      <p className="text-sm font-medium">Nueva meta</p>
      <div className="flex flex-wrap items-end gap-3">
        <input
          name="name"
          type="text"
          required
          placeholder="Ej: Fondo de emergencia"
          className="min-w-[180px] flex-1 rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--border)' }}
        />
        <input
          name="targetAmount"
          type="number"
          step="0.01"
          min="1"
          required
          placeholder="Monto meta"
          className="w-32 rounded-lg border px-3 py-2 text-sm tabular-nums"
          style={{ borderColor: 'var(--border)' }}
        />
        <select name="currency" className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }}>
          <option value="USD">USD</option>
          <option value="VES">VES</option>
        </select>
        <input
          name="targetDate"
          type="date"
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--border)' }}
        />
        <button
          type="submit"
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ background: 'var(--income)', color: 'var(--background)' }}
        >
          Crear
        </button>
      </div>
    </form>
  )
}

function GoalCard({ goal, contributions }: { goal: SavingsGoal; contributions: GoalContribution[] }) {
  const pct = goal.target_amount > 0 ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)) : 0
  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: goal.currency })

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="font-medium">{goal.name}</p>
          {goal.target_date && (
            <p className="text-xs text-[var(--muted)]">
              Meta para {new Date(goal.target_date).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
        <form action={deleteGoal}>
          <input type="hidden" name="id" value={goal.id} />
          <button type="submit" className="text-xs" style={{ color: 'var(--expense)' }}>
            Eliminar
          </button>
        </form>
      </div>

      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="tabular-nums">
          {fmt(goal.current_amount)} <span className="text-[var(--muted)]">de {fmt(goal.target_amount)}</span>
        </span>
        <span className="text-[var(--muted)]">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
      </div>

      <form action={addContribution} className="mt-3 flex items-center gap-2">
        <input type="hidden" name="id" value={goal.id} />
        <input
          name="amount"
          type="number"
          step="0.01"
          placeholder="Monto (+/-)"
          className="w-32 rounded-lg border px-2 py-1.5 text-sm tabular-nums"
          style={{ borderColor: 'var(--border)' }}
        />
        <button type="submit" className="text-xs underline" style={{ color: 'var(--income)' }}>
          Registrar aporte
        </button>
      </form>

      {contributions.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-[var(--muted)]">
            Historial de aportes ({contributions.length})
          </summary>
          <ul className="mt-2 space-y-1 border-t pt-2" style={{ borderColor: 'var(--border)' }}>
            {contributions.map((c) => (
              <li key={c.id} className="flex items-center justify-between text-xs">
                <span className="text-[var(--muted)]">
                  {new Date(c.created_at).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <span
                  className="tabular-nums font-medium"
                  style={{ color: c.amount >= 0 ? 'var(--positive)' : 'var(--negative)' }}
                >
                  {c.amount > 0 ? '+' : ''}
                  {c.amount.toLocaleString('en-US', { style: 'currency', currency: goal.currency })}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}