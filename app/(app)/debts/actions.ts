'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getHouseholdId } from '@/lib/get-household'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

/** Busca la categoría "Deuda" del tipo pedido, o la crea si no existe. */
async function getOrCreateDebtCategory(
  supabase: SupabaseClient,
  householdId: string,
  type: 'ingreso' | 'gasto'
): Promise<string> {
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('household_id', householdId)
    .eq('type', type)
    .eq('is_debt', true)
    .limit(1)
    .maybeSingle()

  if (existing) return existing.id

  const { data: created, error } = await supabase
    .from('categories')
    .insert({ household_id: householdId, name: 'Deuda', type, is_debt: true, sort_order: 99 })
    .select('id')
    .single()

  if (error || !created) throw new Error('No se pudo crear la categoría "Deuda".')
  return created.id
}

export async function addDebt(formData: FormData) {
  const householdId = await getHouseholdId()
  const name = (formData.get('name') as string)?.trim()
  const principal = Number(formData.get('principal'))
  const dueDate = formData.get('dueDate') as string

  if (!householdId) throw new Error('No se encontró tu household.')
  if (!name || !principal || principal <= 0) throw new Error('Faltan datos de la deuda.')

  const supabase = await createClient()
  const categoryId = await getOrCreateDebtCategory(supabase, householdId, 'ingreso')

  const { data: debt, error: debtError } = await supabase
    .from('debts')
    .insert({ household_id: householdId, name, principal_amount: principal, currency: 'USD', due_date: dueDate || null })
    .select('id')
    .single()

  if (debtError || !debt) throw new Error('No se pudo crear la deuda.')

  const { error: txError } = await supabase.from('transactions').insert({
    household_id: householdId,
    category_id: categoryId,
    amount: principal,
    currency: 'USD',
    amount_usd: principal,
    description: name,
    date: new Date().toISOString().slice(0, 10),
  })

  if (txError) throw new Error(`La deuda se creó, pero no se pudo registrar el ingreso: ${txError.message}`)

  revalidatePath('/debts')
  revalidatePath('/dashboard')
  revalidatePath('/transactions')
}

export async function addDebtPayment(formData: FormData) {
  const householdId = await getHouseholdId()
  const debtId = formData.get('debtId') as string
  const amount = Number(formData.get('amount'))

  if (!householdId || !debtId || !amount || amount <= 0) return

  const supabase = await createClient()
  const { data: debt } = await supabase.from('debts').select('name').eq('id', debtId).single()
  if (!debt) return

  const categoryId = await getOrCreateDebtCategory(supabase, householdId, 'gasto')

  await supabase.from('debt_payments').insert({ debt_id: debtId, amount })
  await supabase.from('transactions').insert({
    household_id: householdId,
    category_id: categoryId,
    amount,
    currency: 'USD',
    amount_usd: amount,
    description: `Pago: ${debt.name}`,
    date: new Date().toISOString().slice(0, 10),
  })

  revalidatePath('/debts')
  revalidatePath('/dashboard')
  revalidatePath('/transactions')
}

export async function deleteDebt(formData: FormData) {
  const id = formData.get('id') as string
  if (!id) return

  const supabase = await createClient()
  // Esto borra la deuda y su historial de pagos (cascade), pero NO borra
  // los movimientos ya generados en Transacciones — quedan como registro
  // histórico de que ese dinero entró y salió.
  await supabase.from('debts').delete().eq('id', id)
  revalidatePath('/debts')
}