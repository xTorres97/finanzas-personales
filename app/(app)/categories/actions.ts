'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getHouseholdId } from '@/lib/get-household'

// ---------- Categorías ----------

export async function addCategory(formData: FormData) {
  const householdId = await getHouseholdId()
  const name = (formData.get('name') as string)?.trim()
  const type = formData.get('type') as 'ingreso' | 'gasto'
  const isSavings = formData.get('isSavings') === 'on'

  if (!householdId) throw new Error('No se encontró tu household. Revisá household_members en Supabase.')
  if (!name || !type) throw new Error('Faltan datos: nombre o tipo.')

  const supabase = await createClient()
  const { error } = await supabase
    .from('categories')
    .insert({ household_id: householdId, name, type, is_savings: isSavings })
  if (error) throw new Error(`Error de Supabase: ${error.message}`)
  revalidatePath('/categories')
}

export async function renameCategory(formData: FormData) {
  const id = formData.get('id') as string
  const name = (formData.get('name') as string)?.trim()
  if (!id || !name) return

  const supabase = await createClient()
  await supabase.from('categories').update({ name }).eq('id', id)
  revalidatePath('/categories')
}

export async function deleteCategory(formData: FormData) {
  const id = formData.get('id') as string
  if (!id) return

  const supabase = await createClient()
  // Las transacciones referencian category_id con FK sin cascade, así que
  // si tiene movimientos asociados, Postgres va a rechazar el delete —
  // es el comportamiento correcto (evita perder historial sin querer).
  const { error } = await supabase.from('categories').delete().eq('id', id)

  if (error) {
    const message =
      error.code === '23503'
        ? 'No se puede eliminar: esa categoría ya tiene movimientos cargados.'
        : `No se pudo eliminar: ${error.message}`
    redirect(`/categories?error=${encodeURIComponent(message)}`)
  }

  revalidatePath('/categories')
}

// ---------- Subcategorías ----------

export async function addSubcategory(formData: FormData) {
  const categoryId = formData.get('categoryId') as string
  const name = (formData.get('name') as string)?.trim()
  if (!categoryId || !name) return

  const supabase = await createClient()
  await supabase.from('subcategories').insert({ category_id: categoryId, name })
  revalidatePath('/categories')
}

export async function renameSubcategory(formData: FormData) {
  const id = formData.get('id') as string
  const name = (formData.get('name') as string)?.trim()
  if (!id || !name) return

  const supabase = await createClient()
  await supabase.from('subcategories').update({ name }).eq('id', id)
  revalidatePath('/categories')
}

export async function deleteSubcategory(formData: FormData) {
  const id = formData.get('id') as string
  if (!id) return

  const supabase = await createClient()
  const { error } = await supabase.from('subcategories').delete().eq('id', id)

  if (error) {
    const message =
      error.code === '23503'
        ? 'No se puede eliminar: esa subcategoría ya tiene movimientos cargados.'
        : `No se pudo eliminar: ${error.message}`
    redirect(`/categories?error=${encodeURIComponent(message)}`)
  }

  revalidatePath('/categories')
}