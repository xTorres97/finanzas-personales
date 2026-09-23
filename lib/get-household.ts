import { createClient } from '@/lib/supabase/server'

/** Devuelve el household_id del usuario logueado, o null si no hay sesión. */
export async function getHouseholdId(): Promise<string | null> {
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