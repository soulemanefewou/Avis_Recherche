"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { FileSearch, Clock, CheckCircle2, Users, Building2, Flag, MessageCircle, ShieldCheck, AlertTriangle, ChevronRight } from "lucide-react";

interface DashboardStats {
  avis_actifs: number;
  retrouves: number;
  en_attente_validation: number;
  en_attente_confirmation: number;
  signalements: number;
  conversations: number;
  utilisateurs: number;
  commissariats: number;
}

interface ActivityItem {
  source: string;
  id: number;
  nom: string;
  prenom: string;
  created_at: string;
}

interface SuperAdminDashboard {
  stats: DashboardStats;
  par_region: { nom: string; total: number }[];
  par_statut: { statut: string; total: number }[];
  activite_recente: ActivityItem[];
}

const statutLabels: Record<string, string> = {
  RECHERCHE: "Recherché",
  RETROUVE_VIVANT: "Retrouvé vivant",
  RETROUVE_DECEDE: "Retrouvé décédé",
  RECHERCHE_CLOTUREE: "Clôturé",
  EN_ATTENTE_VALIDATION: "En attente validation",
};

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [dashboard, setDashboard] = useState<SuperAdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !user.roles.includes("ROLE_SUPER_ADMIN"))) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get("/api/super-admin/dashboard");
      setDashboard(res.data.data);
    } catch (err) {
      console.error("Erreur chargement dashboard:", err);
    }
  }, []);

  useEffect(() => {
    if (!user || !user.roles.includes("ROLE_SUPER_ADMIN")) return;

    setLoading(true);
    fetchDashboard().finally(() => setLoading(false));

    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchDashboard();
    };
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) fetchDashboard();
    };

    window.addEventListener("focus", fetchDashboard);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pageshow", handlePageShow);
    const interval = window.setInterval(fetchDashboard, 30000);

    return () => {
      window.removeEventListener("focus", fetchDashboard);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pageshow", handlePageShow);
      window.clearInterval(interval);
    };
  }, [user, fetchDashboard]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

  if (authLoading || loading) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
        <div className="h-8 bg-[#1f2937] rounded w-56 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 p-5 flex items-center gap-4 animate-pulse">
              <div className="w-12 h-12 rounded-lg bg-[#1f2937]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-[#1f2937] rounded w-20" />
                <div className="h-6 bg-[#1f2937] rounded w-12" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 p-6 space-y-4 animate-pulse">
              <div className="h-5 bg-[#1f2937] rounded w-40" />
              {[...Array(4)].map((_, j) => (
                <div key={j} className="h-6 bg-[#1f2937] rounded" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user || !user.roles.includes("ROLE_SUPER_ADMIN")) return null;

  const stats = dashboard
    ? [
        { label: "Avis actifs", value: dashboard.stats.avis_actifs, icon: FileSearch, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
        { label: "En attente validation", value: dashboard.stats.en_attente_validation, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
        { label: "À confirmer", value: dashboard.stats.en_attente_confirmation, icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
        { label: "Retrouvés", value: dashboard.stats.retrouves, icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
        { label: "Utilisateurs", value: dashboard.stats.utilisateurs, icon: Users, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
        { label: "Commissariats", value: dashboard.stats.commissariats, icon: Building2, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
        { label: "Signalements", value: dashboard.stats.signalements, icon: Flag, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
        { label: "Conversations", value: dashboard.stats.conversations, icon: MessageCircle, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
      ]
    : [];

  const quickActions = [
    { label: "Gérer les commissariats", icon: Building2, href: "/super-admin/commissariats", color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Valider les avis citoyens", icon: ShieldCheck, href: "/super-admin/avis", color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Confirmer les retrouvailles", icon: CheckCircle2, href: "/super-admin/avis?filter=retrouve", color: "text-orange-400", bg: "bg-orange-500/10" },
    { label: "Modération", icon: Flag, href: "/super-admin/moderation", color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Conversations", icon: MessageCircle, href: "/super-admin/conversations", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  ];

  const maxRegion = dashboard?.par_region?.length
    ? Math.max(...dashboard.par_region.map((x) => x.total))
    : 1;

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-white tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-gray-500 mt-1">Vue d&apos;ensemble de la plateforme</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => (
          <div key={stat.label} className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-5 hover:border-[#1f2937] transition-all animate-fade-in" style={{ animationDelay: `${idx * 50}ms`, animationFillMode: "both" }}>
            <div className="flex items-center justify-between">
              <div className={`flex items-center justify-center h-12 w-12 rounded-lg border ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
            <p className="text-xs font-medium text-gray-500 mt-4">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
        <h2 className="text-lg font-bold text-white tracking-tight mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href} className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-4 hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 transition-all duration-200 group">
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center h-10 w-10 rounded-lg ${action.bg} shrink-0`}>
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                </div>
                <span className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors flex-1">{action.label}</span>
                <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-[#ef4444] transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dashboard?.par_region && dashboard.par_region.length > 0 && (
          <section className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-6 animate-fade-in" style={{ animationDelay: "150ms", animationFillMode: "both" }}>
            <h2 className="text-sm font-bold text-white tracking-tight mb-5">Avis par région</h2>
            <div className="space-y-4">
              {dashboard.par_region.map((r) => (
                <div key={r.nom} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-400 w-40 truncate">{r.nom}</span>
                  <div className="flex-1 h-2 bg-[#1f2937]/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#ef4444] to-[#f87171] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((r.total / maxRegion) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-white w-8 text-right">{r.total}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {dashboard?.par_statut && dashboard.par_statut.length > 0 && (
          <section className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-6 animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
            <h2 className="text-sm font-bold text-white tracking-tight mb-5">Avis par statut</h2>
            <div className="grid grid-cols-2 gap-3">
              {dashboard.par_statut.map((s) => (
                <div key={s.statut} className="text-center p-4 bg-[#0b0f17]/50 border border-[#1f2937]/50 rounded-lg">
                  <p className="text-2xl font-bold text-white">{s.total}</p>
                  <p className="text-xs text-gray-500 mt-1">{statutLabels[s.statut] || s.statut}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {dashboard?.activite_recente && dashboard.activite_recente.length > 0 && (
        <section className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm overflow-hidden animate-fade-in" style={{ animationDelay: "250ms", animationFillMode: "both" }}>
          <h2 className="text-sm font-bold text-white tracking-tight p-6 pb-4">Activité récente</h2>
          <div className="divide-y divide-[#1f2937]/50">
            {dashboard.activite_recente.slice(0, 5).map((a, i) => (
              <div key={`${a.source}-${a.id}-${i}`} className="px-6 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-200">
                    {a.prenom} {a.nom}
                  </p>
                  <p className="text-xs text-gray-600">Source: {a.source}</p>
                </div>
                <span className="text-xs text-gray-600">{formatDate(a.created_at)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}