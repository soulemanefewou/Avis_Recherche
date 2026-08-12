"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { usePathname } from "next/navigation";
import {
  Search,
  Bell,
  MessageCircle,
  User,
  LogOut,
  Menu,
  X,
  Home,
  PlusCircle,
  Shield,
  LayoutDashboard,
  FileSearch,
  Flag,
  BarChart3,
  ChevronDown,
  Building2,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";

const COMMISSARIAT_LINKS = [
  { href: "/commissariat", label: "Dashboard", icon: LayoutDashboard, desc: "Vue d'ensemble" },
  { href: "/commissariat/avis", label: "Mes avis", icon: FileSearch, desc: "Avis officiels" },
  { href: "/commissariat/avis/create", label: "Publier", icon: PlusCircle, desc: "Nouvel avis" },
  { href: "/commissariat/signalements", label: "Signalements", icon: Flag, desc: "Témoignages reçus" },
  { href: "/commissariat/conversations", label: "Conversations", icon: MessageCircle, desc: "Messagerie" },
  { href: "/commissariat/statistiques", label: "Statistiques", icon: BarChart3, desc: "Analyses" },
  { href: "/commissariat/profil", label: "Profil", icon: User, desc: "Paramètres" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      api
        .get("/api/notifications/unread/count")
        .then((res) => setUnreadCount(res.data.data?.count || 0))
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isCommissariat =
    user?.roles.includes("ROLE_COMMISSARIAT") &&
    !user.roles.includes("ROLE_FONDATEUR") &&
    !user.roles.includes("ROLE_SUPER_ADMIN");

  const isInCommissariat = pathname.startsWith("/commissariat");

  const navLinks = user
    ? [
        { href: "/", label: "Accueil", icon: Home },
        ...(user.roles.includes("ROLE_FONDATEUR")
          ? [{ href: "/admin", label: "Admin", icon: Shield }]
          : []),
        ...(user.roles.includes("ROLE_SUPER_ADMIN") && !user.roles.includes("ROLE_FONDATEUR")
          ? [{ href: "/super-admin", label: "Super Admin", icon: Shield }]
          : []),
        ...(!isCommissariat
          ? [
              { href: "/avis/create", label: "Publier", icon: PlusCircle },
              { href: "/conversations", label: "Messages", icon: MessageCircle },
              { href: "/profile", label: "Profil", icon: User },
            ]
          : []),
        { href: "/notifications", label: "Notifications", icon: Bell, badge: unreadCount },
      ]
    : [
        { href: "/login", label: "Connexion", icon: User },
        { href: "/register", label: "Inscription", icon: PlusCircle },
      ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/commissariat") return pathname === "/commissariat";
    return pathname.startsWith(href);
  };

  const renderNavLink = (link: { href: string; label: string; icon: React.ElementType; badge?: number }) => {
    const active = isActive(link.href);
    return (
      <Link
        key={link.href}
        href={link.href}
        className={`group relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          active
            ? "text-white"
            : "text-gray-400 hover:text-gray-200"
        }`}
      >
        <link.icon className={`h-4 w-4 transition-colors duration-200 ${
          active ? "text-[#ef4444]" : "text-gray-500 group-hover:text-gray-300"
        }`} />
        {link.label}
        {active && (
          <span className="absolute inset-0 rounded-lg bg-white/5 border border-white/10 animate-scale-in" />
        )}
        {link.badge !== undefined && link.badge > 0 && (
          <span className="relative flex items-center justify-center bg-[#ef4444] text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 border border-[#0b0f17] animate-scale-in">
            {link.badge > 99 ? "99+" : link.badge}
          </span>
        )}
      </Link>
    );
  };

  const renderMobileLink = (link: { href: string; label: string; icon: React.ElementType; badge?: number }) => (
    <Link
      key={link.href}
      href={link.href}
      onClick={() => setMobileOpen(false)}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
        isActive(link.href)
          ? "bg-white/10 text-white border border-white/10"
          : "text-gray-400 hover:text-white hover:bg-white/5"
      }`}
    >
      <link.icon className={`h-5 w-5 ${isActive(link.href) ? "text-[#ef4444]" : "text-gray-500"}`} />
      {link.label}
      {link.badge !== undefined && link.badge > 0 && (
        <span className="ml-auto bg-[#ef4444] text-white text-xs font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
          {link.badge > 99 ? "99+" : link.badge}
        </span>
      )}
    </Link>
  );

  return (
    <>
      <nav className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-[#0b0f17]/80 backdrop-blur-xl border-b border-[#1f2937]/80 shadow-2xl"
          : "bg-[#0b0f17]/60 backdrop-blur-md border-b border-[#1f2937]/50"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="group flex items-center gap-2.5 shrink-0">
              <div className="relative flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-[#ef4444] to-[#dc2626] shadow-lg shadow-[#ef4444]/20 transition-transform duration-300 group-hover:scale-105">
                <Search className="h-5 w-5 text-white" />
              </div>
              <span className="hidden sm:inline font-extrabold text-base tracking-tight text-white/90 group-hover:text-white transition-colors">
                Avis de Recherche
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(renderNavLink)}

              {isCommissariat && (
                <div ref={dropdownRef} className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={`group flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isInCommissariat
                        ? "text-white"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <Building2 className={`h-4 w-4 ${
                      isInCommissariat ? "text-[#ef4444]" : "text-gray-500 group-hover:text-gray-300"
                    }`} />
                    <span>Commissariat</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      dropdownOpen ? "rotate-180" : ""
                    } ${isInCommissariat ? "text-[#ef4444]" : "text-gray-500 group-hover:text-gray-300"}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-[#0e1420]/95 backdrop-blur-xl border border-[#1f2937] rounded-xl shadow-2xl py-2 z-50 animate-scale-in origin-top-right">
                      <div className="px-4 pb-2 mb-2 border-b border-[#1f2937]/50">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Menu Commissariat</p>
                      </div>
                      {COMMISSARIAT_LINKS.map((cl) => {
                        const active = isActive(cl.href);
                        return (
                          <Link
                            key={cl.href}
                            href={cl.href}
                            onClick={() => setDropdownOpen(false)}
                            className={`group flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-150 ${
                              active
                                ? "bg-white/10 text-white font-medium"
                                : "text-gray-400 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <span className={`flex items-center justify-center h-8 w-8 rounded-lg ${
                              active
                                ? "bg-[#ef4444]/10 text-[#ef4444]"
                                : "bg-white/5 text-gray-500 group-hover:text-gray-300"
                            }`}>
                              <cl.icon className="h-4 w-4" />
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{cl.label}</p>
                              <p className="text-xs text-gray-500">{cl.desc}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-600" />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {user && (
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all duration-200 cursor-pointer ml-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden lg:inline">Déconnexion</span>
                </button>
              )}
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden relative h-10 w-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all focus:outline-none"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed left-0 right-0 top-[64px] z-50 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/95 backdrop-blur-xl shadow-2xl shadow-black/40 animate-scale-in origin-top overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="py-2">
              <div className="space-y-0.5 px-2">
                {navLinks.map(renderMobileLink)}
              </div>

              {isCommissariat && (
                <div className="mt-2 pt-2 border-t border-[#1f2937]/50 px-2">
                  <div className="flex items-center gap-2 px-2 py-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Commissariat</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {COMMISSARIAT_LINKS.map((cl) => {
                      const active = isActive(cl.href);
                      return (
                        <Link
                          key={cl.href}
                          href={cl.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            active
                              ? "bg-white/10 text-white"
                              : "text-gray-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <span className={`flex items-center justify-center h-7 w-7 rounded-md ${
                            active ? "bg-[#ef4444]/10 text-[#ef4444]" : "bg-white/5 text-gray-500"
                          }`}>
                            <cl.icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-xs">{cl.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {user && (
                <div className="mt-2 pt-2 border-t border-[#1f2937]/50 px-2">
                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-all cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}