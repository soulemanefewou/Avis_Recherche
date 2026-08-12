"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ChevronLeft, FileSearch, UserCheck, Crosshair, TrendingUp, MessageSquare, AlertTriangle, CheckCircle2, XCircle, Clock, Calendar } from "lucide-react";

interface EvolutionMensuelle {
  mois: string;
  creees: number;
  activees: number;
  retrouves: number;
}

interface StatusDistribution {
  statut: string;
  total: number;
}

interface StatistiquesData {
  avis_crees: number;
  avis_actifs: number;
  personnes_retrouves: number;
  taux_reussite: number;
  signalements_recus: number;
  evolution_mensuelle: EvolutionMensuelle[];
  status_distribution: StatusDistribution[];
}

const KPI_CONFIG = [
  { key: "avis_crees", label: "Avis créés", icon: FileSearch },
  { key: "avis_actifs", label: "Avis actifs", icon: Crosshair },
  { key: "personnes_retrouves", label: "Retrouvées", icon: UserCheck },
  { key: "taux_reussite", label: "Taux de réussite", icon: TrendingUp, suffix: "%" },
  { key: "signalements_recus", label: "Signalements", icon: MessageSquare },
];

const KPI_STYLES = [
  { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
  { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
];

const STATUS_META: Record<string, { label: string; color: string }> = {
  RECHERCHE: { label: "En recherche", color: "#ef4444" },
  RETROUVE_VIVANT: { label: "Retrouvé vivant", color: "#22c55e" },
  RETROUVE_DECEDE: { label: "Retrouvé décédé", color: "#6b7280" },
  CLOTURE: { label: "Clôturé", color: "#9ca3af" },
};

const FRENCH_MONTHS: Record<string, string> = {
  "01": "Janv", "02": "Févr", "03": "Mars", "04": "Avr",
  "05": "Mai", "06": "Juin", "07": "Juil", "08": "Août",
  "09": "Sept", "10": "Oct", "11": "Nov", "12": "Déc",
};

function formatMonthShort(mois: string): string {
  const [, month] = mois.split("-");
  return FRENCH_MONTHS[month] || month;
}

function LineChart({ data }: { data: EvolutionMensuelle[] }) {
  if (data.length === 0) return null;
  const w = 600;
  const h = 240;
  const pad = { top: 20, right: 20, bottom: 32, left: 40 };
  const gw = w - pad.left - pad.right;
  const gh = h - pad.top - pad.bottom;

  const allValues = data.flatMap((d) => [d.creees, d.activees, d.retrouves]);
  const maxVal = Math.max(...allValues, 1);
  const yMax = Math.ceil(maxVal * 1.15);

  const xScale = (i: number) => pad.left + (i / (data.length - 1 || 1)) * gw;
  const yScale = (v: number) => pad.top + gh - (v / yMax) * gh;

  const lines = [
    { key: "creees" as const, color: "#3b82f6", label: "Créés" },
    { key: "activees" as const, color: "#ef4444", label: "Actifs" },
    { key: "retrouves" as const, color: "#22c55e", label: "Retrouvés" },
  ];

  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
        const y = pad.top + gh * (1 - frac);
        return (
          <g key={frac}>
            <line x1={pad.left} x2={w - pad.right} y1={y} y2={y} stroke="#1f2937" strokeWidth={1} />
            <text x={pad.left - 8} y={y + 4} textAnchor="end" className="text-[10px] fill-gray-500">
              {Math.round(yMax * frac)}
            </text>
          </g>
        );
      })}

      {lines.map((line) => {
        const pts = data.map((d, i) => `${xScale(i)},${yScale(d[line.key])}`).join(" ");
        return (
          <polyline key={line.key} points={pts} fill="none" stroke={line.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        );
      })}

      {data.map((d, i) => {
        const x = xScale(i);
        return (
          <g key={d.mois}>
            <text x={x} y={h - 4} textAnchor="middle" className="text-[10px] fill-gray-500">{formatMonthShort(d.mois)}</text>
            {lines.map((line) => (
              <circle key={line.key} cx={x} cy={yScale(d[line.key])} r={3} fill={line.color} />
            ))}
          </g>
        );
      })}

      <g transform={`translate(${pad.left + 8}, ${h - 8})`}>
        {lines.map((line, i) => (
          <g key={line.key} transform={`translate(${i * 140}, 0)`}>
            <rect x={0} y={-4} width={10} height={10} rx={2} fill={line.color} />
            <text x={16} y={4} className="text-[10px] fill-gray-500">{line.label}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function BarChart({ data }: { data: StatusDistribution[] }) {
  if (data.length === 0) return null;
  const w = 500;
  const h = 220;
  const pad = { top: 20, right: 20, bottom: 50, left: 40 };
  const gw = w - pad.left - pad.right;
  const gh = h - pad.top - pad.bottom;

  const maxVal = Math.max(...data.map((d) => d.total), 1);
  const yMax = Math.ceil(maxVal * 1.2);
  const barW = Math.min(60, (gw - data.length * 8) / data.length);

  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
        const y = pad.top + gh * (1 - frac);
        return (
          <g key={frac}>
            <line x1={pad.left} x2={w - pad.right} y1={y} y2={y} stroke="#1f2937" strokeWidth={1} />
            <text x={pad.left - 8} y={y + 4} textAnchor="end" className="text-[10px] fill-gray-500">
              {Math.round(yMax * frac)}
            </text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const meta = STATUS_META[d.statut] || { label: d.statut, color: "#6b7280" };
        const barH = (d.total / yMax) * gh;
        const x = pad.left + (i * (gw + 8)) / data.length + 4;
        const y = pad.top + gh - barH;
        return (
          <g key={d.statut}>
            <rect x={x} y={y} width={barW} height={barH} rx={4} fill={meta.color} opacity={0.7} />
            <text x={x + barW / 2} y={y - 6} textAnchor="middle" className="text-[11px] font-semibold fill-gray-300">{d.total}</text>
            <text x={x + barW / 2} y={h - 4} textAnchor="middle" className="text-[9px] fill-gray-500">
              {meta.label.length > 14 ? meta.label.slice(0, 12) + "..." : meta.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function SkeletonKpi() {
  return (
    <div className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-3 bg-[#1f2937] rounded w-16" />
          <div className="h-8 bg-[#1f2937] rounded w-20" />
        </div>
        <div className="w-11 h-11 rounded-xl bg-[#1f2937]" />
      </div>
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 p-5 animate-pulse">
      <div className="h-4 bg-[#1f2937] rounded w-32 mb-4" />
      <div className="h-[200px] bg-[#1f2937]/30 rounded-lg" />
    </div>
  );
}

export default function CommissariatStatistiquesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<StatistiquesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !user.roles.includes("ROLE_COMMISSARIAT"))) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/api/commissariat/statistiques");
      setStats(res.data.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.roles.includes("ROLE_COMMISSARIAT")) {
      fetchStats();
    }
  }, [user, fetchStats]);

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="h-8 bg-[#1f2937] rounded w-48 animate-pulse" />
        <div className="h-4 bg-[#1f2937] rounded w-64 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <SkeletonKpi key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
        </div>
      </div>
    );
  }

  if (!user || !user.roles.includes("ROLE_COMMISSARIAT")) return null;

  function statVal(key: string): number {
    if (!stats) return 0;
    const map: Record<string, number> = {
      avis_crees: stats.avis_crees,
      avis_actifs: stats.avis_actifs,
      personnes_retrouves: stats.personnes_retrouves,
      taux_reussite: stats.taux_reussite,
      signalements_recus: stats.signalements_recus,
    };
    return map[key] ?? 0;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/commissariat"
            className="w-8 h-8 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 flex items-center justify-center hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 transition-all duration-200"
          >
            <ChevronLeft className="h-4 w-4 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Statistiques</h1>
            <p className="text-sm text-gray-500">Vue d'ensemble de votre activité</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats && KPI_CONFIG.map((cfg, i) => {
          const val = statVal(cfg.key);
          const display = cfg.key === "taux_reussite" ? val.toFixed(1) : val.toLocaleString();
          const Icon = cfg.icon;
          const colors = KPI_STYLES[i];
          return (
            <div
              key={cfg.key}
              className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm hover:border-[#1f2937] hover:bg-[#0e1420]/80 transition-all duration-300 p-5 animate-fade-in"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{cfg.label}</p>
                  <p className={`text-3xl font-bold tracking-tight ${colors.text}`}>
                    {display}{cfg.suffix || ""}
                  </p>
                </div>
                <div className={`w-11 h-11 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-5 w-5 ${colors.text}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="animate-fade-in" style={{ animationDelay: "150ms", animationFillMode: "both" }}>
          <h2 className="text-sm font-bold text-white tracking-tight mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            Évolution mensuelle
          </h2>
          {stats && stats.evolution_mensuelle.length > 0 ? (
            <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-5">
              <LineChart data={stats.evolution_mensuelle} />
            </div>
          ) : (
            <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 p-5">
              <p className="text-sm text-gray-500">Aucune donnée mensuelle disponible</p>
            </div>
          )}
        </section>

        <section className="animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
          <h2 className="text-sm font-bold text-white tracking-tight mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Répartition par statut
          </h2>
          {stats && stats.status_distribution && stats.status_distribution.length > 0 ? (
            <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-5">
              <BarChart data={stats.status_distribution} />
            </div>
          ) : (
            <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 p-5">
              <p className="text-sm text-gray-500">Aucune donnée disponible</p>
            </div>
          )}
        </section>
      </div>

      <section className="animate-fade-in" style={{ animationDelay: "250ms", animationFillMode: "both" }}>
        <h2 className="text-sm font-bold text-white tracking-tight mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          Détail mensuel
        </h2>
        {stats && stats.evolution_mensuelle.length > 0 ? (
          <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1f2937]/50 bg-[#0b0f17]/60">
                    <th className="text-left px-4 py-3 font-medium text-gray-400">Mois</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-400">Créés</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-400">Actifs</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-400">Retrouvés</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.evolution_mensuelle.map((ev, i) => (
                    <tr key={ev.mois} className="border-b border-[#1f2937]/30 last:border-b-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-medium text-white">{formatMonthShort(ev.mois)}</td>
                      <td className="px-4 py-3 text-right text-gray-300">{ev.creees}</td>
                      <td className="px-4 py-3 text-right text-red-400 font-medium">{ev.activees}</td>
                      <td className="px-4 py-3 text-right text-green-400 font-medium">{ev.retrouves}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 p-5">
            <p className="text-sm text-gray-500">Aucune donnée disponible</p>
          </div>
        )}
      </section>
    </div>
  );
}