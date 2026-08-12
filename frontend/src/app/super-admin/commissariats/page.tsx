"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ChevronLeft, Building2, PlusCircle, Pencil, Trash2, Power, PowerOff, CheckCircle2, XCircle, FileText, AlertCircle, X, MapPin, Phone, Mail } from "lucide-react";

interface Region { id: number; nom: string }
interface Ville { id: number; nom: string }

interface CommissariatData {
  id: number;
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  responsable: string;
  actif: boolean;
  region?: { id: number; nom: string } | null;
  ville?: { id: number; nom: string } | null;
}

interface DemandeData {
  id: number;
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  responsable: string;
  prenom?: string;
  statut: string;
  motifRejet?: string;
  documentPath?: string;
  documentNomOriginal?: string;
  createdAt: string;
  region?: { id: number; nom: string } | null;
  ville?: { id: number; nom: string } | null;
}

interface CommissariatForm {
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  responsable: string;
  region: string;
  ville: string;
}

const emptyForm: CommissariatForm = { nom: "", adresse: "", telephone: "", email: "", responsable: "", region: "", ville: "" };
const inputClass = "w-full h-10 text-sm rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all px-3";
const selectClass = "w-full h-10 text-sm rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-white appearance-none focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all px-3 pr-9 cursor-pointer";
const textareaClass = "w-full rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all px-3 py-2.5 resize-none";

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

export default function SuperAdminCommissariatsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"commissariats" | "demandes">("commissariats");
  const [commissariats, setCommissariats] = useState<CommissariatData[]>([]);
  const [demandes, setDemandes] = useState<DemandeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCommissariat, setSelectedCommissariat] = useState<CommissariatData | null>(null);
  const [form, setForm] = useState<CommissariatForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedDemandeId, setSelectedDemandeId] = useState<number | null>(null);
  const [rejectMotif, setRejectMotif] = useState("");

  const [regions, setRegions] = useState<Region[]>([]);
  const [villes, setVilles] = useState<Ville[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || !user.roles.includes("ROLE_SUPER_ADMIN"))) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    api.get("/api/regions")
      .then((res) => setRegions(res.data.data || []))
      .catch(() => {});
  }, []);

  const fetchVilles = useCallback(async (regionId: string) => {
    if (!regionId) { setVilles([]); return; }
    try {
      const res = await api.get(`/api/regions/${regionId}/villes`);
      setVilles(res.data.data || []);
    } catch { setVilles([]); }
  }, []);

  const handleRegionChange = (regionId: string) => {
    setForm((prev) => ({ ...prev, region: regionId, ville: "" }));
    fetchVilles(regionId);
  };

  const fetchCommissariats = useCallback(async () => {
    try {
      const res = await api.get("/api/super-admin/commissariats");
      setCommissariats(res.data.data || []);
    } catch {
      setError("Erreur lors du chargement des commissariats.");
    }
  }, []);

  const fetchDemandes = useCallback(async () => {
    try {
      const res = await api.get("/api/super-admin/commissariat-demandes");
      setDemandes(res.data.data || []);
    } catch {
      setError("Erreur lors du chargement des demandes.");
    }
  }, []);

  useEffect(() => {
    if (user && user.roles.includes("ROLE_SUPER_ADMIN")) {
      setLoading(true);
      Promise.all([fetchCommissariats(), fetchDemandes()]).finally(() => setLoading(false));
    }
  }, [user, fetchCommissariats, fetchDemandes]);

  const openCreateModal = () => { setForm(emptyForm); setVilles([]); setError(""); setCreateModalOpen(true); };
  const openEditModal = (c: CommissariatData) => {
    setSelectedCommissariat(c);
    setForm({ nom: c.nom, adresse: c.adresse, telephone: c.telephone, email: c.email, responsable: c.responsable, region: "", ville: "" });
    setEditModalOpen(true);
  };
  const openDeleteModal = (c: CommissariatData) => { setSelectedCommissariat(c); setDeleteModalOpen(true); };

  const handleCreate = async () => {
    setSubmitting(true);
    setError("");
    try {
      await api.post("/api/super-admin/commissariats", {
        ...form,
        region: parseInt(form.region),
        ville: parseInt(form.ville),
      });
      setCreateModalOpen(false);
      await fetchCommissariats();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || "Erreur lors de la création.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedCommissariat) return;
    setSubmitting(true);
    setError("");
    try {
      await api.put(`/api/super-admin/commissariats/${selectedCommissariat.id}`, form);
      setEditModalOpen(false);
      setSelectedCommissariat(null);
      await fetchCommissariats();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || "Erreur lors de la modification.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCommissariat) return;
    setSubmitting(true);
    setError("");
    try {
      await api.delete(`/api/super-admin/commissariats/${selectedCommissariat.id}`);
      setDeleteModalOpen(false);
      setSelectedCommissariat(null);
      await fetchCommissariats();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || "Erreur lors de la suppression.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (c: CommissariatData) => {
    setError("");
    try {
      if (c.actif) {
        await api.patch(`/api/super-admin/commissariats/${c.id}/desactiver`);
      } else {
        await api.patch(`/api/super-admin/commissariats/${c.id}/reactiver`);
      }
      await fetchCommissariats();
    } catch {
      setError("Erreur lors du changement de statut.");
    }
  };

  const handleDemandeValidate = async (id: number) => {
    setError("");
    try {
      await api.post(`/api/super-admin/commissariat-demandes/${id}/valider`);
      await fetchDemandes();
    } catch {
      setError("Erreur lors de la validation.");
    }
  };

  const openRejectDemandeModal = (id: number) => {
    setSelectedDemandeId(id);
    setRejectMotif("");
    setRejectModalOpen(true);
  };

  const handleDemandeReject = async () => {
    if (!selectedDemandeId) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post(`/api/super-admin/commissariat-demandes/${selectedDemandeId}/rejeter`, { motif: rejectMotif });
      setRejectModalOpen(false);
      setSelectedDemandeId(null);
      setRejectMotif("");
      await fetchDemandes();
    } catch {
      setError("Erreur lors du rejet.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

  if (authLoading || loading) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
        <div className="h-8 bg-[#1f2937] rounded w-56 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-9 bg-[#1f2937] rounded w-40 animate-pulse" />
          <div className="h-9 bg-[#1f2937] rounded w-48 animate-pulse" />
        </div>
        <div className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 p-6 space-y-3 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-[#1f2937] rounded" />
          ))}
        </div>
      </div>
    );
  }
  if (!user || !user.roles.includes("ROLE_SUPER_ADMIN")) return null;

  const enAttenteCount = demandes.filter((d) => d.statut === "EN_ATTENTE").length;

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-3 animate-fade-in">
        <Link href="/super-admin" className="w-8 h-8 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 flex items-center justify-center hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 transition-all">
          <ChevronLeft className="h-4 w-4 text-gray-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white tracking-tight">Commissariats</h1>
          <p className="text-sm text-gray-500">Gestion des commissariats et demandes d&apos;inscription</p>
        </div>
        {tab === "commissariats" && (
          <button onClick={openCreateModal} className="inline-flex items-center gap-1.5 text-xs font-semibold h-9 px-4 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transition-all shadow-md shadow-[#ef4444]/10">
            <PlusCircle className="h-3.5 w-3.5" />
            Ajouter un commissariat
          </button>
        )}
      </div>

      <div className="flex gap-2 animate-fade-in" style={{ animationDelay: "60ms", animationFillMode: "both" }}>
        <button
          onClick={() => setTab("commissariats")}
          className={`inline-flex items-center gap-2 text-xs font-semibold h-9 px-4 rounded-lg transition-all ${
            tab === "commissariats"
              ? "bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white shadow-md shadow-[#ef4444]/10"
              : "border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-400 hover:text-white hover:border-[#1f2937]"
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          Commissariats ({commissariats.length})
        </button>
        <button
          onClick={() => setTab("demandes")}
          className={`inline-flex items-center gap-2 text-xs font-semibold h-9 px-4 rounded-lg transition-all ${
            tab === "demandes"
              ? "bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white shadow-md shadow-[#ef4444]/10"
              : "border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-400 hover:text-white hover:border-[#1f2937]"
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          Demandes ({enAttenteCount} en attente)
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm animate-fade-in">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {tab === "commissariats" && (
        commissariats.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40">
            <Building2 className="h-12 w-12 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Aucun commissariat n&apos;a été trouvé.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm overflow-hidden animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1f2937]/50 bg-[#0b0f17]/50">
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Nom</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Responsable</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Email</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Téléphone</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Statut</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {commissariats.map((c) => (
                    <tr key={c.id} className="border-b border-[#1f2937]/30 last:border-b-0 hover:bg-white/[0.03] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-[#ef4444]/10 text-[#ef4444] shrink-0">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">{c.nom}</p>
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {c.ville?.nom || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-300">{c.responsable}</td>
                      <td className="px-5 py-3.5 text-gray-500">{c.email}</td>
                      <td className="px-5 py-3.5 text-gray-500">{c.telephone}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide border ${
                          c.actif ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}>
                          {c.actif ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditModal(c)} className="inline-flex items-center gap-1 text-[10px] font-semibold h-8 px-3 rounded-lg border border-[#1f2937]/80 text-gray-400 hover:text-white hover:border-[#1f2937] hover:bg-white/5 transition-all">
                            <Pencil className="h-3 w-3" />
                            Modifier
                          </button>
                          <button
                            onClick={() => handleToggleActive(c)}
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold h-8 px-3 rounded-lg border transition-all ${
                              c.actif
                                ? "border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50"
                                : "border-green-500/30 text-green-400 hover:bg-green-500/10 hover:border-green-500/50"
                            }`}
                          >
                            {c.actif ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                            {c.actif ? "Désactiver" : "Réactiver"}
                          </button>
                          <button onClick={() => openDeleteModal(c)} className="inline-flex items-center gap-1 text-[10px] font-semibold h-8 px-3 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all">
                            <Trash2 className="h-3 w-3" />
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {tab === "demandes" && (
        demandes.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40">
            <FileText className="h-12 w-12 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Aucune demande de commissariat.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm overflow-hidden animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1f2937]/50 bg-[#0b0f17]/50">
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Nom</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Email</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Région</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Justificatif</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Statut</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Date</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {demandes.map((d) => (
                    <tr key={d.id} className="border-b border-[#1f2937]/30 last:border-b-0 hover:bg-white/[0.03] transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-white">{d.nom}</p>
                        <p className="text-xs text-gray-600">{d.prenom}</p>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">{d.email}</td>
                      <td className="px-5 py-3.5 text-gray-300">{d.region?.nom || "—"}</td>
                      <td className="px-5 py-3.5">
                        {d.documentPath ? (
                          <a href={`/${d.documentPath}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#ef4444] hover:underline">
                            <FileText className="h-3 w-3" />
                            {d.documentNomOriginal || "Voir"}
                          </a>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
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
                      <td className="px-5 py-3.5 text-gray-500">{formatDate(d.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {d.statut === "EN_ATTENTE" && (
                            <>
                              <button onClick={() => handleDemandeValidate(d.id)} className="inline-flex items-center gap-1 text-[10px] font-semibold h-8 px-3 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 hover:border-green-500/50 transition-all">
                                <CheckCircle2 className="h-3 w-3" />
                                Valider
                              </button>
                              <button onClick={() => openRejectDemandeModal(d.id)} className="inline-flex items-center gap-1 text-[10px] font-semibold h-8 px-3 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all">
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
        )
      )}

      {createModalOpen && (
        <ModalShell title="Ajouter un commissariat" onClose={() => setCreateModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nom *</label>
              <input className={inputClass} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Nom du commissariat" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Adresse *</label>
              <input className={inputClass} value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} placeholder="Adresse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Téléphone *</label>
                <input className={inputClass} value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="+225 00 00 00 00" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                <input className={inputClass} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemple.com" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Responsable *</label>
              <input className={inputClass} value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} placeholder="Nom du responsable" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Région *</label>
                <select className={selectClass} value={form.region} onChange={(e) => handleRegionChange(e.target.value)}>
                  <option value="" className="bg-[#0e1420] text-white">Sélectionner une région...</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id} className="bg-[#0e1420] text-white">{r.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Ville *</label>
                <select className={selectClass} value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })}>
                  <option value="" className="bg-[#0e1420] text-white">Sélectionner une ville...</option>
                  {villes.map((v) => (
                    <option key={v.id} value={v.id} className="bg-[#0e1420] text-white">{v.nom}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setCreateModalOpen(false)} className="text-xs font-medium h-9 px-4 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-300 hover:text-white hover:border-[#1f2937] transition-all">
                Annuler
              </button>
              <button onClick={handleCreate} disabled={submitting || !form.nom || !form.adresse || !form.telephone || !form.responsable || !form.region || !form.ville} className="text-xs font-semibold h-9 px-4 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transition-all shadow-md shadow-[#ef4444]/10 disabled:opacity-50">
                {submitting ? "Création..." : "Créer"}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {editModalOpen && (
        <ModalShell title="Modifier le commissariat" onClose={() => setEditModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nom</label>
              <input className={inputClass} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Adresse</label>
              <input className={inputClass} value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Téléphone</label>
                <input className={inputClass} value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                <input className={inputClass} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Responsable</label>
              <input className={inputClass} value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditModalOpen(false)} className="text-xs font-medium h-9 px-4 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-300 hover:text-white hover:border-[#1f2937] transition-all">
                Annuler
              </button>
              <button onClick={handleEdit} disabled={submitting} className="text-xs font-semibold h-9 px-4 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transition-all shadow-md shadow-[#ef4444]/10 disabled:opacity-50">
                {submitting ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {deleteModalOpen && (
        <ModalShell title="Confirmer la suppression" onClose={() => setDeleteModalOpen(false)}>
          <p className="text-sm text-gray-400 mb-6">
            Voulez-vous vraiment supprimer le commissariat <span className="text-white font-semibold">{selectedCommissariat?.nom}</span> ? Cette action est irréversible.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteModalOpen(false)} className="text-xs font-medium h-9 px-4 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-300 hover:text-white hover:border-[#1f2937] transition-all">
              Annuler
            </button>
            <button onClick={handleDelete} disabled={submitting} className="text-xs font-semibold h-9 px-4 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transition-all shadow-md shadow-[#ef4444]/10 disabled:opacity-50">
              {submitting ? "Suppression..." : "Supprimer"}
            </button>
          </div>
        </ModalShell>
      )}

      {rejectModalOpen && (
        <ModalShell title="Rejeter la demande" onClose={() => setRejectModalOpen(false)}>
          <p className="text-sm text-gray-400 mb-4">Veuillez indiquer le motif du rejet.</p>
          <textarea
            value={rejectMotif}
            onChange={(e) => setRejectMotif(e.target.value)}
            rows={4}
            className={textareaClass}
            placeholder="Motif du rejet..."
          />
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setRejectModalOpen(false)} className="text-xs font-medium h-9 px-4 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-300 hover:text-white hover:border-[#1f2937] transition-all">
              Annuler
            </button>
            <button onClick={handleDemandeReject} disabled={submitting || !rejectMotif.trim()} className="text-xs font-semibold h-9 px-4 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transition-all shadow-md shadow-[#ef4444]/10 disabled:opacity-50">
              {submitting ? "Rejet..." : "Confirmer le rejet"}
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}