'use client';

interface AvisShareButtonsProps {
  id: number;
  prenom: string;
  nom: string;
  ageApprox: number;
  dateDisparition: string;
  dernierLieuVu: string;
  telephone: string;
  photoUrl?: string;
  description?: string;
  villeNom?: string;
  regionNom?: string;
}

function WhatsAppIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function FacebookIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export default function AvisShareButtons({
  id,
  prenom,
  nom,
  ageApprox,
  dateDisparition,
  dernierLieuVu,
  telephone,
  photoUrl,
  description,
  villeNom,
  regionNom,
  compact = false,
}: AvisShareButtonsProps & { compact?: boolean }) {
  const shareUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/avis/${id}` : '';

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const message = [
    '🚨 AVIS DE RECHERCHE 🚨',
    `${prenom} ${nom}, ${ageApprox} ans, disparu(e) le ${formatDate(dateDisparition)}.`,
    `Dernier lieu vu : ${dernierLieuVu}.`,
    villeNom ? `Ville : ${villeNom}` : null,
    regionNom ? `Région : ${regionNom}` : null,
    description ? `Description physique : ${description.replace(/\s+/g, ' ').trim()}` : null,
    `Toute information : ${telephone}`,
  ]
    .filter(Boolean)
    .join('\n');

  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    shareUrl
  )}&quote=${encodeURIComponent(message)}`;

  const fetchPhotoFile = async (): Promise<File | null> => {
    if (!photoUrl || typeof navigator === 'undefined' || !navigator.canShare || !navigator.share) {
      return null;
    }
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const sameOriginUrl = photoUrl.replace(apiBase, window.location.origin);

      let blob: Blob | null = null;
      try {
        const res = await fetch(sameOriginUrl);
        if (res.ok) blob = await res.blob();
      } catch {
        /* ignore */
      }
      if (!blob) {
        const res = await fetch(photoUrl);
        if (!res.ok) return null;
        blob = await res.blob();
      }

      const file = new File([blob], 'avis-de-recherche.jpg', {
        type: blob.type || 'image/jpeg',
      });
      return navigator.canShare({ files: [file] }) ? file : null;
    } catch {
      return null;
    }
  };

  const handleWhatsApp = async () => {
    const fullText = `${message}\n${shareUrl}`;
    const file = await fetchPhotoFile();

    if (file && navigator.share) {
      try {
        await navigator.share({ files: [file], text: fullText, url: shareUrl });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }

    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const iconOnly = compact;

  return (
    <div className={compact ? "flex items-center gap-1.5" : "flex flex-wrap gap-2"}>
      <button
        type="button"
        onClick={handleWhatsApp}
        title="Partager sur WhatsApp"
        aria-label="Partager sur WhatsApp"
        className={
          compact
            ? "inline-flex items-center justify-center h-9 w-9 rounded-lg bg-[#25D366] text-white hover:bg-[#1eb355] transition-all duration-200 shadow-md shadow-[#25D366]/10 cursor-pointer"
            : "inline-flex items-center gap-2 text-sm font-semibold h-10 px-4 rounded-lg bg-[#25D366] text-white hover:bg-[#1eb355] transition-all duration-200 shadow-md shadow-[#25D366]/10 cursor-pointer"
        }
      >
        <WhatsAppIcon className={compact ? "h-4 w-4" : "h-4 w-4 shrink-0"} />
        {!iconOnly && "WhatsApp"}
      </button>
      <a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Partager sur Facebook"
        aria-label="Partager sur Facebook"
        className={
          compact
            ? "inline-flex items-center justify-center h-9 w-9 rounded-lg bg-[#1877F2] text-white hover:bg-[#1463c7] transition-all duration-200 shadow-md shadow-[#1877F2]/10"
            : "inline-flex items-center gap-2 text-sm font-semibold h-10 px-4 rounded-lg bg-[#1877F2] text-white hover:bg-[#1463c7] transition-all duration-200 shadow-md shadow-[#1877F2]/10"
        }
      >
        <FacebookIcon className={compact ? "h-4 w-4" : "h-4 w-4 shrink-0"} />
        {!iconOnly && "Facebook"}
      </a>
    </div>
  );
}
