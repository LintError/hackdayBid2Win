import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Profile } from '@/lib/supabase/types'

export async function getCurrentUser() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookies().set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          cookies().delete(name, options)
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('display_name, role')
    .eq('user_id', user.id)
    .single()

  if (error || !profile) return null

  return {
    id: user.id,
    email: user.email!,
    role: profile.role,
    displayName: profile.display_name,
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/sign-in')
  }
  return user
}

export async function requireRole(allowedRoles: string[]) {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/sign-in')
  }
  if (!allowedRoles.includes(user.role)) {
    redirect('/unauthorized')
  }
  return user
}

export async function requireAdmin() {
  return requireRole(['admin'])
}

export async function requireJudge() {
  return requireRole(['admin', 'judge'])
}

export async function requireParticipant() {
  return requireRole(['admin', 'judge', 'participant'])
}

export async function getProfile(userId: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookies().set(name, value, options)
        },
        remove(name: string, options: any) {
          cookies().delete(name, options)
        },
      },
    }
  )

  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, role')
    .eq('user_id', userId)
    .single()

  if (error || !data) return null

  return data
}