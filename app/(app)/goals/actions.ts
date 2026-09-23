'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getHouseholdId } from '@/lib/get-household'

export async function addGoal(formData: FormData) {
  const householdId = await getHouseholdId()
  const name = (formData.get('name') as string)?.trim()
  const targetAmount = Number(formData.get('targetAmount'))
  const currency = formData.get('currency') as 'USD' | 'VES'
  const targetDate = formData.get('targetDate') as string

  if (!householdId || !name || !targetAmount || targetAmount <= 0) return

  const supabase = await createClient()
  await supabase.from('savings_goals').insert({
    household_id: householdId,
    name,
    target_amount: targetAmount,
    currency,
    target_date: targetDate || null,
  })
  revalidatePath('/goals')
}

export async function addContribution(formData: FormData) {
  const id = formData.get('id') as string
  const amount = Number(formData.get('amount'))
  if (!id || !amount || amount === 0) return

  const supabase = await createClient()
  const { data: goal } = await supabase
    .from('savings_goals')
    .select('current_amount')
    .eq('id', id)
    .single()

  if (!goal) return

  const newAmount = Math.max(0, goal.current_amount + amount)
  await supabase.from('savings_goals').update({ current_amount: newAmount }).eq('id', id)
  await supabase.from('goal_contributions').insert({ goal_id: id, amount })
  revalidatePath('/goals')
}

export async function deleteGoal(formData: FormData) {
  const id = formData.get('id') as string
  if (!id) return

  const supabase = await createClient()
  await supabase.from('savings_goals').delete().eq('id', id)
  revalidatePath('/goals')
}