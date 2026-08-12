"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Conversation, Message } from "@/lib/types";
import { ArrowLeft, Send, Flag, AlertCircle, ChevronLeft, X } from "lucide-react";

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportMessageId, setReportMessageId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const fetchData = async () => {
    try {
      const [convRes, msgRes] = await Promise.all([
        api.get(`/api/conversations/${params.id}`),
        api.get(`/api/conversations/${params.id}/messages`),
      ]);
      setConversation(convRes.data.data || convRes.data);
      setMessages(msgRes.data.data || msgRes.data || []);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.id, user]);

  useEffect(() => {
    if (messages.length > 0 && user) {
      const unreadReceived = messages.filter((m) => !m.lu && m.auteur?.id !== user.id);
      if (unreadReceived.length > 0) {
        Promise.all(
          unreadReceived.map(async (m) => {
            await api.patch(`/api/messages/${m.id}/read`);
            return m.id;
          })
        )
          .then((ids) => {
            setMessages((prev) => prev.map((m) => (ids.includes(m.id) ? { ...m, lu: true } : m)));
          })
          .catch(() => {});
      }
    }
  }, [messages, user]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      api
        .get(`/api/conversations/${params.id}/messages`)
        .then((res) => {
          const fresh = res.data.data || res.data || [];
          setMessages((prev) => {
            if (fresh.length !== prev.length) return fresh;
            return prev;
          });
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [params.id, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const res = await api.post(`/api/conversations/${params.id}/messages`, {
        contenu: newMessage.trim(),
        type: "USER",
      });
      setMessages((prev) => [...prev, res.data.data || res.data]);
      setNewMessage("");
    } catch {
      /* empty */
    } finally {
      setSending(false);
    }
  };

  const openReportModal = (messageId: number) => {
    setReportMessageId(messageId);
    setReportReason("");
    setReportModalOpen(true);
  };

  const handleReport = async () => {
    if (!reportMessageId || !reportReason.trim()) return;
    setReporting(true);
    try {
      await api.post(`/api/messages/${reportMessageId}/signaler`, {
        description: reportReason.trim(),
      });
      setReportModalOpen(false);
      setReportMessageId(null);
      setReportReason("");
    } catch {
      /* empty */
    } finally {
      setReporting(false);
    }
  };

  const otherParticipant = conversation
    ? user?.id === conversation.createurSignalement?.id
      ? conversation.proprietaireAvis
      : conversation.createurSignalement
    : null;

  const otherName = otherParticipant ? `${otherParticipant.prenom} ${otherParticipant.nom}` : "";
  const avisTitle = conversation?.avisRecherche
    ? `${conversation.avisRecherche.prenom} ${conversation.avisRecherche.nom}`
    : "";

  const statusLabels: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: "Active", className: "bg-green-500/10 text-green-400 border-green-500/20" },
    LECTURE_SEULE: { label: "Lecture seule", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    ARCHIVEE: { label: "Archivée", className: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  };

  if (authLoading || loading) {
    return (
      <div className="w-full px-3 sm:px-4 py-3 flex flex-col h-[calc(100dvh-6rem)] space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-[#1f2937] rounded-lg animate-pulse" />
          <div className="h-4 bg-[#1f2937] rounded w-40 animate-pulse" />
        </div>
        <div className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#1f2937] rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-[#1f2937] rounded w-32" />
              <div className="h-3 bg-[#1f2937] rounded w-24" />
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
              <div className="h-12 bg-[#1f2937] rounded-2xl w-48 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="w-full px-3 sm:px-4 py-3">
        <div className="flex flex-col items-center justify-center text-center py-16">
          <AlertCircle className="h-10 w-10 text-gray-600 mb-3" />
          <p className="text-sm text-gray-400">Conversation introuvable.</p>
          <button onClick={() => router.back()} className="mt-4 text-xs font-medium h-9 px-4 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-300 hover:text-white transition-all">Retour</button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-3 sm:px-4 py-3 flex flex-col h-[calc(100dvh-6rem)]">
      <button
        onClick={() => router.push("/conversations")}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white mb-3 transition-colors w-fit"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Retour aux conversations
      </button>

      <div className="rounded-t-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1f2937]/50 border border-[#374151]/50 flex items-center justify-center text-sm font-bold text-gray-400 shrink-0">
            {otherName ? `${otherName.charAt(0)}${otherName.split(" ")[1]?.charAt(0) || ""}` : "?"}
          </div>
          <div>
            <h2 className="font-bold text-white leading-tight text-sm">{otherName || "Utilisateur"}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              {avisTitle && <span className="text-xs text-gray-500">Re: {avisTitle}</span>}
              {conversation?.statut && (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide border ${statusLabels[conversation.statut]?.className || "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
                  {statusLabels[conversation.statut]?.label || conversation.statut}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto border-x border-[#1f2937]/80 bg-[#0b0f17]/80 px-4 py-4 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <MessageCircle className="h-8 w-8 text-gray-600 mb-2" />
            <p className="text-gray-500 text-sm font-medium">Aucun message pour l&apos;instant.</p>
            <p className="text-gray-600 text-xs mt-1">Commencez la conversation ci-dessous.</p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.type === "SYSTEM") {
              return (
                <div key={msg.id} className="flex justify-center">
                  <span className="text-[10px] text-gray-500 bg-[#1f2937]/40 border border-[#374151]/50 rounded-full px-3 py-1">
                    {msg.contenu}
                  </span>
                </div>
              );
            }

            const isMe = msg.auteur?.id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} group`}>
                <div
                  className={`relative max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isMe
                      ? "bg-gradient-to-br from-[#ef4444] to-[#dc2626] text-white rounded-br-none"
                      : "bg-[#1f2937]/60 text-gray-200 border border-[#374151]/50 rounded-bl-none"
                  }`}
                >
                  {!isMe && (
                    <p className="text-[10px] font-bold tracking-wide uppercase mb-1 text-gray-400">
                      {msg.auteur?.prenom} {msg.auteur?.nom}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.contenu}</p>
                  <div className="flex items-center justify-end gap-1.5 mt-1.5">
                    <span className={`text-[9px] font-medium ${isMe ? "text-white/60" : "text-gray-500"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isMe && (
                      <span className={`text-[9px] font-semibold ${msg.lu ? "text-green-300" : "text-white/50"}`}>
                        {msg.lu ? "Lu" : "Envoyé"}
                      </span>
                    )}
                    {!isMe && (
                      <button
                        onClick={() => openReportModal(msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400 ml-1"
                        title="Signaler ce message"
                      >
                        <Flag className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="rounded-b-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-3 flex gap-2"
      >
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrire un message..."
          disabled={sending}
          className="flex-1 h-10 text-sm rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-white placeholder-gray-600 focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all duration-200 px-3"
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transition-all duration-200 shadow-md shadow-[#ef4444]/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setReportModalOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-xl border border-[#1f2937]/80 bg-[#0e1420] shadow-2xl shadow-black/40 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[#1f2937]/50">
              <h2 className="text-base font-bold text-white tracking-tight">Signaler ce message</h2>
              <button onClick={() => setReportModalOpen(false)} className="w-7 h-7 rounded-lg border border-[#1f2937]/80 flex items-center justify-center hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 transition-all">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-400">Décrivez pourquoi vous souhaitez signaler ce message.</p>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={4}
                placeholder="Raison du signalement..."
                className="w-full text-sm rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-white placeholder-gray-600 focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all duration-200 px-3 py-2.5 resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setReportModalOpen(false)}
                  className="text-xs font-medium h-9 px-4 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-300 hover:text-white hover:border-[#1f2937] transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReport}
                  disabled={!reportReason.trim() || reporting}
                  className="text-xs font-semibold h-9 px-4 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transition-all duration-200 shadow-md shadow-[#ef4444]/10 disabled:opacity-50"
                >
                  {reporting ? "Signalement..." : "Signaler"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  );
}