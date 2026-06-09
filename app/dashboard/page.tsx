'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { AdminMenu } from '../../components/AdminMenu';

export default function DashboardPage() {
    const [summary, setSummary] = useState({ categories: 0, items: 0, tables: 0, orders: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      const [{ count: categories }, { count: items }, { count: tables }, { count: orders }] = await Promise.all([
        supabase.from('menu_categories').select('*', { count: 'exact', head: true }),
        supabase.from('menu_items').select('*', { count: 'exact', head: true }),
        supabase.from('tables').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true })
      ]);

      setSummary({
        categories: categories || 0,
        items: items || 0,
        tables: tables || 0,
        orders: orders || 0
      });
      setLoading(false);
    };

    fetchSummary();
  }, [supabase]);

  return (
    <main className="container py-12">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <AdminMenu />
        <section className="space-y-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-semibold text-slate-900">Restaurant dashboard</h1>
            <p className="mt-2 text-slate-600">Manage your menu, tables, orders, and kitchen flow from one easy dashboard.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Categories', value: summary.categories, href: '/categories' },
              { label: 'Menu items', value: summary.items, href: '/items' },
              { label: 'Tables', value: summary.tables, href: '/tables' },
              { label: 'Orders', value: summary.orders, href: '/kitchen' }
            ].map((stat) => (
              <Link key={stat.label} href={stat.href} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-500">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{stat.label}</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">{loading ? '…' : stat.value}</p>
              </Link>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Quick actions</h2>
              <div className="mt-4 space-y-3 text-slate-600">
                <p>Use the links to update categories, add new menu items, and create table QR codes.</p>
                <p>Open the kitchen dashboard to watch live orders and update statuses.</p>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Customer experience</h2>
              <p className="mt-4 text-slate-600">Send guests a QR code for any table, and the order will appear instantly in the kitchen.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
