import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm text-center space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EA580C] to-[#F97316] text-white font-bold text-xl shadow-sm">
          WB
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#1E293B]">
            WargaBite — Web Admin Dashboard
          </h1>
          <p className="text-sm text-[#64748B]">
            Portal manajemen komplek untuk verifikasi warga &amp; penjual (Gratis 30 Hari),
            perpanjangan langganan, dan monitoring pesanan COD.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-[#EA580C] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#F97316]"
          >
            Masuk Admin
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-[#E2E8F0] bg-white px-5 py-2.5 text-sm font-semibold text-[#1E293B] transition hover:bg-[#F8FAFC]"
          >
            Buka Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
