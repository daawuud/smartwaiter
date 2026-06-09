'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/auth-helpers-react';
import { AdminMenu } from '../../components/AdminMenu';

type OrderItem = { id: string; name: string; quantity: number; notes: string | null; price: number };
type Order = { id: string; created_at: string; status: string; table_id: string | null; customer_name: string; notes: string | null; order_items: OrderItem[]; total: number };

const statusOrder = ['received', 'preparing', 'ready', 'served'];

export default function KitchenPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    setLoading(true);
    const { data } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
    setOrders((data as Order[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();

    const subscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders((current) => [payload.new as Order, ...current]);
        }
        if (payload.eventType === 'UPDATE') {
          setOrders((current) => current.map((order) => (order.id === payload.new.id ? payload.new as Order : order)));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const updateStatus = async (order: Order, nextStatus: string) => {
    await supabase.from('orders').update({ status: nextStatus }).eq('id', order.id);
  };

  return (
    <main className="container py-12">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <AdminMenu />
        <section className="space-y-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-semibold text-slate-900">Kitchen dashboard</h1>
            <p className="mt-2 text-slate-600">Live orders appear here when guests confirm their meals. Update statuses as kitchen prep moves forward.</p>
          </div>
          <div className="space-y-6">
            {loading ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <p className="text-slate-600">Loading orders…</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <p className="text-slate-600">No orders yet. New orders will appear in real time.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <article key={order.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-brand-700">Table {order.table_id || 'Guest'}</p>
                        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Order {order.id.slice(0, 8)}</h2>
                        <p className="mt-2 text-sm text-slate-500">Placed {new Date(order.created_at).toLocaleTimeString()}</p>
                      </div>
                      <div className="space-y-2 text-right">
                        <p className="text-sm text-slate-500">Status</p>
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-800">{order.status}</span>
                      </div>
                    </div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Items</h3>
                        <ul className="mt-4 space-y-3 text-slate-600">
                          {order.order_items.map((item) => (
                            <li key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <div className="flex items-center justify-between gap-4">
                                <p className="font-semibold text-slate-900">{item.name}</p>
                                <span className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700">x{item.quantity}</span>
                              </div>
                              {item.notes ? <p className="mt-2 text-sm text-slate-500">Notes: {item.notes}</p> : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <p className="text-sm text-slate-500">Customer notes</p>
                        <p className="mt-2 text-slate-700">{order.notes || 'No special notes'}</p>
                        <div className="mt-6 rounded-3xl bg-white p-4 shadow-sm">
                          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Total</p>
                          <p className="mt-2 text-2xl font-semibold text-slate-900">${order.total.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      {statusOrder.map((next) => (
                        <button
                          key={next}
                          disabled={next === order.status}
                          onClick={() => updateStatus(order, next)}
                          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:bg-slate-300 disabled:text-slate-500"
                        >
                          {next}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
