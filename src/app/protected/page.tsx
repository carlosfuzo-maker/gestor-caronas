import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { hasSupabaseEnv } from '@/lib/supabase/env'
import { signout } from '@/app/login/actions'

async function AuthenticatedContent() {
  if (!hasSupabaseEnv()) {
    redirect('/login')
  }

  const supabase = await createClient()

  // Defense-in-depth: always verify JWT claims inside protected Server Components
  // in addition to the Next.js Proxy (`src/proxy.ts`).
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    redirect('/login')
  }

  const { claims } = data

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Authenticated Session
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        You are signed in as{' '}
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {typeof claims.email === 'string' ? claims.email : claims.sub}
        </span>
        . This page is protected by both the Next.js Proxy (
        <code className="font-mono text-xs">src/proxy.ts</code>) and server-side{' '}
        <code className="font-mono text-xs">getClaims()</code> verification.
      </p>

      <div className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Verified JWT Claims
        </h2>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-zinc-950 p-4 font-mono text-xs text-zinc-100">
          {JSON.stringify(claims, null, 2)}
        </pre>
      </div>
    </section>
  )
}

export default function ProtectedPage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Caronas
            </Link>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Protected Route
            </span>
          </div>
          <form action={signout}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 px-3.5 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              Verifying session...
            </div>
          }
        >
          <AuthenticatedContent />
        </Suspense>
      </main>
    </div>
  )
}
