'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const next = (formData.get('next') as string) || '/dashboard'

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const qs = new URLSearchParams({ error: 'Email o contraseña incorrectos', next })
    redirect(`/login?${qs.toString()}`)
  }

  revalidatePath('/', 'layout')
  redirect(next)
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const householdName = formData.get('householdName') as string
  const next = (formData.get('next') as string) || '/dashboard'

  const headerList = await headers()
  const origin = headerList.get('origin') ?? `https://${headerList.get('host')}`

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { household_name: householdName || undefined },
      // Si Supabase requiere confirmación por email, el link del correo
      // manda de vuelta acá — por ejemplo, a /join/CODE si venía de una
      // invitación.
      emailRedirectTo: `${origin}${next}`,
    },
  })

  if (error) {
    const qs = new URLSearchParams({ error: error.message, next, mode: 'signup' })
    redirect(`/login?${qs.toString()}`)
  }

  // Si Supabase ya te dio sesión (confirmación de email desactivada),
  // podemos ir directo al destino. Si no, mostramos el mensaje de
  // "revisá tu correo" y el link del mail se encarga del resto.
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    revalidatePath('/', 'layout')
    redirect(next)
  }

  const qs = new URLSearchParams({ message: 'Revisá tu correo para confirmar la cuenta', mode: 'signup' })
  redirect(`/login?${qs.toString()}`)
}