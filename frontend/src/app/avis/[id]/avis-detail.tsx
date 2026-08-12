'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { AvisRecherche, Signalement, Photo } from '@/lib/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import Badge, { AvisStatutBadge, AvisTypeBadge } from '@/components/ui/Badge';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AvisShareButtons from '@/components/AvisShareButtons';
import { MapPin, Calendar, Phone, Camera, User, AlertTriangle, ImageIcon, Clock, Eye, EyeOff, MessageCircle, X } from 'lucide-react';

export default function AvisDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [avis, setAvis] = useState<AvisRecherche | null>(null);
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const [showSignalement, setShowSignalement] = useState(false);
  const [signalementForm, setSignalementForm] = useState({
    description: '',
    lieu: '',
    dateObservation: '',
    heureObservation: '',
    telephoneContact: '',
    commentaireSupplementaire: '',
    photo: '',
    urgent: false,
  });
  const [signalementError, setSignalementError] = useState('');
  const [signalementPhotoFile, setSignalementPhotoFile] = useState<File | null>(null);
  const [signalementPhotoPreview, setSignalementPhotoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showRetrouve, setShowRetrouve] = useState(false);
  const [retrouveStatut, setRetrouveStatut] = useState('RETROUVE_VIVANT');
  const [retrouveDesc, setRetrouveDesc] = useState('');

  const fetchAvis = useCallback(async () => {
    try {
      const res = await api.get(`/api/avis-recherches/${params.id}`);
      setAvis(res.data.data || res.data);
    } catch {
      setError('Avis non trouvé.');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const fetchSignalements = useCallback(async () => {
    try {
      const res = await api.get(`/api/avis-recherches/${params.id}/signalements`);
      setSignalements(res.data.data || res.data || []);
    } catch {
      /* ignore */
    }
  }, [params.id]);

  useEffect(() => {
    fetchAvis();
    fetchSignalements();
  }, [fetchAvis, fetchSignalements]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('report') === 'true' || urlParams.get('signalement') === 'true') {
        setShowSignalement(true);
      }
    }
  }, []);

  const isOwner = user && avis && user.id === avis.auteur?.id;
  const isCommissariat = user?.roles.includes('ROLE_COMMISSARIAT');
  const isSuperAdmin = user?.roles.includes('ROLE_SUPER_ADMIN');
  const canSeePrivate = isOwner || isCommissariat || isSuperAdmin;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const handleSignalement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSignalementError('');
    try {
      let photoUrl = signalementForm.photo;

      if (signalementPhotoFile) {
        const formData = new FormData();
        formData.append('photo', signalementPhotoFile);
        const uploadRes = await api.post('/api/signalements/photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        photoUrl = uploadRes.data?.data?.url || '';
      }

      const payload: Record<string, unknown> = {
        description: signalementForm.description,
        lieu: signalementForm.lieu,
        dateObservation: signalementForm.dateObservation,
      };
      if (signalementForm.heureObservation) payload.heureObservation = signalementForm.heureObservation;
      if (signalementForm.telephoneContact) payload.telephoneContact = signalementForm.telephoneContact;
      if (signalementForm.commentaireSupplementaire) payload.commentaireSupplementaire = signalementForm.commentaireSupplementaire;
      if (photoUrl) payload.photo = photoUrl;
      if (signalementForm.urgent) payload.urgent = true;

      const res = await api.post(`/api/avis-recherches/${params.id}/signalements`, payload);
      setSuccess('Signalement publié avec succès !');
      setShowSignalement(false);
      setSignalementForm({
        description: '', lieu: '', dateObservation: '', heureObservation: '',
        telephoneContact: '', commentaireSupplementaire: '', photo: '', urgent: false,
      });
      if (signalementPhotoPreview) URL.revokeObjectURL(signalementPhotoPreview);
      setSignalementPhotoPreview('');
      setSignalementPhotoFile(null);
      fetchSignalements();
      const conversationId = res.data?.data?.conversation_id;
      if (conversationId) {
        setTimeout(() => { window.location.href = `/conversations/${conversationId}`; }, 1000);
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setSignalementError(apiErr.response?.data?.message || 'Erreur lors du signalement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignalementPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setSignalementError('Format non supporté. Utilisez une image JPEG, PNG ou WEBP.');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSignalementError('Image trop lourde. Taille maximale : 5 Mo.');
      e.target.value = '';
      return;
    }

    setSignalementError('');
    if (signalementPhotoPreview) URL.revokeObjectURL(signalementPhotoPreview);
    setSignalementPhotoPreview(URL.createObjectURL(file));
    setSignalementPhotoFile(file);
    setSignalementForm((prev) => ({ ...prev, photo: '' }));
    e.target.value = '';
  };

  const removeSignalementPhoto = () => {
    if (signalementPhotoPreview) URL.revokeObjectURL(signalementPhotoPreview);
    setSignalementPhotoPreview('');
    setSignalementPhotoFile(null);
  };

  const today = new Date().toISOString().split('T')[0];

  const handleRetrouve = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/api/avis-recherches/${params.id}/declarer-retrouve`, {
        statut: retrouveStatut,
        description: retrouveDesc || undefined,
      });
      setSuccess('Statut mis à jour avec succès !');
      setShowRetrouve(false);
      setRetrouveDesc('');
      fetchAvis();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || 'Erreur lors de la mise à jour.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!avis)
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState title="Avis non trouvé" description={error || "Cet avis n'existe pas ou a été supprimé."} />
      </div>
    );

  const photos = avis.photos || [];
  const activePhoto = photos[activePhotoIdx];
  const mainPhoto = photos.find((p) => p.estPrincipale) || photos[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full">
      <PageHeader title="" backHref="/" />

      {error && (
        <div className="bg-[#ef4444]/15 border border-[#ef4444]/30 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4.5 w-4.5 text-[#ef4444] shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-green-950/40 border border-green-500/30 text-green-200 px-4 py-3 rounded-lg mb-6 text-sm">
          {success}
        </div>
      )}

      {/* Hero / Photo carousel */}
      <Card padding="none" className="overflow-hidden mb-6 border-[#1f2937] bg-[#0e1420]/60 backdrop-blur-md">
        {photos.length > 0 ? (
          <>
            <div
              className="h-64 md:h-96 bg-slate-950 relative cursor-pointer group"
              onClick={() => activePhoto.url && setSelectedPhoto(activePhoto.url)}
            >
              <img
                src={activePhoto.url}
                alt={`${avis.prenom} ${avis.nom}`}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="text-white text-xs font-semibold bg-black/60 px-3 py-1.5 rounded-full border border-gray-800">
                  Cliquer pour agrandir
                </span>
              </div>
            </div>
            {photos.length > 1 && (
              <div className="flex gap-2 p-4 bg-[#0b0f17]/40 border-t border-[#1f2937]/50 overflow-x-auto">
                {photos.map((photo: Photo, idx: number) => (
                  <button
                    key={photo.id}
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition ${
                      idx === activePhotoIdx ? 'border-[#ef4444] shadow-md shadow-[#ef4444]/20' : 'border-[#1f2937]'
                    }`}
                  >
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="h-64 bg-[#0b0f17]/50 flex flex-col items-center justify-center border-b border-[#1f2937]">
            <Camera className="h-12 w-12 text-gray-600 mb-2" />
            <p className="text-sm text-gray-500 font-medium">Aucune photo enregistrée</p>
          </div>
        )}
      </Card>

      {/* Title + Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {avis.prenom} {avis.nom}
          </h1>
          <p className="text-gray-400 text-sm mt-1 uppercase font-bold tracking-wider">
            {avis.sexe === 'HOMME' ? 'Homme' : 'Femme'} &middot; {avis.ageApprox} ans
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AvisStatutBadge statut={avis.statut} />
          <AvisTypeBadge type={avis.type} />
        </div>
      </div>

      {/* Info Grid */}
      <Card className="mb-6 border-[#1f2937] bg-[#0e1420]/60 backdrop-blur-md">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Informations Dossier</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2.5 text-gray-300">
            <User className="h-4.5 w-4.5 text-gray-500 shrink-0" />
            <span>Identité : <strong>{avis.prenom} {avis.nom}</strong></span>
          </div>
          <div className="flex items-center gap-2.5 text-gray-300">
            <Calendar className="h-4.5 w-4.5 text-[#ef4444] shrink-0" />
            <span>Disparu le : <strong className="text-[#ef4444] font-semibold">{formatDate(avis.dateDisparition)}</strong></span>
          </div>
          <div className="flex items-center gap-2.5 text-gray-300">
            <MapPin className="h-4.5 w-4.5 text-gray-500 shrink-0" />
            <span>Dernier lieu vu : <strong>{avis.dernierLieuVu}</strong></span>
          </div>
          <div className="flex items-center gap-2.5 text-gray-300">
            <Phone className="h-4.5 w-4.5 text-gray-500 shrink-0" />
            <span>Téléphone contact : <strong>{avis.telephone}</strong></span>
          </div>
          {avis.region && (
            <div className="text-gray-300">
              <span className="font-semibold text-gray-500">Région :</span> {avis.region.nom}
            </div>
          )}
          {avis.ville && (
            <div className="text-gray-300">
              <span className="font-semibold text-gray-500">Ville :</span> {avis.ville.nom}
            </div>
          )}
          {avis.taille && (
            <div className="text-gray-300">
              <span className="font-semibold text-gray-500">Taille :</span> {avis.taille} m
            </div>
          )}
          {avis.poids && (
            <div className="text-gray-300">
              <span className="font-semibold text-gray-500">Poids :</span> {avis.poids} kg
            </div>
          )}
        </div>
      </Card>

      {/* Description */}
      <Card className="mb-6 border-[#1f2937] bg-[#0e1420]/60 backdrop-blur-md">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Description physique</h2>
        <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{avis.description}</p>
      </Card>

      {/* Circonstances */}
      {avis.circonstances && (
        <Card className="mb-6 border-[#1f2937] bg-[#0e1420]/60 backdrop-blur-md">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Circonstances de la disparition</h2>
          <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{avis.circonstances}</p>
        </Card>
      )}

      {/* Physical specs (tenue, signes) */}
      {(avis.tenueVestimentaire || avis.signesParticuliers) && (
        <Card className="mb-6 border-[#1f2937] bg-[#0e1420]/60 backdrop-blur-md">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Signes distinctifs & Tenue</h2>
          <div className="space-y-3 text-sm">
            {avis.tenueVestimentaire && (
              <p className="text-gray-300">
                <span className="font-semibold text-gray-500">Tenue vestimentaire :</span> {avis.tenueVestimentaire}
              </p>
            )}
            {avis.signesParticuliers && (
              <p className="text-gray-300">
                <span className="font-semibold text-gray-500">Signes particuliers :</span> {avis.signesParticuliers}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Actions */}
      <Card className="mb-6 border-[#1f2937] bg-[#0e1420]/60 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex flex-wrap gap-3">
            {isOwner && (
              <Link href={`/avis/${avis.id}/edit`}>
                <Button variant="primary" className="font-bold">Modifier l&apos;avis</Button>
              </Link>
            )}
            {isOwner && (
              <Link href={`/avis/${avis.id}/photos`}>
                <Button variant="secondary" icon={<ImageIcon className="h-4 w-4" />} className="bg-slate-900 border border-[#1f2937] text-white hover:bg-slate-950 font-bold">
                  Gérer les photos
                </Button>
              </Link>
            )}
            {isOwner && (
              <Button variant="secondary" onClick={() => setShowRetrouve(true)} className="bg-slate-900 border border-[#1f2937] text-white hover:bg-slate-950 font-bold">
                Déclarer retrouvé
              </Button>
            )}
            {user && !isOwner && (
              <Button
                variant="primary"
                icon={<AlertTriangle className="h-4.5 w-4.5 shrink-0" />}
                onClick={() => setShowSignalement(true)}
                className="bg-[#ef4444] text-white hover:bg-[#dc2626] font-bold shadow-md shadow-[#ef4444]/10"
              >
                Transmettre un indice urgent
              </Button>
            )}
          </div>
        </div>
        <div className="pt-4 border-t border-[#1f2937]">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Partager cet avis</p>
          <AvisShareButtons
            id={avis.id}
            prenom={avis.prenom}
            nom={avis.nom}
            ageApprox={avis.ageApprox}
            dateDisparition={avis.dateDisparition}
            dernierLieuVu={avis.dernierLieuVu}
            telephone={avis.telephone}
            photoUrl={mainPhoto?.url}
            description={avis.description}
            villeNom={avis.ville?.nom}
            regionNom={avis.region?.nom}
          />
        </div>
      </Card>

      {/* Signalements — Version publique */}
      {signalements.length > 0 && !canSeePrivate && (
        <Card className="mb-6 border-[#1f2937] bg-[#0e1420]/60 backdrop-blur-md">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Eye className="h-4.5 w-4.5 text-gray-500" />
            Témoignages & Signalements publics ({signalements.length})
          </h2>
          <div className="space-y-4">
            {signalements.map((s) => (
              <div key={s.id} className="border border-[#1f2937] bg-slate-950/40 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs text-gray-400">
                    {formatDate(s.createdAt)} &middot; {s.lieu}
                  </p>
                  <Badge variant={s.statut === 'PUBLIE' ? 'success' : 'muted'}>
                    {s.statut === 'PUBLIE' ? 'Validé' : 'Masqué'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{s.description}</p>
                {s.photo && (
                  <img src={s.photo} alt="Photo du signalement" className="mt-3 max-h-48 rounded-lg object-cover border border-[#1f2937]" />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Signalements — Version privée (owner, commissariat, super-admin) */}
      {signalements.length > 0 && canSeePrivate && (
        <Card className="mb-6 border-[#ef4444]/20 bg-[#ef4444]/5 backdrop-blur-md">
          <h2 className="text-xs font-bold text-[#ef4444] uppercase tracking-widest mb-4 flex items-center gap-2">
            <EyeOff className="h-4.5 w-4.5 text-[#ef4444]" />
            Dossier d&apos;Investigation Confidentiel ({signalements.length} indices)
          </h2>
          <div className="space-y-4">
            {signalements.map((s) => (
              <div key={s.id} className="border border-[#1f2937] bg-slate-950 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2 pb-2 border-b border-[#1f2937]">
                  <div>
                    <p className="font-bold text-white text-sm">
                      Témoin: {s.auteur?.prenom} {s.auteur?.nom}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Soumis le {formatDate(s.createdAt)} &bull; Lieu: {s.lieu}
                    </p>
                  </div>
                  <Badge variant={s.statut === 'PUBLIE' ? 'success' : 'muted'}>
                    {s.statut === 'PUBLIE' ? 'Actif' : 'Masqué'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-300 mb-3 whitespace-pre-wrap leading-relaxed">{s.description}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-400 mb-3 bg-[#0b0f17] p-2.5 rounded border border-[#1f2937]">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-gray-500" /> Observation: {new Date(s.dateObservation).toLocaleDateString('fr-FR')}
                  </span>
                  {s.heureObservation && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-gray-500" /> Heure: {s.heureObservation}
                    </span>
                  )}
                  {s.auteur?.telephone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-gray-500" /> Tél: {s.auteur.telephone}
                    </span>
                  )}
                  {s.auteur?.email && (
                    <span className="flex items-center gap-1">
                      @ {s.auteur.email}
                    </span>
                  )}
                </div>
                {s.commentaireSupplementaire && (
                  <div className="bg-slate-900 border border-[#1f2937] rounded-lg px-3 py-2.5 text-xs text-gray-300 mb-3">
                    <span className="font-semibold text-gray-400">Commentaire interne :</span> {s.commentaireSupplementaire}
                  </div>
                )}
                {s.photo && (
                  <img src={s.photo} alt="Photo" className="max-h-40 rounded-lg object-cover mb-3 border border-[#1f2937]" />
                )}
                {canSeePrivate && (
                  <div className="pt-2 border-t border-[#1f2937] flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<MessageCircle className="h-3.5 w-3.5" />}
                      className="text-gray-400 hover:text-white"
                      onClick={async () => {
                        try {
                          const res = await api.post(`/api/signalements/${s.id}/contacter`);
                          const convId = res.data?.data?.conversation_id;
                          if (convId) router.push(`/conversations/${convId}`);
                        } catch {
                          setError('Erreur lors de la création de la conversation.');
                        }
                      }}
                    >
                      Contacter ce témoin
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Signalement Modal */}
      <Modal
        open={showSignalement}
        onClose={submitting ? () => {} : () => setShowSignalement(false)}
        title="Transmettre un indice"
        className="bg-[#0e1420] border border-[#1f2937] text-white max-w-2xl"
      >
        <form onSubmit={handleSignalement} className="space-y-6">
          <p className="text-sm text-gray-400 leading-relaxed">
            Vos informations sont précieuses. Décrivez ce que vous avez observé concernant <strong className="text-white">{avis?.prenom} {avis?.nom}</strong> pour aider les enquêteurs.
          </p>

          {/* Section Observation */}
          <div className="rounded-xl border border-[#1f2937]/60 bg-slate-950/40 p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Eye className="h-3.5 w-3.5 text-[#ef4444]" />
              Observation
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-300">Description de votre observation *</label>
                  <span className={`text-[10px] font-semibold ${signalementForm.description.length >= 10 ? 'text-gray-500' : 'text-[#ef4444]'}`}>
                    {signalementForm.description.length}/2000
                  </span>
                </div>
                <textarea
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={3}
                  value={signalementForm.description}
                  onChange={(e) => setSignalementForm({ ...signalementForm, description: e.target.value })}
                  placeholder="Ex: J'ai aperçu la personne marchant près du centre commercial..."
                  className="w-full rounded-lg border border-[#1f2937] bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-gray-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Lieu d'observation *"
                  required
                  value={signalementForm.lieu}
                  onChange={(e) => setSignalementForm({ ...signalementForm, lieu: e.target.value })}
                  placeholder="Rue, quartier, ville ou monument..."
                  icon={<MapPin className="h-4 w-4" />}
                  className="bg-slate-950 border-[#1f2937] text-white focus:border-primary"
                />
                <Input
                  label="Téléphone de contact (optionnel)"
                  type="tel"
                  value={signalementForm.telephoneContact}
                  onChange={(e) => setSignalementForm({ ...signalementForm, telephoneContact: e.target.value })}
                  placeholder="Ex: +237 6XX XXX XXX"
                  icon={<Phone className="h-4 w-4" />}
                  className="bg-slate-950 border-[#1f2937] text-white focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Date d'observation *"
                  type="date"
                  required
                  max={today}
                  value={signalementForm.dateObservation}
                  onChange={(e) => setSignalementForm({ ...signalementForm, dateObservation: e.target.value })}
                  icon={<Calendar className="h-4 w-4" />}
                  className="bg-slate-950 border-[#1f2937] text-white focus:border-primary"
                />
                <Input
                  label="Heure d'observation"
                  type="time"
                  value={signalementForm.heureObservation}
                  onChange={(e) => setSignalementForm({ ...signalementForm, heureObservation: e.target.value })}
                  icon={<Clock className="h-4 w-4" />}
                  className="bg-slate-950 border-[#1f2937] text-white focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Commentaire supplémentaire</label>
                <textarea
                  rows={2}
                  maxLength={2000}
                  value={signalementForm.commentaireSupplementaire}
                  onChange={(e) => setSignalementForm({ ...signalementForm, commentaireSupplementaire: e.target.value })}
                  placeholder="Détails vestimentaires, comportement, météo, etc."
                  className="w-full rounded-lg border border-[#1f2937] bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-gray-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Section Preuves */}
          <div className="rounded-xl border border-[#1f2937]/60 bg-slate-950/40 p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Camera className="h-3.5 w-3.5 text-[#ef4444]" />
              Preuves (optionnel)
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Photo ou preuve visuelle</label>
                {signalementPhotoPreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-[#1f2937]">
                    <img src={signalementPhotoPreview} alt="Aperçu de la preuve" className="w-full h-44 object-cover bg-slate-950" />
                    <button
                      type="button"
                      onClick={removeSignalementPhoto}
                      disabled={submitting}
                      title="Retirer l'image"
                      className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/70 text-white flex items-center justify-center hover:bg-[#ef4444] transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg border-[#1f2937]/60 bg-slate-950/40 py-8 text-center transition-all cursor-pointer ${submitting ? 'opacity-50 pointer-events-none' : 'hover:border-[#ef4444]/40 hover:bg-slate-950/70'}`}>
                    <div className="p-3 bg-[#ef4444]/10 rounded-full mb-2">
                      <ImageIcon className="h-5 w-5 text-[#ef4444]" />
                    </div>
                    <p className="text-sm font-medium text-gray-300">Cliquez pour importer une image</p>
                    <p className="text-xs text-gray-600 mt-1">JPEG, PNG ou WEBP — 5 Mo max</p>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleSignalementPhotoSelect} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Section Urgence */}
          <button
            type="button"
            onClick={() => setSignalementForm({ ...signalementForm, urgent: !signalementForm.urgent })}
            className={`w-full flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all cursor-pointer ${
              signalementForm.urgent
                ? 'border-[#ef4444]/60 bg-[#ef4444]/10'
                : 'border-[#1f2937] bg-slate-950/40 hover:border-[#ef4444]/30'
            }`}
          >
            <span className={`mt-0.5 shrink-0 p-1.5 rounded-lg ${signalementForm.urgent ? 'bg-[#ef4444]/20 text-[#ef4444]' : 'bg-[#1f2937] text-gray-400'}`}>
              <AlertTriangle className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-white">
                Ce témoignage est urgent {signalementForm.urgent ? <span className="text-[#ef4444]">· Activé</span> : ''}
              </span>
              <span className="block text-xs text-gray-500 mt-0.5 leading-relaxed">
                En cas de danger immédiat ou d'observation très récente, alertez les enquêteurs en priorité.
              </span>
            </span>
          </button>

          {signalementError && (
            <div className="bg-[#ef4444]/15 border border-[#ef4444]/30 text-red-200 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-[#ef4444] shrink-0 mt-0.5" />
              <span>{signalementError}</span>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowSignalement(false)} disabled={submitting} className="border-[#1f2937] text-gray-300 hover:bg-slate-950">
              Annuler
            </Button>
            <Button type="submit" variant="primary" loading={submitting} className="font-bold">
              Transmettre l&apos;indice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Déclarer retrouvé Modal */}
      <Modal open={showRetrouve} onClose={() => setShowRetrouve(false)} title="Modifier le statut du dossier" className="bg-[#0e1420] border border-[#1f2937] text-white">
        <form onSubmit={handleRetrouve} className="space-y-4">
          <Select
            label="Nouveau statut *"
            value={retrouveStatut}
            onChange={(e) => setRetrouveStatut(e.target.value)}
            options={[
              { value: 'RETROUVE_VIVANT', label: 'Retrouvé vivant' },
              { value: 'RETROUVE_DECEDE', label: 'Retrouvé décédé' },
            ]}
            className="bg-slate-950 border-[#1f2937] text-white"
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description des retrouvailles (optionnel)</label>
            <textarea
              rows={3}
              value={retrouveDesc}
              onChange={(e) => setRetrouveDesc(e.target.value)}
              placeholder="Indiquez les détails officiels..."
              className="w-full rounded-lg border border-[#1f2937] bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-gray-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" loading={submitting}>Confirmer le statut</Button>
            <Button type="button" variant="outline" onClick={() => setShowRetrouve(false)} className="border-[#1f2937] text-gray-300 hover:bg-slate-950">
              Annuler
            </Button>
          </div>
        </form>
      </Modal>

      {/* Full-screen photo */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-55 p-4 cursor-pointer"
          onClick={() => setSelectedPhoto(null)}
        >
          <img src={selectedPhoto} alt="Photo agrandie" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-gray-800" />
        </div>
      )}
    </div>
  );
}

