"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { AvisStatutBadge } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { FileSearch, UserCheck, MessageSquare, TrendingUp, Plus, List, Flag, MessageCircle, BarChart3, Settings, Clock, ArrowRight } from "lucide-react";

interface DashboardAvis {
  id: number;
  nom: string;
  prenom: string;
  statut: string;
  createdAt: string;
}

interface DashboardData {
  commissariat_nom: string;
  avis_actifs: number;
  retrouves: number;
  signalements_recus: number;
  taux_resolution: number;
  historique: DashboardAvis[];
}

const statIcons = [FileSearch, UserCheck, MessageSquare, TrendingUp] as const;

const statColors = [
  { bg: "bg-red-500/10", text: "text-red-400", icon: "text-red-400" },
  { bg: "bg-green-500/10", text: "text-green-400", icon: "text-green-400" },
  { bg: "bg-amber-500/10", text: "text-amber-400", icon: "text-amber-400" },
  { bg: "bg-blue-500/10", text: "text-blue-400", icon: "text-blue-400" },
] as const;

const quickActions = [
  { label: "Créer un avis", href: "/commissariat/avis/create", icon: Plus, desc: "Publier un nouvel avis de recherche" },
  { label: "Gérer mes avis", href: "/commissariat/avis", icon: List, desc: "Consulter et gérer vos avis" },
  { label: "Signalements", href: "/commissariat/signalements", icon: Flag, desc: "Traiter les signalements reçus" },
  { label: "Conversations", href: "/commissariat/conversations", icon: MessageCircle, desc: "Messages et échanges" },
  { label: "Statistiques", href: "/commissariat/statistiques", icon: BarChart3, desc: "Analyses et tendances" },
  { label: "Profil", href: "/commissariat/profil", icon: Settings, desc: "Paramètres du compte" },
];

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 overflow-hidden animate-pulse">
      <div className="p-5 space-y-3">
        <div className="h-4 bg-[#1f2937] rounded w-3/4" />
        <div className="h-3 bg-[#1f2937] rounded w-1/2" />
      </div>
    </div>
  );
}

export default function CommissariatDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !user.roles.includes("ROLE_COMMISSARIAT"))) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get("/api/commissariat/dashboard");
      setDashboard(res.data.data);
    } catch (err) {
      console.error("Erreur chargement dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.roles.includes("ROLE_COMMISSARIAT")) {
      fetchDashboard();
    }
  }, [user, fetchDashboard]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="space-y-2">
          <div className="h-8 bg-[#1f2937] rounded w-48 animate-pulse" />
          <div className="h-4 bg-[#1f2937] rounded w-72 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1f2937]" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-[#1f2937] rounded w-20" />
                  <div className="h-6 bg-[#1f2937] rounded w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-5 bg-[#1f2937] rounded w-32 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (!user || !user.roles.includes("ROLE_COMMISSARIAT")) return null;

  const statCards = dashboard
    ? [
        { label: "Avis actifs", value: dashboard.avis_actifs },
        { label: "Retrouvés", value: dashboard.retrouves },
        { label: "Signalements reçus", value: dashboard.signalements_recus },
        { label: "Taux de résolution", value: `${dashboard.taux_resolution}%` },
      ]
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/20 flex items-center justify-center">
            <FileSearch className="h-4 w-4 text-[#ef4444]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {dashboard?.commissariat_nom ?? "Tableau de bord"}
            </h1>
            <p className="text-sm text-gray-500">Vue d'ensemble de votre activité</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = statIcons[i];
          const colors = statColors[i];
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm hover:border-[#1f2937] hover:bg-[#0e1420]/80 transition-all duration-300 p-5 animate-fade-in"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${colors.icon}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
                  <p className={`text-2xl font-bold ${colors.text} mt-0.5`}>{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <section>
        <h2 className="text-base font-bold text-white tracking-tight mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-[#ef4444] rounded-full inline-block" />
          Actions rapides
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="group rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm hover:border-[#ef4444]/30 hover:bg-[#0e1420]/80 transition-all duration-300 p-4 animate-fade-in"
                style={{ animationDelay: `${(i + 4) * 80}ms`, animationFillMode: "both" }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#1f2937]/50 flex items-center justify-center group-hover:bg-[#ef4444]/10 transition-colors duration-300 shrink-0">
                    <Icon className="h-5 w-5 text-gray-400 group-hover:text-[#ef4444] transition-colors duration-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white group-hover:text-[#ef4444] transition-colors duration-200">
                      {action.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{action.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-[#ef4444] group-hover:translate-x-0.5 transition-all duration-300 shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-base font-bold text-white tracking-tight mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-[#ef4444] rounded-full inline-block" />
          Derniers avis
        </h2>
        {!dashboard || dashboard.historique.length === 0 ? (
          <EmptyState
            title="Aucun avis pour le moment"
            description="Les avis créés par votre commissariat apparaîtront ici."
            className="border border-[#1f2937]/50 bg-[#0e1420]/40 rounded-xl py-12"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboard.historique.map((avis, i) => (
              <Link
                key={avis.id}
                href={`/commissariat/avis/${avis.id}`}
                className="group rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm hover:border-[#1f2937] hover:bg-[#0e1420]/80 transition-all duration-300 overflow-hidden animate-fade-in"
                style={{ animationDelay: `${(i + 10) * 60}ms`, animationFillMode: "both" }}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-bold text-white group-hover:text-[#ef4444] transition-colors duration-200 truncate">
                      {avis.prenom} {avis.nom}
                    </h3>
                    <AvisStatutBadge statut={avis.statut} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3.5 w-3.5 text-gray-600 shrink-0" />
                    <span>Créé le {formatDate(avis.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
