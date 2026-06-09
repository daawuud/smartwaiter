'use client';

import Link from 'next/link';
import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/categories', label: 'Categories' },
  { href: '/items', label: 'Menu items' },
  { href: '/tables', label: 'Tables' },
  { href: '/tables/qr', label: 'QR export' },
  { href: '/tables/export/csv', label: 'CSV export' },
];

export function AdminMenu() {
  const router = useRouter();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:w-72">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Manager</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Admin navigation</h2>
        </div>
        <nav className="space-y-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="block rounded-2xl px-4 py-3 text-slate-700 transition hover:bg-slate-50 hover:text-slate-900">
              {link.label}
            </Link>
          ))}
        </nav>
        <button onClick={handleSignOut} className="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          Sign out
        </button>
      </div>
    </aside>
  );
}
