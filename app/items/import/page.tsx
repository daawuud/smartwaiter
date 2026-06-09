'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { AdminMenu } from '../../../components/AdminMenu';

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseCsv(text: string) {
  const rows = text.trim().split(/\r?\n/).filter(Boolean);
  if (rows.length === 0) return [];

  const header = parseCsvLine(rows[0]).map((value) => value.trim());
  return rows.slice(1).map((row) => {
    const values = parseCsvLine(row);
    const record: Record<string, string> = {};
    header.forEach((key, index) => {
      record[key] = values[index] ?? '';
    });
    return record;
  });
}

export default function ItemsImportPage() {
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [rowCount, setRowCount] = useState(0);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setMessage('');
    setRowCount(0);
  };

  const handleImport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = document.getElementById('csv-file') as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      setMessage('Please select a CSV file first.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const text = await file.text();
      const records = parseCsv(text);
      if (!records.length) {
        setMessage('The CSV file is empty or invalid.');
        setIsLoading(false);
        return;
      }

      const categoryNames = Array.from(
        new Set(
          records
            .map((row) => (row.category_name || '').trim())
            .filter((name) => name.length > 0)
            .map((name) => name.toLowerCase())
        )
      );

      const { data: existingCategories } = await supabase.from('menu_categories').select('id, name');
      const categoryMap = new Map<string, string>();
      (existingCategories || []).forEach((category) => {
        if (category.name) categoryMap.set(category.name.toLowerCase(), category.id);
      });

      const missingNames = categoryNames.filter((name) => !categoryMap.has(name));
      if (missingNames.length > 0) {
        const inserts = missingNames.map((name, index) => ({ name, sort_order: 100 + index }));
        const { error: categoryError } = await supabase.from('menu_categories').insert(inserts);
        if (categoryError) throw categoryError;
      }

      const { data: refreshedCategories } = await supabase.from('menu_categories').select('id, name');
      const refreshedMap = new Map<string, string>();
      (refreshedCategories || []).forEach((category) => {
        if (category.name) refreshedMap.set(category.name.toLowerCase(), category.id);
      });

      const items = records.map((row) => ({
        name: row.name || '',
        description: row.description || '',
        ingredients: row.ingredients || '',
        spice_level: row.spice_level || '',
        price: Number(row.price) || 0,
        image_url: row.image_url || null,
        is_available: String(row.is_available || 'true').toLowerCase() === 'true',
        is_sold_out: String(row.is_sold_out || 'false').toLowerCase() === 'true',
        category_id: row.category_name ? refreshedMap.get(row.category_name.toLowerCase()) ?? null : null
      }));

      const { error: insertError } = await supabase.from('menu_items').insert(items);
      if (insertError) throw insertError;

      setRowCount(items.length);
      setMessage(`Imported ${items.length} menu item${items.length === 1 ? '' : 's'} successfully.`);
      if (input) input.value = '';
      setFileName('');
    } catch (error: any) {
      setMessage(error.message || 'Failed to import the CSV file.');
    }

    setIsLoading(false);
  };

  return (
    <main className="container py-12">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <AdminMenu />
        <section className="space-y-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-semibold text-slate-900">Import menu items</h1>
            <p className="mt-2 text-slate-600">Upload a CSV file to create the restaurant's menu items and categories in bulk.</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <form className="space-y-6" onSubmit={handleImport}>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">CSV file</label>
                <input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} className="block w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900" />
                {fileName ? <p className="text-sm text-slate-500">Selected file: {fileName}</p> : null}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-700">
                <p className="font-semibold text-slate-900">Required CSV columns</p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                  <li><code>category_name</code> (optional)</li>
                  <li><code>name</code></li>
                  <li><code>description</code></li>
                  <li><code>ingredients</code></li>
                  <li><code>spice_level</code></li>
                  <li><code>price</code></li>
                  <li><code>image_url</code> (optional)</li>
                  <li><code>is_available</code> (<code>true</code> or <code>false</code>)</li>
                  <li><code>is_sold_out</code> (<code>true</code> or <code>false</code>)</li>
                </ul>
              </div>

              <button type="submit" disabled={isLoading} className="inline-flex items-center justify-center rounded-full bg-brand-600 px-6 py-3 text-white hover:bg-brand-700 disabled:opacity-60">
                {isLoading ? 'Importing…' : 'Import CSV'}
              </button>
            </form>

            {message ? <p className="mt-6 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">{message}</p> : null}
            {rowCount > 0 ? <p className="mt-2 text-sm text-slate-600">Imported {rowCount} items.</p> : null}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Example CSV</h2>
            <p className="mt-2 text-slate-600">Use the sample file format from the project root: <code>demo-items.csv</code>.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
