'use server'

import Link from 'next/link'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getCurrentRole, promoteFirstAdminWithRedirect } from '@/app/actions/admin'
import { getPendingSubmissions } from '@/app/actions/submissions'

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return <main className="flex min-h-screen items-center justify-center bg-[#f7f6f2] p-6"><div className="rounded-2xl border border-[#deded7] bg-[#fbfaf7] p-8 text-center"><h1 className="font-serif text-3xl">Admin access</h1><p className="mt-2 text-sm text-[#687068]">Sign in with the designated admin email to continue.</p><Link href="/sign-in" className="mt-6 inline-block rounded-xl bg-[#1f3b2c] px-4 py-3 text-sm font-semibold text-white">Sign in</Link></div></main>
  }
  const role = await getCurrentRole()
  if (role !== 'admin' && session.user.email.toLowerCase() === 'mehul.n.ved@gmail.com') {
    return <main className="flex min-h-screen items-center justify-center bg-[#f7f6f2] p-6"><div className="w-full max-w-lg rounded-2xl border border-[#deded7] bg-[#fbfaf7] p-8"><Link href="/" className="font-serif text-2xl font-semibold text-[#1f3b2c]">kaapi</Link><p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-[#b46d45]">First-time setup</p><h1 className="mt-2 font-serif text-4xl">Establish admin access</h1><p className="mt-3 text-sm leading-6 text-[#687068]">Your signed-in account is eligible to become the first kaapi admin. This unlocks moderation tools for staged cafe submissions.</p><form action={async (formData) => { 'use server'; await promoteFirstAdminWithRedirect(formData) }} className="mt-6"><input type="hidden" name="email" value={session.user.email} /><button className="rounded-xl bg-[#1f3b2c] px-4 py-3 text-sm font-semibold text-white">Become first admin</button></form></div></main>
  }
  if (role !== 'admin') return <main className="flex min-h-screen items-center justify-center bg-[#f7f6f2] p-6"><div className="rounded-2xl border border-[#deded7] bg-[#fbfaf7] p-8 text-center"><h1 className="font-serif text-3xl">Approval required</h1><p className="mt-2 text-sm text-[#687068]">This account does not have moderation access.</p><Link href="/" className="mt-6 inline-block text-sm font-semibold text-[#9a603e]">Return to atlas</Link></div></main>
  const submissions = await getPendingSubmissions()
  return <main className="min-h-screen bg-[#f7f6f2] p-6 lg:p-10"><div className="mx-auto max-w-5xl"><Link href="/" className="font-serif text-2xl font-semibold text-[#1f3b2c]">kaapi</Link><div className="mt-10 rounded-2xl border border-[#deded7] bg-[#fbfaf7] p-8"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b46d45]">Moderation</p><h1 className="mt-2 font-serif text-4xl">Review staged cafes</h1><p className="mt-3 text-sm text-[#687068]">Approved submissions will appear in the public atlas. The moderation queue is ready for staged cafe records.</p><div className="mt-8 grid gap-4">{submissions.length ? submissions.map((submission) => <article key={submission.id} className="rounded-xl border border-[#deded7] bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-serif text-2xl text-[#1f3b2c]">{submission.name}</h2><p className="mt-1 text-sm text-[#687068]">{submission.address}</p></div><div className="flex gap-2">{submission.tags.map((tag) => <span key={tag} className="rounded-full bg-[#fff0e9] px-2 py-1 text-xs font-semibold text-[#b64d2d]">{tag}</span>)}</div></div><p className="mt-4 text-sm text-[#687068]">{submission.details || 'No additional details.'}</p><p className="mt-3 text-xs text-[#8a9189]">Submitted {submission.createdAt.toLocaleDateString()}</p></article>) : <div className="rounded-xl border border-dashed border-[#c9cec5] p-8 text-sm text-[#687068]">No staged submissions yet.</div>}</div></div></div></main>
}
