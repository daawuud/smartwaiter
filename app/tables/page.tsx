'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/auth-helpers-react';
import { AdminMenu } from '../../components/AdminMenu';

type TableRecord = { id: string; label: string; qr_code: string | null; is_active: boolean };

export default function TablesPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [tables, setTables] = useState<TableRecord[]>([]);
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(true);

  const loadTables = async () => {
    setLoading(true);
    const { data } = await supabase.from('tables').select('*').order('label', { ascending: true });
    setTables(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadTables();
  }, []);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { data } = await supabase.from('tables').insert({ label }).select().single();
    if (data) {
      const qrCode = `${window.location.origin}/order/${data.id}`;
      await supabase.from('tables').update({ qr_code: qrCode }).eq('id', data.id);
    }
    setLabel('');
    await loadTables();
  };

  const toggleActive = async (table: TableRecord) => {
    await supabase.from('tables').update({ is_active: !table.is_active }).eq('id', table.id);
    await loadTables();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('tables').delete().eq('id', id);
    await loadTables();
  };

  return (
    <main className="container py-12">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <AdminMenu />
        <section className="space-y-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-semibold text-slate-900">Table management</h1>
            <p className="mt-2 text-slate-600">Create tables and generate unique QR links for guest ordering.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <form className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleCreate}>
              <h2 className="text-xl font-semibold text-slate-900">Add table</h2>
              <label className="mt-6 block space-y-2 text-slate-700">
                <span>Label</span>
                <input value={label} onChange={(e) => setLabel(e.target.value)} required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" placeholder="Table 1" />
              </label>
              <button type="submit" className="mt-6 rounded-full bg-brand-600 px-5 py-3 text-white hover:bg-brand-700">Create table</button>
            </form>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Tables</h2>
              {loading ? (
                <p className="mt-4 text-slate-600">Loading tables…</p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {tables.map((table) => (
                    <li key={table.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-lg font-semibold text-slate-900">{table.label}</p>
                          <p className="text-sm text-slate-600">{table.qr_code || 'QR code will generate after creation.'}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => toggleActive(table)} className="rounded-full border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                            {table.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => handleDelete(table.id)} className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">
                            Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                  {tables.length === 0 && <p className="text-slate-500">No tables yet.</p>}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
