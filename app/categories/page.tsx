'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/auth-helpers-react';
import { AdminMenu } from '../../components/AdminMenu';

type Category = { id: string; name: string; sort_order: number };

export default function CategoriesPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [order, setOrder] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadCategories = async () => {
    setLoading(true);
    const { data } = await supabase.from('menu_categories').select('*').order('sort_order', { ascending: true });
    setCategories(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await supabase.from('menu_categories').insert({ name, sort_order: order });
    setName('');
    setOrder(0);
    await loadCategories();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('menu_categories').delete().eq('id', id);
    await loadCategories();
  };

  return (
    <main className="container py-12">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <AdminMenu />
        <section className="space-y-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-semibold text-slate-900">Menu category management</h1>
            <p className="mt-2 text-slate-600">Add, edit, and delete categories to organize the restaurant menu.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <form className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleCreate}>
              <h2 className="text-xl font-semibold text-slate-900">Add category</h2>
              <label className="mt-6 block space-y-2 text-slate-700">
                <span>Name</span>
                <input value={name} onChange={(event) => setName(event.target.value)} required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
              </label>
              <label className="mt-4 block space-y-2 text-slate-700">
                <span>Sort order</span>
                <input type="number" value={order} onChange={(event) => setOrder(Number(event.target.value))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
              </label>
              <button type="submit" className="mt-6 rounded-full bg-brand-600 px-5 py-3 text-white hover:bg-brand-700">Create category</button>
            </form>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Current categories</h2>
              {loading ? (
                <p className="mt-4 text-slate-600">Loading categories…</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {categories.map((category) => (
                    <li key={category.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900">{category.name}</p>
                        <p className="text-sm text-slate-500">Order {category.sort_order}</p>
                      </div>
                      <button onClick={() => handleDelete(category.id)} className="rounded-full bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600">
                        Delete
                      </button>
                    </li>
                  ))}
                  {categories.length === 0 && <p className="mt-4 text-slate-500">No categories yet.</p>}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
