'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { hasSupabaseEnv } from '@/lib/supabase/env'

function getSafeRedirectPath(rawPath: FormDataEntryValue | null): string {
  if (
    typeof rawPath !== 'string' ||
    !rawPath.startsWith('/') ||
    rawPath.startsWith('//')
  ) {
    return '/protected'
  }
  return rawPath
}

export async function login(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect(
      '/login?error=' +
        encodeURIComponent(
          'Supabase environment variables are not configured in .env.local.'
        )
    )
  }

  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const next = getSafeRedirectPath(formData.get('next'))

  if (!email || !password) {
    redirect(
      '/login?error=' +
        encodeURIComponent('Please enter both your email and password.')
    )
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect(next)
}

export async function signup(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect(
      '/login?error=' +
        encodeURIComponent(
          'Supabase environment variables are not configured in .env.local.'
        )
    )
  }

  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    redirect(
      '/login?error=' +
        encodeURIComponent('Please enter both your email and password.')
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')

  if (data.session) {
    redirect('/protected')
  }

  redirect(
    '/login?message=' +
      encodeURIComponent(
        'Check your email for a confirmation link to complete your sign-up.'
      )
  )
}

export async function signout() {
  if (hasSupabaseEnv()) {
    const supabase = await createClient()
    // Use `scope: 'local'` so only the current browser session is signed out
    // rather than revoking refresh tokens across all devices.
    await supabase.auth.signOut({ scope: 'local' })
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}

