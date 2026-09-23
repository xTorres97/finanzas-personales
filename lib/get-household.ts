import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

/** Devuelve el household_id del usuario logueado, o null si no hay sesión. */
export async function getHouseholdId(): Promise<string | null> {
  // El middleware ya autenticó al usuario y resolvió su household_id en
  // esta misma request — lo leemos del header en vez de volver a golpear
  // Supabase (evita una autenticación + consulta redundante por página).
  const headerList = await headers()
  const fromHeader = headerList.get('x-household-id')
  if (fromHeader) return fromHeader

  // Fallback: si por algo el header no está (ej. llamadas fuera del
  // middleware normal), resolvemos como antes.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('getHouseholdId error:', error.message)
    return null
  }

  return data?.household_id ?? null
}