"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { AvisRecherche } from "@/lib/types";
import { ChevronLeft, Trash2, Upload, Image as ImageIcon, AlertCircle, CheckCircle2, Star, X } from "lucide-react";

export default function ManagePhotosPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: isLoading } = useAuth();

  const [avis, setAvis] = useState<AvisRecherche | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const fetchAvis = useCallback(async () => {
    try {
      const response = await api.get(`/api/avis-recherches/${params.id}`);
      setAvis(response.data.data || response.data);
    } catch {
      setError("Impossible de charger cet avis de recherche.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }
    fetchAvis();
  }, [user, isLoading, fetchAvis, router]);

  const isOwner = user && avis && (
    (avis.type === 'CITOYEN' && user.id === avis.auteur?.id) ||
    (avis.type === 'OFFICIEL' && user.roles?.includes('ROLE_COMMISSARIAT'))
  );

  const MAX_PHOTOS = 5;
  const photoCount = avis?.photos?.length || 0;
  const atLimit = photoCount >= MAX_PHOTOS;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const remaining = MAX_PHOTOS - photoCount;
      const toUpload = Array.from(files).slice(0, remaining);

      if (files.length > remaining) {
        setError(`Vous ne pouvez ajouter que ${remaining} photo(s) de plus.`);
      }

      let uploaded = 0;
      for (const file of toUpload) {
        const formData = new FormData();
        formData.append("photo", file);
        await api.post(`/api/avis-recherches/${params.id}/photos`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploaded++;
      }

      if (uploaded > 0) {
        setSuccess(`${uploaded} photo(s) ajoutée(s) avec succès !`);
      }
      fetchAvis();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || "Erreur lors du téléversement de l'image.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setError("");
    setSuccess("");
    try {
      await api.delete(`/api/photos/${deleteTarget}`);
      setSuccess("Photo supprimée avec succès.");
      setDeleteTarget(null);
      fetchAvis();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || "Impossible de supprimer cette photo.");
      setDeleteTarget(null);
    }
  };

  const handleSetPrimary = async (photoId: number) => {
    setError("");
    setSuccess("");
    try {
      await api.patch(`/api/photos/${photoId}/principale`);
      setSuccess("Photo principale mise à jour.");
      fetchAvis();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || "Impossible de modifier la photo principale.");
    }
  };

  if (isLoading || loading) {
    return (
      <div className="mx-auto px-8 py-8 space-y-8 max-w-[1800px]">
        <div className="h-8 bg-[#1f2937] rounded w-48 animate-pulse" />
        <div className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 p-8 space-y-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-[#1f2937] rounded w-32" />
            <div className="h-6 bg-[#1f2937] rounded w-16" />
          </div>
          <div className="h-48 bg-[#1f2937] rounded-xl" />
        </div>
        <div className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 p-8 space-y-4 animate-pulse">
          <div className="h-4 bg-[#1f2937] rounded w-24" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => <div key={i} className="aspect-[2/3] bg-[#1f2937] rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!avis) {
    return (
      <div className="mx-auto px-8 py-8 max-w-[1800px]">
        <div className="flex flex-col items-center justify-center text-center border border-[#1f2937]/50 bg-[#0e1420]/40 rounded-xl py-16">
          <AlertCircle className="h-10 w-10 text-gray-600 mb-3" />
          <p className="text-sm text-gray-400">Avis non trouvé.</p>
          <Link href="/" className="mt-4 text-xs font-medium h-9 px-4 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-300 hover:text-white transition-all inline-flex items-center">Retour</Link>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="mx-auto px-8 py-8 max-w-[1800px]">
        <div className="flex flex-col items-center justify-center text-center border border-[#1f2937]/50 bg-[#0e1420]/40 rounded-xl py-16">
          <AlertCircle className="h-10 w-10 text-[#ef4444] mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">Accès non autorisé</h2>
          <p className="text-sm text-gray-400 mb-6">Vous devez être le créateur de cet avis pour gérer ses photos.</p>
          <button onClick={() => router.push(`/avis/${params.id}`)} className="text-xs font-medium h-9 px-4 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-300 hover:text-white transition-all">
            Retourner à l&apos;avis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-8 py-8 space-y-8 max-w-[1800px]">
      <div className="flex items-center gap-3 animate-fade-in">
        <Link href={`/avis/${params.id}`} className="w-8 h-8 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 flex items-center justify-center hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 transition-all">
          <ChevronLeft className="h-4 w-4 text-gray-400" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Gérer les photos</h1>
          <p className="text-sm text-gray-500">Ajoutez des photos récentes ou changez l&apos;image principale</p>
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

      <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-8 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Upload className="h-4 w-4 text-[#ef4444]" />
            Téléverser des photos
          </h2>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide ${atLimit ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"}`}>
            {photoCount} / {MAX_PHOTOS}
          </span>
        </div>
        <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-14 text-center transition-all ${
          atLimit
            ? "border-[#1f2937]/50 bg-[#0b0f17]/30 cursor-not-allowed opacity-50"
            : uploading
              ? "border-[#ef4444]/30 bg-[#ef4444]/5 cursor-wait"
              : "border-[#1f2937]/50 bg-[#0b0f17]/30 hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 cursor-pointer"
        }`}>
          <div className="p-4 bg-[#ef4444]/10 rounded-full mb-3">
            <Upload className="h-7 w-7 text-[#ef4444]" />
          </div>
          <p className="font-semibold text-base text-gray-300">
            {atLimit ? "Nombre maximum de photos atteint" : uploading ? "Téléversement en cours..." : "Cliquez pour choisir des fichiers image"}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {atLimit ? "Supprimez une photo pour en ajouter une autre" : "PNG, JPG ou WEBP — jusqu'à 5 Mo par photo"}
          </p>
          {!atLimit && (
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading} onChange={handleUpload} className="hidden" />
          )}
        </label>
      </div>

      <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-8 animate-fade-in" style={{ animationDelay: "80ms", animationFillMode: "both" }}>
        <h2 className="text-sm font-bold text-white tracking-tight mb-5 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-[#ef4444]" />
          Photos actuelles
        </h2>
        {avis.photos && avis.photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {avis.photos.map((photo) => (
              <div key={photo.id} className={`relative rounded-xl border overflow-hidden bg-[#0b0f17]/60 group ${photo.estPrincipale ? "border-[#ef4444]/50 ring-1 ring-[#ef4444]/20" : "border-[#1f2937]/50"}`}>
                <div className="aspect-[2/3] relative overflow-hidden bg-[#0b0f17]">
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  {photo.estPrincipale && (
                    <span className="absolute top-2 left-2 bg-[#ef4444] text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-sm z-10 flex items-center gap-1">
                      <Star className="h-2.5 w-2.5 fill-white" />
                      Principale
                    </span>
                  )}
                  <div className="absolute inset-0 bg-[#0b0f17]/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                    {!photo.estPrincipale && (
                      <button onClick={() => handleSetPrimary(photo.id)} className="w-full max-w-[130px] bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold py-1.5 px-2 rounded-lg transition-all backdrop-blur-sm">
                        Définir principale
                      </button>
                    )}
                    <button onClick={() => setDeleteTarget(photo.id)} className="w-full max-w-[130px] bg-[#ef4444]/80 hover:bg-[#ef4444] text-white text-[11px] font-bold py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1">
                      <Trash2 className="h-3 w-3" />
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-[#0b0f17]/30 rounded-xl border border-[#1f2937]/50">
            <ImageIcon className="h-12 w-12 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Aucune photo pour le moment.</p>
          </div>
        )}
      </div>

      {deleteTarget !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-xl border border-[#1f2937]/80 bg-[#0e1420] shadow-2xl shadow-black/40 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[#1f2937]/50">
              <h2 className="text-base font-bold text-white tracking-tight">Confirmer la suppression</h2>
              <button onClick={() => setDeleteTarget(null)} className="w-7 h-7 rounded-lg border border-[#1f2937]/80 flex items-center justify-center hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 transition-all">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-400 mb-6">Voulez-vous vraiment supprimer cette photo ?</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteTarget(null)} className="text-xs font-medium h-9 px-4 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-300 hover:text-white hover:border-[#1f2937] transition-all">
                  Annuler
                </button>
                <button onClick={handleDelete} className="text-xs font-semibold h-9 px-4 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transition-all shadow-md shadow-[#ef4444]/10">
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}