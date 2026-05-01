import { Nav } from "@/components/nav";
import { Dashboard } from "@/components/dashboard";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-6 py-12">
        <section className="mb-10">
          <div className="inline-block px-3 py-1 rounded-full glass text-xs font-mono text-indigo-300 mb-3">
            Live Telemetry
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2 bg-gradient-to-r from-indigo-200 via-white to-pink-200 bg-clip-text text-transparent">
            Detection Dashboard
          </h1>
          <p className="text-slate-400">
            สถิติการเรียก <code className="font-mono text-indigo-300">/analyze</code> แบบเรียลไทม์ —
            ดูได้ว่าระบบจับ pattern อะไรบ่อยที่สุด เกิดถี่แค่ไหน
          </p>
        </section>
        <Dashboard />
      </main>
    </>
  );
}
