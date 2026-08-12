"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ChevronLeft, AlertCircle, PlusCircle, Trash2, Power, PowerOff, X, ShieldCheck, Phone, Mail } from "lucide-react";

interface SuperAdmin {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  roles: string[];
  actif: boolean;
  createdAt: string;
}

interface SuperAdminForm {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  password: string;
}

const emptyForm: SuperAdminForm = {
  nom: "",
  prenom: "",
  email: "",
  telephone: "",
  password: "",
};

const inputClass = "w-full h-10 text-sm rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all px-3";
const btnGhost = "text-xs font-medium h-9 px-4 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-300 hover:text-white hover:border-[#1f2937] transition-all";
const btnPrimary = "text-xs font-semibold h-9 px-4 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transition-all shadow-md shadow-[#ef4444]/10 disabled:opacity-50";
const btnDanger = "text-xs font-semibold h-9 px-4 rounded-lg bg-gradient-to-r from-red-500 to-red-700 text-white hover:from-red-600 hover:to-red-800 transition-all shadow-md shadow-red-500/10 disabled:opacity-50";
const btnRowGhost = "inline-flex items-center gap-1 text-[10px] font-semibold h-8 px-3 rounded-lg border border-[#1f2937]/80 text-gray-400 hover:text-white hover:border-[#1f2937] hover:bg-white/5 transition-all";
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

export default function SuperAdminsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [selectedAdmin, setSelectedAdmin] = useState<SuperAdmin | null>(null);
  const [form, setForm] = useState<SuperAdminForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !user.roles.includes("ROLE_FONDATEUR"))) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const fetchSuperAdmins = useCallback(async () => {
    try {
      setError("");
      const res = await api.get("/api/fondateur/super-admins");
      setSuperAdmins(res.data.data || []);
    } catch {
      setError("Erreur lors du chargement des super administrateurs.");
    }
  }, []);

  useEffect(() => {
    if (user && user.roles.includes("ROLE_FONDATEUR")) {
      setLoading(true);
      fetchSuperAdmins().finally(() => setLoading(false));
    }
  }, [user, fetchSuperAdmins]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const openCreateModal = () => {
    setForm(emptyForm);
    setError("");
    setCreateModalOpen(true);
  };

  const openDeleteModal = (admin: SuperAdmin) => {
    setSelectedAdmin(admin);
    setError("");
    setDeleteModalOpen(true);
  };

  const handleCreate = async () => {
    setSubmitting(true);
    setError("");
    try {
      await api.post("/api/fondateur/super-admins", form);
      setCreateModalOpen(false);
      await fetchSuperAdmins();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || "Erreur lors de la création.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAdmin) return;
    setSubmitting(true);
    setError("");
    try {
      await api.delete(`/api/fondateur/super-admins/${selectedAdmin.id}`);
      setDeleteModalOpen(false);
      setSelectedAdmin(null);
      await fetchSuperAdmins();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || "Erreur lors de la suppression.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (admin: SuperAdmin) => {
    setError("");
    try {
      if (admin.actif) {
        await api.patch(`/api/fondateur/super-admins/${admin.id}/desactiver`);
      } else {
        await api.patch(`/api/fondateur/super-admins/${admin.id}/reactiver`);
      }
      await fetchSuperAdmins();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || "Erreur lors du changement de statut.");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
        <div className="h-8 bg-[#1f2937] rounded w-64 animate-pulse" />
        <div className="h-4 bg-[#1f2937] rounded w-80 animate-pulse" />
        <div className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 p-6 space-y-3 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-[#1f2937] rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!user || !user.roles.includes("ROLE_FONDATEUR")) return null;

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-3 animate-fade-in">
        <Link href="/admin" className="w-8 h-8 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 flex items-center justify-center hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 transition-all">
          <ChevronLeft className="h-4 w-4 text-gray-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white tracking-tight">Super Administrateurs</h1>
          <p className="text-sm text-gray-500">Gestion des super administrateurs</p>
        </div>
        <button onClick={openCreateModal} className="inline-flex items-center gap-1.5 text-xs font-semibold h-9 px-4 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transition-all shadow-md shadow-[#ef4444]/10">
          <PlusCircle className="h-3.5 w-3.5" />
          Ajouter un super admin
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm animate-fade-in">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {superAdmins.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40">
          <ShieldCheck className="h-12 w-12 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucun super administrateur n&apos;a été trouvé.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm overflow-hidden animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f2937]/50 bg-[#0b0f17]/50">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Nom</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Téléphone</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Statut</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Date création</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {superAdmins.map((admin) => (
                  <tr key={admin.id} className="border-b border-[#1f2937]/30 last:border-b-0 hover:bg-white/[0.03] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar prenom={admin.prenom} nom={admin.nom} />
                        <p className="font-semibold text-white">{admin.prenom} {admin.nom}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-gray-600" />
                        {admin.email}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-gray-600" />
                        {admin.telephone}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide border ${
                        admin.actif ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        {admin.actif ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{formatDate(admin.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleActive(admin)}
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold h-8 px-3 rounded-lg border transition-all ${
                            admin.actif
                              ? "border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50"
                              : "border-green-500/30 text-green-400 hover:bg-green-500/10 hover:border-green-500/50"
                          }`}
                        >
                          {admin.actif ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                          {admin.actif ? "Désactiver" : "Réactiver"}
                        </button>
                        {admin.id !== user?.id && (
                          <button className={btnRowDanger} onClick={() => openDeleteModal(admin)}>
                            <Trash2 className="h-3 w-3" />
                            Supprimer
                          </button>
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

      {createModalOpen && (
        <ModalShell title="Ajouter un super administrateur" onClose={() => setCreateModalOpen(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nom *</label>
                <input className={inputClass} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Nom" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Prénom *</label>
                <input className={inputClass} value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} placeholder="Prénom" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email *</label>
              <input className={inputClass} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemple.com" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Téléphone *</label>
              <input className={inputClass} value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="+225 00 00 00 00" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Mot de passe *</label>
              <input className={inputClass} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mot de passe" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button className={btnGhost} onClick={() => setCreateModalOpen(false)}>Annuler</button>
              <button className={btnPrimary} disabled={submitting || !form.nom || !form.prenom || !form.email || !form.telephone || !form.password} onClick={handleCreate}>
                {submitting ? "Création..." : "Créer"}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {deleteModalOpen && selectedAdmin && (
        <ModalShell title="Confirmer la suppression" onClose={() => setDeleteModalOpen(false)}>
          <p className="text-sm text-gray-400 mb-6">
            Voulez-vous vraiment supprimer le super administrateur <span className="text-white font-semibold">{selectedAdmin.prenom} {selectedAdmin.nom}</span> ? Cette action est irréversible.
          </p>
          <div className="flex justify-end gap-3">
            <button className={btnGhost} onClick={() => setDeleteModalOpen(false)}>Annuler</button>
            <button className={btnDanger} disabled={submitting} onClick={handleDelete}>{submitting ? "Suppression..." : "Supprimer"}</button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
