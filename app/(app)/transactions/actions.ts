'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function deleteTransaction(formData: FormData) {
  const id = formData.get('id') as string
  if (!id) return

  const supabase = await createClient()
  await supabase.from('transactions').delete().eq('id', id)
  revalidatePath('/transactions')
  revalidatePath('/dashboard')
}