import { NavBar } from '@/components/nav-bar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    // pb-16 deja espacio para que el nav fijo de abajo no tape el
    // contenido final de cada página
    <div className="pb-16">
      {children}
      <NavBar />
    </div>
  )
}