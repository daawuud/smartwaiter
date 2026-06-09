import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SmartWaiter AI',
  description: 'AI-powered QR restaurant ordering system for menus, kitchen orders, and admin management.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm">
            <div className="container flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">SmartWaiter AI</p>
                <h1 className="text-2xl font-semibold text-slate-900">Modern QR ordering for restaurants.</h1>
              </div>
              <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                <a href="#features" className="hover:text-brand-700">Features</a>
                <a href="/login" className="rounded-full bg-brand-600 px-4 py-2 text-white shadow-sm hover:bg-brand-700">Admin login</a>
                <a href="/order/demo" className="rounded-full border border-slate-300 px-4 py-2 hover:border-brand-500">Demo order</a>
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
