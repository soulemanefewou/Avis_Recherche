"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { AvisRecherche } from "@/lib/types";
import { ChevronLeft, AlertCircle, Users, ShieldCheck, Building2, FileSearch, Clock, CheckCircle2, Flag, MessagesSquare, Bell, Database, ArrowRight, CheckCircle, XCircle, X, User, Building, FileText } from "lucide-react";

interface CommissariatDemande {
  id: number;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  responsable: string;
  statut: string;
  motifRejet?: string;
  createdAt: string;
  region?: { id: number; nom: string } | null;
  ville?: { id: number; nom: string } | null;
}

interface DashboardData {
  utilisateurs: number;
  super_admins: number;
  commissariats: number;
  avis: {
    total: number;
    officiels: number;
    citoyens: number;
    retrouves: number;
    en_attente: number;
  };
  signalements: number;
  conversations: number;
  notifications: number;
  storage: { used_mb: number; free_mb: number };
}

const inputClass = "w-full h-10 text-sm rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all px-3";
const textareaClass = "w-full rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all px-3 py-2.5 resize-none";
const btnGhost = "text-xs font-medium h-9 px-4 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-300 hover:text-white hover:border-[#1f2937] transition-all";
const btnPrimary = "text-xs font-semibold h-9 px-4 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transition-all shadow-md shadow-[#ef4444]/10 disabled:opacity-50";
const btnDanger = "text-xs font-semibold h-9 px-4 rounded-lg bg-gradient-to-r from-red-500 to-red-700 text-white hover:from-red-600 hover:to-red-800 transition-all shadow-md shadow-red-500/10 disabled:opacity-50";
const btnRowGhost = "inline-flex items-center gap-1 text-[10px] font-semibold h-8 px-3 rounded-lg border border-[#1f2937]/80 text-gray-400 hover:text-white hover:border-[#1f2937] hover:bg-white/5 transition-all";
const btnRowSuccess = "inline-flex items-center gap-1 text-[10px] font-semibold h-8 px-3 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 hover:border-green-500/50 transition-all";
const btnRowDanger = "inline-flex items-center gap-1 text-[10px] font-semibold h-8 px-3 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all";

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg rounded-xl border border-[#1f2937]/80 bg-[#0e1420] shadow-2xl shadow-black/40 animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#1f2937]/50 sticky top-0 bg-[#0e1420] z-10">
          <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg border border-[#1f2937]/80 flex items-center justify-center hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 transition-all">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Avatar({ prenom, nom }: { prenom: string; nom: string }) {
  return (
    <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-[#ef4444]/10 text-[#ef4444] shrink-0 text-xs font-bold">
      {(prenom[0] || "?").toUpperCase()}{(nom[0] || "").toUpperCase()}
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [pendingAvis, setPendingAvis] = useState<AvisRecherche[]>([]);
  const [demandes, setDemandes] = useState<CommissariatDemande[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [validateModalOpen, setValidateModalOpen] = useState(false);
  const [selectedAvisId, setSelectedAvisId] = useState<number | null>(null);
  const [validating, setValidating] = useState(false);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectMotif, setRejectMotif] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const [demandeRejectModalOpen, setDemandeRejectModalOpen] = useState(false);
  const [selectedDemandeId, setSelectedDemandeId] = useState<number | null>(null);
  const [demandeRejectMotif, setDemandeRejectMotif] = useState("");
  const [demandeActionLoading, setDemandeActionLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !user.roles.includes("ROLE_FONDATEUR"))) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get("/api/fondateur/dashboard");
      setDashboard(res.data.data);
    } catch (err) {
      console.error("Erreur chargement dashboard:", err);
    }
  }, []);

  const fetchPendingAvis = useCallback(async () => {
    try {
      const res = await api.get("/api/avis-recherches?statut=EN_ATTENTE_VALIDATION&limit=999");
      setPendingAvis(res.data.data || []);
    } catch (err) {
      console.error("Erreur chargement avis:", err);
    }
  }, []);

  const fetchDemandes = useCallback(async () => {
    try {
      const res = await api.get("/api/super-admin/commissariat-demandes");
      setDemandes(res.data.data || []);
    } catch (err: unknown) {
      const apiErr = err as { response?: { status?: number; data?: { message?: string } } };
      console.error("Erreur chargement demandes:", apiErr.response?.status, apiErr.response?.data);
      setError(apiErr.response?.data?.message || `Erreur ${apiErr.response?.status || "inconnue"} lors du chargement des demandes.`);
    }
  }, []);

  useEffect(() => {
    if (user && user.roles.includes("ROLE_FONDATEUR")) {
      setLoading(true);
      Promise.all([fetchDashboard(), fetchPendingAvis(), fetchDemandes()]).finally(() => setLoading(false));
    }
  }, [user, fetchDashboard, fetchPendingAvis, fetchDemandes]);

  const openValidateModal = (id: number) => {
    setSelectedAvisId(id);
    setValidateModalOpen(true);
  };

  const openRejectModal = (id: number) => {
    setSelectedAvisId(id);
    setRejectMotif("");
    setRejectModalOpen(true);
  };

  const handleValidate = async () => {
    if (!selectedAvisId) return;
    setValidating(true);
    setError("");
    try {
      await api.post(`/api/avis-recherches/${selectedAvisId}/valider`, { valide: true });
      setValidateModalOpen(false);
      setSelectedAvisId(null);
      await Promise.all([fetchPendingAvis(), fetchDashboard()]);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || "Erreur lors de la validation.");
    } finally {
      setValidating(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAvisId) return;
    setRejecting(true);
    setError("");
    try {
      await api.post(`/api/avis-recherches/${selectedAvisId}/valider`, {
        valide: false,
        motifRejet: rejectMotif,
      });
      setRejectModalOpen(false);
      setSelectedAvisId(null);
      setRejectMotif("");
      await Promise.all([fetchPendingAvis(), fetchDashboard()]);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || "Erreur lors du rejet.");
    } finally {
      setRejecting(false);
    }
  };

  const handleDemandeValidate = async (id: number) => {
    setDemandeActionLoading(true);
    setError("");
    try {
      await api.post(`/api/super-admin/commissariat-demandes/${id}/valider`);
      await Promise.all([fetchDemandes(), fetchDashboard()]);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || "Erreur lors de la validation de la demande.");
    } finally {
      setDemandeActionLoading(false);
    }
  };

  const openDemandeRejectModal = (id: number) => {
    setSelectedDemandeId(id);
    setDemandeRejectMotif("");
    setDemandeRejectModalOpen(true);
  };

  const handleDemandeReject = async () => {
    if (!selectedDemandeId) return;
    setDemandeActionLoading(true);
    setError("");
    try {
      await api.post(`/api/super-admin/commissariat-demandes/${selectedDemandeId}/rejeter`, {
        motif: demandeRejectMotif,
      });
      setDemandeRejectModalOpen(false);
      setSelectedDemandeId(null);
      setDemandeRejectMotif("");
      await Promise.all([fetchDemandes(), fetchDashboard()]);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || "Erreur lors du rejet de la demande.");
    } finally {
      setDemandeActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (authLoading || loading) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
        <div className="h-8 bg-[#1f2937] rounded w-64 animate-pulse" />
        <div className="h-4 bg-[#1f2937] rounded w-96 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
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
        <div className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 p-6 space-y-3 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-[#1f2937] rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!user || !user.roles.includes("ROLE_FONDATEUR")) return null;

  const statCards = dashboard
    ? [
        { label: "Utilisateurs", value: dashboard.utilisateurs, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
        { label: "Super Admins", value: dashboard.super_admins, icon: ShieldCheck, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
        { label: "Commissariats", value: dashboard.commissariats, icon: Building2, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
        { label: "Avis total", value: dashboard.avis.total, icon: FileSearch, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
        { label: "Avis en attente", value: dashboard.avis.en_attente, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
        { label: "Avis retrouvés", value: dashboard.avis.retrouves, icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
        { label: "Signalements", value: dashboard.signalements, icon: Flag, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
        { label: "Conversations", value: dashboard.conversations, icon: MessagesSquare, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
        { label: "Notifications", value: dashboard.notifications, icon: Bell, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
      ]
    : [];

  const storagePercent = dashboard?.storage
    ? Math.min((dashboard.storage.used_mb / (dashboard.storage.used_mb + dashboard.storage.free_mb)) * 100, 100)
    : 0;

  const quickActions = [
    { label: "Gérer les Super Admins", href: "/admin/super-admins", icon: ShieldCheck, desc: "Gestion des comptes super admin" },
    { label: "Gérer les utilisateurs", href: "/admin/users", icon: Users, desc: "Liste et gestion des utilisateurs" },
    { label: "Avis en attente", href: "#pending-avis", icon: Clock, desc: `${dashboard?.avis.en_attente ?? 0} avis à valider` },
    { label: "Commissariats", href: "/super-admin/commissariats", icon: Building, desc: "Commissariats et demandes" },
  ];

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-3 animate-fade-in">
        <Link href="/" className="w-8 h-8 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 flex items-center justify-center hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 transition-all">
          <ChevronLeft className="h-4 w-4 text-gray-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white tracking-tight">Tableau de bord du Fondateur</h1>
          <p className="text-sm text-gray-500">Vue d&apos;ensemble complète de la plateforme</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm animate-fade-in">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm hover:border-[#1f2937] hover:bg-[#0e1420]/80 transition-all duration-300 p-5 animate-fade-in"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color} mt-0.5`}>{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {dashboard?.storage && (
        <section className="animate-fade-in" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
          <h2 className="text-base font-bold text-white tracking-tight mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-[#ef4444] rounded-full inline-block" />
            Stockage
          </h2>
          <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <Database className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-400">{dashboard.storage.used_mb} Mo utilisés</span>
              <span className="text-gray-600">&middot;</span>
              <span className="text-sm text-gray-400">{dashboard.storage.free_mb} Mo libres</span>
            </div>
            <div className="w-full h-2.5 bg-[#1f2937]/50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  storagePercent > 80 ? "bg-red-500" : storagePercent > 50 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${storagePercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1.5">{storagePercent.toFixed(1)}% utilisé</p>
          </div>
        </section>
      )}

      <section className="animate-fade-in" style={{ animationDelay: "360ms", animationFillMode: "both" }}>
        <h2 className="text-base font-bold text-white tracking-tight mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-[#ef4444] rounded-full inline-block" />
          Actions rapides
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="group rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm hover:border-[#ef4444]/30 hover:bg-[#0e1420]/80 transition-all duration-300 p-4"
                style={{ animationDelay: `${(i + 6) * 60}ms`, animationFillMode: "both" }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#1f2937]/50 flex items-center justify-center group-hover:bg-[#ef4444]/10 transition-colors duration-300 shrink-0">
                    <Icon className="h-5 w-5 text-gray-400 group-hover:text-[#ef4444] transition-colors duration-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white group-hover:text-[#ef4444] transition-colors duration-200">{action.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{action.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-[#ef4444] group-hover:translate-x-0.5 transition-all duration-300 shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section id="pending-avis" className="scroll-mt-24 animate-fade-in" style={{ animationDelay: "420ms", animationFillMode: "both" }}>
        <h2 className="text-base font-bold text-white tracking-tight mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-[#ef4444] rounded-full inline-block" />
          Avis en attente de validation
        </h2>
        {pendingAvis.length === 0 ? (
          <div className="text-center py-14 rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40">
            <CheckCircle2 className="h-12 w-12 text-green-500/60 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Aucun avis en attente de validation.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1f2937]/50 bg-[#0b0f17]/50">
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Nom</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Auteur</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Type</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Date</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingAvis.map((avis) => (
                    <tr key={avis.id} className="border-b border-[#1f2937]/30 last:border-b-0 hover:bg-white/[0.03] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar prenom={avis.prenom} nom={avis.nom} />
                          <p className="font-semibold text-white">{avis.prenom} {avis.nom}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400">
                        {avis.auteur ? (
                          <span className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-gray-600" />
                            {avis.auteur.prenom} {avis.auteur.nom}
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide border ${
                          avis.type === "OFFICIEL"
                            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}>
                          {avis.type === "OFFICIEL" ? "Officiel" : "Citoyen"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">{formatDate(avis.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button className={btnRowSuccess} onClick={() => openValidateModal(avis.id)}>
                            <CheckCircle className="h-3 w-3" />
                            Valider
                          </button>
                          <button className={btnRowDanger} onClick={() => openRejectModal(avis.id)}>
                            <XCircle className="h-3 w-3" />
                            Rejeter
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="animate-fade-in" style={{ animationDelay: "480ms", animationFillMode: "both" }}>
        <h2 className="text-base font-bold text-white tracking-tight mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-[#ef4444] rounded-full inline-block" />
          Demandes de commissariat
        </h2>
        {demandes.length === 0 ? (
          <div className="text-center py-14 rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40">
            <Building className="h-12 w-12 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Aucune demande de commissariat en attente.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1f2937]/50 bg-[#0b0f17]/50">
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Nom</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Email</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Téléphone</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Statut</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {demandes.map((d) => (
                    <tr key={d.id} className="border-b border-[#1f2937]/30 last:border-b-0 hover:bg-white/[0.03] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-[#ef4444]/10 text-[#ef4444] shrink-0">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">{d.nom}</p>
                            <p className="text-xs text-gray-600">{d.responsable}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">{d.email}</td>
                      <td className="px-5 py-3.5 text-gray-500">{d.telephone}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide border ${
                          d.statut === "VALIDE"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : d.statut === "REJETE"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        }`}>
                          {d.statut === "VALIDE" ? "Validée" : d.statut === "REJETE" ? "Rejetée" : "En attente"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {d.statut === "EN_ATTENTE" && (
                            <>
                              <button className={btnRowSuccess} disabled={demandeActionLoading} onClick={() => handleDemandeValidate(d.id)}>
                                <CheckCircle className="h-3 w-3" />
                                Valider
                              </button>
                              <button className={btnRowDanger} disabled={demandeActionLoading} onClick={() => openDemandeRejectModal(d.id)}>
                                <XCircle className="h-3 w-3" />
                                Rejeter
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {validateModalOpen && (
        <ModalShell title="Confirmer la validation" onClose={() => setValidateModalOpen(false)}>
          <p className="text-sm text-gray-400 mb-6">Voulez-vous vraiment valider cet avis ? Il sera publié et visible publiquement.</p>
          <div className="flex justify-end gap-3">
            <button className={btnGhost} onClick={() => setValidateModalOpen(false)}>Annuler</button>
            <button className={btnPrimary} disabled={validating} onClick={handleValidate}>{validating ? "Validation..." : "Confirmer la validation"}</button>
          </div>
        </ModalShell>
      )}

      {rejectModalOpen && (
        <ModalShell title="Rejeter l'avis" onClose={() => setRejectModalOpen(false)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-400">Veuillez indiquer le motif du rejet.</p>
            <textarea
              value={rejectMotif}
              onChange={(e) => setRejectMotif(e.target.value)}
              rows={4}
              className={textareaClass}
              placeholder="Motif du rejet..."
            />
            <div className="flex justify-end gap-3">
              <button className={btnGhost} onClick={() => setRejectModalOpen(false)}>Annuler</button>
              <button className={btnDanger} disabled={rejecting || !rejectMotif.trim()} onClick={handleReject}>{rejecting ? "Rejet..." : "Confirmer le rejet"}</button>
            </div>
          </div>
        </ModalShell>
      )}

      {demandeRejectModalOpen && (
        <ModalShell title="Rejeter la demande" onClose={() => setDemandeRejectModalOpen(false)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-400">Veuillez indiquer le motif du rejet de cette demande de commissariat.</p>
            <textarea
              value={demandeRejectMotif}
              onChange={(e) => setDemandeRejectMotif(e.target.value)}
              rows={4}
              className={textareaClass}
              placeholder="Motif du rejet..."
            />
            <div className="flex justify-end gap-3">
              <button className={btnGhost} onClick={() => setDemandeRejectModalOpen(false)}>Annuler</button>
              <button className={btnDanger} disabled={demandeActionLoading || !demandeRejectMotif.trim()} onClick={handleDemandeReject}>
                {demandeActionLoading ? "Rejet..." : "Confirmer le rejet"}
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
