'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function deleteTransaction(formData: FormData) {
  const id = formData.get('id') as string
  if (!id) return

  const supabase = await createClient()
  const { error } = await supabase.from('transactions').delete().eq('id', id)

  if (error) {
    redirect(`/transactions?error=${encodeURIComponent(`No se pudo eliminar: ${error.message}`)}`)
  }

  revalidatePath('/transactions')
  revalidatePath('/dashboard')
}