'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/login?error=${encodeURIComponent('Email o contraseña incorrectos')}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const householdName = formData.get('householdName') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { household_name: householdName || undefined },
    },
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  // Si tenés confirmación por email activada en Supabase, acá el usuario
  // todavía no tiene sesión — mostramos el mensaje en vez de redirigir.
  redirect('/login?message=Revisá tu correo para confirmar la cuenta')
}