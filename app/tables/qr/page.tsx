"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/auth-helpers-react";
import QRCode from "qrcode";

type TableRecord = { id: string; label: string; qr_code: string | null; is_active: boolean };

export default function TableQrPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [tables, setTables] = useState<TableRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from("tables").select("id,label,qr_code,is_active").order("label", { ascending: true });
      setTables((data as TableRecord[]) || []);
      setLoading(false);
    };
    load();
  }, [supabase]);

  const downloadQr = async (table: TableRecord) => {
    try {
      setGenerating((s) => ({ ...s, [table.id]: true }));
      const url = table.qr_code || `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/order/${table.id}`;
      const dataUrl = await QRCode.toDataURL(url, { margin: 2, width: 512 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${table.label || 'table'}-qr.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert("Failed to generate QR code.");
    } finally {
      setGenerating((s) => ({ ...s, [table.id]: false }));
    }
  };

  return (
    <main className="container py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">QR code generator & export</h1>
        <p className="mt-2 text-slate-600">Generate and download high-resolution QR codes for each table. Use the PNG files for printing or framing.</p>
      </div>

      <section className="mt-8 grid gap-6">
        {loading ? (
          <p className="text-slate-600">Loading tables…</p>
        ) : tables.length === 0 ? (
          <p className="text-slate-600">No tables available. Create tables in the Tables management view first.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tables.map((table) => (
              <div key={table.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{table.label}</p>
                    <p className="text-sm text-slate-600">{table.is_active ? 'Active' : 'Inactive'}</p>
                  </div>
                  <div className="text-right">
                    <button onClick={() => downloadQr(table)} className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60" disabled={!!generating[table.id]}>
                      {generating[table.id] ? 'Generating…' : 'Download PNG'}
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-center">
                  <img src={table.qr_code || `${process.env.NEXT_PUBLIC_SITE_URL || ''}/order/${table.id}`} alt={`QR for ${table.label}`} className="h-48 w-48 rounded-md border" />
                </div>
                <p className="mt-3 text-xs text-slate-500">Right-click the image for quick save, or use Download PNG to get a print-ready 512px QR.</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
