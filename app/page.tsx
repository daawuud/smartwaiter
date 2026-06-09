import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="container py-16">
      <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center fade-in-up">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700 opacity-90">
            Restaurant-first ordering
          </p>
          <h2 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            AI-first QR ordering that keeps tables full, kitchens flowing, and service moving.
          </h2>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">
            SmartWaiter AI turns every table QR into a fast, modern guest experience — from menu browsing and AI dish help to seamless ordering and live kitchen updates.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className="inline-flex items-center justify-center rounded-full bg-brand-600 px-6 py-3 text-white shadow-sm transition duration-200 hover:bg-brand-700">
              Restaurant login
            </Link>
            <Link href="/order/demo" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-slate-900 transition duration-200 hover:border-brand-500 hover:bg-slate-50">
              Try demo ordering
            </Link>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/50 fade-in-up delay-150">
          <div className="space-y-4">
            <div className="rounded-3xl bg-slate-100 p-6">
              <h3 className="text-xl font-semibold text-slate-900">Customer experience</h3>
              <ul className="mt-4 space-y-3 text-slate-600">
                <li>Scan QR, view menu, ask AI questions</li>
                <li>Add dishes to cart and confirm order</li>
                <li>Kitchen sees orders live and updates status</li>
              </ul>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 p-5">
                <h4 className="font-semibold text-slate-900">Admin tools</h4>
                <p className="mt-2 text-sm text-slate-600">Manage categories, items, tables, QR codes, and daily sales.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 p-5">
                <h4 className="font-semibold text-slate-900">Kitchen view</h4>
                <p className="mt-2 text-sm text-slate-600">See new orders live, update status, and keep service moving.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mt-20 space-y-10">
        <div className="grid gap-6 lg:grid-cols-3 staggered-fade">
          {[
            { title: 'AI menu assistant', description: 'Answer questions with menu data only and suggest dishes responsibly.' },
            { title: 'Table QR management', description: 'Generate unique QR codes for every table and track orders by table.' },
            { title: 'Kitchen dashboard', description: 'Live kitchen view, status updates, and audible notifications.' }
          ].map((feature, index) => (
            <div key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" style={{ animationDelay: `${index * 0.08}s` }}>
              <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-3 text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
