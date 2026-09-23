import { createClient } from '@/lib/supabase/server'
import { getHouseholdId } from '@/lib/get-household'
import { InviteButton } from '@/components/invite-button'

export default async function HouseholdPage() {
  const householdId = await getHouseholdId()
  const supabase = await createClient()

  const [{ data: household }, { count }] = await Promise.all([
    supabase.from('households').select('name').eq('id', householdId ?? '').single(),
    supabase.from('household_members').select('*', { count: 'exact', head: true }).eq('household_id', householdId ?? ''),
  ])

  return (
    <main className="content-width px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Tu hogar</h1>
        <p className="text-sm text-[var(--muted)]">
          {household?.name ?? 'Mi hogar'} · {count ?? 1} {count === 1 ? 'miembro' : 'miembros'}
        </p>
      </header>

      <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <p className="mb-1 text-sm font-medium">Invitar a tu pareja</p>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Generá un link de invitación para que se sume a este hogar con su propia cuenta — van a compartir
          categorías, movimientos y metas de ahorro.
        </p>
        <InviteButton />
      </div>
    </main>
  )
}