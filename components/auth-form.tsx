'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true); setError('')
    const form = new FormData(event.currentTarget)
    const result = mode === 'sign-up'
      ? await authClient.signUp.email({ email: String(form.get('email')), password: String(form.get('password')), name: String(form.get('name')) })
      : await authClient.signIn.email({ email: String(form.get('email')), password: String(form.get('password')) })
    setPending(false)
    if (result.error) { setError('We could not complete that request. Check your details and try again.'); return }
    router.push('/'); router.refresh()
  }
  return <main className="flex min-h-screen items-center justify-center bg-[#f7f6f2] px-6"><div className="w-full max-w-md rounded-2xl border border-[#deded7] bg-[#fbfaf7] p-8 shadow-sm"><Link href="/" className="font-serif text-2xl font-semibold text-[#1f3b2c]">Sūtra</Link><p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-[#b46d45]">Coffee atlas community</p><h1 className="mt-2 font-serif text-4xl text-[#20221f]">{mode === 'sign-up' ? 'Join the atlas' : 'Welcome back'}</h1><p className="mt-2 text-sm text-[#687068]">{mode === 'sign-up' ? 'Help keep India’s coffee map thoughtful and current.' : 'Sign in to suggest and manage cafe submissions.'}</p><form onSubmit={submit} className="mt-8 flex flex-col gap-4">{mode === 'sign-up' && <label className="text-sm font-medium">Name<input name="name" required className="mt-2 w-full rounded-xl border border-[#deded7] bg-white px-3 py-3 outline-none focus:border-[#b46d45]" /></label>}<label className="text-sm font-medium">Email<input name="email" type="email" required className="mt-2 w-full rounded-xl border border-[#deded7] bg-white px-3 py-3 outline-none focus:border-[#b46d45]" /></label><label className="text-sm font-medium">Password<input name="password" type="password" minLength={8} required className="mt-2 w-full rounded-xl border border-[#deded7] bg-white px-3 py-3 outline-none focus:border-[#b46d45]" /></label>{error && <p className="text-sm text-[#a64f3f]" role="alert">{error}</p>}<button disabled={pending} className="rounded-xl bg-[#1f3b2c] px-4 py-3 font-semibold text-white disabled:opacity-60">{pending ? 'Working…' : mode === 'sign-up' ? 'Create account' : 'Sign in'}</button></form><p className="mt-6 text-center text-sm text-[#687068]">{mode === 'sign-up' ? 'Already a member?' : 'New to Sūtra?'} <Link href={mode === 'sign-up' ? '/sign-in' : '/sign-up'} className="font-semibold text-[#9a603e]">{mode === 'sign-up' ? 'Sign in' : 'Create an account'}</Link></p></div></main>
}
