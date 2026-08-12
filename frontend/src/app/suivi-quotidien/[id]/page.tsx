'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { AvisRecherche } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ChevronLeft, Check, X, HeartPulse, HeartCrack, Search } from 'lucide-react';

type Step = 'question' | 'retrouve' | 'non' | 'done';

export default function SuiviQuotidienPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [avis, setAvis] = useState<AvisRecherche | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState<Step>('question');
  const [statut, setStatut] = useState<'RETROUVE_VIVANT' | 'RETROUVE_DECEDE'>('RETROUVE_VIVANT');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

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

  useEffect(() => {
    if (user) fetchAvis();
  }, [user, fetchAvis]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload: Record<string, unknown> = { statut };
      if (description) payload.description = description;
      await api.post(`/api/avis-recherches/${params.id}/declarer-retrouve`, payload);
      setStep('done');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || 'Erreur lors de l\'envoi de la réponse.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <Card className="w-full max-w-md text-center">
          <p className="text-sm text-red-400">{error}</p>
          <div className="mt-6">
            <Link href="/notifications">
              <Button variant="outline">Retour aux notifications</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/notifications"
            className="w-8 h-8 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 flex items-center justify-center hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 transition-all"
          >
            <ChevronLeft className="h-4 w-4 text-gray-400" />
          </Link>
          <h1 className="text-xl font-bold text-white tracking-tight">Suivi quotidien</h1>
        </div>

        <Card padding="lg" className="text-center">
          {step === 'question' && avis && (
            <>
              <div className="mx-auto w-14 h-14 rounded-full bg-[#ef4444]/10 flex items-center justify-center mb-4">
                <Search className="h-7 w-7 text-[#ef4444]" />
              </div>
              <h2 className="text-lg font-semibold text-white">
                {avis.prenom} {avis.nom}
              </h2>
              <p className="text-sm text-gray-400 mt-1">Recherché depuis le {new Date(avis.dateDisparition).toLocaleDateString('fr-FR')}</p>
              <p className="text-base text-gray-300 mt-6">
                La personne a-t-elle été retrouvée ?
              </p>
              <div className="grid grid-cols-2 gap-3 mt-8">
                <Button
                  variant="danger"
                  size="lg"
                  icon={<Check className="h-5 w-5" />}
                  onClick={() => setStep('retrouve')}
                >
                  Oui
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  icon={<X className="h-5 w-5" />}
                  onClick={() => setStep('non')}
                >
                  Non
                </Button>
              </div>
            </>
          )}

          {step === 'retrouve' && avis && (
            <>
              <div className="mx-auto w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <HeartPulse className="h-7 w-7 text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Elle a été retrouvée</h2>
              <p className="text-sm text-gray-400 mt-1">Indiquez dans quel état la personne a été retrouvée.</p>
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatut('RETROUVE_VIVANT')}
                    className={`rounded-xl border p-4 text-sm font-medium transition-all cursor-pointer ${
                      statut === 'RETROUVE_VIVANT'
                        ? 'border-green-500/50 bg-green-500/10 text-green-400'
                        : 'border-[#1f2937] text-gray-400 hover:border-[#2d3748]'
                    }`}
                  >
                    Vivante
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatut('RETROUVE_DECEDE')}
                    className={`rounded-xl border p-4 text-sm font-medium transition-all cursor-pointer ${
                      statut === 'RETROUVE_DECEDE'
                        ? 'border-red-500/50 bg-red-500/10 text-red-400'
                        : 'border-[#1f2937] text-gray-400 hover:border-[#2d3748]'
                    }`}
                  >
                    Décédée
                  </button>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description (facultatif)"
                  rows={3}
                  className="w-full rounded-lg border border-[#1f2937] bg-[#0e1420]/60 px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#ef4444]/40"
                />
                {error && <p className="text-sm text-red-400">{error}</p>}
                <Button type="submit" variant="primary" size="lg" loading={submitting} className="w-full">
                  Confirmer
                </Button>
              </form>
            </>
          )}

          {step === 'non' && (
            <>
              <div className="mx-auto w-14 h-14 rounded-full bg-[#1f2937] flex items-center justify-center mb-4">
                <Search className="h-7 w-7 text-gray-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Toujours pas retrouvée</h2>
              <p className="text-sm text-gray-400 mt-2">
                Merci pour votre réponse. Les recherches se poursuivent et vous recevrez un nouveau suivi demain.
              </p>
              <div className="mt-8">
                <Link href="/">
                  <Button variant="outline">Retour à l'accueil</Button>
                </Link>
              </div>
            </>
          )}

          {step === 'done' && (
            <>
              <div className="mx-auto w-14 h-14 rounded-full bg-[#ef4444]/10 flex items-center justify-center mb-4">
                <HeartCrack className="h-7 w-7 text-[#ef4444]" />
              </div>
              <h2 className="text-lg font-semibold text-white">Déclaration envoyée</h2>
              <p className="text-sm text-gray-400 mt-2">
                Votre déclaration a été transmise. Un administrateur doit la confirmer avant que l'avis ne soit mis à jour.
              </p>
              <div className="mt-8">
                <Link href="/">
                  <Button variant="outline">Retour à l'accueil</Button>
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
