"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ChevronLeft, User, Shield, MapPin, Phone, Mail, Building, Key, CheckCircle2, AlertCircle, Save, Eye, EyeOff } from "lucide-react";

interface UserProfile {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  roles: string[];
  actif: boolean;
}

interface CommissariatInfo {
  id: number;
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  responsable: string;
  actif: boolean;
  region?: { id: number; nom: string } | null;
  ville?: { id: number; nom: string } | null;
}

function Input({ label, type = "text", value, onChange, placeholder, icon: Icon }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string; icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full h-10 text-sm rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-white placeholder-gray-600 focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all duration-200 ${Icon ? "pl-9 pr-3" : "px-3"}`}
        />
      </div>
    </div>
  );
}

export default function CommissariatProfilPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [commissariat, setCommissariat] = useState<CommissariatInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [commNom, setCommNom] = useState("");
  const [commAdresse, setCommAdresse] = useState("");
  const [commTelephone, setCommTelephone] = useState("");
  const [commEmail, setCommEmail] = useState("");
  const [responsable, setResponsable] = useState("");
  const [responsablePrenom, setResponsablePrenom] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !user.roles.includes("ROLE_COMMISSARIAT"))) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get("/api/commissariat/profile");
      const data = res.data.data;
      setProfile(data.utilisateur);
      setCommissariat(data.commissariat);
      setEmail(data.utilisateur.email);
      setTelephone(data.utilisateur.telephone);
      setCommNom(data.commissariat.nom);
      setCommAdresse(data.commissariat.adresse);
      setCommTelephone(data.commissariat.telephone);
      setCommEmail(data.commissariat.email);
      setResponsable(data.commissariat.responsable);
      setResponsablePrenom(data.utilisateur.prenom);
    } catch {
      setError("Erreur lors du chargement du profil.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.roles.includes("ROLE_COMMISSARIAT")) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api.put("/api/commissariat/profile", {
        email,
        telephone,
        commissariat_nom: commNom,
        adresse: commAdresse,
        responsable,
        responsablePrenom,
        commissariat_telephone: commTelephone,
        commissariat_email: commEmail,
      });
      setSuccess("Profil mis à jour avec succès.");
      await fetchProfile();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || "Erreur lors de la mise à jour.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setChangingPassword(true);
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      setChangingPassword(false);
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      setChangingPassword(false);
      return;
    }

    try {
      await api.put("/api/commissariat/password", {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess("Mot de passe modifié avec succès.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setPasswordError(apiErr.response?.data?.message || "Erreur lors du changement de mot de passe.");
    } finally {
      setChangingPassword(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="h-8 bg-[#1f2937] rounded w-48 animate-pulse" />
        <div className="h-4 bg-[#1f2937] rounded w-72 animate-pulse" />
        <div className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 p-6 space-y-4 animate-pulse">
          <div className="h-5 bg-[#1f2937] rounded w-40" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-[#1f2937] rounded" />)}
          </div>
        </div>
      </div>
    );
  }
  if (!user || !user.roles.includes("ROLE_COMMISSARIAT") || !profile || !commissariat) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/commissariat"
            className="w-8 h-8 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 flex items-center justify-center hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 transition-all duration-200"
          >
            <ChevronLeft className="h-4 w-4 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Mon profil</h1>
            <p className="text-sm text-gray-500">Gérez vos informations personnelles et celles de votre commissariat</p>
          </div>
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

      <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-6 animate-fade-in" style={{ animationDelay: "80ms", animationFillMode: "both" }}>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/20 flex items-center justify-center">
            <User className="h-4 w-4 text-[#ef4444]" />
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">Informations du compte</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Nom</label>
            <p className="text-sm text-gray-300 bg-[#0b0f17] rounded-lg px-3 py-2.5 border border-[#1f2937]/50">{profile.nom}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Prénom</label>
            <p className="text-sm text-gray-300 bg-[#0b0f17] rounded-lg px-3 py-2.5 border border-[#1f2937]/50">{profile.prenom}</p>
          </div>
          <Input label="Email" type="email" value={email} onChange={setEmail} icon={Mail} />
          <Input label="Téléphone" value={telephone} onChange={setTelephone} icon={Phone} />
        </div>
      </div>

      <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-6 animate-fade-in" style={{ animationDelay: "140ms", animationFillMode: "both" }}>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/20 flex items-center justify-center">
            <Building className="h-4 w-4 text-[#ef4444]" />
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">Informations du commissariat</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nom du commissariat" value={commNom} onChange={setCommNom} icon={Building} />
          <Input label="Adresse" value={commAdresse} onChange={setCommAdresse} icon={MapPin} />
          <Input label="Téléphone" value={commTelephone} onChange={setCommTelephone} icon={Phone} />
          <Input label="Email" type="email" value={commEmail} onChange={setCommEmail} icon={Mail} />
          <Input label="Responsable (nom)" value={responsable} onChange={setResponsable} icon={User} />
          <Input label="Responsable (prénom)" value={responsablePrenom} onChange={setResponsablePrenom} icon={User} />
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Région</label>
            <p className="text-sm text-gray-300 bg-[#0b0f17] rounded-lg px-3 py-2.5 border border-[#1f2937]/50">{commissariat.region?.nom || "—"}</p>
          </div>
        </div>
        <div className="flex justify-end mt-5 pt-4 border-t border-[#1f2937]/50">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs font-semibold h-10 px-5 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transition-all duration-200 shadow-md shadow-[#ef4444]/10 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-6 animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/20 flex items-center justify-center">
            <Key className="h-4 w-4 text-[#ef4444]" />
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">Changer le mot de passe</h2>
        </div>

        {passwordError && (
          <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}
        {passwordSuccess && (
          <div className="flex items-start gap-2.5 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl mb-4 text-sm">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Mot de passe actuel</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Mot de passe actuel"
                className="w-full h-10 text-sm rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-white placeholder-gray-600 focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all duration-200 px-3 pr-10"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Input label="Nouveau mot de passe" type={showPassword ? "text" : "password"} value={newPassword} onChange={setNewPassword} placeholder="Minimum 8 caractères" icon={Key} />
          <Input label="Confirmer le nouveau mot de passe" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={setConfirmPassword} placeholder="Confirmer le mot de passe" icon={Key} />
        </div>
        <div className="flex justify-end mt-5 pt-4 border-t border-[#1f2937]/50">
          <button
            onClick={handleChangePassword}
            disabled={!currentPassword || !newPassword || !confirmPassword || changingPassword}
            className="flex items-center gap-1.5 text-xs font-semibold h-10 px-5 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transition-all duration-200 shadow-md shadow-[#ef4444]/10 disabled:opacity-50"
          >
            <Key className="h-3.5 w-3.5" />
            {changingPassword ? "Modification..." : "Changer le mot de passe"}
          </button>
        </div>
      </div>
    </div>
  );
}