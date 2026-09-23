'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function redeemInvite(code: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('redeem_household_invite', { p_code: code })

  if (error) {
    redirect(`/join/${code}?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/dashboard')
}