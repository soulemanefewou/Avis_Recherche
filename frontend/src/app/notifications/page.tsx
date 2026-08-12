"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { initPushNotifications } from "@/lib/firebase";
import type { Notification } from "@/lib/types";
import { ChevronLeft, Bell, BellOff, MessageSquare, AlertTriangle, FileText, CheckCircle, Info, Clock } from "lucide-react";

function timeSince(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return `il y a ${Math.floor(diff / 86400)}j`;
}

function notificationIcon(type: Notification["type"]) {
  const cls = "h-6 w-6";
  switch (type) {
    case "MESSAGE":
      return <MessageSquare className={cls} />;
    case "SIGNALEMENT":
    case "SIGNALEMENT_URGENT":
    case "MESSAGE_SIGNALE":
      return <AlertTriangle className={cls} />;
    case "AVIS_PUBLIE":
    case "AVIS_STATUT":
    case "AVIS_REJETE":
    case "AVIS_EN_ATTENTE":
    case "NOUVEL_AVIS_REGION":
    case "AVIS_A_VALIDER":
      return <FileText className={cls} />;
    case "DEMANDE_VALIDATION":
    case "CONFIRMATION_RETROUVE":
    case "COMPTE_REACTIVE":
      return <CheckCircle className={cls} />;
    case "COMPTE_DESACTIVE":
      return <AlertTriangle className={cls} />;
    case "SUIVI_QUOTIDIEN":
    case "SYSTEM":
    default:
      return <Info className={cls} />;
  }
}

function notificationColor(type: Notification["type"]) {
  switch (type) {
    case "MESSAGE":
      return "bg-blue-500/10 text-blue-400";
    case "SIGNALEMENT":
      return "bg-amber-500/10 text-amber-400";
    case "SIGNALEMENT_URGENT":
    case "MESSAGE_SIGNALE":
    case "AVIS_REJETE":
    case "COMPTE_DESACTIVE":
      return "bg-red-500/10 text-red-400";
    case "AVIS_PUBLIE":
    case "NOUVEL_AVIS_REGION":
    case "COMPTE_REACTIVE":
      return "bg-green-500/10 text-green-400";
    case "AVIS_STATUT":
    case "AVIS_EN_ATTENTE":
      return "bg-purple-500/10 text-purple-400";
    case "DEMANDE_VALIDATION":
    case "AVIS_A_VALIDER":
    case "CONFIRMATION_RETROUVE":
      return "bg-indigo-500/10 text-indigo-400";
    default:
      return "bg-gray-500/10 text-gray-400";
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      api
        .get("/api/notifications")
        .then((res) => setNotifications(res.data.data || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)));
    } catch {
      /* empty */
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.lu);
    await Promise.all(unread.map((n) => api.patch(`/api/notifications/${n.id}/read`)));
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
  };

  const unreadCount = notifications.filter((n) => !n.lu).length;
  const [pushStatus, setPushStatus] = useState<"idle" | "enabled" | "denied" | "error">("idle");

  const enablePush = async () => {
    try {
      await initPushNotifications(true);
      setPushStatus(Notification.permission === "granted" ? "enabled" : "denied");
    } catch {
      setPushStatus("error");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="px-10 py-8 space-y-8">
        <div className="flex items-center justify-between animate-pulse">
          <div className="h-8 bg-[#1f2937] rounded w-48" />
          <div className="h-4 bg-[#1f2937] rounded w-32" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 p-4 flex items-start gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-[#1f2937] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#1f2937] rounded w-48" />
                <div className="h-3 bg-[#1f2937] rounded w-72" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-10 py-8 space-y-8">
      <div className="flex items-center gap-3 animate-fade-in">
        <Link href="/" className="w-8 h-8 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 flex items-center justify-center hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 transition-all">
          <ChevronLeft className="h-4 w-4 text-gray-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white tracking-tight">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500">{unreadCount} non lue{unreadCount > 1 ? "s" : ""}</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="text-xs font-semibold h-9 px-4 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-300 hover:text-white hover:border-[#1f2937] transition-all">
            Tout marquer comme lu
          </button>
        )}
        <button onClick={enablePush} className={`text-xs font-semibold h-9 px-4 rounded-lg border transition-all ${
          pushStatus === "enabled"
            ? "border-green-500/40 bg-green-500/10 text-green-400"
            : "border-[#ef4444]/40 bg-[#ef4444]/10 text-red-300 hover:bg-[#ef4444]/20 hover:text-red-200"
        }`}>
          {pushStatus === "enabled"
            ? "Notifications push activées"
            : pushStatus === "denied"
              ? "Permission refusée"
              : pushStatus === "error"
                ? "Erreur"
                : "Activer les notifications push"}
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40">
          <BellOff className="h-12 w-12 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucune notification</p>
          <p className="text-xs text-gray-600 mt-1">Vous n'avez pas encore reçu de notifications.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif, idx) => (
            <div
              key={notif.id}
              onClick={() => !notif.lu && markAsRead(notif.id)}
              className={`rounded-xl border p-6 flex items-start gap-5 transition-all cursor-pointer animate-fade-in ${
                !notif.lu
                  ? "border-[#ef4444]/20 bg-[#ef4444]/5 hover:bg-[#ef4444]/10"
                  : "border-[#1f2937]/50 bg-[#0e1420]/40 hover:bg-[#0e1420]/60"
              }`}
              style={{ animationDelay: `${idx * 40}ms`, animationFillMode: "both" }}
            >
              <div className={`mt-0.5 p-3 rounded-full shrink-0 ${notificationColor(notif.type)}`}>
                {notificationIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-semibold text-sm truncate ${notif.lu ? "text-gray-400" : "text-white"}`}>{notif.titre}</p>
                  {!notif.lu && <span className="w-2 h-2 bg-[#ef4444] rounded-full shrink-0" />}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{notif.contenu}</p>
                <p className="text-[10px] text-gray-600 mt-1.5 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeSince(notif.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}