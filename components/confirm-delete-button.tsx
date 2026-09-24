'use client'

interface Props {
  children: React.ReactNode
  confirmMessage?: string
  className?: string
  style?: React.CSSProperties
}

export function ConfirmDeleteButton({
  children,
  confirmMessage = '¿Seguro que querés eliminar esto? No se puede deshacer.',
  className,
  style,
}: Props) {
  return (
    <button
      type="submit"
      className={className}
      style={style}
      onClick={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault()
        }
      }}
    >
      {children}
    </button>
  )
}