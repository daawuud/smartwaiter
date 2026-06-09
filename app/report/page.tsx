'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { AdminMenu } from '../../components/AdminMenu';

export default function ReportPage() {
    const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, activeOrders: 0, readyOrders: 0 });
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    setLoading(true);
    const now = new Date().toISOString();
    const { data: orders } = await supabase.from('orders').select('status,total');
    if (!orders) return;
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, row) => sum + Number(row.total || 0), 0);
    const activeOrders = orders.filter((order) => order.status === 'received' || order.status === 'preparing').length;
    const readyOrders = orders.filter((order) => order.status === 'ready').length;
    setStats({ totalOrders, totalRevenue, activeOrders, readyOrders });
    setLoading(false);
  };

  useEffect(() => {
    loadReport();
  }, []);

  return (
    <main className="container py-12">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <AdminMenu />
        <section className="space-y-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-semibold text-slate-900">Daily sales report</h1>
            <p className="mt-2 text-slate-600">Review order volume, revenue, and kitchen status at a glance.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Total orders', value: stats.totalOrders },
              { label: 'Revenue', value: `$${stats.totalRevenue.toFixed(2)}` },
              { label: 'Active orders', value: stats.activeOrders },
              { label: 'Ready orders', value: stats.readyOrders }
            ].map((tile) => (
              <div key={tile.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{tile.label}</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">{loading ? '…' : tile.value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Sales notes</h2>
            <p className="mt-4 text-slate-600">This report uses the current order totals from your restaurant. Use the kitchen dashboard to process orders and keep totals updated.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
