'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, Tags, BarChart3, PiggyBank, LogOut } from 'lucide-react'
import { logout } from '@/app/(app)/actions'

const items = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/transactions', label: 'Movimientos', icon: ArrowLeftRight },
  { href: '/categories', label: 'Categorías', icon: Tags },
  { href: '/reports', label: 'Reportes', icon: BarChart3 },
  { href: '/goals', label: 'Metas', icon: PiggyBank },
]

export function NavBar() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 border-t"
      style={{
        background: 'var(--card)',
        borderColor: 'var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className="flex flex-col items-center gap-0.5 py-2 text-[11px]"
                style={{ color: active ? 'var(--income)' : 'var(--muted)' }}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            </li>
          )
        })}
        <li className="flex-1">
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full flex-col items-center gap-0.5 py-2 text-[11px]"
              style={{ color: 'var(--expense)' }}
            >
              <LogOut size={20} />
              Salir
            </button>
          </form>
        </li>
      </ul>
    </nav>
  )
}