import { login, signup } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; mode?: string; next?: string }>
}) {
  const params = await searchParams
  const isSignup = params.mode === 'signup'
  const next = params.next ?? ''

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div
        className="w-full max-w-sm rounded-xl border p-6"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        <h1 className="mb-1 text-xl font-semibold">
          {isSignup ? 'Creá tu cuenta' : 'Iniciá sesión'}
        </h1>
        <p className="mb-6 text-sm text-[var(--muted)]">
          {isSignup ? 'Para vos y tu pareja, si querés compartirla.' : 'Finanzas personales'}
        </p>

        {params.error && (
          <p className="mb-4 rounded-lg px-3 py-2 text-sm" style={{ background: '#fbeae6', color: 'var(--expense)' }}>
            {params.error}
          </p>
        )}
        {params.message && (
          <p className="mb-4 rounded-lg px-3 py-2 text-sm" style={{ background: '#eaf2ed', color: 'var(--income)' }}>
            {params.message}
          </p>
        )}

        <form action={isSignup ? signup : login} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          {isSignup && (
            <Field label="Nombre del hogar (opcional)">
              <input
                name="householdName"
                type="text"
                placeholder="Ej: Casa de Jose"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border)' }}
              />
            </Field>
          )}
          <Field label="Email">
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </Field>
          <Field label="Contraseña">
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </Field>

          <button
            type="submit"
            className="w-full rounded-lg py-2.5 text-sm font-medium"
            style={{ background: 'var(--income)', color: 'var(--background)' }}
          >
            {isSignup ? 'Crear cuenta' : 'Entrar'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          {isSignup ? (
            <>¿Ya tenés cuenta? <a href={`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="underline">Iniciá sesión</a></>
          ) : (
            <>¿Primera vez? <a href={`/login?mode=signup${next ? `&next=${encodeURIComponent(next)}` : ''}`} className="underline">Creá tu cuenta</a></>
          )}
        </p>
      </div>
    </main>
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