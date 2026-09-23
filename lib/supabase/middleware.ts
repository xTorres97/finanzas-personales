import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)

  let response = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isLoginRoute = request.nextUrl.pathname.startsWith('/login')
  const isPublicRoute = isLoginRoute || request.nextUrl.pathname.startsWith('/join')

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    const originalPath = url.pathname + url.search
    url.pathname = '/login'
    url.search = ''
    url.searchParams.set('next', originalPath)
    return NextResponse.redirect(url)
  }

  if (user && isLoginRoute) {
    const url = request.nextUrl.clone()
    const next = url.searchParams.get('next')
    url.pathname = next && next.startsWith('/') ? next : '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Aprovechamos que ya autenticamos al usuario acá para resolver también
  // su household_id, y lo pasamos por header — así getHouseholdId() en las
  // páginas/actions no necesita volver a autenticar ni consultar de nuevo.
  if (user) {
    requestHeaders.set('x-user-id', user.id)

    const { data: membership } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .single()

    if (membership?.household_id) {
      requestHeaders.set('x-household-id', membership.household_id)
    }

    response = NextResponse.next({ request: { headers: requestHeaders } })
  }

  return response
}