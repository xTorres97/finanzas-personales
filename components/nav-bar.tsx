'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, Tags, BarChart3, MoreHorizontal } from 'lucide-react'

const items = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/transactions', label: 'Movimientos', icon: ArrowLeftRight },
  { href: '/categories', label: 'Categorías', icon: Tags },
  { href: '/reports', label: 'Reportes', icon: BarChart3 },
  { href: '/more', label: 'Más', icon: MoreHorizontal },
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
      </ul>
    </nav>
  )
}