'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getHouseholdId } from '@/lib/get-household'
import type { TransactionWithCategory } from '@/lib/types'

const PAGE_SIZE = 10

export async function loadMoreTransactions(offset: number): Promise<TransactionWithCategory[]> {
  const householdId = await getHouseholdId()
  if (!householdId) return []

  const supabase = await createClient()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  const { data } = await supabase
    .from('transactions')
    .select('*, categories(name, type, color)')
    .eq('household_id', householdId)
    .gte('date', startOfMonth)
    .lte('date', endOfMonth)
    .order('date', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)
    .returns<TransactionWithCategory[]>()

  return data ?? []
}

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