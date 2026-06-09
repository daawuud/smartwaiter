'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { MenuCategory, MenuItem, OrderItem } from '../../../lib/types';

type TableInfo = { label: string; qr_code: string | null };

type OrderRequest = {
  table_id: string | null;
  customer_name: string;
  notes: string;
  order_items: Array<{ menu_item_id: string | null; name: string; quantity: number; price: number; notes: string }>; 
};

export default function TableOrderPage({ params }: { params: { tableId: string } }) {
  const router = useRouter();
    const { tableId } = params;
  const [table, setTable] = useState<TableInfo | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState('');
  const [customerName, setCustomerName] = useState('Guest');
  const [question, setQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [orderMessage, setOrderMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const displayedItems = useMemo(() => items.filter((item) => item.is_available && !item.is_sold_out), [items]);

  useEffect(() => {
    const loadData = async () => {
      if (tableId !== 'demo') {
        const { data: tableData } = await supabase.from('tables').select('label, qr_code').eq('id', tableId).single();
        setTable(tableData || null);
      } else {
        setTable({ label: 'Demo table', qr_code: null });
      }
      const [{ data: categoriesData }, { data: itemData }] = await Promise.all([
        supabase.from('menu_categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('menu_items').select('*').order('name', { ascending: true })
      ]);
      setCategories(categoriesData || []);
      setItems(itemData || []);
    };
    loadData();
  }, [supabase, tableId]);

  const addToCart = (item: MenuItem) => {
    setCart((current) => {
      const existing = current.find((entry) => entry.menu_item_id === item.id);
      if (existing) {
        return current.map((entry) => (entry.menu_item_id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry));
      }
      return [...current, { id: item.id, menu_item_id: item.id, name: item.name, quantity: 1, price: item.price, notes: '' }];
    });
  };

  const updateCartItem = (id: string, quantity: number) => {
    setCart((current) => current.map((item) => (item.menu_item_id === id ? { ...item, quantity: Math.max(1, quantity) } : item)));
  };

  const removeCartItem = (id: string) => {
    setCart((current) => current.filter((item) => item.menu_item_id !== id));
  };

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  const handleAskQuestion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim()) return;
    setAiLoading(true);
    setAiResponse('');
    const response = await fetch('/api/ai/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, table_id: tableId })
    });
    const result = await response.json();
    setAiResponse(result.answer || 'Sorry, the assistant could not answer right now.');
    setAiLoading(false);
  };

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    setOrderMessage('');
    const payload: OrderRequest = {
      table_id: tableId === 'demo' ? null : tableId,
      customer_name: customerName || 'Guest',
      notes,
      order_items: cart.map((item) => ({
        menu_item_id: item.menu_item_id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes
      }))
    };
    const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (response.ok) {
      setOrderMessage('Order sent to the kitchen!');
      setCart([]);
      setNotes('');
    } else {
      const json = await response.json();
      setOrderMessage(json.error || 'Failed to send order.');
    }
    setSubmitting(false);
  };

  return (
    <main className="container py-12">
      <div className="space-y-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-brand-700">Table order</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">{table ? `Table ${table.label}` : 'Loading menu...'}</h1>
          <p className="mt-4 max-w-2xl text-slate-600">Browse the restaurant menu, ask the AI assistant about dishes, and send your order directly to the kitchen.</p>
        </section>

        <div className="grid gap-8 xl:grid-cols-[1.6fr_1fr]">
          <div className="space-y-8">
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Menu</h2>
                  <p className="mt-2 text-slate-600">Select your favorite dishes and add them to the cart.</p>
                </div>
                <span className="rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">{displayedItems.length} items available</span>
              </div>
              <div className="mt-8 space-y-10">
                {categories.length === 0 ? (
                  <p className="text-slate-600">No menu categories available yet.</p>
                ) : (
                  categories.map((category) => (
                    <div key={category.id} className="space-y-4">
                      <h3 className="text-xl font-semibold text-slate-900">{category.name}</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {displayedItems.filter((item) => item.category_id === category.id).map((item) => (
                          <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-lg font-semibold text-slate-900">{item.name}</p>
                                <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                                <p className="mt-2 text-sm text-slate-500">{item.ingredients}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold text-slate-900">${item.price.toFixed(2)}</p>
                                <p className="text-sm text-slate-500">{item.spice_level || 'Regular'}</p>
                              </div>
                            </div>
                            <button onClick={() => addToCart(item)} className="mt-5 w-full rounded-full bg-brand-600 px-4 py-3 text-white hover:bg-brand-700">Add to cart</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-semibold text-slate-900">AI assistant</h2>
              <p className="mt-2 text-slate-600">Ask about menu items, spice level, ingredients, and recommendations based only on available menu data.</p>
              <form onSubmit={handleAskQuestion} className="mt-6 grid gap-4">
                <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={4} placeholder="Ask about a dish, allergy concern, or recommendation..." className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-900 outline-none" />
                <button type="submit" disabled={aiLoading} className="rounded-full bg-brand-600 px-5 py-3 text-white hover:bg-brand-700 disabled:opacity-60">{aiLoading ? 'Thinking…' : 'Ask assistant'}</button>
              </form>
              {aiResponse ? (
                <div className="mt-6 rounded-3xl bg-slate-50 p-5 text-slate-700">
                  <h3 className="font-semibold text-slate-900">Assistant response</h3>
                  <p className="mt-3 whitespace-pre-line">{aiResponse}</p>
                </div>
              ) : null}
            </section>
          </div>

          <aside className="space-y-8">
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-semibold text-slate-900">Your cart</h2>
              <p className="mt-2 text-slate-600">Review items and place your order.</p>
              {cart.length === 0 ? (
                <p className="mt-6 text-slate-600">Your cart is empty. Add a dish to get started.</p>
              ) : (
                <div className="mt-6 space-y-4">
                  {cart.map((item) => (
                    <div key={item.menu_item_id || item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-900">{item.name}</p>
                          <p className="text-sm text-slate-600">${item.price.toFixed(2)} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => updateCartItem(item.menu_item_id || item.id, item.quantity - 1)} className="rounded-full bg-white px-3 py-2 text-slate-700 shadow-sm">-</button>
                          <span className="min-w-[2rem] text-center font-semibold text-slate-900">{item.quantity}</span>
                          <button type="button" onClick={() => updateCartItem(item.menu_item_id || item.id, item.quantity + 1)} className="rounded-full bg-white px-3 py-2 text-slate-700 shadow-sm">+</button>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <button type="button" onClick={() => removeCartItem(item.menu_item_id || item.id)} className="text-sm text-red-600 hover:text-red-800">Remove</button>
                        <p className="font-semibold text-slate-900">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 space-y-4 rounded-3xl bg-slate-50 p-5">
                <div className="flex items-center justify-between text-slate-700">
                  <span>Subtotal</span>
                  <strong>${total.toFixed(2)}</strong>
                </div>
                <label className="block space-y-2 text-slate-700">
                  <span>Name</span>
                  <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" />
                </label>
                <label className="block space-y-2 text-slate-700">
                  <span>Special notes</span>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" />
                </label>
                <button type="button" disabled={cart.length === 0 || submitting} onClick={handlePlaceOrder} className="w-full rounded-full bg-brand-600 px-5 py-3 text-white hover:bg-brand-700 disabled:opacity-60">
                  {submitting ? 'Sending order…' : 'Confirm order'}
                </button>
                {orderMessage ? <p className="text-sm text-brand-700">{orderMessage}</p> : null}
              </div>
            </section>
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-semibold text-slate-900">Order summary</h2>
              <p className="mt-2 text-slate-600">Your order will appear in the kitchen immediately after confirmation.</p>
              <div className="mt-6 space-y-3 rounded-3xl bg-slate-50 p-5 text-slate-700">
                <p className="font-semibold text-slate-900">Table</p>
                <p>{table ? table.label : 'Loading…'}</p>
                <p className="mt-4 font-semibold text-slate-900">Items</p>
                <p>{cart.length} selected</p>
                <p className="mt-4 font-semibold text-slate-900">Total</p>
                <p>${total.toFixed(2)}</p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
