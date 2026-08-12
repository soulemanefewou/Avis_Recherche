"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ChevronLeft, Search, AlertCircle, Pencil, Shield, Power, PowerOff, X, Users } from "lucide-react";

interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  roles: string[];
  actif: boolean;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
}

const ALL_ROLES = ["ROLE_USER", "ROLE_SUPER_ADMIN", "ROLE_COMMISSARIAT", "ROLE_FONDATEUR"];

const ROLE_STYLES: Record<string, string> = {
  ROLE_FONDATEUR: "bg-red-500/10 text-red-400 border-red-500/20",
  ROLE_SUPER_ADMIN: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ROLE_COMMISSARIAT: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  ROLE_USER: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const roleBadgeClass = (role: string) => ROLE_STYLES[role] || "bg-gray-500/10 text-gray-400 border-gray-500/20";

const inputClass = "w-full h-10 text-sm rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all px-3";
const selectClass = "w-full h-10 text-sm rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-white appearance-none focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all px-3 pr-9 cursor-pointer";
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

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Utilisateur | null>(null);
  const [editForm, setEditForm] = useState({ nom: "", prenom: "", email: "", telephone: "" });
  const [editLoading, setEditLoading] = useState(false);

  const [rolesModalOpen, setRolesModalOpen] = useState(false);
  const [rolesUser, setRolesUser] = useState<Utilisateur | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [rolesLoading, setRolesLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !user.roles.includes("ROLE_FONDATEUR"))) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const fetchUsers = useCallback(async (page: number, searchTerm: string, role: string) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (searchTerm) params.set("search", searchTerm);
      if (role) params.set("role", role);
      const res = await api.get(`/api/fondateur/utilisateurs?${params.toString()}`);
      setUsers(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, limit: 20, total: 0 });
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || "Erreur lors du chargement des utilisateurs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.roles.includes("ROLE_FONDATEUR")) {
      fetchUsers(1, search, roleFilter);
    }
  }, [user, fetchUsers, search, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleRoleFilter = (value: string) => {
    setRoleFilter(value);
  };

  const goToPage = (page: number) => {
    fetchUsers(page, search, roleFilter);
  };

  const openEditModal = (u: Utilisateur) => {
    setEditingUser(u);
    setEditForm({ nom: u.nom, prenom: u.prenom, email: u.email, telephone: u.telephone });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditLoading(true);
    setError("");
    try {
      await api.put(`/api/fondateur/utilisateurs/${editingUser.id}`, editForm);
      setEditModalOpen(false);
      setEditingUser(null);
      await fetchUsers(pagination.page, search, roleFilter);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || "Erreur lors de la mise à jour.");
    } finally {
      setEditLoading(false);
    }
  };

  const openRolesModal = (u: Utilisateur) => {
    setRolesUser(u);
    setSelectedRole(u.roles[0] || "ROLE_USER");
    setRolesModalOpen(true);
  };

  const handleRolesSubmit = async () => {
    if (!rolesUser) return;
    setRolesLoading(true);
    setError("");
    try {
      await api.patch(`/api/fondateur/utilisateurs/${rolesUser.id}/roles`, {
        roles: [selectedRole],
      });
      setRolesModalOpen(false);
      setRolesUser(null);
      await fetchUsers(pagination.page, search, roleFilter);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || "Erreur lors de la mise à jour des rôles.");
    } finally {
      setRolesLoading(false);
    }
  };

  const handleToggleActive = async (u: Utilisateur) => {
    setError("");
    try {
      const endpoint = u.actif
        ? `/api/fondateur/utilisateurs/${u.id}/desactiver`
        : `/api/fondateur/utilisateurs/${u.id}/reactiver`;
      await api.patch(endpoint);
      await fetchUsers(pagination.page, search, roleFilter);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || "Erreur lors du changement de statut.");
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (authLoading || (loading && users.length === 0)) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
        <div className="h-8 bg-[#1f2937] rounded w-64 animate-pulse" />
        <div className="h-4 bg-[#1f2937] rounded w-80 animate-pulse" />
        <div className="flex gap-3">
          <div className="h-10 bg-[#1f2937] rounded-lg flex-1 max-w-xs animate-pulse" />
          <div className="h-10 bg-[#1f2937] rounded-lg w-48 animate-pulse" />
        </div>
        <div className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 p-6 space-y-3 animate-pulse">
          {[...Array(6)].map((_, i) => (
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
          <h1 className="text-xl font-bold text-white tracking-tight">Gestion des utilisateurs</h1>
          <p className="text-sm text-gray-500">Administration — rôles et statuts</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm animate-fade-in">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 animate-fade-in" style={{ animationDelay: "60ms", animationFillMode: "both" }}>
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
            <input
              type="text"
              className={`${inputClass} pl-9`}
              placeholder="Rechercher par nom ou email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className={btnPrimary}>Rechercher</button>
        </form>
        <select
          className={`${selectClass} w-full sm:w-56`}
          value={roleFilter}
          onChange={(e) => handleRoleFilter(e.target.value)}
        >
          <option value="" className="bg-[#0e1420] text-white">Tous</option>
          {ALL_ROLES.map((r) => (
            <option key={r} value={r} className="bg-[#0e1420] text-white">{r}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 p-6 space-y-3 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-[#1f2937] rounded" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40">
          <Users className="h-12 w-12 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucun utilisateur trouvé.</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm overflow-hidden animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1f2937]/50 bg-[#0b0f17]/50">
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Nom</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Email</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Téléphone</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Rôles</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Statut</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Date création</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-[#1f2937]/30 last:border-b-0 hover:bg-white/[0.03] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar prenom={u.prenom} nom={u.nom} />
                          <p className="font-semibold text-white">{u.prenom} {u.nom}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">{u.email}</td>
                      <td className="px-5 py-3.5 text-gray-500">{u.telephone}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((role) => (
                            <span key={role} className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide border ${roleBadgeClass(role)}`}>
                              {role.replace("ROLE_", "")}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide border ${
                          u.actif ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}>
                          {u.actif ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">{formatDate(u.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button className={btnRowGhost} onClick={() => openEditModal(u)}>
                            <Pencil className="h-3 w-3" />
                            Modifier
                          </button>
                          <button className={btnRowGhost} onClick={() => openRolesModal(u)}>
                            <Shield className="h-3 w-3" />
                            Rôles
                          </button>
                          {u.actif && u.id !== user.id && (
                            <button className={btnRowDanger} onClick={() => handleToggleActive(u)}>
                              <PowerOff className="h-3 w-3" />
                              Désactiver
                            </button>
                          )}
                          {!u.actif && (
                            <button className={btnRowSuccess} onClick={() => handleToggleActive(u)}>
                              <Power className="h-3 w-3" />
                              Réactiver
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

          <div className="flex items-center justify-between animate-fade-in">
            <p className="text-sm text-gray-500">
              Page {pagination.page} sur {totalPages} ({pagination.total} utilisateurs)
            </p>
            <div className="flex gap-2">
              <button className={btnGhost} disabled={pagination.page <= 1} onClick={() => goToPage(pagination.page - 1)}>Précédent</button>
              <button className={btnGhost} disabled={pagination.page >= totalPages} onClick={() => goToPage(pagination.page + 1)}>Suivant</button>
            </div>
          </div>
        </>
      )}

      {editModalOpen && editingUser && (
        <ModalShell title="Modifier l'utilisateur" onClose={() => setEditModalOpen(false)}>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nom *</label>
              <input className={inputClass} value={editForm.nom} onChange={(e) => setEditForm((prev) => ({ ...prev, nom: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Prénom *</label>
              <input className={inputClass} value={editForm.prenom} onChange={(e) => setEditForm((prev) => ({ ...prev, prenom: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email *</label>
              <input className={inputClass} type="email" value={editForm.email} onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Téléphone *</label>
              <input className={inputClass} value={editForm.telephone} onChange={(e) => setEditForm((prev) => ({ ...prev, telephone: e.target.value }))} required />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className={btnGhost} onClick={() => setEditModalOpen(false)}>Annuler</button>
              <button type="submit" className={btnPrimary} disabled={editLoading}>{editLoading ? "Enregistrement..." : "Enregistrer"}</button>
            </div>
          </form>
        </ModalShell>
      )}

      {rolesModalOpen && rolesUser && (
        <ModalShell title="Changer les rôles" onClose={() => setRolesModalOpen(false)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Choisir le rôle unique de <span className="text-white font-semibold">{rolesUser.prenom} {rolesUser.nom}</span>
            </p>
            <div className="space-y-2">
              {ALL_ROLES.map((role) => (
                <label key={role} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedRole === role ? "border-[#ef4444]/40 bg-[#ef4444]/5" : "border-[#1f2937]/80 bg-[#0b0f17]/50 hover:border-[#1f2937]"
                }`}>
                  <input
                    type="radio"
                    name="role"
                    checked={selectedRole === role}
                    onChange={() => setSelectedRole(role)}
                    className="h-4 w-4 accent-[#ef4444]"
                  />
                  <span className={`text-sm ${selectedRole === role ? "text-white font-semibold" : "text-gray-400"}`}>{role.replace("ROLE_", "")}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button className={btnGhost} onClick={() => setRolesModalOpen(false)}>Annuler</button>
              <button className={btnPrimary} disabled={rolesLoading} onClick={handleRolesSubmit}>{rolesLoading ? "Enregistrement..." : "Enregistrer"}</button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
