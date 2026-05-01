"use client";

import { useEffect, useState } from "react";
import { fetchStats } from "@/lib/api";
import type { StatsResponse } from "@/lib/types";

const RISK_COLORS: Record<string, string> = {
  Safe: "bg-emerald-500",
  Low: "bg-lime-500",
  Medium: "bg-amber-500",
  High: "bg-orange-500",
  Critical: "bg-rose-500",
};

const RISK_TEXT: Record<string, string> = {
  Safe: "text-emerald-300",
  Low: "text-lime-300",
  Medium: "text-amber-300",
  High: "text-orange-300",
  Critical: "text-rose-300",
};

const LAYER_COLOR: Record<string, string> = {
  heuristic: "text-indigo-300",
  encoding: "text-pink-300",
  lexical: "text-amber-300",
  llm_judge: "text-emerald-300",
};

export function Dashboard() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const data = await fetchStats();
        if (alive) setStats(data);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "Unknown error");
      }
    }
    load();
    const interval = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  if (error) {
    return (
      <div className="glass rounded-2xl p-6 border-rose-500/30">
        <p className="text-rose-300 font-semibold">❌ Failed to load stats</p>
        <p className="text-sm text-slate-400 mt-1 font-mono">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="glass rounded-2xl p-12 text-center text-slate-400">
        Loading stats...
      </div>
    );
  }

  if (stats.total_analyses === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <p className="text-slate-300 text-lg mb-2">ยังไม่มีข้อมูล analysis</p>
        <p className="text-sm text-slate-500">
          ลองยิง prompt บนหน้า{" "}
          <a href="/" className="text-indigo-300 hover:text-indigo-200 underline">
            Analyzer
          </a>{" "}
          ดูสักสองสามครั้งก่อน แล้วค่อยกลับมาดู dashboard
        </p>
      </div>
    );
  }

  const totalRisks = Object.values(stats.risk_distribution).reduce((a, b) => a + b, 0);
  const maxHourly = Math.max(...stats.hourly_attacks_24h.map((h) => h.total), 1);

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Analyses" value={stats.total_analyses} accent="text-indigo-300" />
        <KpiCard label="Avg Risk Score" value={`${stats.average_risk_score}`} suffix="/100" accent="text-pink-300" />
        <KpiCard
          label="Malicious Caught"
          value={totalRisks - (stats.risk_distribution.Safe ?? 0)}
          accent="text-rose-300"
        />
        <KpiCard
          label="Safe %"
          value={`${Math.round(((stats.risk_distribution.Safe ?? 0) / Math.max(totalRisks, 1)) * 100)}`}
          suffix="%"
          accent="text-emerald-300"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Risk distribution */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold text-slate-200 mb-4">Risk Distribution</h3>
          <div className="space-y-3">
            {(["Safe", "Low", "Medium", "High", "Critical"] as const).map((level) => {
              const count = stats.risk_distribution[level] ?? 0;
              const pct = totalRisks ? (count / totalRisks) * 100 : 0;
              return (
                <div key={level}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className={RISK_TEXT[level]}>{level}</span>
                    <span className="text-slate-400 font-mono text-xs">
                      {count} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${RISK_COLORS[level]} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top patterns */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold text-slate-200 mb-4">Top Detected Patterns</h3>
          {stats.top_patterns.length === 0 ? (
            <p className="text-slate-500 text-sm">ยังไม่มี pattern ที่จับได้</p>
          ) : (
            <div className="space-y-2">
              {stats.top_patterns.map((p, i) => {
                const max = stats.top_patterns[0].count;
                const pct = (p.count / max) * 100;
                return (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-slate-500 font-mono w-5 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-200 truncate">{p.name}</span>
                        <span className={`font-mono text-xs ${LAYER_COLOR[p.layer] ?? "text-slate-400"}`}>
                          {p.layer}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-pink-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-slate-400 font-mono w-8 text-right">{p.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Hourly chart */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold text-slate-200 mb-4">Activity — Last 24 Hours</h3>
        {stats.hourly_attacks_24h.length === 0 ? (
          <p className="text-slate-500 text-sm">ยังไม่มีข้อมูลใน 24 ชม. ที่ผ่านมา</p>
        ) : (
          <div className="flex items-end gap-1 h-32">
            {stats.hourly_attacks_24h.map((h, i) => {
              const totalH = (h.total / maxHourly) * 100;
              const attackH = (h.attacks / maxHourly) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col-reverse gap-0.5 items-stretch group relative"
                  title={`${h.hour}: ${h.attacks}/${h.total} attacks`}
                >
                  <div
                    className="bg-rose-500/70 rounded-t-sm transition-all"
                    style={{ height: `${attackH}%` }}
                  />
                  <div
                    className="bg-emerald-500/40 rounded-t-sm transition-all"
                    style={{ height: `${Math.max(totalH - attackH, 0)}%` }}
                  />
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-3 flex gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-rose-500/70 rounded-sm" /> Attacks
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-500/40 rounded-sm" /> Safe
          </span>
        </div>
      </div>

      {/* Recent analyses */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold text-slate-200 mb-4">Recent Analyses</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 uppercase tracking-wider border-b border-white/5">
              <tr>
                <th className="text-left py-2 pr-4">Prompt</th>
                <th className="text-left py-2 px-2">Risk</th>
                <th className="text-right py-2 px-2">Score</th>
                <th className="text-left py-2 pl-4">Top Pattern</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_analyses.map((r, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="py-2 pr-4 text-slate-300 truncate max-w-md font-mono text-xs">
                    {r.prompt_preview}
                  </td>
                  <td className={`py-2 px-2 font-semibold ${RISK_TEXT[r.risk_level] ?? ""}`}>
                    {r.risk_level}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-slate-400">{r.risk_score}</td>
                  <td className="py-2 pl-4 text-slate-400 text-xs">
                    {r.top_pattern ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-600 mt-3">
          🔄 Auto-refresh ทุก 5 วินาที
        </p>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  accent: string;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
        {label}
      </div>
      <div className={`text-3xl font-extrabold font-mono ${accent}`}>
        {value}
        {suffix && <span className="text-lg text-slate-500">{suffix}</span>}
      </div>
    </div>
  );
}
