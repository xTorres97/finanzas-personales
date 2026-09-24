'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getHouseholdId } from '@/lib/get-household'

export async function addDebt(formData: FormData) {
  const householdId = await getHouseholdId()
  const name = (formData.get('name') as string)?.trim()
  const principal = Number(formData.get('principal'))
  const dueDate = formData.get('dueDate') as string

  if (!householdId) throw new Error('No se encontró tu household.')
  if (!name || !principal || principal <= 0) throw new Error('Faltan datos de la deuda.')

  const supabase = await createClient()
  const { error } = await supabase.from('debts').insert({
    household_id: householdId,
    name,
    principal_amount: principal,
    currency: 'USD',
    due_date: dueDate || null,
  })

  if (error) throw new Error(`No se pudo crear la deuda: ${error.message}`)
  revalidatePath('/debts')
}

export async function addDebtPayment(formData: FormData) {
  const debtId = formData.get('debtId') as string
  const amount = Number(formData.get('amount'))
  if (!debtId || !amount || amount <= 0) return

  const supabase = await createClient()
  await supabase.from('debt_payments').insert({ debt_id: debtId, amount })
  revalidatePath('/debts')
}

export async function deleteDebt(formData: FormData) {
  const id = formData.get('id') as string
  if (!id) return

  const supabase = await createClient()
  await supabase.from('debts').delete().eq('id', id)
  revalidatePath('/debts')
}