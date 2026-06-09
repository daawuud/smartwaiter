"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/auth-helpers-react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";

type TableRecord = { id: string; label: string; qr_code: string | null; is_active: boolean };

export default function TableQrPrintPage() {
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

  const [restaurantLogo, setRestaurantLogo] = useState<string>('');
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const { data } = await supabase.from('restaurants').select('logo_url').limit(1).single();
        setRestaurantLogo(data?.logo_url || '');
      } catch (e) {
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

  const generatePdf = async () => {
    if (!tables || tables.length === 0) return;
    const pdf = new jsPDF({ unit: "mm", format: "a4" });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const cardW = 90; // mm
    const cardH = 60; // mm
    const margin = 10;
    const cols = Math.floor((pageWidth - margin * 2) / cardW) || 1;
    const rows = Math.floor((pageHeight - margin * 2) / cardH) || 1;

    let index = 0;

    for (const table of tables) {
      const url = table.qr_code || `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/order/${table.id}`;
      const dataUrl = await QRCode.toDataURL(url, { margin: 2, width: 1024 });

      const col = index % cols;
      const row = Math.floor((index / cols) % rows);
      const page = Math.floor(index / (cols * rows));

      if (index > 0 && index % (cols * rows) === 0) pdf.addPage();

      const x = margin + col * cardW;
      const y = margin + row * cardH;

      // Draw card background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(x, y, cardW - 6, cardH - 6, "F");

      // Add logo if present
      if (restaurantLogo) {
        const logoData = await urlToDataUrl(restaurantLogo);
        if (logoData) {
          try {
            pdf.addImage(logoData, 'PNG', x + 6, y + 4, 20, 8);
          } catch (e) {}
        }
      }

      // Add label
      pdf.setFontSize(12);
      pdf.setTextColor(30, 30, 30);
      pdf.text(table.label || "Table", x + 6, y + 18);

      // Add QR image centered
      const imgW = 40; // mm
      const imgH = 40; // mm
      const imgX = x + (cardW - imgW) / 2 - 3;
      const imgY = y + 14;
      pdf.addImage(dataUrl, "PNG", imgX, imgY, imgW, imgH);

      index++;
    }

    pdf.save("table-qr-cards.pdf");
  };

  return (
    <main className="container py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">Printable QR cards</h1>
        <p className="mt-2 text-slate-600">Generate a print-ready PDF of table QR cards (A4). Each card includes the table label and a high-resolution QR code.</p>
      </div>

      <section className="mt-8">
        {loading ? (
          <p className="text-slate-600">Loading tables…</p>
        ) : tables.length === 0 ? (
          <p className="text-slate-600">No tables available.</p>
        ) : (
          <div className="space-y-4">
            <button onClick={generatePdf} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-3 text-white hover:bg-brand-700">Download PDF</button>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
              {tables.map((table) => (
                <div key={table.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{table.label}</p>
                  <div className="mt-3 flex items-center justify-center">
                    <img src={table.qr_code || `${process.env.NEXT_PUBLIC_SITE_URL || ''}/order/${table.id}`} alt={`QR for ${table.label}`} className="h-40 w-40 rounded-md border" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
