import Link from 'next/link'
import { PiggyBank, Wallet, HandCoins, Users, LogOut, ChevronRight } from 'lucide-react'
import { logout } from '@/app/(app)/actions'

const links = [
  { href: '/goals', label: 'Metas de ahorro', icon: PiggyBank },
  { href: '/savings', label: 'Ahorros', icon: Wallet },
  { href: '/debts', label: 'Deudas', icon: HandCoins },
  { href: '/household', label: 'Tu hogar', icon: Users },
]

export default function MorePage() {
  return (
    <main className="content-width px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Más</h1>
      </header>

      <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        {links.map(({ href, label, icon: Icon }, i) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-4 py-3.5"
            style={i > 0 ? { borderTop: '1px solid var(--border)' } : undefined}
          >
            <Icon size={18} style={{ color: 'var(--muted)' }} />
            <span className="flex-1 text-sm font-medium">{label}</span>
            <ChevronRight size={16} style={{ color: 'var(--muted)' }} />
          </Link>
        ))}
      </div>

      <form action={logout} className="mt-4">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-medium"
          style={{ borderColor: 'var(--border)', color: 'var(--negative)' }}
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </form>
    </main>
  )
}