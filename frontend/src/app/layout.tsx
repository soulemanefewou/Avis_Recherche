import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EmergencyCTA from "@/components/EmergencyCTA";
import { PhoneCall } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Avis de Recherche - Secours National",
  description: "Plateforme d'utilité publique et d'investigation citoyenne pour la recherche de personnes disparues.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-primary selection:text-white">
        <AuthProvider>
          {/* Official Emergency Contact Banner */}
          <div className="bg-[#ef4444]/10 border-b border-[#ef4444]/20 text-[#f3f4f6] text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 relative z-50">
            <PhoneCall className="h-3.5 w-3.5 text-[#ef4444] animate-pulse shrink-0" />
            <span>NUMÉROS D&apos;URGENCE OFFICIELS : Contactez immédiatement le <strong>17</strong> (Police) ou le <strong>119</strong> (Secours) en cas de danger.</span>
          </div>

          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
          
          {/* Floating Emergency CTA with Multi-step Form */}
          <EmergencyCTA />
        </AuthProvider>
      </body>
    </html>
  );
}

