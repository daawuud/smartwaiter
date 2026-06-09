'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import { AdminMenu } from '../../components/AdminMenu';

type Category = { id: string; name: string };
type Item = {
  id: string;
  name: string;
  description: string;
  ingredients: string;
  spice_level: string;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_sold_out: boolean;
  category_id: string | null;
};

export default function ItemsPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    ingredients: '',
    spice_level: '',
    price: 0,
    image_url: '',
    category_id: '',
    is_available: true,
    is_sold_out: false
  });

  const loadData = async () => {
    setLoading(true);
    const [{ data: categoryData }, { data: itemData }] = await Promise.all([
      supabase.from('menu_categories').select('id, name').order('name', { ascending: true }),
      supabase.from('menu_items').select('*').order('name', { ascending: true })
    ]);
    setCategories(categoryData || []);
    setItems(itemData || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({
      name: '',
      description: '',
      ingredients: '',
      spice_level: '',
      price: 0,
      image_url: '',
      category_id: '',
      is_available: true,
      is_sold_out: false
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editing) {
      await supabase.from('menu_items').update({
        ...form,
        category_id: form.category_id || null
      }).eq('id', editing.id);
    } else {
      await supabase.from('menu_items').insert({
        ...form,
        category_id: form.category_id || null
      });
    }
    await loadData();
    resetForm();
  };

  const handleEdit = (item: Item) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description,
      ingredients: item.ingredients,
      spice_level: item.spice_level,
      price: item.price,
      image_url: item.image_url || '',
      category_id: item.category_id || '',
      is_available: item.is_available,
      is_sold_out: item.is_sold_out
    });
  };

  const handleDelete = async (id: string) => {
    await supabase.from('menu_items').delete().eq('id', id);
    await loadData();
  };

  return (
    <main className="container py-12">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <AdminMenu />
        <section className="space-y-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-semibold text-slate-900">Menu item management</h1>
            <p className="mt-2 text-slate-600">Add new dishes, update descriptions, mark availability, and publish images for the menu.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <form className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
              <h2 className="text-xl font-semibold text-slate-900">{editing ? 'Edit item' : 'Add item'}</h2>
              <div className="space-y-4 mt-6">
                <label className="block space-y-2 text-slate-700">
                  <span>Name</span>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
                </label>
                <label className="block space-y-2 text-slate-700">
                  <span>Description</span>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" rows={3} />
                </label>
                <label className="block space-y-2 text-slate-700">
                  <span>Ingredients</span>
                  <input value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
                </label>
                <label className="block space-y-2 text-slate-700">
                  <span>Spice level</span>
                  <input value={form.spice_level} onChange={(e) => setForm({ ...form, spice_level: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
                </label>
                <label className="block space-y-2 text-slate-700">
                  <span>Price</span>
                  <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
                </label>
                <label className="block space-y-2 text-slate-700">
                  <span>Image URL</span>
                  <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
                </label>
                <label className="block space-y-2 text-slate-700">
                  <span>Category</span>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <option value="">Uncategorized</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="inline-flex items-center gap-3 text-slate-700">
                    <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} className="h-5 w-5 rounded border-slate-300 text-brand-600" />
                    Available
                  </label>
                  <label className="inline-flex items-center gap-3 text-slate-700">
                    <input type="checkbox" checked={form.is_sold_out} onChange={(e) => setForm({ ...form, is_sold_out: e.target.checked })} className="h-5 w-5 rounded border-slate-300 text-brand-600" />
                    Sold out
                  </label>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button type="submit" className="rounded-full bg-brand-600 px-5 py-3 text-white hover:bg-brand-700">{editing ? 'Save changes' : 'Create item'}</button>
                  {editing ? <button type="button" onClick={resetForm} className="rounded-full border border-slate-300 px-5 py-3 text-slate-700 hover:bg-slate-100">Cancel</button> : null}
                </div>
              </div>
            </form>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Menu items</h2>
              {loading ? (
                <p className="mt-4 text-slate-600">Loading items…</p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {items.map((item) => (
                    <li key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-lg font-semibold text-slate-900">{item.name}</p>
                          <p className="text-sm text-slate-600">{item.description}</p>
                          <p className="mt-2 text-sm text-slate-500">{item.price.toFixed(2)} USD • {item.spice_level || 'Regular'} • {item.is_sold_out ? 'Sold out' : item.is_available ? 'Available' : 'Hidden'}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => handleEdit(item)} className="rounded-full border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">Edit</button>
                          <button onClick={() => handleDelete(item.id)} className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">Delete</button>
                        </div>
                      </div>
                    </li>
                  ))}
                  {items.length === 0 && <p className="text-slate-500">No menu items yet.</p>}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
