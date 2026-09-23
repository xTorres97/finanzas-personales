import { createClient } from '@/lib/supabase/server'
import { redeemInvite } from './actions'

export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { code } = await params
  const { error } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const redeemWithCode = redeemInvite.bind(null, code)

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div
        className="w-full max-w-sm rounded-xl border p-6"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        <h1 className="mb-1 text-xl font-semibold">Te invitaron a un hogar</h1>
        <p className="mb-6 text-sm text-[var(--muted)]">
          En Finanzas Personales vas a compartir categorías, movimientos y metas de ahorro.
        </p>

        {error && (
          <p className="mb-4 rounded-lg px-3 py-2 text-sm" style={{ background: '#fbeae6', color: 'var(--negative)' }}>
            {error}
          </p>
        )}

        {user ? (
          <form action={redeemWithCode}>
            <button
              type="submit"
              className="w-full rounded-lg py-2.5 text-sm font-medium"
              style={{ background: 'var(--income)', color: 'var(--background)' }}
            >
              Unirme a este hogar
            </button>
            <p className="mt-3 text-center text-xs text-[var(--muted)]">
              Vas a entrar como {user.email}
            </p>
          </form>
        ) : (
          <div className="space-y-2">
            <a
              href={`/login?mode=signup&next=/join/${code}`}
              className="block w-full rounded-lg py-2.5 text-center text-sm font-medium"
              style={{ background: 'var(--income)', color: 'var(--background)' }}
            >
              Crear cuenta y unirme
            </a>
            <a
              href={`/login?next=/join/${code}`}
              className="block w-full rounded-lg border py-2.5 text-center text-sm font-medium"
              style={{ borderColor: 'var(--border)' }}
            >
              Ya tengo cuenta
            </a>
          </div>
        )}
      </div>
    </main>
  )
}