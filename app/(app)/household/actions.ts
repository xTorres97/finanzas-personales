'use server'

import { createClient } from '@/lib/supabase/server'

export async function generateInvite(): Promise<{ code?: string; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('create_household_invite')

  if (error) return { error: error.message }
  return { code: data as string }
}