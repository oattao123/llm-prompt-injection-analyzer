import { Analyzer } from "@/components/analyzer";
import { Nav } from "@/components/nav";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-6 py-12">
        <section className="text-center mb-10">
          <div className="inline-block px-3 py-1 rounded-full glass text-xs font-mono text-indigo-300 mb-4">
            OWASP Top 10 for LLMs · LLM01
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 bg-gradient-to-r from-indigo-200 via-white to-pink-200 bg-clip-text text-transparent">
            Prompt Injection &amp; Jailbreak Analyzer
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Hybrid AI Defense: 4 ชั้นการตรวจจับ —{" "}
            <span className="text-indigo-300 font-mono">Heuristic</span> →{" "}
            <span className="text-pink-300 font-mono">Encoding</span> →{" "}
            <span className="text-amber-300 font-mono">Lexical</span> →{" "}
            <span className="text-emerald-300 font-mono">LLM-Judge</span>
            {" "}· รองรับภาษาไทย+อังกฤษ
          </p>
        </section>

        <Analyzer />

        <footer className="mt-16 text-center text-xs text-slate-500 space-y-1">
          <p>Next.js + FastAPI · Frontend on Vercel · API on Render · CI/CD via GitHub Actions</p>
          <p className="text-slate-600">
            Inspired by{" "}
            <a href="https://github.com/protectai/rebuff" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400">Rebuff</a> ·{" "}
            <a href="https://gandalf.lakera.ai" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400">Lakera Gandalf</a> ·{" "}
            <a href="https://github.com/leondz/garak" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400">Garak</a> ·{" "}
            <a href="https://github.com/deadbits/vigil-llm" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400">Vigil</a>
          </p>
        </footer>
      </main>
    </>
  );
}
