import type { Metadata } from 'next';
import { headers } from 'next/headers';
import AvisDetailClient from './avis-detail';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface PhotoDto {
  url: string;
  estPrincipale: boolean;
}

interface AvisDto {
  id: number;
  prenom: string;
  nom: string;
  ageApprox: number;
  dateDisparition: string;
  dernierLieuVu: string;
  telephone: string;
  description?: string;
  ville?: { id: number; nom: string };
  region?: { id: number; nom: string };
  photos?: PhotoDto[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchAvis(id: string): Promise<AvisDto | null> {
  try {
    const res = await fetch(`${API_BASE}/api/avis-recherches/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const body = await res.json();
    return (body.data || body) as AvisDto;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const avis = await fetchAvis(id);

  if (!avis) {
    return { title: 'Avis de recherche' };
  }

  const h = await headers();
  const proto = h.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'http';
  const host = h.get('x-forwarded-host')?.split(',')[0]?.trim() || h.get('host') || 'localhost:3000';
  const origin = `${proto}://${host}`;

  const photo = avis.photos?.find((p) => p.estPrincipale) || avis.photos?.[0];
  const date = new Date(avis.dateDisparition).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const description = [
    `🚨 AVIS DE RECHERCHE 🚨 ${avis.prenom} ${avis.nom}, ${avis.ageApprox} ans, disparu(e) le ${date}.`,
    `Dernier lieu vu : ${avis.dernierLieuVu}.`,
    avis.ville?.nom ? `Ville : ${avis.ville.nom}.` : null,
    avis.region?.nom ? `Région : ${avis.region.nom}.` : null,
    avis.description ? `Description physique : ${avis.description.replace(/\s+/g, ' ').trim()}` : null,
    `Toute information : ${avis.telephone}`,
  ]
    .filter(Boolean)
    .join(' ');

  const imageUrl = photo ? `${origin}${new URL(photo.url).pathname}` : '';

  return {
    title: `Avis de recherche - ${avis.prenom} ${avis.nom}`,
    description,
    alternates: {
      canonical: `${origin}/avis/${id}`,
    },
    openGraph: {
      title: `🚨 Avis de recherche - ${avis.prenom} ${avis.nom}`,
      description,
      type: 'website',
      locale: 'fr_FR',
      url: `${origin}/avis/${id}`,
      images: imageUrl ? [{ url: imageUrl, alt: `${avis.prenom} ${avis.nom}` }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Avis de recherche - ${avis.prenom} ${avis.nom}`,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default function Page() {
  return <AvisDetailClient />;
}
