'use client'

import { useState } from 'react'
import { generateInvite } from '@/app/(app)/household/actions'

export function InviteButton() {
  const [link, setLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    const result = await generateInvite()
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }
    if (result.code) {
      setLink(`${window.location.origin}/join/${result.code}`)
    }
  }

  async function handleCopy() {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      {!link && (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
          style={{ background: 'var(--income)', color: 'var(--background)' }}
        >
          {loading ? 'Generando…' : 'Invitar a mi pareja'}
        </button>
      )}

      {link && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={link}
              className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
            <button
              onClick={handleCopy}
              className="shrink-0 rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {copied ? 'Copiado ✓' : 'Copiar'}
            </button>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Válida por 7 días y para un solo uso. Mandale este link a tu pareja — al abrirlo va a poder
            crear su cuenta (o iniciar sesión) y sumarse directo a este hogar.
          </p>
          <button onClick={handleGenerate} className="text-xs underline" style={{ color: 'var(--muted)' }}>
            Generar otra
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm" style={{ color: 'var(--negative)' }}>
          {error}
        </p>
      )}
    </div>
  )
}