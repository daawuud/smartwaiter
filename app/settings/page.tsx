'use client';

import { useEffect, useState, useRef } from 'react';
import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import { AdminMenu } from '../../components/AdminMenu';

export default function SettingsPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [restaurant, setRestaurant] = useState({ name: '', currency: 'USD', timezone: 'UTC', logo_url: '' } as any);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadRestaurant = async () => {
      const { data } = await supabase.from('restaurants').select('*').limit(1).single();
      if (data) {
        setRestaurant({ name: data.name || '', currency: data.currency || 'USD', timezone: data.timezone || 'UTC', logo_url: data.logo_url || '' });
      }
      setLoading(false);
    };
    loadRestaurant();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    const { data, error } = await supabase.from('restaurants').select('id').limit(1).single();
    if (error && error.code !== 'PGRST102') {
      setMessage(error.message);
      return;
    }
    if (data) {
      await supabase.from('restaurants').update(restaurant).eq('id', data.id);
    } else {
      await supabase.from('restaurants').insert(restaurant);
    }
    setMessage('Settings saved.');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // ensure bucket 'logos' exists and is configured public
      const filePath = `logos/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('logos').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage.from('logos').getPublicUrl(filePath);
      const publicUrl = publicData?.publicUrl || '';

      // save to restaurants
      const { data } = await supabase.from('restaurants').select('id').limit(1).single();
      if (data) {
        await supabase.from('restaurants').update({ logo_url: publicUrl }).eq('id', data.id);
      } else {
        await supabase.from('restaurants').insert({ name: restaurant.name || 'Restaurant', logo_url: publicUrl });
      }
      setRestaurant((r: any) => ({ ...r, logo_url: publicUrl }));
      setMessage('Logo uploaded.');
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="container py-12">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <AdminMenu />
        <section className="space-y-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-semibold text-slate-900">Settings</h1>
            <p className="mt-2 text-slate-600">Update restaurant details and default preferences.</p>
          </div>
          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            {loading ? (
              <p className="text-slate-600">Loading settings…</p>
            ) : (
              <div className="grid gap-6">
                <label className="block space-y-2 text-slate-700">
                  <span>Restaurant name</span>
                  <input value={restaurant.name} onChange={(e) => setRestaurant({ ...restaurant, name: e.target.value })} required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
                </label>
                <label className="block space-y-2 text-slate-700">
                  <span>Currency</span>
                  <input value={restaurant.currency} onChange={(e) => setRestaurant({ ...restaurant, currency: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
                </label>
                <label className="block space-y-2 text-slate-700">
                  <span>Timezone</span>
                  <input value={restaurant.timezone} onChange={(e) => setRestaurant({ ...restaurant, timezone: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
                </label>
                <label className="block space-y-2 text-slate-700">
                  <span>Restaurant logo</span>
                  <div className="flex items-center gap-4">
                    {restaurant.logo_url ? (
                      <img src={restaurant.logo_url} alt="logo" className="h-16 w-16 rounded-md border object-contain" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-md border bg-slate-50 text-sm text-slate-400">No logo</div>
                    )}
                    <div className="flex flex-col gap-2">
                      <input ref={fileRef} onChange={handleFileChange} type="file" accept="image/*" className="text-sm" />
                      <div className="flex gap-2">
                        <button onClick={() => fileRef.current?.click()} type="button" className="rounded-full border px-4 py-2 text-sm">Choose file</button>
                        <button onClick={() => { setRestaurant((r:any)=>({ ...r, logo_url: '' })); setMessage('Logo removed locally. Click Save to persist.'); }} type="button" className="rounded-full border px-4 py-2 text-sm">Remove</button>
                      </div>
                      {uploading ? <p className="text-sm text-slate-500">Uploading…</p> : null}
                    </div>
                  </div>
                </label>
                <button type="submit" className="rounded-full bg-brand-600 px-5 py-3 text-white hover:bg-brand-700">Save settings</button>
                {message ? <p className="text-sm text-brand-700">{message}</p> : null}
              </div>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}
