"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { User, ShieldAlert, ChevronRight, HelpCircle } from "lucide-react";

export default function RegisterPage() {
  const [selected, setSelected] = useState<"user" | "commissariat" | null>(null);

  if (selected === "commissariat") {
    return <CommissariatChoice onBack={() => setSelected(null)} />;
  }

  if (selected === "user") {
    return <UserRegister onBack={() => setSelected(null)} />;
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <Card padding="lg" className="border-[#1f2937] bg-[#0e1420]/80 backdrop-blur-md">
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary">
              <User className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Créer un compte</h1>
            <p className="text-sm text-gray-400 mt-1">Sélectionnez la nature de votre rôle d&apos;enquête citoyenne</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setSelected("user")}
              className="w-full p-6 rounded-xl border border-[#1f2937] bg-slate-950/40 hover:border-primary/50 hover:bg-[#ef4444]/5 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors text-primary">
                  <User className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors">Citoyen & Témoin</h3>
                    <ChevronRight className="h-4 w-4 text-gray-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                    Publiez des avis de recherche, signalez des indices géolocalisés et participez activement à l&apos;enquête citoyenne.
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelected("commissariat")}
              className="w-full p-6 rounded-xl border border-[#1f2937] bg-slate-950/40 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors text-emerald-400">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">Commissariat & Police</h3>
                    <ChevronRight className="h-4 w-4 text-gray-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                    Accréditation officielle requise. Publiez des avis validés, pilotez les enquêtes et modérez les indices.
                  </p>
                </div>
              </div>
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-gray-400">
            Déjà inscrit sur le portail ?{" "}
            <Link href="/login" className="text-primary hover:underline font-bold transition">
              Se connecter
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

function CommissariatChoice({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <Card padding="lg" className="border-[#1f2937] bg-[#0e1420]/80 backdrop-blur-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white">Compte Commissariat</h1>
            <p className="text-sm text-gray-400 mt-1">Procédure officielle d&apos;habilitation administrative</p>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6 flex items-start gap-2.5">
            <HelpCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200 leading-relaxed">
              <strong>Vérification obligatoire :</strong> Vous devez soumettre des justificatifs de fonctions officielles. Un super administrateur étudiera votre dossier sous 24h. Vous serez notifié par email.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} className="flex-1 border-[#1f2937] hover:bg-slate-950 text-gray-300">
              Retour
            </Button>
            <Link href="/commissariat-demande" className="flex-1">
              <Button variant="primary" className="w-full font-bold shadow-lg shadow-primary/20">
                Formulaire d&apos;accréditation
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

function UserRegister({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Card padding="lg" className="border-[#1f2937] bg-[#0e1420]/80 backdrop-blur-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white">Citoyen & Témoin</h1>
            <p className="text-sm text-gray-400 mt-1">Rejoignez le réseau d&apos;aide publique</p>
          </div>

          <p className="text-sm text-gray-300 mb-6 text-center leading-relaxed">
            Vous allez être redirigé vers notre formulaire d&apos;inscription sécurisé pour valider votre identité.
          </p>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} className="flex-1 border-[#1f2937] hover:bg-slate-950 text-gray-300">
              Retour
            </Button>
            <Link href="/register/user" className="flex-1">
              <Button variant="primary" className="w-full font-bold shadow-lg shadow-primary/20">
                Continuer
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
