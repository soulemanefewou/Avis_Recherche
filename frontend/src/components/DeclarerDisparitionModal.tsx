'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Region, Ville } from '@/lib/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { X, User, MapPin, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';

interface DeclarerDisparitionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeclarerDisparitionModal({ isOpen, onClose }: DeclarerDisparitionModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [regions, setRegions] = useState<Region[]>([]);
  const [villes, setVilles] = useState<Ville[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    sexe: 'HOMME',
    ageApprox: '',
    dateDisparition: '',
    dernierLieuVu: '',
    description: '',
    circonstances: '',
    telephone: '',
    tenueVestimentaire: '',
    signesParticuliers: '',
    taille: '',
    poids: '',
    region: '',
    ville: '',
  });

  // Load regions when modal is open and user is logged in
  useEffect(() => {
    if (isOpen && user) {
      api.get('/api/regions')
        .then((res) => setRegions(res.data.data || []))
        .catch(() => {});
    }
  }, [isOpen, user]);

  // Load cities when region changes
  useEffect(() => {
    if (form.region) {
      api.get(`/api/regions/${form.region}/villes`)
        .then((res) => {
          setVilles(res.data.data || []);
          setForm((prev) => ({ ...prev, ville: '' }));
        })
        .catch(() => {});
    } else {
      setVilles([]);
    }
  }, [form.region]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleNext = () => {
    setError('');
    // Simple validation per step
    if (step === 1) {
      if (!form.nom || !form.prenom || !form.ageApprox || !form.telephone) {
        setError('Veuillez remplir tous les champs obligatoires (*).');
        return;
      }
    } else if (step === 2) {
      if (!form.dateDisparition || !form.dernierLieuVu || !form.region || !form.ville || !form.description) {
        setError('Veuillez remplir tous les champs obligatoires (*).');
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError('');
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        nom: form.nom,
        prenom: form.prenom,
        sexe: form.sexe,
        ageApprox: parseInt(form.ageApprox),
        dateDisparition: form.dateDisparition,
        dernierLieuVu: form.dernierLieuVu,
        description: form.description,
        circonstances: form.circonstances || undefined,
        telephone: form.telephone,
        tenueVestimentaire: form.tenueVestimentaire || undefined,
        signesParticuliers: form.signesParticuliers || undefined,
        taille: form.taille ? parseFloat(form.taille) : undefined,
        poids: form.poids ? parseFloat(form.poids) : undefined,
        region: parseInt(form.region),
        ville: parseInt(form.ville),
      };

      const res = await api.post(
        user?.roles.includes("ROLE_COMMISSARIAT") ? "/api/commissariat/avis" : "/api/avis-recherches",
        payload
      );
      const avisId = res.data.data?.id || res.data.id;
      
      onClose();
      // Reset form
      setForm({
        nom: '', prenom: '', sexe: 'HOMME', ageApprox: '', dateDisparition: '',
        dernierLieuVu: '', description: '', circonstances: '', telephone: '',
        tenueVestimentaire: '', signesParticuliers: '', taille: '', poids: '',
        region: '', ville: ''
      });
      setStep(1);
      
      router.push(avisId ? (user?.roles.includes("ROLE_COMMISSARIAT") ? `/commissariat/avis/${avisId}` : `/avis/${avisId}/photos`) : '/');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string; errors?: string[] } } };
      setError(
        apiErr.response?.data?.errors?.join(', ') ||
        apiErr.response?.data?.message ||
        'Une erreur est survenue lors de la création de l\'avis.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div 
        className="relative bg-[#0e1420] border border-[#1f2937] rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-fade-in my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f2937] bg-[#0b0f17]">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Déclarer une Disparition
            </h2>
            {user && (
              <p className="text-xs text-gray-400 mt-0.5">Procédure officielle d&apos;alerte citoyenne</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-1 rounded-md hover:bg-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {error && (
            <div className="bg-danger-light border border-danger/30 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!user ? (
            /* Warning / Redirection state for unauthenticated users */
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">Identification sécurisée requise</h3>
                <p className="text-sm text-gray-400 max-w-md mx-auto">
                  Afin de limiter les fausses alertes et de permettre aux forces de l&apos;ordre de vous recontacter, vous devez posséder un compte vérifié.
                </p>
              </div>
              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => { onClose(); router.push('/login?redirect=create'); }}
                  variant="primary"
                  className="px-6"
                >
                  Se connecter
                </Button>
                <Button 
                  onClick={() => { onClose(); router.push('/register'); }}
                  variant="outline"
                  className="px-6 border-[#1f2937] hover:bg-slate-950 text-gray-300"
                >
                  Créer un compte
                </Button>
              </div>
            </div>
          ) : (
            /* Multi-step form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Progress Indicator */}
              <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mb-6 bg-slate-950/40 p-2.5 rounded-lg border border-[#1f2937]/50">
                <span className={`flex items-center gap-1.5 ${step >= 1 ? 'text-primary' : ''}`}>
                  <User className="h-3.5 w-3.5" /> Identité
                </span>
                <div className="h-[1px] flex-1 bg-[#1f2937] mx-3" />
                <span className={`flex items-center gap-1.5 ${step >= 2 ? 'text-primary' : ''}`}>
                  <MapPin className="h-3.5 w-3.5" /> Localisation
                </span>
                <div className="h-[1px] flex-1 bg-[#1f2937] mx-3" />
                <span className={`flex items-center gap-1.5 ${step >= 3 ? 'text-primary' : ''}`}>
                  <Activity className="h-3.5 w-3.5" /> Physique
                </span>
              </div>

              {/* Step 1: Identity */}
              {step === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Nom *"
                      name="nom"
                      required
                      value={form.nom}
                      onChange={handleChange}
                      placeholder="Nom de famille"
                      className="bg-slate-950 border-[#1f2937] text-white focus:border-primary"
                    />
                    <Input
                      label="Prénom *"
                      name="prenom"
                      required
                      value={form.prenom}
                      onChange={handleChange}
                      placeholder="Prénom"
                      className="bg-slate-950 border-[#1f2937] text-white focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Genre *"
                      name="sexe"
                      value={form.sexe}
                      onChange={handleChange}
                      options={[
                        { value: 'HOMME', label: 'Homme' },
                        { value: 'FEMME', label: 'Femme' }
                      ]}
                      className="bg-slate-950 border-[#1f2937] text-white focus:border-primary"
                    />
                    <Input
                      label="Âge approximatif *"
                      name="ageApprox"
                      type="number"
                      min={0}
                      required
                      value={form.ageApprox}
                      onChange={handleChange}
                      placeholder="Ex: 28"
                      className="bg-slate-950 border-[#1f2937] text-white focus:border-primary"
                    />
                  </div>

                  <Input
                    label="Téléphone de contact direct *"
                    name="telephone"
                    type="tel"
                    required
                    value={form.telephone}
                    onChange={handleChange}
                    placeholder="Numéro joignable 24h/24"
                    className="bg-slate-950 border-[#1f2937] text-white focus:border-primary"
                  />
                  
                  <p className="text-xs text-gray-500 italic">Les champs marqués d&apos;une * sont obligatoires pour valider le signalement.</p>
                </div>
              )}

              {/* Step 2: Location & Description */}
              {step === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Région de disparition *"
                      name="region"
                      value={form.region}
                      onChange={handleChange}
                      options={regions.map((r) => ({ value: r.id, label: r.nom }))}
                      placeholder="Choisir une région"
                      className="bg-slate-950 border-[#1f2937] text-white focus:border-primary"
                    />
                    <Select
                      label="Ville de disparition *"
                      name="ville"
                      value={form.ville}
                      onChange={handleChange}
                      options={villes.map((v) => ({ value: v.id, label: v.nom }))}
                      placeholder="Choisir une ville"
                      disabled={!form.region}
                      className="bg-slate-950 border-[#1f2937] text-white focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Date & Heure estimée *"
                      name="dateDisparition"
                      type="datetime-local"
                      required
                      value={form.dateDisparition}
                      onChange={handleChange}
                      className="bg-slate-950 border-[#1f2937] text-white focus:border-primary"
                    />
                    <Input
                      label="Dernier lieu vu exact *"
                      name="dernierLieuVu"
                      required
                      value={form.dernierLieuVu}
                      onChange={handleChange}
                      placeholder="Ex: Gare, Rue de Paris"
                      className="bg-slate-950 border-[#1f2937] text-white focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Description détaillée *</label>
                    <textarea
                      name="description"
                      required
                      rows={3}
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Signes distinctifs, détails de la disparition..."
                      className="w-full rounded-lg border border-[#1f2937] bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-gray-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Circonstances (optionnel)</label>
                    <textarea
                      name="circonstances"
                      rows={2}
                      value={form.circonstances}
                      onChange={handleChange}
                      placeholder="Dans quelles circonstances la personne a-t-elle disparu ?"
                      className="w-full rounded-lg border border-[#1f2937] bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-gray-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Physical specs */}
              {step === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Taille (en mètres - optionnel)"
                      name="taille"
                      type="number"
                      step="0.01"
                      min={0}
                      value={form.taille}
                      onChange={handleChange}
                      placeholder="Ex: 1.75"
                      className="bg-slate-950 border-[#1f2937] text-white focus:border-primary"
                    />
                    <Input
                      label="Poids (en kg - optionnel)"
                      name="poids"
                      type="number"
                      step="0.1"
                      min={0}
                      value={form.poids}
                      onChange={handleChange}
                      placeholder="Ex: 72"
                      className="bg-slate-950 border-[#1f2937] text-white focus:border-primary"
                    />
                  </div>

                  <Input
                    label="Tenue vestimentaire (optionnel)"
                    name="tenueVestimentaire"
                    value={form.tenueVestimentaire}
                    onChange={handleChange}
                    placeholder="Description des vêtements portés"
                    className="bg-slate-950 border-[#1f2937] text-white focus:border-primary"
                  />

                  <Input
                    label="Signes particuliers (optionnel)"
                    name="signesParticuliers"
                    value={form.signesParticuliers}
                    onChange={handleChange}
                    placeholder="Ex: tatouages, cicatrice, lunettes"
                    className="bg-slate-950 border-[#1f2937] text-white focus:border-primary"
                  />

                  <div className="p-4 bg-slate-950/60 border border-[#1f2937] rounded-lg space-y-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Note de validation</h4>
                    {user?.roles.includes("ROLE_COMMISSARIAT") ? (
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Après soumission, cet avis de recherche sera <strong className="text-green-500 font-semibold">publié immédiatement</strong> et visible par tous, sans validation d&apos;un administrateur. Vous pourrez ensuite ajouter des photos.
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Après soumission, cet avis sera placé sous le statut <strong className="text-yellow-500 font-semibold">En attente de validation</strong>. Un administrateur ou agent de police habilité validera les pièces et publiera l&apos;avis officiellement. Vous pourrez ensuite ajouter des photos.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-[#1f2937] bg-[#0b0f17]/50 -mx-6 -mb-6 px-6 py-4">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="border-[#1f2937] hover:bg-slate-950 text-gray-300"
                  >
                    Retour
                  </Button>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleNext}
                  >
                    Suivant
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    className="shadow-lg shadow-primary/20"
                  >
                    Soumettre la disparition
                  </Button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
