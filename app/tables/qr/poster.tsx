"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";

type TableRecord = { id: string; label: string; qr_code: string | null; is_active: boolean };

export default function TableQrPosterPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [tables, setTables] = useState<TableRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from("tables").select("id,label,qr_code,is_active").order("label", { ascending: true });
      setTables((data as TableRecord[]) || []);
      setLoading(false);
    };
    load();
  }, [supabase]);

  const [restaurantName, setRestaurantName] = useState<string>('');
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [restaurantLogo, setRestaurantLogo] = useState<string>('');

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const { data } = await supabase.from('restaurants').select('name,logo_url').limit(1).single();
        setRestaurantName(data?.name || process.env.NEXT_PUBLIC_RESTAURANT_NAME || 'Restaurant');
        setRestaurantLogo(data?.logo_url || '');
      } catch (err) {
        setRestaurantName(process.env.NEXT_PUBLIC_RESTAURANT_NAME || 'Restaurant');
        setRestaurantLogo('');
      }
    };
    loadMeta();
  }, [supabase]);

  const urlToDataUrl = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      return '';
    }
  };

  const generatePosterPdf = async () => {
    if (!tables || tables.length === 0) return;
    const pdf = new jsPDF({ unit: "mm", format: "a4" });

    // Poster layout: large QR per page with label and short instructions
    for (const table of tables) {
      const width = pdf.internal.pageSize.getWidth();
      const height = pdf.internal.pageSize.getHeight();
      const url = table.qr_code || `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/order/${table.id}`;
      const dataUrl = await QRCode.toDataURL(url, { margin: 2, width: 2000 });

      // Page background and top accent bar
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, width, height, 'F');
      pdf.setFillColor(124, 58, 237);
      pdf.rect(0, 0, width, 20, 'F');

      // Poster card
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(12, 20, width - 24, height - 32, 10, 10, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(12, 20, width - 24, height - 32, 10, 10, 'S');

      // Header with restaurant name and optional logo
      pdf.setFontSize(22);
      pdf.setTextColor(255, 255, 255);
      pdf.text(restaurantName, width / 2, 14, { align: 'center' });
      pdf.setTextColor(30, 30, 30);
      pdf.setFontSize(12);
      pdf.text('Scan the QR below and order from this table instantly.', width / 2, 24, { align: 'center' });

      if (restaurantLogo) {
        const logoData = await urlToDataUrl(restaurantLogo);
        if (logoData) {
          try {
            pdf.addImage(logoData, 'PNG', width - 50, 24, 32, 16);
          } catch (e) {
            // ignore logo failures
          }
        }
      }

      // Add large QR
      const size = 140; // mm
      const x = (width - size) / 2;
      const y = 40;
      pdf.addImage(dataUrl, 'PNG', x, y, size, size);

      // Label
      pdf.setFontSize(28);
      pdf.setTextColor(30, 30, 30);
      pdf.text(table.label || 'Table', pdf.internal.pageSize.getWidth() / 2, y + size + 20, { align: 'center' });

      // Short instructions
      pdf.setFontSize(12);
      pdf.setTextColor(80, 80, 80);
      pdf.text('Scan this QR with your phone to open the menu and order from this table.', pdf.internal.pageSize.getWidth() / 2, y + size + 32, { align: 'center', maxWidth: pdf.internal.pageSize.getWidth() - 30 });

      pdf.addPage();
    }

    pdf.deletePage(pdf.getNumberOfPages());
    pdf.save('table-qr-posters.pdf');
  };

  const openPreview = async (table: TableRecord) => {
    const url = table.qr_code || `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/order/${table.id}`;
    const dataUrl = await QRCode.toDataURL(url, { margin: 2, width: 1200 });
    setPreviewDataUrl(dataUrl);
  };

  const closePreview = () => setPreviewDataUrl(null);

  return (
    <main className="container py-12">
      <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-brand-600 to-violet-500 p-8 shadow-xl text-white">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.3em] text-brand-100/80">Poster export</p>
          <h1 className="mt-4 text-4xl font-semibold">Large table QR posters</h1>
          <p className="mt-4 text-base text-white/80">Create premium A4 posters with clear instructions, large QR codes, and optional restaurant branding for easy table display.</p>
        </div>
      </div>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="show-print rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg text-slate-900">
          <h2 className="text-xl font-semibold">Print preview</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">When printing, screen buttons are hidden and this summary panel appears so the output stays clean and focused.</p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-600">
            <li>One A4 poster per table</li>
            <li>Large QR and clear table label</li>
            <li>Branded header and instructions</li>
          </ul>
        </div>
        <div className="space-y-6">
          <div className="poster-card rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Poster preview</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Polished QR poster layout</h2>
              </div>
              <div className="text-right text-sm text-slate-500">
                <p>{restaurantName}</p>
                <p>Large print-ready pages</p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-brand-700">Table poster</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">Scan to order</p>
                </div>
                <div className="h-28 w-28 rounded-3xl bg-white p-4 shadow-sm">
                  <img src={tables[0]?.qr_code || `${process.env.NEXT_PUBLIC_SITE_URL || ''}/order/${tables[0]?.id}`} alt="QR preview" className="h-full w-full" />
                </div>
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-600">Fine-tuned for print, each poster is generated with strong typography, brand accents, and a clean QR presentation.</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Why this works</p>
            <ul className="mt-4 space-y-3 text-slate-600">
              <li className="flex items-start gap-3"><span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-brand-500" />Large QR makes scanning easy from a distance.</li>
              <li className="flex items-start gap-3"><span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-brand-500" />Branded header and clean layout improves visual clarity.</li>
              <li className="flex items-start gap-3"><span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-brand-500" />Print-ready PDF preserves contrast and details.</li>
            </ul>
          </div>
        </div>

        <div>
        {loading ? (
          <p className="text-slate-600">Loading tables…</p>
        ) : tables.length === 0 ? (
          <p className="text-slate-600">No tables available.</p>
        ) : (
          <div className="space-y-4">
            <button onClick={generatePosterPdf} className="hide-print inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-3 text-white hover:bg-brand-700">Download Posters</button>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
              {tables.map((table) => (
                <div key={table.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm qr-card">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.15em] text-slate-500">{table.label}</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">Table QR</p>
                    </div>
                    <button onClick={() => openPreview(table)} className="hide-print rounded-full border border-slate-300 px-3 py-1 text-sm transition hover:border-brand-500">Preview</button>
                  </div>
                  <div className="mt-4 flex items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <img src={table.qr_code || `${process.env.NEXT_PUBLIC_SITE_URL || ''}/order/${table.id}`} alt={`QR for ${table.label}`} className="h-40 w-40" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </section>
      {previewDataUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="max-w-3xl rounded-2xl bg-white p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">QR preview</h3>
              <button onClick={closePreview} className="rounded-full bg-slate-100 px-3 py-1">Close</button>
            </div>
            <div className="mt-4 flex flex-col items-center gap-4">
              <img src={previewDataUrl} alt="QR preview" className="max-h-[60vh] max-w-full rounded-md border" />
              <div className="text-sm text-slate-600">Right-click the image to save, or use the poster/pdf export to download printable files.</div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
