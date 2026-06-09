"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/auth-helpers-nextjs";

type TableRecord = { id: string; label: string; qr_code: string | null; is_active: boolean };

export default function TablesCsvExport() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [tables, setTables] = useState<TableRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from('tables').select('id,label,qr_code,is_active').order('label', { ascending: true });
      setTables((data as TableRecord[]) || []);
      setLoading(false);
    };
    load();
  }, [supabase]);

  const downloadCsv = () => {
    const rows = tables.map(t => ({
      label: t.label,
      qr_url: t.qr_code || `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/order/${t.id}`
    }));
    const header = 'label,qr_url\n';
    const csv = header + rows.map(r => `"${(r.label||'').replace(/"/g,'""')}","${r.qr_url.replace(/"/g,'""')}"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'table-qr-labels.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="container py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">CSV export for label printing</h1>
        <p className="mt-2 text-slate-600">Download a CSV with table labels and QR URLs. Use this with third-party label printing services (Avery, Dymo, etc.).</p>
      </div>
      <section className="mt-8">
        {loading ? (
          <p className="text-slate-600">Loading tables…</p>
        ) : tables.length === 0 ? (
          <p className="text-slate-600">No tables available.</p>
        ) : (
          <div>
            <button onClick={downloadCsv} className="rounded-full bg-brand-600 px-5 py-3 text-white hover:bg-brand-700">Download CSV</button>
            <div className="mt-6">
              <table className="w-full table-auto text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="p-2">Label</th>
                    <th className="p-2">QR URL</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.map(t => (
                    <tr key={t.id} className="border-t border-slate-100">
                      <td className="p-2">{t.label}</td>
                      <td className="p-2 text-slate-600 break-all">{t.qr_code || `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/order/${t.id}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
