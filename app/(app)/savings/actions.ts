'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getHouseholdId } from '@/lib/get-household'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

/** Busca la categoría de tipo ingreso usada para retiros de ahorro, o la crea. */
async function getOrCreateWithdrawalCategory(supabase: SupabaseClient, householdId: string): Promise<string> {
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('household_id', householdId)
    .eq('type', 'ingreso')
    .eq('is_savings', true)
    .limit(1)
    .maybeSingle()

  if (existing) return existing.id

  const { data: created, error } = await supabase
    .from('categories')
    .insert({ household_id: householdId, name: 'Retiro de ahorro', type: 'ingreso', is_savings: true, sort_order: 99 })
    .select('id')
    .single()

  if (error || !created) throw new Error('No se pudo crear la categoría "Retiro de ahorro".')
  return created.id
}

export async function withdrawSavings(formData: FormData) {
  const householdId = await getHouseholdId()
  const subcategoryIdRaw = formData.get('subcategoryId') as string
  const subcategoryId = subcategoryIdRaw || null
  const label = (formData.get('label') as string) || 'Ahorro'
  const amount = Number(formData.get('amount'))

  if (!householdId) throw new Error('No se encontró tu household.')
  if (!amount || amount <= 0) throw new Error('Ingresá un monto válido.')

  const supabase = await createClient()

  // Validar que no se retire más de lo disponible en ese bucket
  const { data: savingsCategories } = await supabase
    .from('categories')
    .select('id')
    .eq('household_id', householdId)
    .eq('is_savings', true)
  const categoryIds = (savingsCategories ?? []).map((c) => c.id)

  let query = supabase
    .from('transactions')
    .select('amount_usd, categories(type)')
    .in('category_id', categoryIds)
  query = subcategoryId ? query.eq('subcategory_id', subcategoryId) : query.is('subcategory_id', null)
  const { data: relevant } = await query

  const available = (relevant ?? []).reduce((sum, t) => {
    const isDeposit = (t.categories as unknown as { type: string } | null)?.type === 'gasto'
    return sum + (isDeposit ? t.amount_usd : -t.amount_usd)
  }, 0)

  if (amount > available) {
    throw new Error(`Solo tenés ${available.toFixed(2)} disponibles ahí.`)
  }

  const categoryId = await getOrCreateWithdrawalCategory(supabase, householdId)

  const { error } = await supabase.from('transactions').insert({
    household_id: householdId,
    category_id: categoryId,
    subcategory_id: subcategoryId,
    amount,
    currency: 'USD',
    amount_usd: amount,
    description: `Retiro: ${label}`,
    date: new Date().toISOString().slice(0, 10),
  })

  if (error) throw new Error(`Error al registrar el retiro: ${error.message}`)

  revalidatePath('/savings')
  revalidatePath('/dashboard')
  revalidatePath('/transactions')
}