// Renvoie un chemin relatif (proxy Vercel) pour une photo servie initialement
// par l'API Render. Le navigateur charge alors /uploads/... via le proxy Vercel
// (rewrites de next.config.ts), ce qui beneficie du cache CDN edge de Vercel et
// evite le "cold start" du conteneur Render pour l'affichage des images.
export function photoSrc(url?: string | null): string {
  if (!url) return "";
  // Deja relatif -> on le laisse tel quel
  if (url.startsWith("/")) return url;
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}
