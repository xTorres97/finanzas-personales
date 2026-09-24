'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getHouseholdId } from '@/lib/get-household'

export async function withdrawSavings(formData: FormData) {
  const householdId = await getHouseholdId()
  const categoryId = formData.get('categoryId') as string
  const subcategoryIdRaw = formData.get('subcategoryId') as string
  const subcategoryId = subcategoryIdRaw || null
  const amount = Number(formData.get('amount'))

  if (!householdId) throw new Error('No se encontró tu household.')
  if (!categoryId) throw new Error('Falta la categoría de ahorro.')
  if (!amount || amount <= 0) throw new Error('Ingresá un monto válido.')

  const supabase = await createClient()

  // Validar que no se retire más de lo disponible: depósitos - retiros previos
  let depositsQuery = supabase.from('transactions').select('amount_usd').eq('category_id', categoryId)
  depositsQuery = subcategoryId ? depositsQuery.eq('subcategory_id', subcategoryId) : depositsQuery.is('subcategory_id', null)
  const { data: deposits } = await depositsQuery
  const totalDeposited = (deposits ?? []).reduce((s, t) => s + t.amount_usd, 0)

  let withdrawalsQuery = supabase.from('savings_withdrawals').select('amount').eq('category_id', categoryId)
  withdrawalsQuery = subcategoryId
    ? withdrawalsQuery.eq('subcategory_id', subcategoryId)
    : withdrawalsQuery.is('subcategory_id', null)
  const { data: withdrawals } = await withdrawalsQuery
  const totalWithdrawn = (withdrawals ?? []).reduce((s, w) => s + w.amount, 0)

  const available = totalDeposited - totalWithdrawn
  if (amount > available) {
    throw new Error(`Solo tenés ${available.toFixed(2)} disponibles ahí.`)
  }

  const { error } = await supabase.from('savings_withdrawals').insert({
    household_id: householdId,
    category_id: categoryId,
    subcategory_id: subcategoryId,
    amount,
  })

  if (error) throw new Error(`Error al registrar el retiro: ${error.message}`)

  revalidatePath('/savings')
}