'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/auth-helpers-react';
import Link from 'next/link';

export default function LoginPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Check your email for a login link.');
    }

    setLoading(false);
  };

  return (
    <main className="container py-16">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 shadow-xl shadow-slate-200/60">
        <h1 className="text-3xl font-semibold text-slate-900">Restaurant admin login</h1>
        <p className="mt-3 text-slate-600">Use your email to log in and manage the restaurant dashboard.</p>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Email address</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              placeholder="owner@example.com"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-full bg-brand-600 px-5 py-3 text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Sending...' : 'Send magic link'}
          </button>
          {message ? <p className="text-sm text-slate-700">{message}</p> : null}
        </form>
        <div className="mt-8 text-sm text-slate-600">
          <p>For kitchen access, use the same admin login and open the kitchen dashboard after signing in.</p>
          <Link href="/order/demo" className="mt-3 inline-flex text-brand-700 hover:text-brand-900">Try a demo customer ordering page</Link>
        </div>
      </div>
    </main>
  );
}
