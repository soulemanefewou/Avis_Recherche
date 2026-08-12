"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { AvisStatutBadge } from "@/components/ui/Badge";
import AvisShareButtons from "@/components/AvisShareButtons";
import { ChevronLeft, ChevronDown, Clock, MapPin, Phone, Calendar, Ruler, Weight, User, FileText, AlertTriangle, Eye, EyeOff, Trash2, Save, CheckCircle2, AlertCircle, X } from "lucide-react";

interface AvisPhoto {
  id: number;
  chemin: string;
  url: string;
  estPrincipale: boolean;
  nomOriginal: string;
}

interface AvisDetail {
  id: number;
  nom: string;
  prenom: string;
  sexe: string;
  ageApprox: number;
  description: string;
  circonstances: string;
  tenueVestimentaire: string;
  signesParticuliers: string;
  taille: number;
  poids: number;
  telephone: string;
  dernierLieuVu: string;
  dateDisparition: string;
  statut: string;
  actif: boolean;
  type: string;
  createdAt: string;
  updatedAt: string;
  region: { id: number; nom: string } | null;
  ville: { id: number; nom: string } | null;
  photos: AvisPhoto[];
  signalementsCount: number;
}

interface Signalement {
  id: number;
  description: string;
  lieu: string;
  dateObservation: string;
  telephoneContact: string;
  statut: string;
  createdAt: string;
  utilisateur: { id: number; nom: string; prenom: string };
}

const statutOptions = [
  { value: "RECHERCHE", label: "Recherché" },
  { value: "RETROUVE_VIVANT", label: "Retrouvé vivant" },
  { value: "RETROUVE_DECEDE", label: "Retrouvé décédé" },
  { value: "RECHERCHE_CLOTUREE", label: "Clôturé" },
];

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-gray-200">{value}</p>
      </div>
    </div>
  );
}

export default function CommissariatAvisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [avis, setAvis] = useState<AvisDetail | null>(null);
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [newStatut, setNewStatut] = useState("");
  const [updatingStatut, setUpdatingStatut] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  useEffect(() => {
    if (!authLoading && (!user || !user.roles.includes("ROLE_COMMISSARIAT"))) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const fetchAvis = useCallback(async () => {
    try {
      const res = await api.get(`/api/commissariat/avis/${params.id}`);
      setAvis(res.data.data || res.data);
    } catch {
      setError("Avis non trouvé.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const fetchSignalements = useCallback(async () => {
    try {
      const res = await api.get(`/api/commissariat/avis/${params.id}/signalements`);
      setSignalements(res.data.data || res.data || []);
    } catch {
      /* ignore */
    }
  }, [params.id]);

  useEffect(() => {
    if (user && user.roles.includes("ROLE_COMMISSARIAT")) {
      fetchAvis();
      fetchSignalements();
    }
  }, [user, fetchAvis, fetchSignalements]);

  useEffect(() => {
    if (avis) setNewStatut(avis.statut);
  }, [avis]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    });

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

  const handleStatutChange = async () => {
    if (!avis || newStatut === avis.statut) return;
    setUpdatingStatut(true);
    setError("");
    setSuccess("");
    try {
      await api.patch(`/api/commissariat/avis/${avis.id}/statut`, { statut: newStatut });
      setSuccess("Statut mis à jour avec succès !");
      fetchAvis();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || "Erreur lors de la mise à jour du statut.");
    } finally {
      setUpdatingStatut(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      await api.delete(`/api/commissariat/avis/${avis?.id}`);
      router.push("/commissariat/avis");
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || "Erreur lors de la suppression.");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleToggleMasquer = async (signalementId: number, currentStatut: string) => {
    try {
      const endpoint = currentStatut === "MASQUE"
        ? `/api/commissariat/signalements/${signalementId}/demasquer`
        : `/api/commissariat/signalements/${signalementId}/masquer`;
      await api.patch(endpoint);
      fetchSignalements();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || "Erreur lors de l'action.");
    }
  };

  if (authLoading) {
    return (
        <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
          <div className="h-8 bg-[#1f2937] rounded w-56 animate-pulse" />
          <div className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 h-64 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <div className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 p-6 space-y-3 animate-pulse">
                <div className="h-4 bg-[#1f2937] rounded w-24" />
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(6)].map((_, i) => <div key={i} className="h-3 bg-[#1f2937] rounded" />)}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 p-6 space-y-4 animate-pulse">
                <div className="h-4 bg-[#1f2937] rounded w-20" />
                <div className="h-10 bg-[#1f2937] rounded" />
                <div className="h-9 bg-[#1f2937] rounded" />
              </div>
            </div>
          </div>
        </div>
    );
  }

  if (!user || !user.roles.includes("ROLE_COMMISSARIAT")) return null;

  if (!avis) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="flex flex-col items-center justify-center text-center border border-[#1f2937]/50 bg-[#0e1420]/40 rounded-xl py-16">
          <AlertCircle className="h-10 w-10 text-gray-600 mb-3" />
          <p className="text-sm text-gray-400">{error || "Cet avis n'existe pas ou a été supprimé."}</p>
          <Link href="/commissariat/avis" className="mt-4 text-xs font-medium h-9 px-4 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-300 hover:text-white transition-all inline-flex items-center">Retour</Link>
        </div>
      </div>
    );
  }

  const photos = avis.photos || [];
  const activePhoto = photos[activePhotoIdx];

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-3 animate-fade-in">
        <Link href="/commissariat/avis" className="w-8 h-8 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 flex items-center justify-center hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 transition-all">
          <ChevronLeft className="h-4 w-4 text-gray-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-xl font-bold text-white tracking-tight">{avis.prenom} {avis.nom}</h1>
            <AvisStatutBadge statut={avis.statut} />
          </div>
          <p className="text-sm text-gray-500">
            {avis.sexe === "HOMME" ? "Homme" : "Femme"} &middot; {avis.ageApprox} ans
            {avis.type === "OFFICIEL" && (
              <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide bg-amber-500/20 text-amber-400 border border-amber-500/30">Officiel</span>
            )}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm animate-fade-in">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2.5 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl text-sm animate-fade-in">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {photos.length > 0 ? (
        <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm overflow-hidden animate-fade-in">
          <div className="mx-auto max-w-4xl aspect-[139/95] max-h-[85vh] bg-[#0b0f17] relative">
            <img src={activePhoto.url} alt={`${avis.prenom} ${avis.nom}`} className="w-full h-full object-cover" />
          </div>
          {photos.length > 1 && (
            <div className="flex gap-2 p-3 border-t border-[#1f2937]/50 bg-[#0b0f17]/60 overflow-x-auto">
              {photos.map((photo, idx) => (
                <button
                  key={photo.id}
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 shrink-0 transition-all duration-200 ${
                    idx === activePhotoIdx ? "border-[#ef4444] shadow-sm shadow-[#ef4444]/20" : "border-[#1f2937]/80 hover:border-[#374151]"
                  }`}
                >
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 p-10 text-center animate-fade-in">
          <p className="text-sm text-gray-500">Aucune photo</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">

          <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-6 animate-fade-in" style={{ animationDelay: "80ms", animationFillMode: "both" }}>
            <h2 className="text-sm font-bold text-white tracking-tight mb-5 flex items-center gap-2">
              <User className="h-4 w-4 text-[#ef4444]" />
              Informations
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={Phone} label="Téléphone" value={avis.telephone} />
              <InfoRow icon={MapPin} label="Dernier lieu vu" value={avis.dernierLieuVu} />
              <InfoRow icon={Calendar} label="Date de disparition" value={formatDate(avis.dateDisparition)} />
              <InfoRow icon={Clock} label="Créé le" value={formatDateTime(avis.createdAt)} />
              {avis.region && <InfoRow icon={MapPin} label="Région" value={avis.region.nom} />}
              {avis.ville && <InfoRow icon={MapPin} label="Ville" value={avis.ville.nom} />}
              <InfoRow icon={Clock} label="Mis à jour le" value={formatDateTime(avis.updatedAt)} />
            </div>
          </div>

          <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-6 animate-fade-in" style={{ animationDelay: "120ms", animationFillMode: "both" }}>
            <h2 className="text-sm font-bold text-white tracking-tight mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#ef4444]" />
              Description
            </h2>
            <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{avis.description}</p>
          </div>

          {avis.circonstances && (
            <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-6 animate-fade-in" style={{ animationDelay: "140ms", animationFillMode: "both" }}>
              <h2 className="text-sm font-bold text-white tracking-tight mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#ef4444]" />
                Circonstances
              </h2>
              <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{avis.circonstances}</p>
            </div>
          )}

          {(avis.tenueVestimentaire || avis.signesParticuliers || avis.taille || avis.poids) && (
            <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-6 animate-fade-in" style={{ animationDelay: "160ms", animationFillMode: "both" }}>
              <h2 className="text-sm font-bold text-white tracking-tight mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#ef4444]" />
                Détails complémentaires
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {avis.tenueVestimentaire && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Tenue vestimentaire</p>
                    <p className="text-sm text-gray-300">{avis.tenueVestimentaire}</p>
                  </div>
                )}
                {avis.signesParticuliers && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Signes particuliers</p>
                    <p className="text-sm text-gray-300">{avis.signesParticuliers}</p>
                  </div>
                )}
                {avis.taille && <InfoRow icon={Ruler} label="Taille" value={`${avis.taille} m`} />}
                {avis.poids && <InfoRow icon={Weight} label="Poids" value={`${avis.poids} kg`} />}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-5 animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
            <h2 className="text-xs font-bold text-white tracking-tight mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#ef4444] rounded-full inline-block" />
              Modifier le statut
            </h2>
            <div className="relative mb-3">
              <select
                value={newStatut}
                onChange={(e) => setNewStatut(e.target.value)}
                className="w-full h-10 text-sm rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-white appearance-none focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all px-3 pr-9 cursor-pointer"
              >
                {statutOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#0e1420] text-white">{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
            <button
              onClick={handleStatutChange}
              disabled={newStatut === avis.statut || updatingStatut}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold h-9 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transition-all duration-200 shadow-md shadow-[#ef4444]/10 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {updatingStatut ? "Mise à jour..." : "Mettre à jour"}
            </button>
          </div>

          <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-5 animate-fade-in" style={{ animationDelay: "140ms", animationFillMode: "both" }}>
            <h2 className="text-xs font-bold text-white tracking-tight mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#ef4444] rounded-full inline-block" />
              Actions rapides
            </h2>
            <div className="space-y-2">
              <Link href={`/commissariat/avis/${avis.id}/edit`} className="flex items-center justify-center gap-1.5 text-xs font-medium h-9 rounded-lg border border-[#1f2937]/80 text-gray-300 hover:text-white hover:bg-white/5 hover:border-[#1f2937] transition-all duration-200">
                Modifier l&apos;avis
              </Link>
              <Link href={`/commissariat/avis/${avis.id}/photos`} className="flex items-center justify-center gap-1.5 text-xs font-medium h-9 rounded-lg border border-[#1f2937]/80 text-gray-300 hover:text-white hover:bg-white/5 hover:border-[#1f2937] transition-all duration-200">
                Gérer les photos
              </Link>
              <div className="pt-3 border-t border-[#1f2937]/60">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Partager cet avis</p>
                <AvisShareButtons
                  id={avis.id}
                  prenom={avis.prenom}
                  nom={avis.nom}
                  ageApprox={avis.ageApprox}
                  dateDisparition={avis.dateDisparition}
                  dernierLieuVu={avis.dernierLieuVu}
                  telephone={avis.telephone}
                  photoUrl={photos.find((p) => p.estPrincipale)?.url || photos[0]?.url}
                  description={avis.description}
                  villeNom={avis.ville?.nom}
                  regionNom={avis.region?.nom}
                />
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-medium h-9 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-200"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer l&apos;avis
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-5 animate-fade-in" style={{ animationDelay: "180ms", animationFillMode: "both" }}>
            <h2 className="text-xs font-bold text-white tracking-tight mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#ef4444] rounded-full inline-block" />
              Signalements ({signalements.length})
            </h2>
            {signalements.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Aucun signalement</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {signalements.map((s) => (
                  <div key={s.id} className="rounded-lg border border-[#1f2937]/50 bg-[#0b0f17]/60 p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-xs font-medium text-gray-300">{s.utilisateur?.prenom} {s.utilisateur?.nom}</p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide shrink-0 ${
                        s.statut === "MASQUE" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-green-500/10 text-green-400 border border-green-500/20"
                      }`}>
                        {s.statut === "MASQUE" ? "Masqué" : "Visible"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{s.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-gray-600">
                      <span>{s.lieu} &middot; {formatDate(s.dateObservation)}</span>
                      <button
                        onClick={() => handleToggleMasquer(s.id, s.statut)}
                        className="flex items-center gap-1 text-gray-500 hover:text-white transition-colors"
                      >
                        {s.statut === "MASQUE" ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {s.statut === "MASQUE" ? "Démasquer" : "Masquer"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-xl border border-[#1f2937]/80 bg-[#0e1420] shadow-2xl shadow-black/40 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[#1f2937]/50">
              <h2 className="text-base font-bold text-white tracking-tight">Confirmer la suppression</h2>
              <button onClick={() => setShowDeleteModal(false)} className="w-7 h-7 rounded-lg border border-[#1f2937]/80 flex items-center justify-center hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 transition-all">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-400 mb-6">Êtes-vous sûr de vouloir supprimer cet avis de recherche ? Cette action est irréversible.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="text-xs font-medium h-9 px-4 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-300 hover:text-white hover:border-[#1f2937] transition-all">
                  Annuler
                </button>
                <button onClick={handleDelete} disabled={deleting} className="text-xs font-semibold h-9 px-4 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transition-all shadow-md shadow-[#ef4444]/10 disabled:opacity-50">
                  {deleting ? "Suppression..." : "Supprimer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}