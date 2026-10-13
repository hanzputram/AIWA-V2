"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  MessageSquare,
  Users,
  Package,
  BarChart3,
  Settings,
  FileText,
  Layers,
  Bot,
  LogOut,
  Search,
  Bell,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Zap,
  MessageCircle,
  UserCheck,
  DollarSign,
  Clock,
  Activity,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Sliders,
  ExternalLink,
  Play,
  Eye,
  FileCheck,
  Check,
  Filter,
  X,
  QrCode,
  Smartphone,
  Globe,
  Monitor,
  Radio,
  Power,
  Copy,
  AlertTriangle,
  Key,
  Terminal,
  Laptop,
  Plus,
  Trash2,
  Pencil,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  CheckCheck,
  User,
  Building2,
  MapPin,
  Briefcase,
} from "lucide-react";

// ===== SIDEBAR COMPONENT =====
function Sidebar({
  active,
  onNavigate,
  unreadCount = 0,
}: {
  active: string;
  onNavigate: (page: string) => void;
  unreadCount?: number;
}) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "playwright", label: "Koneksi WhatsApp", icon: QrCode, badge: "Scan" },
    {
      id: "inbox",
      label: "Inbox",
      icon: MessageSquare,
      badge: unreadCount > 0 ? (unreadCount > 99 ? "99+" : String(unreadCount)) : undefined,
    },
    { id: "pipeline", label: "Pipeline", icon: Layers },
    { id: "contacts", label: "Kontak", icon: Users },
    { id: "catalog", label: "Katalog", icon: Package },
    { id: "documents", label: "Dokumen", icon: FileText },
    { id: "analytics", label: "Analitik", icon: BarChart3 },
    { id: "playground", label: "Playground", icon: Bot },
    { id: "settings", label: "Pengaturan", icon: Settings },
  ];

  return (
    <aside className="w-[260px] h-screen bg-surface border-r border-border-light flex flex-col fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border-light">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-sm">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-text-primary">
              AIWA
            </h1>
            <p className="text-[10px] font-medium text-text-muted tracking-widest uppercase">
              v2.0 Platform
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`sidebar-link w-full ${active === item.id ? "active" : ""}`}
          >
            <item.icon className="w-[18px] h-[18px] shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span
                className={`min-w-[20px] h-5 rounded-full ${
                  item.id === "inbox" ? "bg-emerald-600 text-white animate-pulse" : "bg-primary-600 text-white"
                } text-[11px] font-bold flex items-center justify-center px-1.5 shadow-2xs`}
              >
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-border-light">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary-700">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              Admin
            </p>
            <p className="text-xs text-text-muted truncate">Owner</p>
          </div>
          <button className="btn-ghost p-1.5">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ===== HEADER COMPONENT =====
function Header({
  title,
  subtitle,
  unreadCount = 0,
  onNavigate,
}: {
  title: string;
  subtitle?: string;
  unreadCount?: number;
  onNavigate?: (page: string) => void;
}) {
  return (
    <header className="h-16 bg-surface border-b border-border-light flex items-center justify-between px-6 sticky top-0 z-20">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        {subtitle && (
          <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Cari..."
            className="input pl-9 w-56 h-9 text-sm"
          />
        </div>
        <button
          onClick={() => onNavigate?.("inbox")}
          className="btn-ghost p-2 relative hover:bg-slate-100 transition-colors"
          title={unreadCount > 0 ? `${unreadCount} pesan belum dibaca di Inbox` : "Notifikasi"}
        >
          <Bell className="w-[18px] h-[18px] text-text-secondary" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-emerald-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs animate-scale-up">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

// ===== STAT CARD =====
function StatCard({
  label,
  value,
  change,
  changeType,
  icon: Icon,
}: {
  label: string;
  value: string;
  change: string;
  changeType: "up" | "down" | "neutral";
  icon: any;
}) {
  return (
    <div className="card stat-card card-hover animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value">{value}</p>
          <div
            className={`stat-change flex items-center gap-1 ${
              changeType === "up"
                ? "text-success"
                : changeType === "down"
                  ? "text-danger"
                  : "text-text-muted"
            }`}
          >
            {changeType === "up" ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : changeType === "down" ? (
              <TrendingDown className="w-3.5 h-3.5" />
            ) : null}
            <span>{change}</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary-600" />
        </div>
      </div>
    </div>
  );
}

// ===== DASHBOARD PAGE =====
function DashboardPage({
  onNavigate,
  conversations = [],
  unreadCount = 0,
  onSelectChat,
  sessionStatus = "disconnected",
  qrCodeData = null,
}: {
  onNavigate?: (page: string) => void;
  conversations?: any[];
  unreadCount?: number;
  onSelectChat?: (phone: string) => void;
  sessionStatus?: string;
  qrCodeData?: string | null;
}) {
  const recentConversations = conversations.slice(0, 6);

  const stageBadge: Record<string, string> = {
    new: "badge-slate",
    qualified: "badge-blue",
    proposal: "badge-amber",
    negotiation: "badge-orange",
    won: "badge-green",
    lost: "badge-red",
  };

  const stageLabel: Record<string, string> = {
    new: "Baru",
    qualified: "Terkualifikasi",
    proposal: "Penawaran",
    negotiation: "Negosiasi",
    won: "Menang",
    lost: "Kalah",
  };

  const pipelineDistribution = useMemo(() => {
    const total = conversations.length || 1;
    const stages = [
      { key: "new", stage: "Baru", color: "bg-slate-400" },
      { key: "qualified", stage: "Terkualifikasi", color: "bg-blue-500" },
      { key: "proposal", stage: "Penawaran", color: "bg-amber-500" },
      { key: "negotiation", stage: "Negosiasi", color: "bg-orange-500" },
      { key: "won", stage: "Menang", color: "bg-emerald-500" },
    ];
    return stages.map((s) => {
      const count = conversations.filter((c) => c.stage === s.key).length;
      const pct = conversations.length > 0 ? Math.round((count / total) * 100) : 0;
      return { stage: s.stage, count, pct, color: s.color };
    });
  }, [conversations]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Percakapan Aktif"
          value={conversations.length > 0 ? `${conversations.length}` : "0"}
          change={unreadCount > 0 ? `${unreadCount} pesan belum dibaca` : (conversations.length > 0 ? "Semua pesan aktif" : "Belum ada pesan masuk")}
          changeType={unreadCount > 0 ? "up" : "neutral"}
          icon={MessageCircle}
        />
        <StatCard
          label="Lead Terkualifikasi"
          value={String(conversations.filter((c) => c.stage !== "new").length)}
          change={`${conversations.filter((c) => c.stage === "proposal" || c.stage === "negotiation").length} dalam tahap negosiasi/penawaran`}
          changeType={conversations.length > 0 ? "up" : "neutral"}
          icon={UserCheck}
        />
        <StatCard
          label="Pipeline Terbuka"
          value={conversations.length > 0 ? `${conversations.length} Prospek` : "Rp 0"}
          change="Pelanggan WhatsApp aktif"
          changeType={conversations.length > 0 ? "up" : "neutral"}
          icon={DollarSign}
        />
        <StatCard
          label="Waktu Respons AI"
          value="< 2 detik"
          change="Claude 4.5 Auto-Reply Aktif"
          changeType="up"
          icon={Clock}
        />
      </div>

      {/* WhatsApp Playwright Connect Hero Banner */}
      {sessionStatus === "connected" ? (
        <div className="card p-4.5 bg-gradient-to-r from-emerald-50/90 via-white to-blue-50/50 border border-emerald-100/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#075e54] text-white flex items-center justify-center shadow-xs shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-text-primary">Koneksi WhatsApp Web (Playwright)</h4>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Terhubung
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                WhatsApp nomor bisnis Anda terhubung via browser Chrome anti-deteksi dengan AI Auto-Sales aktif.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate?.("playwright")}
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-2 shrink-0 self-start sm:self-auto bg-[#075e54] hover:bg-[#128c7e]"
          >
            <Smartphone className="w-4 h-4" />
            <span>Kelola Sesi & Layar</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="card p-4.5 bg-gradient-to-r from-amber-50/90 via-white to-orange-50/40 border border-amber-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3.5">
            {qrCodeData ? (
              <img
                src={qrCodeData}
                alt="Scan WhatsApp QR"
                className="w-16 h-16 rounded-lg border border-amber-300 shadow-2xs shrink-0 cursor-pointer object-contain bg-white p-1"
                onClick={() => onNavigate?.("playwright")}
                title="Klik untuk memperbesar QR Code"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-text-primary">Koneksi WhatsApp Web Belum Terhubung</h4>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  Perlu Scan QR Code
                </span>
              </div>
              <p className="text-xs text-amber-900/80 mt-1">
                Silakan scan kode QR dengan WhatsApp di HP Anda (Buka WhatsApp &rarr; Titik Tiga / Pengaturan &rarr; <strong>Perangkat Tertaut</strong>).
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate?.("playwright")}
            className="btn-primary text-xs py-2.5 px-4 flex items-center gap-2 shrink-0 self-start sm:self-auto bg-[#075e54] hover:bg-[#128c7e] text-white shadow-sm"
          >
            <QrCode className="w-4 h-4" />
            <span>Pindai QR WhatsApp Sekarang</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Conversations */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-5 py-4 border-b border-border-light flex items-center justify-between bg-surface-secondary/40">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                Percakapan Terbaru
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Aktivitas WhatsApp real-time ({conversations.length} kontak aktif)
              </p>
            </div>
            <button onClick={() => onNavigate?.("inbox")} className="btn-ghost text-xs flex items-center gap-1 text-primary-700 font-medium">
              Lihat semua <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-border-light">
            {recentConversations.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-text-primary">Belum Ada Percakapan Aktif</p>
                <p className="text-xs text-text-muted max-w-sm mx-auto">
                  Pesan masuk dari pelanggan melalui WhatsApp akan langsung tampil di sini secara real-time.
                </p>
              </div>
            ) : (
              recentConversations.map((conv, i) => (
                <div
                  key={conv.id || i}
                  onClick={() => {
                    onSelectChat?.(conv.wa || conv.id);
                    onNavigate?.("inbox");
                  }}
                  className="px-5 py-3.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-200/60 shadow-2xs relative">
                      {conv.name ? conv.name.replace(/\D/g, "")[0] || conv.name[0] : "W"}
                      {conv.unread > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center shadow-xs animate-scale-up">
                          {conv.unread > 9 ? "9+" : conv.unread}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {conv.name}
                        </p>
                        <span className="text-xs text-text-muted shrink-0">•</span>
                        <span className="text-xs text-text-muted truncate">
                          {conv.wa || conv.company}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5 truncate leading-relaxed">
                        {conv.lastMsg}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={`badge ${stageBadge[conv.stage] || "badge-slate"}`}>
                      {stageLabel[conv.stage] || "Baru"}
                    </span>
                    {conv.mode === "ai" ? (
                      <span className="badge badge-green text-[11px] font-medium flex items-center gap-1">
                        <Bot className="w-3.5 h-3.5" />
                        AI
                      </span>
                    ) : (
                      <span className="badge badge-blue text-[11px] font-medium flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        Manual
                      </span>
                    )}
                    <span className="text-xs text-text-muted w-20 text-right font-mono">
                      {conv.time}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pipeline Summary */}
        <div className="card">
          <div className="px-5 py-4 border-b border-border-light">
            <h3 className="text-sm font-semibold text-text-primary">
              Pipeline
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Distribusi tahap deal ({conversations.length} deal aktif)
            </p>
          </div>
          <div className="px-5 py-4 space-y-4">
            {pipelineDistribution.map((item) => (
              <div key={item.stage} className="animate-fade-in">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-text-secondary font-medium">
                    {item.stage}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">
                      {item.count}
                    </span>
                    <span className="text-text-muted text-xs">
                      ({item.pct}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-surface-hover rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${item.color} transition-all duration-700 ease-out`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* AI Performance */}
          <div className="px-5 py-4 border-t border-border-light">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Performa AI
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-text-primary">100%</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Tingkat Resolusi
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-text-primary">4.9</p>
                <p className="text-xs text-text-muted mt-0.5">Rating Avg</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="card">
        <div className="px-5 py-4 border-b border-border-light flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary-600" />
          <h3 className="text-sm font-semibold text-text-primary">
            Aktivitas Terkini
          </h3>
        </div>
        <div className="px-5 py-3 flex flex-wrap gap-2">
          {conversations.slice(0, 3).map((c, i) => (
            <div
              key={i}
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-surface-secondary border border-border-light text-xs text-text-secondary animate-slide-in"
            >
              💬 <strong>{c.name}:</strong> &quot;{c.lastMsg.slice(0, 45)}...&quot;
            </div>
          ))}
          <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-surface-secondary border border-border-light text-xs text-text-secondary">
            ✅ Sistem AI Sales siap menerima percakapan WhatsApp
          </div>
          <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-surface-secondary border border-border-light text-xs text-text-secondary">
            📦 Database katalog aktif (41.255 produk real tersinkronisasi)
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== INBOX PAGE =====
function InboxPage({
  initialConversations = [],
  selectedPhone,
  onSelectPhone,
  onRefresh,
}: {
  initialConversations?: any[];
  selectedPhone?: string | null;
  onSelectPhone?: (phone: string | null) => void;
  onRefresh?: () => void;
}) {
  const PLAYWRIGHT_URL = "http://localhost:3001";
  const [selectedConv, setSelectedConv] = useState(0);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [isLiveWA, setIsLiveWA] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [conversations, setConversations] = useState<any[]>(initialConversations);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [triggeringAi, setTriggeringAi] = useState(false);

  // Contact edit / rename / save state
  const [showEditContactModal, setShowEditContactModal] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [contactToast, setContactToast] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    company: "",
    project: "",
    budget: "",
    stage: "proposal",
    address: "",
    notes: "",
  });

  // Sync real chats from /api/webhooks/playwright (unified endpoint)
  const syncLiveChats = useCallback(async () => {
    try {
      const whRes = await fetch(`/api/webhooks/playwright`).catch(() => null);
      if (whRes && whRes.ok) {
        const whData = await whRes.json();
        if (whData.ok && Array.isArray(whData.conversations) && whData.conversations.length > 0) {
          setIsLiveWA(true);
          setConversations((prev) => {
            return whData.conversations.map((liveChat: any, idx: number) => {
              const isCurrent = idx === selectedConv || (prev[selectedConv] && prev[selectedConv].wa === liveChat.wa);
              return {
                ...liveChat,
                unread: isCurrent ? 0 : liveChat.unread,
                company: liveChat.company || "Kontak WhatsApp",
              };
            });
          });
          return;
        }
      }

      // Direct fallback to Playwright service if needed
      const res = await fetch(`${PLAYWRIGHT_URL}/sessions/default/chats`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.chats) && data.chats.length > 0) {
          setIsLiveWA(true);
          setConversations((prev) => {
            return data.chats.map((liveChat: any, idx: number) => {
              const isCurrent = idx === selectedConv || (prev[selectedConv] && prev[selectedConv].name === liveChat.name);
              return {
                ...liveChat,
                unread: isCurrent ? 0 : liveChat.unread,
                company: liveChat.company || "Kontak WhatsApp",
              };
            });
          });
        }
      }
    } catch (err) {}
  }, [selectedConv]);

  // Keep conversations updated when parent passes new initialConversations
  useEffect(() => {
    if (initialConversations && initialConversations.length > 0) {
      setConversations(initialConversations);
      setIsLiveWA(true);
    }
  }, [initialConversations]);

  // Auto-select conversation when selectedPhone is provided (e.g. from Dashboard or Pipeline)
  useEffect(() => {
    if (selectedPhone && conversations.length > 0) {
      const cleanTarget = selectedPhone.replace(/\D/g, "");
      const foundIdx = conversations.findIndex((c) => {
        const cDigits = (c.wa || c.id || c.name || "").replace(/\D/g, "");
        return cDigits.includes(cleanTarget) || cleanTarget.includes(cDigits);
      });
      if (foundIdx !== -1) {
        setSelectedConv(foundIdx);
        handleSelectConv(foundIdx, conversations[foundIdx]);
        onSelectPhone?.(null);
      }
    }
  }, [selectedPhone, conversations.length]);

  useEffect(() => {
    syncLiveChats();
    const interval = setInterval(syncLiveChats, 3000);
    return () => clearInterval(interval);
  }, [syncLiveChats]);

  // Click / Open conversation -> immediately clear old history & notification badge
  const handleSelectConv = async (idx: number, explicitTarget?: any) => {
    setSelectedConv(idx);
    const target = explicitTarget || conversations[idx];
    if (!target) return;

    setLoadingChat(true);

    // 1. Immediately clear unread notification badge locally!
    setConversations((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, unread: 0 } : c))
    );

    // 2. Immediately show existing messages if available in target
    const existingMsgs = target.messages || target.webhookMessages || [];
    if (existingMsgs.length > 0) {
      setMessages(existingMsgs);
    } else {
      setMessages([]);
    }

    // 3. Mark as read on the server via PATCH
    const phoneToMark = target.wa || target.id;
    if (phoneToMark) {
      fetch(`/api/webhooks/playwright`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneToMark }),
      })
        .then(() => onRefresh?.())
        .catch(() => {});
    }

    // 4. Load live messages from Playwright WhatsApp Web
    try {
      const res = await fetch(`${PLAYWRIGHT_URL}/sessions/default/chats/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          index: target.index ?? idx,
          name: target.name,
          phone: target.wa,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages);
        }
      }
    } catch (e) {
    } finally {
      setLoadingChat(false);
    }
  };

  // Auto load first chat if live WA is ready and messages are empty
  useEffect(() => {
    if (conversations.length > 0 && messages.length === 0 && conversations[selectedConv]) {
      handleSelectConv(selectedConv, conversations[selectedConv]);
    }
  }, [conversations.length]);

  // Manual Trigger AI Reply for current conversation
  const handleAiReplyNow = async () => {
    const target = conversations[selectedConv];
    if (!target || !target.wa || triggeringAi) return;
    setTriggeringAi(true);
    try {
      const lastCustomerMsg = [...messages].reverse().find((m) => m.sender === "customer");
      const textToReply = lastCustomerMsg ? lastCustomerMsg.body : (target.lastMsg || "halo");
      const cleanPhone = (target.wa || "").replace(/\D/g, "");

      await fetch("/api/webhooks/playwright", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "trigger_ai_reply",
          phone: cleanPhone,
          text: textToReply,
          sessionId: "default",
        }),
      });

      // Reload chat messages after 3s to show newly sent AI reply
      setTimeout(() => {
        handleSelectConv(selectedConv);
      }, 3200);
    } catch (e) {
    } finally {
      setTriggeringAi(false);
    }
  };

  // Send message manually
  const handleSendMessage = async () => {
    if (!inputText.trim() || sending) return;
    const text = inputText.trim();
    setInputText("");
    const target = conversations[selectedConv];

    const newMsg = {
      id: Date.now(),
      sender: "ai" as const,
      body: text,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMsg]);

    // Send via Playwright WhatsApp Web
    if (target && target.wa) {
      setSending(true);
      try {
        await fetch(`${PLAYWRIGHT_URL}/messages/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: "default",
            to: target.wa,
            text,
          }),
        });
      } catch (err) {} finally {
        setSending(false);
      }
    }
  };

  // Open edit / save contact modal
  const handleOpenEditContact = () => {
    const cur = conversations[selectedConv];
    if (!cur) return;
    setContactForm({
      name: cur.name && !cur.name.startsWith("+") && !cur.name.startsWith("62") ? cur.name : (cur.company !== "Kontak WhatsApp" ? cur.company : ""),
      company: cur.company !== "Kontak WhatsApp" ? cur.company : "",
      project: cur.project && cur.project !== "-" ? cur.project : "",
      budget: cur.budget && cur.budget !== "-" ? cur.budget : "",
      stage: cur.stage || "proposal",
      address: cur.address || "",
      notes: cur.notes || "",
    });
    setShowEditContactModal(true);
  };

  // Smart Autofill from recent chat messages
  const handleAutofillFromChat = () => {
    let detectedName = "";
    let detectedCompany = "";
    let detectedAddress = "";
    let detectedBudget = "";

    const reversed = [...messages].reverse();
    for (const msg of reversed) {
      const text = msg.body || "";
      const lines = text.split("\n").map((l: string) => l.trim()).filter(Boolean);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Detect PT, CV, UD, TOKO, PD
        if (!detectedCompany && /^(PT|CV|UD|TOKO|PD|TB)\b/i.test(line)) {
          detectedCompany = line;
          if (!detectedName) detectedName = line;
        }
        // Detect Street Address / Alamat
        if (!detectedAddress && /(JALAN|JL\.|JL|DUKUH|KAVLING|KOMPLEK|BLOK|RUKO|DESA|KECAMATAN|KELURAHAN|RT\/RW|NO\.|NOMOR)\b/i.test(line)) {
          detectedAddress = line;
        }
      }
      // Detect Total / Rp for budget
      const budgetMatch = text.match(/Rp\s*([\d\.,]+)/i) || text.match(/Total:\s*Rp\s*([\d\.,]+)/i);
      if (budgetMatch && !detectedBudget) {
        detectedBudget = `Rp ${budgetMatch[1]}`;
      }
    }

    setContactForm((prev) => ({
      ...prev,
      name: detectedName || prev.name || (conversations[selectedConv]?.name?.startsWith("+") ? "" : conversations[selectedConv]?.name) || "",
      company: detectedCompany || prev.company || "",
      address: detectedAddress || prev.address || "",
      budget: detectedBudget || prev.budget || "",
    }));

    setContactToast("✨ Berhasil mengekstrak data dari chat!");
    setTimeout(() => setContactToast(null), 3000);
  };

  // Save contact to backend API
  const handleSaveContact = async () => {
    const cur = conversations[selectedConv];
    if (!cur) return;
    const phone = cur.wa || cur.id;
    if (!phone) return;

    if (!contactForm.name.trim()) {
      alert("Silakan masukkan nama kontak atau perusahaan");
      return;
    }

    setSavingContact(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          name: contactForm.name.trim(),
          company: contactForm.company.trim() || contactForm.name.trim(),
          project: contactForm.project.trim() || "-",
          budget: contactForm.budget.trim() || "-",
          stage: contactForm.stage,
          address: contactForm.address.trim(),
          notes: contactForm.notes.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update local state immediately
        setConversations((prev) =>
          prev.map((c, i) =>
            i === selectedConv
              ? {
                  ...c,
                  name: contactForm.name.trim(),
                  company: contactForm.company.trim() || contactForm.name.trim(),
                  project: contactForm.project.trim() || "-",
                  budget: contactForm.budget.trim() || "-",
                  stage: contactForm.stage,
                  address: contactForm.address.trim(),
                  notes: contactForm.notes.trim(),
                  isSaved: true,
                }
              : c
          )
        );
        setShowEditContactModal(false);
        setContactToast("✓ Kontak berhasil disimpan!");
        setTimeout(() => setContactToast(null), 3500);
        syncLiveChats();
        onRefresh?.();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Gagal menyimpan: ${err.error || "Terjadi kesalahan"}`);
      }
    } catch (e: any) {
      alert(`Gagal menyimpan kontak: ${e.message}`);
    } finally {
      setSavingContact(false);
    }
  };

  const conv = conversations[selectedConv] || conversations[0] || initialConversations[0];

  // Dynamically detect discussed products from conversation messages
  const discussedProducts: string[] = useMemo(() => {
    if (conv?.products && Array.isArray(conv.products) && conv.products.length > 0) {
      return conv.products;
    }
    const found = new Set<string>();
    const allText = messages.map((m) => m.body).join(" ").toLowerCase();
    if (allText.includes("kabel") || allText.includes("nym") || allText.includes("nyy") || allText.includes("nyaf")) {
      found.add("Kabel Supreme / NYM / NYAF");
    }
    if (allText.includes("mcb") || allText.includes("schneider") || allText.includes("domae") || allText.includes("ic60n")) {
      found.add("MCB Schneider Electric");
    }
    if (allText.includes("acb") || allText.includes("circuit breaker")) {
      found.add("ACB (Air Circuit Breaker)");
    }
    if (allText.includes("konduit") || allText.includes("pipa")) {
      found.add("Pipa Konduit Clipsal / Schneider");
    }
    if (allText.includes("broco") || allText.includes("saklar") || allText.includes("stop kontak")) {
      found.add("Saklar / Stop Kontak Broco");
    }
    return Array.from(found);
  }, [messages, conv]);

  // Dynamically detect active negotiation
  const activeNego = useMemo(() => {
    if (conv?.activeNegotiation) return conv.activeNegotiation;
    const allText = messages.map((m) => m.body).join(" ").toLowerCase();
    if (allText.includes("diskon") || allText.includes("nego") || allText.includes("best price") || allText.includes("penawaran")) {
      const discMatch = allText.match(/(\d+)%/);
      const discText = discMatch ? `Diskon tertera: ${discMatch[1]}%` : "Penawaran Khusus Proyek";
      return {
        code: discussedProducts[0] || "PEN-ARAYA-2026",
        desc: discText,
        pct: discMatch ? Math.min(Number(discMatch[1]) * 2, 100) : 45,
      };
    }
    return null;
  }, [messages, conv, discussedProducts]);
  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMsg.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-64px)] -mx-6 -mt-6">
      {/* Conversation List */}
      <div className="w-[340px] border-r border-border-light bg-surface flex flex-col">
        <div className="p-3 border-b border-border-light space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Percakapan
            </span>
            {isLiveWA ? (
              <span className="badge badge-green text-[10px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live WhatsApp
              </span>
            ) : (
              <span className="badge badge-slate text-[10px]">Demo Mode</span>
            )}
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Cari kontak atau pesan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-9 h-9 text-xs"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-text-muted">
              <MessageSquare className="w-8 h-8 text-primary-400/40 mb-2" />
              <p className="text-xs font-semibold text-text-secondary">Belum ada percakapan</p>
              <p className="text-[11px] text-text-muted mt-1">Pesan WhatsApp masuk akan tampil di sini secara real-time</p>
            </div>
          ) : (
            filteredConversations.map((c, i) => {
              const actualIndex = conversations.indexOf(c);
              const isSelected = actualIndex === selectedConv;
              return (
                <button
                  key={c.id || actualIndex}
                  onClick={() => handleSelectConv(actualIndex)}
                  className={`w-full px-4 py-3 flex items-start gap-3 text-left border-b border-border-light transition-colors ${
                    isSelected
                      ? "bg-primary-50/70 border-l-3 border-l-primary-600"
                      : "hover:bg-surface-hover"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs font-bold text-sm text-primary-700">
                    {c.name ? c.name[0].toUpperCase() : "W"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {c.name}
                        </p>
                        {c.isSaved && (
                          <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0" title="Kontak Tersimpan">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-text-muted shrink-0 font-mono">
                        {c.time}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted truncate mt-0.5">{c.company || c.wa}</p>
                    <p className="text-xs text-text-secondary mt-1 truncate">
                      {c.lastMsg}
                    </p>
                  </div>
                  {c.unread > 0 && !isSelected && (
                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-1 shadow-xs animate-scale-up">
                      {c.unread}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area & Contact Panel */}
      {!conv ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-surface-secondary text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-3 border border-primary-100 shadow-2xs">
            <MessageSquare className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-base font-semibold text-text-primary">Kotak Masuk Kosong</h3>
          <p className="text-xs text-text-muted max-w-sm mt-1">
            Belum ada percakapan aktif. Ketika ada customer mengirim pesan ke nomor WhatsApp Anda, percakapan akan otomatis muncul di sini.
          </p>
        </div>
      ) : (
        <>
          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-surface-secondary">
        {/* Chat Header */}
        <div className="h-16 bg-surface border-b border-border-light px-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700">
              {conv.name ? conv.name[0].toUpperCase() : "W"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-text-primary">
                  {conv.name}
                </p>
                <span className={`badge ${conv.mode === "ai" ? "badge-green" : "badge-blue"} text-[10px]`}>
                  {conv.mode === "ai" ? "🤖 AI Auto-Sales" : "👤 Manual"}
                </span>
                {isLiveWA && (
                  <span className="badge badge-slate text-[10px] font-mono">Playwright Web</span>
                )}
              </div>
              <p className="text-xs text-text-muted font-mono">
                {conv.company} {conv.wa ? `· ${conv.wa}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenEditContact}
              className="btn-secondary text-xs flex items-center gap-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 font-semibold px-2.5 py-1.5 rounded-lg shadow-2xs transition-colors"
              title="Ganti nama atau simpan data kontak pelanggan ini"
            >
              <Pencil className="w-3.5 h-3.5 text-blue-600" />
              Ganti Nama / Simpan
            </button>
            <button
              onClick={handleAiReplyNow}
              disabled={triggeringAi}
              className="btn-secondary text-xs flex items-center gap-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
              title="Minta AI Sales Assistant membalas pesan WhatsApp saat ini"
            >
              <Sparkles className={`w-3.5 h-3.5 text-emerald-600 ${triggeringAi ? "animate-spin" : ""}`} />
              {triggeringAi ? "AI Mengetik..." : "AI Balas Sekarang"}
            </button>
            <button
              onClick={syncLiveChats}
              className="btn-ghost p-2 text-text-muted hover:text-text-primary"
              title="Segarkan Chat"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {conv.mode === "ai" ? (
              <button
                onClick={() => {
                  setConversations((prev) =>
                    prev.map((c, i) => (i === selectedConv ? { ...c, mode: "human" } : c))
                  );
                }}
                className="btn-secondary text-xs"
              >
                Ambil Alih Manual
              </button>
            ) : (
              <button
                onClick={() => {
                  setConversations((prev) =>
                    prev.map((c, i) => (i === selectedConv ? { ...c, mode: "ai" } : c))
                  );
                }}
                className="btn-primary text-xs"
              >
                Kembalikan ke AI
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50/70">
          {/* Visual Legend for Send vs Receive */}
          <div className="flex items-center justify-center pt-1 pb-2">
            <div className="inline-flex items-center gap-3 px-3.5 py-1 bg-white/95 border border-slate-200/90 rounded-full text-[11px] shadow-2xs text-slate-600 backdrop-blur-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-2xs inline-block" />
                <span className="text-emerald-800 font-bold">Kanan (Hijau):</span> Kita / AI (Terkirim)
              </span>
              <span className="text-slate-300 font-bold">|</span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-400 inline-block shadow-2xs" />
                <span className="text-slate-800 font-bold">Kiri (Putih):</span> Pelanggan (Masuk)
              </span>
            </div>
          </div>

          {loadingChat && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-text-muted py-12">
              <RefreshCw className="w-8 h-8 text-primary-500 mb-2 animate-spin" />
              <p className="text-sm font-medium">Membuka percakapan WhatsApp...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-text-muted py-12">
              <Bot className="w-10 h-10 text-primary-400 mb-2 opacity-50" />
              <p className="text-sm font-medium">Belum ada riwayat pesan</p>
              <p className="text-xs text-text-muted mt-1">Pesan baru akan muncul di sini secara otomatis</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isCustomer = msg.sender === "customer" || msg.sender === "inbound";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isCustomer ? "justify-start" : "justify-end"} animate-fade-in my-1.5`}
                >
                  <div
                    className={`max-w-[76%] rounded-2xl px-4 py-3 shadow-xs transition-all ${
                      isCustomer
                        ? "bg-white border-2 border-slate-200/95 text-slate-900 rounded-tl-xs shadow-sm"
                        : "bg-emerald-600 text-white rounded-tr-xs shadow-md border border-emerald-500"
                    }`}
                  >
                    {/* Bubble Sender Header */}
                    <div
                      className={`flex items-center justify-between gap-3 pb-1.5 mb-1.5 border-b text-[11px] ${
                        isCustomer ? "border-slate-100 text-slate-600" : "border-emerald-500/50 text-emerald-100"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold">
                        {isCustomer ? (
                          <>
                            <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                              <User className="w-2.5 h-2.5" />
                            </span>
                            <span className="truncate max-w-[170px] text-slate-800 font-bold">
                              {conv.name || "Pelanggan"}
                            </span>
                            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold border border-slate-200 shrink-0">
                              Masuk
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="w-4 h-4 rounded-full bg-emerald-500/60 flex items-center justify-center text-white shrink-0">
                              <Bot className="w-2.5 h-2.5" />
                            </span>
                            <span className="text-white font-bold">AI Sales Assistant</span>
                            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-emerald-700/70 text-emerald-100 font-bold border border-emerald-400/40 shrink-0">
                              Terkirim
                            </span>
                          </>
                        )}
                      </div>
                      <span className={`text-[10px] font-mono shrink-0 ${isCustomer ? "text-slate-400" : "text-emerald-200"}`}>
                        {msg.time}
                      </span>
                    </div>

                    {/* Bubble Message Text */}
                    <p
                      className={`text-[13px] whitespace-pre-line leading-relaxed ${
                        isCustomer ? "text-slate-800 font-normal" : "text-white font-normal"
                      }`}
                    >
                      {msg.body}
                    </p>

                    {/* Bubble Footer */}
                    <div
                      className={`flex items-center justify-end gap-1.5 mt-2 text-[10px] ${
                        isCustomer ? "text-slate-400 font-mono" : "text-emerald-200 font-mono"
                      }`}
                    >
                      <span>{isCustomer ? "Diterima" : "Tersampaikan"}</span>
                      {!isCustomer && <CheckCheck className="w-3.5 h-3.5 text-emerald-200 inline" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <div className="px-5 py-3 bg-surface border-t border-border-light">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder={`Ketik balasan untuk ${conv.name}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="input flex-1 h-10 text-xs"
            />
            <button
              onClick={handleSendMessage}
              disabled={sending || !inputText.trim()}
              className="btn-primary h-10 px-5 flex items-center gap-1.5 text-xs"
            >
              {sending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Kirim
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Contact Panel */}
      <div className="w-[280px] border-l border-border-light bg-surface overflow-y-auto">
        <div className="p-5 border-b border-border-light text-center">
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto">
            <span className="text-2xl font-bold text-primary-700">
              {conv.name ? conv.name[0].toUpperCase() : "W"}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-text-primary mt-3 truncate">
            {conv.name}
          </h3>
          <p className="text-xs text-text-muted truncate">{conv.company || "Kontak Personal"}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="badge badge-green">
              {conv.score ? `Skor: ${conv.score}` : "Lead Baru"}
            </span>
            <span className="badge badge-amber">
              {conv.stage === "negotiation" ? "Negosiasi" : conv.stage === "qualified" ? "Terkualifikasi" : conv.stage === "proposal" ? "Penawaran" : conv.stage || "Inquiry"}
            </span>
          </div>
          <button
            onClick={handleOpenEditContact}
            className="w-full mt-3 py-2 px-3 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
          >
            <Pencil className="w-3.5 h-3.5 text-primary-600" />
            {conv.isSaved ? "Edit Data Kontak" : "Simpan Kontak Ini"}
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Informasi
            </h4>
            <div className="space-y-2">
              {[
                { label: "WhatsApp", value: conv.wa || "-" },
                { label: "Perusahaan", value: conv.company || "Kontak WhatsApp" },
                { label: "Alamat", value: conv.address || "-" },
                { label: "Proyek", value: conv.project || "-" },
                { label: "Budget", value: conv.budget || "-" },
                { label: "Catatan", value: conv.notes || "-" },
              ].map((info) => (
                <div key={info.label} className="flex justify-between text-xs">
                  <span className="text-text-muted">{info.label}</span>
                  <span className="text-text-secondary font-medium truncate max-w-[150px] text-right">
                    {info.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Produk Dibahas
            </h4>
            {discussedProducts.length > 0 ? (
              <div className="space-y-1.5">
                {discussedProducts.map((product) => (
                  <div
                    key={product}
                    className="flex items-center gap-2 text-xs bg-surface-secondary px-3 py-2 rounded-lg"
                  >
                    <Package className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                    <span className="text-text-secondary truncate">{product}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic py-1">Belum ada produk yang dibahas</p>
            )}
          </div>

          <div>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Negosiasi Aktif
            </h4>
            {activeNego ? (
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                <p className="text-xs font-medium text-amber-900 truncate">
                  {activeNego.code}
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {activeNego.desc}
                </p>
                <div className="w-full bg-amber-200 rounded-full h-1.5 mt-2">
                  <div
                    className="h-1.5 rounded-full bg-amber-500"
                    style={{ width: `${activeNego.pct}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-muted italic py-1">Tidak ada negosiasi aktif</p>
            )}
          </div>
        </div>
      </div>
        </>
      )}

      {/* Floating Toast Notification */}
      {contactToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs font-medium flex items-center gap-2 animate-fade-in backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{contactToast}</span>
        </div>
      )}

      {/* Modal Simpan / Ganti Nama Kontak */}
      {showEditContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-border-light shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border-light flex items-center justify-between bg-surface-secondary/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">
                    Simpan & Ganti Nama Kontak
                  </h3>
                  <p className="text-[11px] text-text-muted">
                    Perbarui profil pelanggan agar tercatat rapi di WhatsApp & CRM
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditContactModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-hover"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Magic Autofill Bar */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-xs text-emerald-900 leading-tight">
                    Mau cepat? Ekstrak PT, alamat, dan total penawaran dari chat otomatis.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAutofillFromChat}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shrink-0 shadow-2xs flex items-center gap-1 transition-all"
                >
                  <Sparkles className="w-3 h-3" />
                  Isi Otomatis
                </button>
              </div>

              {/* Phone Info Display */}
              <div className="flex items-center justify-between bg-surface-secondary px-3.5 py-2.5 rounded-xl border border-border-light text-xs">
                <span className="text-text-muted font-medium">Nomor WhatsApp:</span>
                <span className="font-mono font-bold text-text-primary">{conv.wa || conv.id}</span>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary-600" />
                    Nama Kontak / PIC <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: PT AKU atau Pak Budi"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="input w-full h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-primary-600" />
                    Nama Perusahaan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: PT AKU"
                    value={contactForm.company}
                    onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                    className="input w-full h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primary-600" />
                    Tahap Pipeline
                  </label>
                  <select
                    value={contactForm.stage}
                    onChange={(e) => setContactForm({ ...contactForm, stage: e.target.value })}
                    className="input w-full h-9 text-xs bg-white"
                  >
                    <option value="new">Lead Baru</option>
                    <option value="qualified">Terkualifikasi</option>
                    <option value="proposal">Penawaran / Faktur</option>
                    <option value="negotiation">Negosiasi</option>
                    <option value="won">Deal / Menang</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary-600" />
                    Alamat Pengiriman / Pabrik
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: DUKUH KUPANG XIX/26"
                    value={contactForm.address}
                    onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                    className="input w-full h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-primary-600" />
                    Proyek
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Panel MDP Proyek Gedung"
                    value={contactForm.project}
                    onChange={(e) => setContactForm({ ...contactForm, project: e.target.value })}
                    className="input w-full h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-primary-600" />
                    Budget / Total Order
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Rp 53.174.550"
                    value={contactForm.budget}
                    onChange={(e) => setContactForm({ ...contactForm, budget: e.target.value })}
                    className="input w-full h-9 text-xs"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary-600" />
                    Catatan Tambahan
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Catatan khusus, syarat tempo pembayaran, dll..."
                    value={contactForm.notes}
                    onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                    className="input w-full text-xs p-2.5 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-border-light flex items-center justify-end gap-2.5 bg-surface-secondary/50">
              <button
                type="button"
                onClick={() => setShowEditContactModal(false)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveContact}
                disabled={savingContact || !contactForm.name.trim()}
                className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5"
              >
                {savingContact ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    Simpan Kontak
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== PIPELINE PAGE =====
function PipelinePage({
  conversations = [],
  onSelectChat,
}: {
  conversations?: any[];
  onSelectChat?: (phone: string) => void;
}) {
  const stageDefs = [
    { key: "new", name: "Baru", color: "border-t-slate-400" },
    { key: "qualified", name: "Terkualifikasi", color: "border-t-blue-400" },
    { key: "proposal", name: "Penawaran", color: "border-t-amber-400" },
    { key: "negotiation", name: "Negosiasi", color: "border-t-orange-400" },
    { key: "won", name: "Menang", color: "border-t-emerald-500" },
  ];

  const stages = useMemo(() => {
    return stageDefs.map((def) => {
      const stageConvs = conversations.filter((c) => (c.stage || "new") === def.key);
      return {
        name: def.name,
        count: stageConvs.length,
        color: def.color,
        deals: stageConvs.map((c) => {
          const allText = (c.messages || []).map((m: any) => m.body).join(" ");
          const priceMatch = allText.match(/Rp\s*([\d\.\,]+)/);
          const estimatedValue = priceMatch ? `Rp ${priceMatch[1]}` : (c.value || "Rp 1.250.000");
          return {
            name: c.name,
            company: c.company || c.wa || "Kontak WhatsApp",
            value: estimatedValue,
            score: c.unread > 0 ? 95 : 85,
            phone: c.wa || c.id,
            lastMsg: c.lastMsg,
          };
        }),
      };
    });
  }, [conversations]);

  const totalDeals = conversations.length;

  return (
    <div className="-mx-6 -mt-6">
      <div className="px-6 py-4 bg-surface border-b border-border-light flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            Pipeline Deal WhatsApp
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            {totalDeals > 0 ? `${totalDeals} deal aktif dari percakapan WhatsApp real-time` : "Belum ada deal aktif"}
          </p>
        </div>
        <button className="btn-primary text-xs">+ Tambah Deal</button>
      </div>

      <div className="flex gap-4 px-6 py-5 overflow-x-auto min-h-[calc(100vh-180px)]">
        {stages.map((stage) => (
          <div
            key={stage.name}
            className="w-[260px] shrink-0 flex flex-col"
          >
            <div
              className={`card rounded-b-none border-t-[3px] ${stage.color}`}
            >
              <div className="px-4 py-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-text-primary">
                  {stage.name}
                </h4>
                <span className="badge badge-slate">{stage.count}</span>
              </div>
            </div>
            <div className="flex-1 space-y-2 mt-2">
              {stage.deals.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-border-light bg-surface/50 text-center text-xs text-text-muted">
                  Belum ada deal
                </div>
              ) : (
                stage.deals.map((deal, i) => (
                  <div
                    key={i}
                    onClick={() => deal.phone && onSelectChat?.(deal.phone)}
                    className="card card-hover px-4 py-3 cursor-pointer animate-fade-in transition-all hover:border-primary-400 hover:shadow-sm"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {deal.name}
                      </p>
                      <span className="text-xs font-semibold text-primary-700 shrink-0 ml-2">
                        {deal.value}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 truncate">
                      {deal.company}
                    </p>
                    {deal.lastMsg && (
                      <p className="text-[11px] text-text-secondary mt-1.5 line-clamp-2 italic bg-surface-secondary/70 p-1.5 rounded-md border border-border-light/60">
                        &quot;{deal.lastMsg}&quot;
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 bg-surface-hover rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-primary-500 transition-all"
                          style={{ width: `${deal.score}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-text-muted font-medium">
                        {deal.score}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== CATALOG PAGE =====
interface ProductItem {
  id?: string;
  sku: string;
  name: string;
  price: number;
  cat: string;
  unit: string;
  standard: string;
  max1: string;
  priceMax1: number;
  max2: string;
  priceMax2: number | null;
  coef: number;
  floor: number;
}

function CatalogPage() {
  // Query parameters state
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [jumpPageInput, setJumpPageInput] = useState("");

  // Paginated data state
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCatalogItems, setTotalCatalogItems] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [csvInputText, setCsvInputText] = useState("");
  const [importError, setImportError] = useState("");

  const [showProductModal, setShowProductModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSku, setEditingSku] = useState<string | null>(null);

  // Form fields
  const [formSku, setFormSku] = useState("");
  const [formName, setFormName] = useState("");
  const [formCat, setFormCat] = useState("Kabel");
  const [formUnit, setFormUnit] = useState("pcs");
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formStandard, setFormStandard] = useState("30%");
  const [formMax1, setFormMax1] = useState("35%");
  const [formPriceMax1, setFormPriceMax1] = useState<number>(0);
  const [formMax2, setFormMax2] = useState("40%");
  const [formPriceMax2, setFormPriceMax2] = useState<number | null>(0);
  const [formCoef, setFormCoef] = useState<number>(0.85);
  const [formFloor, setFormFloor] = useState<number>(0);
  const [formError, setFormError] = useState("");

  // Delete confirmations
  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Debounce search input to avoid lagging while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch paginated products from API
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
      }
      if (selectedCategory && selectedCategory !== "Semua") {
        params.set("category", selectedCategory);
      }

      const res = await fetch(`/api/catalog?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data || []);
        if (json.pagination) {
          setPage(json.pagination.page);
          setLimit(json.pagination.limit);
          setTotalItems(json.pagination.totalItems);
          setTotalPages(json.pagination.totalPages);
          setTotalCatalogItems(json.pagination.totalCatalogItems || json.pagination.totalItems);
        }
        if (json.categories && Array.isArray(json.categories)) {
          setCategories(json.categories);
        }
      }
    } catch (err) {
      console.error("Gagal memuat katalog paginasi:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, selectedCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const parsePct = (val: string): number => {
    const cleaned = val.replace("%", "").replace(",", ".").trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const handlePriceOrDiscountChange = (
    newPrice: number,
    newMax1: string,
    newMax2: string
  ) => {
    setFormPrice(newPrice);
    setFormMax1(newMax1);
    setFormMax2(newMax2);

    const pct1 = parsePct(newMax1);
    const p1 = Math.round(newPrice * (1 - pct1 / 100));
    setFormPriceMax1(p1);

    if (!newMax2 || newMax2.trim() === "-" || newMax2.trim() === "") {
      setFormPriceMax2(null);
      setFormFloor(p1);
      const c = newPrice > 0 ? +(p1 / newPrice).toFixed(2) : 0.85;
      setFormCoef(c);
    } else {
      const pct2 = parsePct(newMax2);
      const p2 = Math.round(newPrice * (1 - pct2 / 100));
      setFormPriceMax2(p2);
      setFormFloor(p2);
      const c = newPrice > 0 ? +(p2 / newPrice).toFixed(2) : 0.85;
      setFormCoef(c);
    }
  };

  const handleOpenAddModal = () => {
    setModalMode("add");
    setEditingId(null);
    setEditingSku(null);
    setFormSku("");
    setFormName("");
    setFormCat(categories[0] || "Umum");
    setFormUnit("pcs");
    setFormPrice(100000);
    setFormStandard("-");
    setFormMax1("-");
    setFormPriceMax1(100000);
    setFormMax2("-");
    setFormPriceMax2(null);
    setFormCoef(1.0);
    setFormFloor(100000);
    setFormError("");
    setShowProductModal(true);
  };

  const handleOpenEditModal = (p: ProductItem) => {
    setModalMode("edit");
    setEditingId(p.id || null);
    setEditingSku(p.sku);
    setFormSku(p.sku === "-" ? "" : p.sku);
    setFormName(p.name);
    setFormCat(p.cat);
    setFormUnit(p.unit);
    setFormPrice(p.price);
    setFormStandard(p.standard);
    setFormMax1(p.max1);
    setFormPriceMax1(p.priceMax1);
    setFormMax2(p.max2);
    setFormPriceMax2(p.priceMax2);
    setFormCoef(p.coef);
    setFormFloor(p.floor);
    setFormError("");
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formName.trim()) {
      setFormError("Nama barang wajib diisi.");
      return;
    }

    const itemPrice = Number(formPrice) || 0;
    const itemStandard = formStandard.trim() === "" || formStandard.trim() === "-"
      ? "-"
      : formStandard.includes("%") ? formStandard.trim() : `${formStandard.trim()}%`;
    const itemMax1 = formMax1.trim() === "" || formMax1.trim() === "-"
      ? "-"
      : formMax1.includes("%") ? formMax1.trim() : `${formMax1.trim()}%`;
    const itemMax2 = formMax2.trim() === "" || formMax2.trim() === "-"
      ? "-"
      : formMax2.includes("%") ? formMax2.trim() : `${formMax2.trim()}%`;

    const item: ProductItem = {
      id: editingId || `prod_${Date.now()}`,
      sku: formSku.trim() || "-",
      name: formName.trim(),
      cat: formCat.trim() || "Umum",
      unit: formUnit.trim() || "pcs",
      price: itemPrice,
      standard: itemStandard,
      max1: itemMax1,
      priceMax1: Number(formPriceMax1) || itemPrice,
      max2: itemMax2,
      priceMax2: itemMax2 === "-" ? null : Number(formPriceMax2),
      coef: Number(formCoef) || 1.0,
      floor: Number(formFloor) || (Number(formPriceMax1) || itemPrice),
    };

    try {
      if (modalMode === "add") {
        const res = await fetch("/api/catalog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "add", product: item }),
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || "Gagal menambah produk");

        showToast(`Produk "${item.name}" berhasil ditambahkan!`);
      } else {
        const res = await fetch("/api/catalog", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, originalSku: editingSku, product: item }),
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || "Gagal memperbarui produk");

        showToast(`Perubahan produk "${item.name}" berhasil disimpan!`);
      }

      setShowProductModal(false);
      fetchProducts();
    } catch (err: any) {
      setFormError(err.message || "Gagal menyimpan data produk.");
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      const deleteUrl = productToDelete.id
        ? `/api/catalog?id=${encodeURIComponent(productToDelete.id)}`
        : `/api/catalog?sku=${encodeURIComponent(productToDelete.sku)}`;
      const res = await fetch(deleteUrl, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus produk");

      showToast(`Produk "${productToDelete.name}" telah dihapus.`);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus produk");
    } finally {
      setProductToDelete(null);
    }
  };

  const handleDeleteAll = async () => {
    try {
      const res = await fetch("/api/catalog?all=true", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengosongkan katalog");

      showToast("Semua produk katalog berhasil dikosongkan.");
      setPage(1);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || "Gagal mengosongkan katalog");
    } finally {
      setShowDeleteAllModal(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      "sku,nama,kategori,satuan,harga_pricelist,diskon_standard,diskon_max1,diskon_max2,koefisien\n" +
      'MCB-1P-16A-SCH,MCB Domae 1 Pole 16A Schneider Electric,Proteksi & Panel,pcs,68000,40%,45%,50%,0.86\n' +
      'KBL-NYM-3X25-100,Kabel NYM 3x2.5mm Supreme (Roll 100m),Kabel,roll,1570000,30%,35%,40%,0.88\n' +
      'PPA-CND-PVC-20,Pipa Konduit PVC 20mm 2.9m Clipsal,Konduit & Aksesori,batang,24000,35%,40%,45%,0.85';

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "template_katalog_diskon_ats.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportFullCatalog = async () => {
    try {
      showToast(`Sedang menyiapkan file export ${totalCatalogItems.toLocaleString("id-ID")} produk...`);
      const res = await fetch("/api/catalog?all=true");
      const json = await res.json();
      if (!json.success || !json.data) throw new Error("Gagal mengambil data lengkap katalog");

      const items: ProductItem[] = json.data;
      let csv = "sku,nama,kategori,satuan,harga_pricelist,diskon_standard,diskon_max1,diskon_max2,koefisien\n";
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const cleanSku = (item.sku === "-" ? "" : item.sku || "").replace(/"/g, '""');
        const cleanName = (item.name || "").replace(/"/g, '""');
        const cleanCat = (item.cat || "").replace(/"/g, '""');
        const std = item.standard === "-" ? "" : item.standard;
        const m1 = item.max1 === "-" ? "" : item.max1;
        const m2 = item.max2 === "-" ? "" : item.max2;
        const cf = item.coef === 1.0 ? "" : String(item.coef);
        csv += `"${cleanSku}","${cleanName}","${cleanCat}","${item.unit || "pcs"}",${item.price},"${std}","${m1}","${m2}","${cf}"\n`;
      }

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `katalog_real_ats_araya_${items.length}_items.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Export selesai! ${items.length.toLocaleString("id-ID")} produk tersimpan ke file CSV.`);
    } catch (err: any) {
      alert("Gagal mengekspor data: " + err.message);
    }
  };

  const parseCsvText = (text: string): ProductItem[] => {
    if (!text || !text.trim()) return [];

    // Auto-detect delimiter from the first non-empty line
    const firstLine = text.split(/\r?\n/).find((l) => l.trim().length > 0) || "";
    let delimiter = ",";
    if (firstLine.includes(";") && !firstLine.includes(",")) delimiter = ";";
    else if (firstLine.includes("\t")) delimiter = "\t";

    const rows: string[][] = [];
    let row: string[] = [""];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];
      if (c === '"') {
        if (inQuotes && next === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === delimiter && !inQuotes) {
        row.push("");
      } else if ((c === "\r" || c === "\n") && !inQuotes) {
        if (c === "\r" && next === "\n") i++;
        rows.push(row);
        row = [""];
      } else {
        row[row.length - 1] += c;
      }
    }
    if (row.length > 1 || row[0] !== "") rows.push(row);
    if (rows.length === 0) return [];

    // Check if first row is header
    const firstRowStr = rows[0].join(" ").toLowerCase();
    const startIndex =
      firstRowStr.includes("sku") || firstRowStr.includes("nama") || firstRowStr.includes("harga")
        ? 1
        : 0;

    const parsed: ProductItem[] = [];
    for (let i = startIndex; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length === 0) continue;

      const rawSku = (r[0] || "").trim();
      const rawName = (r[1] || "").trim();
      if (!rawName) continue; // Keep all items that have a product name

      const cat = (r[2] || "").trim() || "Umum";
      const unit = (r[3] || "").trim() || "pcs";
      const priceRaw = (r[4] || "").replace(/[^0-9.-]/g, "").trim();
      const price = parseFloat(priceRaw) || 0;

      const rawStd = (r[5] || "").trim();
      const rawMax1 = (r[6] || "").trim();
      const rawMax2 = (r[7] || "").trim();
      const rawCoef = (r[8] || "").trim();

      // Format standard discount
      let standard = "-";
      if (rawStd && rawStd !== "-") {
        const pctStd = parsePct(rawStd);
        standard = `${pctStd}%`;
      }

      // Format Max 1 discount
      let max1 = "-";
      let priceMax1 = price;
      if (rawMax1 && rawMax1 !== "-") {
        const pct1 = parsePct(rawMax1);
        if (pct1 > 0) {
          max1 = `${pct1}%`;
          priceMax1 = Math.round(price * (1 - pct1 / 100));
        } else {
          max1 = "0%";
          priceMax1 = price;
        }
      }

      // Format Max 2 discount
      let max2 = "-";
      let priceMax2: number | null = null;
      if (rawMax2 && rawMax2 !== "-") {
        const pct2 = parsePct(rawMax2);
        if (pct2 > 0) {
          max2 = `${pct2}%`;
          priceMax2 = Math.round(price * (1 - pct2 / 100));
        }
      }

      // Parse coef
      let coef = 1.0;
      if (rawCoef && rawCoef !== "-") {
        const parsedCoef = parseFloat(rawCoef.replace(",", "."));
        if (!isNaN(parsedCoef) && parsedCoef > 0) {
          coef = parsedCoef;
        }
      }

      // Calculate floor price
      let floor = priceMax2 !== null ? priceMax2 : priceMax1;
      if (coef !== 1.0) {
        floor = Math.round(floor * coef);
      }

      parsed.push({
        id: `prod_${i}`,
        sku: rawSku || "-",
        name: rawName,
        cat,
        unit,
        price,
        standard,
        max1,
        priceMax1,
        max2,
        priceMax2,
        coef,
        floor,
      });
    }

    return parsed;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError("");
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setCsvInputText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    setImportError("");
    if (!csvInputText.trim()) {
      setImportError("Silakan pilih file CSV atau tempel teks data CSV terlebih dahulu.");
      return;
    }

    setImporting(true);
    try {
      const parsedItems = parseCsvText(csvInputText);
      if (parsedItems.length === 0) {
        throw new Error("Format CSV tidak sesuai atau tidak ada baris produk valid yang ditemukan.");
      }

      const res = await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk_replace", items: parsedItems }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengimpor produk");

      setImportDone(true);
      showToast(`Berhasil mengimpor ${parsedItems.length.toLocaleString("id-ID")} produk real ke katalog!`);
      setTimeout(() => {
        setShowImportModal(false);
        setImportDone(false);
        setCsvInputText("");
        setPage(1);
        fetchProducts();
      }, 1000);
    } catch (err: any) {
      setImportError(err.message || "Gagal mengimpor data");
    } finally {
      setImporting(false);
    }
  };

  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(jumpPageInput, 10);
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      setPage(target);
      setJumpPageInput("");
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="space-y-4">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2.5 animate-scale-up text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Control Bar (Search, Category Filter & Main Actions) */}
      <div className="card p-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search Input with Debounce & Clear */}
            <div className="relative min-w-[260px] sm:w-80">
              {loading ? (
                <RefreshCw className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary-600 animate-spin" />
              ) : (
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              )}
              <input
                type="text"
                placeholder="Cari SKU, nama, kategori..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="input pl-9 pr-8 w-full h-9 text-xs"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Select Dropdown (Handles 200+ categories instantly) */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="input text-xs h-9 pr-7 pl-3 font-medium bg-surface text-text-primary border-border-light cursor-pointer min-w-[180px] max-w-[280px] truncate"
              >
                <option value="Semua">Semua Kategori ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {(debouncedSearch || selectedCategory !== "Semua") && (
              <button
                onClick={() => {
                  setSearchInput("");
                  setDebouncedSearch("");
                  setSelectedCategory("Semua");
                  setPage(1);
                }}
                className="btn-ghost text-xs text-text-muted hover:text-red-600 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Reset Filter
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {totalCatalogItems > 0 && (
              <button
                onClick={handleExportFullCatalog}
                className="btn-secondary text-xs flex items-center gap-1.5"
                title="Download seluruh katalog dalam format CSV"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV ({totalCatalogItems.toLocaleString("id-ID")})
              </button>
            )}

            <button
              onClick={handleDownloadTemplate}
              className="btn-secondary text-xs flex items-center gap-1.5"
              title="Unduh format spreadsheet CSV standar"
            >
              <FileText className="w-3.5 h-3.5" />
              Template
            </button>

            <button
              onClick={() => {
                setImportError("");
                setCsvInputText("");
                setShowImportModal(true);
              }}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Import CSV
            </button>

            <button
              onClick={handleOpenAddModal}
              className="btn-primary text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Tambah Produk
            </button>

            {totalCatalogItems > 0 && (
              <button
                onClick={() => setShowDeleteAllModal(true)}
                className="btn-ghost text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5 border border-red-200"
                title="Kosongkan seluruh produk"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Kosongkan
              </button>
            )}
          </div>
        </div>

        {/* Stats & Quick Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border-light text-xs text-text-secondary">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary">
              Total Database:{" "}
              <strong className="text-primary-700 font-bold">
                {totalCatalogItems.toLocaleString("id-ID")} produk real
              </strong>
            </span>
            {totalItems !== totalCatalogItems && (
              <span className="badge badge-blue">
                Hasil Filter: {totalItems.toLocaleString("id-ID")} produk
              </span>
            )}
            <span className="badge badge-slate">
              {categories.length} Kategori
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <span>Baris per halaman:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="input py-0.5 px-2 h-7 text-xs font-semibold bg-white"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
            <span className="text-text-muted">
              Menampilkan {totalItems === 0 ? 0 : (page - 1) * limit + 1} -{" "}
              {Math.min(page * limit, totalItems)} dari {totalItems.toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
        <div className="text-xs text-text-secondary leading-relaxed">
          <span className="font-semibold text-text-primary">
            Sistem Paginasi Server Cepat (High-Performance 40.000+ Items):
          </span>{" "}
          Database Anda saat ini memuat{" "}
          <strong className="text-primary-700 font-bold">{totalCatalogItems.toLocaleString("id-ID")} produk real</strong>.
          Tampilan dirender secara paginasi dan di-cache dalam memori sehingga penelusuran, filter, dan perpindahan halaman
          berjalan sangat cepat (&lt; 20ms) tanpa lag atau membuat browser macet. AI WhatsApp Sales otomatis mencari harga
          secara deterministik dari seluruh produk ini.
        </div>
      </div>

      {/* Table Container */}
      <div className="card overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-2xs z-10 flex items-center justify-center">
            <div className="bg-slate-900/90 text-white px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg">
              <RefreshCw className="w-4 h-4 animate-spin text-primary-400" />
              <span>Memuat halaman {page}...</span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-surface-secondary">
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Nama Barang</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Kategori</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Pricelist</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">Satuan</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">Standard</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-800 uppercase tracking-wider bg-emerald-50/50">MAX 1 (Penawaran AI)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-amber-800 uppercase tracking-wider bg-amber-50/50">MAX 2 (Batas Negosiasi)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Koefisien (Floor)</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y border-border-light">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-16 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto shadow-inner">
                        <Package className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-semibold text-text-primary">
                        {totalCatalogItems === 0 ? "Katalog Masih Kosong" : "Tidak Ada Produk yang Cocok"}
                      </h3>
                      <p className="text-xs text-text-muted leading-relaxed">
                        {totalCatalogItems === 0
                          ? "Katalog saat ini belum memiliki item. Silakan gunakan tombol Tambah Produk atau Import CSV untuk memasukkan data produk."
                          : "Tidak ada produk yang cocok dengan kata kunci pencarian atau filter kategori yang dipilih."}
                      </p>
                      {totalCatalogItems > 0 && (
                        <button
                          onClick={() => {
                            setSearchInput("");
                            setDebouncedSearch("");
                            setSelectedCategory("Semua");
                            setPage(1);
                          }}
                          className="btn-secondary text-xs"
                        >
                          Tampilkan Semua Produk
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((p, i) => (
                  <tr
                    key={p.id || `${p.sku}-${i}`}
                    className="table-row hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold">
                      {p.sku && p.sku !== "-" ? (
                        <span className="text-primary-700">{p.sku}</span>
                      ) : (
                        <span className="text-text-muted italic">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-text-primary max-w-sm truncate" title={p.name}>
                      {p.name}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="badge badge-slate max-w-[150px] truncate block" title={p.cat}>
                        {p.cat}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium tabular-nums text-text-primary">
                      Rp {p.price.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-2.5 text-center text-text-secondary text-xs">{p.unit}</td>
                    <td className="px-4 py-2.5 text-center">
                      {p.standard && p.standard !== "-" ? (
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {p.standard}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted italic">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right bg-emerald-50/30 font-mono text-xs">
                      {p.max1 && p.max1 !== "-" && p.max1 !== "0%" ? (
                        <>
                          <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                            {p.max1}
                          </span>
                          <span className="text-xs text-emerald-700 font-bold block mt-0.5">
                            Rp {p.priceMax1.toLocaleString("id-ID")}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-text-muted italic">-</span>
                          <span className="text-xs text-text-secondary block mt-0.5">
                            Rp {p.price.toLocaleString("id-ID")}
                          </span>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right bg-amber-50/30 font-mono text-xs">
                      {p.max2 && p.max2 !== "-" && p.max2 !== "0%" ? (
                        <>
                          <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[11px]">
                            {p.max2}
                          </span>
                          <span className="text-xs text-amber-800 font-semibold block mt-0.5">
                            Min: Rp {p.priceMax2?.toLocaleString("id-ID")}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-text-muted italic">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">
                      <span className="text-text-primary font-semibold">{p.coef}</span>
                      <span className="text-[11px] text-text-muted block">Min: Rp {p.floor.toLocaleString("id-ID")}</span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          title="Edit Produk"
                          className="btn-ghost p-1 text-blue-600 hover:bg-blue-50 rounded-lg text-xs"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setProductToDelete(p)}
                          title="Hapus Produk"
                          className="btn-ghost p-1 text-red-600 hover:bg-red-50 rounded-lg text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Bar */}
        {totalItems > 0 && (
          <div className="p-3.5 border-t border-border-light bg-surface-secondary/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-text-muted">
              Halaman <strong className="text-text-primary font-semibold">{page}</strong> dari{" "}
              <strong className="text-text-primary font-semibold">{totalPages.toLocaleString("id-ID")}</strong>{" "}
              (Total: {totalItems.toLocaleString("id-ID")} item)
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* First Page */}
              <button
                onClick={() => setPage(1)}
                disabled={page <= 1 || loading}
                title="Halaman Pertama"
                className="btn-ghost p-1.5 rounded-lg border border-border-light disabled:opacity-40"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>

              {/* Prev Page */}
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                title="Halaman Sebelumnya"
                className="btn-ghost p-1.5 rounded-lg border border-border-light disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Numbered Page Buttons */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((pNum, idx) =>
                  pNum === "..." ? (
                    <span key={`dots-${idx}`} className="px-1 text-text-muted">
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${pNum}`}
                      onClick={() => setPage(Number(pNum))}
                      disabled={loading}
                      className={`h-7 min-w-[28px] px-2 rounded-lg text-xs font-medium transition-colors ${
                        page === pNum
                          ? "bg-primary-600 text-white font-bold shadow-2xs"
                          : "btn-ghost border border-border-light text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {pNum}
                    </button>
                  )
                )}
              </div>

              {/* Next Page */}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                title="Halaman Berikutnya"
                className="btn-ghost p-1.5 rounded-lg border border-border-light disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages || loading}
                title="Halaman Terakhir"
                className="btn-ghost p-1.5 rounded-lg border border-border-light disabled:opacity-40"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>

              {/* Jump to page form */}
              {totalPages > 5 && (
                <form onSubmit={handleJumpToPage} className="flex items-center gap-1 ml-2">
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    placeholder="Ke hal..."
                    value={jumpPageInput}
                    onChange={(e) => setJumpPageInput(e.target.value)}
                    className="input h-7 w-16 px-1.5 text-xs text-center font-mono"
                  />
                  <button type="submit" className="btn-secondary h-7 px-2 text-xs">
                    Go
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-xl w-full border border-border-light shadow-2xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-border-light flex items-center justify-between bg-surface-secondary/50">
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {modalMode === "add" ? "Tambah Produk Real Baru" : `Edit Produk (${editingSku})`}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Isi data spesifikasi dan matriks diskon distributor (Standard, MAX 1, MAX 2, Koefisien Floor)
                </p>
              </div>
              <button
                onClick={() => setShowProductModal(false)}
                className="btn-ghost p-1.5 rounded-lg text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* SKU & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">SKU Barang (Opsional)</label>
                  <input
                    type="text"
                    placeholder="misal: KBL-NYM-3X25 atau kosong (-)"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="input text-xs font-mono w-full"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Nama Barang *</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: Kabel NYM 3x2.5mm Supreme (Roll 100m)"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="input text-xs w-full"
                  />
                </div>
              </div>

              {/* Category, Unit, Pricelist */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Kategori</label>
                  <input
                    type="text"
                    placeholder="Kabel, Konduit, dll"
                    value={formCat}
                    onChange={(e) => setFormCat(e.target.value)}
                    className="input text-xs w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Satuan</label>
                  <input
                    type="text"
                    placeholder="pcs, roll, batang"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="input text-xs w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Harga Pricelist (Rp) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formPrice || ""}
                    onChange={(e) =>
                      handlePriceOrDiscountChange(Number(e.target.value), formMax1, formMax2)
                    }
                    className="input text-xs font-mono w-full font-bold"
                  />
                </div>
              </div>

              {/* Discount Matrix Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-primary-600" /> Matriks Diskon & Harga Bersih
                  </h4>
                  <span className="text-[11px] text-text-muted">Dihitung otomatis saat diskon diubah</span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  {/* Standard */}
                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Diskon Standard</label>
                    <input
                      type="text"
                      placeholder="30%"
                      value={formStandard}
                      onChange={(e) => setFormStandard(e.target.value)}
                      className="input text-xs font-mono w-full"
                    />
                  </div>

                  {/* MAX 1 */}
                  <div className="space-y-1 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                    <label className="font-semibold text-emerald-800">MAX 1 (Penawaran AI)</label>
                    <input
                      type="text"
                      placeholder="35%"
                      value={formMax1}
                      onChange={(e) =>
                        handlePriceOrDiscountChange(formPrice, e.target.value, formMax2)
                      }
                      className="input text-xs font-mono w-full font-bold text-emerald-800 bg-white"
                    />
                    <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                      Nett: Rp {formPriceMax1.toLocaleString("id-ID")}
                    </div>
                  </div>

                  {/* MAX 2 */}
                  <div className="space-y-1 bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                    <label className="font-semibold text-amber-800">MAX 2 (Batas Nego)</label>
                    <input
                      type="text"
                      placeholder="40% atau -"
                      value={formMax2}
                      onChange={(e) =>
                        handlePriceOrDiscountChange(formPrice, formMax1, e.target.value)
                      }
                      className="input text-xs font-mono w-full font-bold text-amber-800 bg-white"
                    />
                    <div className="text-[11px] text-amber-800 font-semibold mt-1">
                      {formPriceMax2 !== null ? `Min: Rp ${formPriceMax2.toLocaleString("id-ID")}` : "Tanpa batas 2 (-)"}
                    </div>
                  </div>
                </div>

                {/* Floor and Coef */}
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200 text-xs">
                  <div className="space-y-1">
                    <label className="font-medium text-text-secondary">Koefisien Floor (Pengali)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.88"
                      value={formCoef || ""}
                      onChange={(e) => setFormCoef(Number(e.target.value))}
                      className="input text-xs font-mono w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-text-secondary">Harga Minimum Floor (Rp)</label>
                    <input
                      type="number"
                      placeholder="942000"
                      value={formFloor || ""}
                      onChange={(e) => setFormFloor(Number(e.target.value))}
                      className="input text-xs font-mono w-full font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border-light">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="btn-secondary text-xs"
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary text-xs flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  {modalMode === "add" ? "Simpan Produk Baru" : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE SINGLE PRODUCT CONFIRMATION MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-md w-full border border-border-light shadow-xl p-6 space-y-4 animate-scale-up">
            <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shadow-inner">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">Hapus Produk dari Katalog?</h3>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Apakah Anda yakin ingin menghapus produk{" "}
                <strong className="text-text-primary">{productToDelete.name}</strong> (SKU:{" "}
                <span className="font-mono font-semibold">{productToDelete.sku}</span>)? Tindakan ini tidak dapat
                dibatalkan.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-light">
              <button onClick={() => setProductToDelete(null)} className="btn-secondary text-xs">
                Batal
              </button>
              <button
                onClick={handleDeleteProduct}
                className="btn-primary bg-red-600 hover:bg-red-700 text-white text-xs border-red-700"
              >
                Ya, Hapus Produk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ALL CONFIRMATION MODAL */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-md w-full border border-border-light shadow-xl p-6 space-y-4 animate-scale-up">
            <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shadow-inner">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">Kosongkan Semua Katalog?</h3>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Tindakan ini akan menghapus semua <strong className="text-text-primary">{totalCatalogItems.toLocaleString("id-ID")} produk</strong>{" "}
                yang ada di katalog saat ini sehingga katalog benar-benar kosong untuk diisi data baru.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-light">
              <button onClick={() => setShowDeleteAllModal(false)} className="btn-secondary text-xs">
                Batal
              </button>
              <button
                onClick={handleDeleteAll}
                className="btn-primary bg-red-600 hover:bg-red-700 text-white text-xs border-red-700"
              >
                Ya, Kosongkan Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-lg w-full border border-border-light shadow-xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-border-light flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-text-primary">Import Katalog Produk Real</h3>
                <p className="text-xs text-text-muted mt-0.5">Unggah file CSV atau tempel teks data CSV langsung</p>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="btn-ghost p-1.5 rounded-lg text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {importError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{importError}</span>
                </div>
              )}

              {/* File upload input */}
              <div className="border-2 border-dashed border-primary-200 rounded-xl p-5 text-center bg-primary-50/40 hover:bg-primary-50/70 transition-colors relative cursor-pointer">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <UploadCloud className="w-9 h-9 text-primary-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-text-primary">Klik untuk memilih file CSV atau drag & drop</p>
                <p className="text-xs text-text-muted mt-1">Mendukung file .csv dengan delimiter koma</p>
              </div>

              {/* Paste Text Area */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-primary flex items-center justify-between">
                  <span>Atau Tempel Teks CSV:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCsvInputText(
                        "sku,nama,kategori,satuan,harga_pricelist,diskon_standard,diskon_max1,diskon_max2,koefisien\n" +
                        "MCB-1P-16A-SCH,MCB Domae 1 Pole 16A Schneider Electric,Proteksi & Panel,pcs,68000,40%,45%,50%,0.86\n" +
                        "KBL-NYM-3X25-100,Kabel NYM 3x2.5mm Supreme (Roll 100m),Kabel,roll,1570000,30%,35%,40%,0.88"
                      );
                    }}
                    className="text-[11px] text-primary-600 hover:underline"
                  >
                    Gunakan Contoh Format
                  </button>
                </label>
                <textarea
                  rows={4}
                  value={csvInputText}
                  onChange={(e) => setCsvInputText(e.target.value)}
                  placeholder="sku,nama,kategori,satuan,harga_pricelist,diskon_standard,diskon_max1,diskon_max2,koefisien"
                  className="input text-xs font-mono w-full leading-relaxed"
                />
              </div>

              <div className="rounded-lg bg-surface-secondary p-3 text-xs space-y-1 border border-border-light">
                <p className="font-semibold text-text-primary flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Format Kolom Header:
                </p>
                <p className="text-text-secondary font-mono text-[11px]">
                  sku, nama, kategori, satuan, harga_pricelist, diskon_standard, diskon_max1, diskon_max2, koefisien
                </p>
              </div>

              {importDone && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Berhasil mengimpor produk real ke katalog!
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-border-light bg-surface-secondary flex items-center justify-end gap-2">
              <button onClick={() => setShowImportModal(false)} className="btn-secondary text-xs">
                Batal
              </button>
              <button
                onClick={handleExecuteImport}
                disabled={importing || importDone}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Memproses Import...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Proses Import Real
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== CONTACTS PAGE =====
function ContactsPage({
  conversations = [],
  onSelectChat,
}: {
  conversations?: any[];
  onSelectChat?: (phone: string) => void;
}) {
  const [filter, setFilter] = useState("Semua");
  const [search, setSearch] = useState("");

  const stageBadge: Record<string, string> = {
    new: "badge-slate",
    qualified: "badge-blue",
    proposal: "badge-amber",
    negotiation: "badge-orange",
    won: "badge-green",
    lost: "badge-red",
  };
  const stageLabel: Record<string, string> = {
    new: "Baru",
    qualified: "Terkualifikasi",
    proposal: "Penawaran",
    negotiation: "Negosiasi",
    won: "Menang",
    lost: "Kalah",
  };

  const contacts = useMemo(() => {
    return conversations.map((c) => ({
      name: c.name,
      company: c.company || "Kontak WhatsApp",
      wa: c.wa,
      stage: c.stage || "new",
      score: c.unread > 0 ? 95 : 85,
      tags: c.unread > 0 ? ["WhatsApp", "Unread"] : ["WhatsApp", "Lead"],
    }));
  }, [conversations]);

  const filteredContacts = contacts.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.wa.includes(search);
    const matchFilter =
      filter === "Semua" ||
      (filter === "Baru" && c.stage === "new") ||
      (filter === "Terkualifikasi" && c.stage === "qualified") ||
      (filter === "Negosiasi" && c.stage === "negotiation") ||
      (filter === "Menang" && c.stage === "won");
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Cari kontak..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 w-72 h-9 text-xs"
            />
          </div>
          <div className="flex gap-1">
            {["Semua", "Baru", "Terkualifikasi", "Negosiasi", "Menang"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`btn-ghost text-xs ${filter === f ? "bg-primary-50 text-primary-700 font-semibold" : ""}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-light bg-surface-secondary">
              <th className="px-5 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Kontak</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">WhatsApp</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Tahap</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">Skor</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Tag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {filteredContacts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-xs text-text-muted">
                  <div className="flex flex-col items-center justify-center">
                    <Users className="w-8 h-8 text-primary-400/40 mb-2" />
                    <p className="font-semibold text-text-secondary">Belum ada kontak tersimpan</p>
                    <p className="text-[11px] text-text-muted mt-0.5">Kontak pelanggan dari pesan masuk WhatsApp akan tercatat otomatis di sini</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredContacts.map((c, i) => (
                <tr
                  key={i}
                  onClick={() => c.wa && onSelectChat?.(c.wa)}
                  className="table-row cursor-pointer animate-fade-in hover:bg-surface-hover"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center font-bold text-xs text-primary-700">
                        {c.name ? c.name[0].toUpperCase() : "K"}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{c.name}</p>
                        <p className="text-xs text-text-muted">{c.company}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-text-secondary font-mono text-xs">{c.wa}</td>
                  <td className="px-5 py-3"><span className={`badge ${stageBadge[c.stage]}`}>{stageLabel[c.stage]}</span></td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-sm font-semibold ${c.score >= 80 ? "text-primary-600" : c.score >= 60 ? "text-amber-600" : "text-text-muted"}`}>{c.score}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      {c.tags?.map((tag: string) => <span key={tag} className="badge badge-slate">{tag}</span>)}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===== SETTINGS PAGE =====
function SettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="card">
        <div className="px-5 py-4 border-b border-border-light">
          <h3 className="text-sm font-semibold text-text-primary">Profil Perusahaan</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">Nama Perusahaan</label>
              <input type="text" className="input" defaultValue="PT Elektra Mandiri" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">Jenis Industri</label>
              <select className="input">
                <option>Kelistrikan & Material</option>
                <option>Bahan Bangunan</option>
                <option>Suku Cadang</option>
                <option>Umum</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Gaya Bahasa AI</label>
            <div className="flex gap-2">
              {["Formal", "Santai", "Ramah"].map((tone) => (
                <button key={tone} className={`btn-ghost text-xs border border-border ${tone === "Ramah" ? "bg-primary-50 text-primary-700 border-primary-200" : ""}`}>{tone}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-border-light">
          <h3 className="text-sm font-semibold text-text-primary">Aturan Negosiasi</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">Maks. Ronde</label>
              <input type="number" className="input" defaultValue={3} />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">Budget Share (%)</label>
              <input type="number" className="input" defaultValue={60} />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">Kunci Harga (jam)</label>
              <input type="number" className="input" defaultValue={24} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="giveForGet" defaultChecked className="rounded" />
            <label htmlFor="giveForGet" className="text-sm text-text-secondary">Wajibkan imbal balik untuk setiap konsesi</label>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-border-light">
          <h3 className="text-sm font-semibold text-text-primary">WhatsApp Business</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">Phone Number ID</label>
              <input type="text" className="input font-mono text-xs" placeholder="Dari Meta Business" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">Access Token</label>
              <input type="password" className="input font-mono text-xs" placeholder="••••••••" />
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary-50 border border-primary-100">
            <Zap className="w-4 h-4 text-primary-600" />
            <span className="text-xs text-primary-800">Status: Terhubung · Nomor: +6281234567890</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn-primary">Simpan Pengaturan</button>
      </div>
    </div>
  );
}

// ===== DOCUMENTS PAGE =====
function DocumentsPage() {
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [targetContact, setTargetContact] = useState("Pak Hendra (CV Graha Jaya Mandiri)");
  const [sentSuccess, setSentSuccess] = useState(false);

  const documents: any[] = [];

  const handleOpenSend = (doc: any) => {
    setSelectedDoc(doc);
    setSentSuccess(false);
    setShowSendModal(true);
  };

  const handleSendWhatsApp = () => {
    setSentSuccess(true);
    setTimeout(() => {
      setShowSendModal(false);
      setSentSuccess(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Dokumen & Media Penjualan</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Dokumen PDF yang dapat dikirim otomatis oleh AI saat prospek meminta info atau company profile
          </p>
        </div>
        <button className="btn-primary text-xs flex items-center gap-1.5 self-start sm:self-auto">
          <UploadCloud className="w-3.5 h-3.5" />
          Upload Dokumen PDF
        </button>
      </div>

      {/* Document Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.length === 0 ? (
          <div className="col-span-full card p-12 text-center text-text-muted">
            <FileText className="w-10 h-10 text-primary-400/40 mx-auto mb-2" />
            <p className="text-sm font-semibold text-text-secondary">Belum ada dokumen tersimpan</p>
            <p className="text-xs text-text-muted mt-1 max-w-md mx-auto">
              Upload company profile, brosur teknis, atau dokumen penawaran agar AI Sales dapat melampirkannya secara otomatis ke chat WhatsApp.
            </p>
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="card card-hover p-5 flex flex-col justify-between space-y-4 animate-fade-in">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-slate text-[10px]">{doc.category}</span>
                    <span className="badge badge-green text-[10px]">{doc.status}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-text-primary mt-1.5 leading-snug line-clamp-1">
                    {doc.title}
                  </h4>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed line-clamp-2">
                    {doc.desc}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border-light flex items-center justify-between text-xs text-text-secondary">
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span>{doc.size}</span>
                  <span>•</span>
                  <span>{doc.downloads}x dikirim</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenSend(doc)}
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <Send className="w-3 h-3" />
                    Kirim ke WhatsApp
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* WhatsApp Send Modal */}
      {showSendModal && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-md w-full border border-border-light shadow-xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-border-light flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-text-primary">Kirim Dokumen ke WhatsApp</h3>
                <p className="text-xs text-text-muted mt-0.5">Lampirkan file PDF langsung ke chat pelanggan</p>
              </div>
              <button onClick={() => setShowSendModal(false)} className="btn-ghost p-1.5 rounded-lg text-text-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1.5 block">Pilih Kontak Pelanggan</label>
                <select
                  value={targetContact}
                  onChange={(e) => setTargetContact(e.target.value)}
                  className="input text-xs"
                >
                  <option>Pak Hendra (CV Graha Jaya Mandiri) - +6281899988877</option>
                  <option>Budi Santoso (PT Maju Jaya) - +6281234567890</option>
                  <option>Siti Rahayu (CV Berkah) - +6287654321098</option>
                  <option>Ahmad Wijaya (PT Mandiri Teknik) - +6289876543210</option>
                </select>
              </div>

              {/* WhatsApp Bubble Preview */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-2">
                <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Preview Pesan WhatsApp:</p>
                <div className="bg-white p-3 rounded-lg shadow-2xs border border-emerald-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">{selectedDoc.title}</p>
                    <p className="text-[11px] text-text-muted">{selectedDoc.size} • Dokumen PDF</p>
                  </div>
                </div>
                <p className="text-xs text-text-secondary italic">
                  &ldquo;Halo Pak, berikut terlampir dokumen resmi dari PT Sinar Elektrik Mandiri untuk referensi proyek Bapak.&rdquo;
                </p>
              </div>

              {sentSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Dokumen berhasil terkirim melalui WhatsApp Cloud API!
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-border-light bg-surface-secondary flex items-center justify-end gap-2">
              <button onClick={() => setShowSendModal(false)} className="btn-secondary text-xs">
                Batal
              </button>
              <button
                onClick={handleSendWhatsApp}
                disabled={sentSuccess}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {sentSuccess ? "Terkirim!" : "Kirim Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== ANALYTICS PAGE =====
function AnalyticsPage() {
  const funnelStages = [
    { label: "Leads Baru", count: 0, pct: "0%", value: "Rp 0", color: "bg-slate-500" },
    { label: "Terkualifikasi", count: 0, pct: "0%", value: "Rp 0", color: "bg-blue-500" },
    { label: "Penawaran Diberikan", count: 0, pct: "0%", value: "Rp 0", color: "bg-amber-500" },
    { label: "Negosiasi Diskon", count: 0, pct: "0%", value: "Rp 0", color: "bg-indigo-500" },
    { label: "Deal Menang (Closed Won)", count: 0, pct: "0%", value: "Rp 0", color: "bg-emerald-500" },
  ];

  const skillPerformances: Array<{ skill: string; label: string; usage: number; winRate: string; impact: string }> = [];

  return (
    <div className="space-y-6">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 space-y-2">
          <p className="text-xs font-medium text-text-muted">Total Nilai Pipeline Aktif</p>
          <p className="text-2xl font-bold text-text-primary">Rp 0</p>
          <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>0% bulan ini</span>
          </div>
        </div>

        <div className="card p-5 space-y-2">
          <p className="text-xs font-medium text-text-muted">AI Containment Rate</p>
          <p className="text-2xl font-bold text-primary-600">0%</p>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span>Menunggu interaksi aktif</span>
          </div>
        </div>

        <div className="card p-5 space-y-2">
          <p className="text-xs font-medium text-text-muted">Rata-rata Diskon Negosiasi</p>
          <p className="text-2xl font-bold text-emerald-600">0%</p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Aman sesuai aturan koefisien</span>
          </div>
        </div>

        <div className="card p-5 space-y-2">
          <p className="text-xs font-medium text-text-muted">Kecepatan Respons Rata-rata</p>
          <p className="text-2xl font-bold text-text-primary">-</p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Real-time via WhatsApp Webhooks</span>
          </div>
        </div>
      </div>

      {/* Funnel & Conversion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Sales Pipeline Funnel</h3>
            <span className="text-xs text-text-muted">Periode: 30 Hari Terakhir</span>
          </div>

          <div className="space-y-3 pt-2">
            {funnelStages.map((stage) => (
              <div key={stage.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-text-primary flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${stage.color}`} />
                    {stage.label}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-text-muted font-mono">{stage.count} deal</span>
                    <span className="font-semibold text-text-primary">{stage.value}</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden">
                  <div className={`h-full rounded-full ${stage.color}`} style={{ width: stage.pct }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Sales Skills Leaderboard */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Kontribusi Sales Skills</h3>
              <p className="text-xs text-text-muted">Berdasarkan modul <code>louisblythe/Sales-Skills</code></p>
            </div>
            <span className="badge badge-blue text-[10px]">122 Skills Siap</span>
          </div>

          <div className="divide-y divide-border-light">
            {skillPerformances.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-muted">
                <p className="font-medium text-text-secondary">Belum ada data aktivitas sales skill</p>
                <p className="text-[11px] text-text-muted mt-1">Statistik akan tercatat otomatis saat AI memproses negosiasi WhatsApp</p>
              </div>
            ) : (
              skillPerformances.map((s) => (
                <div key={s.skill} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-text-primary">{s.label}</p>
                    <p className="text-[11px] font-mono text-primary-700">{s.skill}</p>
                    <p className="text-[11px] text-text-muted mt-0.5">{s.impact}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 block">{s.winRate}</span>
                    <span className="text-[10px] text-text-muted">{s.usage}x dipicu</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== PLAYGROUND PAGE =====
function PlaygroundPage() {
  const [messages, setMessages] = useState<Array<{ sender: "user" | "ai"; text: string; time: string; attachment?: string }>>([
    {
      sender: "user",
      text: "Selamat siang, saya kontraktor butuh Kabel NYM Supreme 3x2.5 roll 100m sekitar 25 roll. Bisa dapat diskon?",
      time: "10:30",
    },
    {
      sender: "ai",
      text: "Selamat siang! Untuk Kabel NYM 3x2.5mm Supreme (Roll 100m) ready stock di gudang kami. Harga normal Rp 1.350.000/roll.\n\nUntuk pengambilan 25 roll, otomatis kami berikan diskon tier kuantiti 5% menjadi Rp 1.282.500/roll (Total: Rp 32.062.500). Pengiriman ke area Jabodetabek bebas biaya ongkir armada kami. Boleh tahu rencana kirim ke lokasi mana?",
      time: "10:30",
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [activeIntent, setActiveIntent] = useState("pricing_discussion");
  const [activeSkills, setActiveSkills] = useState(["pricing-discussion-logic", "product-knowledge", "building-rapport"]);
  const [negotiationRound, setNegotiationRound] = useState(1);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiEngine, setAiEngine] = useState("Claude 4.5 Sonnet");

  const [guardrail, setGuardrail] = useState({
    status: "Aktif 100%",
    catalogPrice: 1350000,
    tierDiscount: "5% (Rp 1.282.500)",
    floorPrice: 1188000,
    maxOffer: 1250000,
    isFloorSafe: true,
  });

  const [recommendations, setRecommendations] = useState<Array<{ sku: string; name: string; price: number; unit?: string }>>([
    { sku: "PPA-CND-PVC-20", name: "Pipa Konduit PVC High Impact 20mm 2.9m Clipsal / Schneider", price: 18500, unit: "batang" },
    { sku: "KLM-CND-20", name: "Klem Pipa Konduit 20mm Putih PVC (Pack 50 pcs)", price: 32000, unit: "pack" },
  ]);

  const presetPrompts = [
    { label: "Minta diskon lagi ke Rp 1.250.000" },
    { label: "schneider ada?" },
    { label: "saya mau beli mcb" },
    { label: "Tanya pipa konduit pelengkap (cross-sell)" },
    { label: "Minta Company Profile PDF" },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loadingAI) return;

    const timeStr = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const newMsgs = [...messages, { sender: "user" as const, text, time: timeStr }];
    setMessages(newMsgs);
    setInputMessage("");
    setLoadingAI(true);

    try {
      const res = await fetch("/api/playground/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages,
          negotiationRound,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.activeIntent) setActiveIntent(data.activeIntent);
        if (data.activeSkills) setActiveSkills(data.activeSkills);
        if (data.negotiationRound) setNegotiationRound(data.negotiationRound);
        if (data.guardrail) setGuardrail(data.guardrail);
        if (data.recommendations && data.recommendations.length > 0) {
          setRecommendations(data.recommendations);
        }
        if (data.modelUsed) {
          setAiEngine(data.modelUsed);
        }

        const aiTime = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: data.replyText,
            time: aiTime,
            attachment: data.attachment,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: "Mohon maaf Pak, silakan ulangi pesan Anda.",
            time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Koneksi terganggu. Silakan pastikan server aktif.",
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      {/* Left: WhatsApp Phone Simulator (7 cols) */}
      <div className="lg:col-span-7 flex flex-col card overflow-hidden border border-border-light shadow-sm">
        {/* WhatsApp Chat Header */}
        <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
              SE
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold">PT Sinar Elektrik Mandiri</p>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              </div>
              <p className="text-[11px] text-emerald-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                AI Sales Assistant ({aiEngine} Online)
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-white/15 px-2.5 py-1 rounded text-white font-mono flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" />
            Anthropic Claude Core
          </span>
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#efeae2]/70">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs space-y-1.5 ${
                  m.sender === "user"
                    ? "bg-[#dcf8c6] text-slate-800 rounded-tr-xs"
                    : "bg-white text-slate-800 rounded-tl-xs border border-slate-100"
                }`}
              >
                {m.attachment && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[11px] truncate text-slate-800">{m.attachment}</p>
                      <p className="text-[10px] text-slate-500">2.8 MB • Dokumen PDF Terverifikasi</p>
                    </div>
                  </div>
                )}
                <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 pt-0.5 font-mono">
                  <span>{m.time}</span>
                  {m.sender === "user" && <Check className="w-3 h-3 text-emerald-600" />}
                </div>
              </div>
            </div>
          ))}

          {loadingAI && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-white rounded-2xl rounded-tl-xs px-4 py-3 text-xs border border-slate-100 shadow-2xs flex items-center gap-2.5 text-slate-600">
                <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
                <span className="text-[11px]">AI sedang menganalisis katalog, stok, dan guardrail harga...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-text-muted shrink-0 text-[10px] font-semibold uppercase">Uji Coba:</span>
          {presetPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(p.label)}
              disabled={loadingAI}
              className="btn-ghost shrink-0 text-[11px] py-1 px-2.5 bg-slate-50 hover:bg-primary-50 hover:text-primary-700 border border-slate-200 rounded-full cursor-pointer disabled:opacity-50"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-border-light flex items-center gap-2">
          <input
            type="text"
            placeholder="Ketik pesan simulasi pembeli (misal: 'schneider ada?' atau 'saya mau beli mcb')..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            disabled={loadingAI}
            className="input flex-1 h-9 text-xs"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={loadingAI || !inputMessage.trim()}
            className="btn-primary h-9 px-3 flex items-center gap-1 text-xs disabled:opacity-50"
          >
            {loadingAI ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Kirim
          </button>
        </div>
      </div>

      {/* Right: Engine Inspector (5 cols) */}
      <div className="lg:col-span-5 flex flex-col space-y-4 overflow-y-auto">
        {/* Guardrail Box */}
        <div className="card p-4 space-y-3 bg-gradient-to-br from-white to-blue-50/40">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary-600" />
              Guardrail Keamanan Harga AI
            </h4>
            <span className="badge badge-green text-[10px]">{guardrail.status}</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-border-light">
              <span className="text-text-secondary">Harga Katalog Asli:</span>
              <span className="font-semibold tabular-nums text-text-primary">
                Rp {guardrail.catalogPrice.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-light">
              <span className="text-text-secondary">Diskon Tier Kuantiti (25 roll):</span>
              <span className="font-semibold text-emerald-600">{guardrail.tierDiscount}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-light">
              <span className="text-text-secondary">Koefisien Floor (0.88):</span>
              <span className="font-mono font-bold text-red-600">
                Rp {guardrail.floorPrice.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-text-secondary">Batas Penawaran Terkini:</span>
              <span className="font-semibold text-text-primary font-mono">
                Rp {guardrail.maxOffer.toLocaleString("id-ID")} (Ronde {negotiationRound})
              </span>
            </div>
          </div>
          <p className="text-[11px] text-text-muted italic">
            *AI dilarang keras menawarkan harga di bawah Rp {guardrail.floorPrice.toLocaleString("id-ID")} apa pun argumen pelanggan.
          </p>
        </div>

        {/* Live Intent & Skills Picked */}
        <div className="card p-4 space-y-3">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Skills Terpilih dari vendor/sales-skills
          </h4>

          <div>
            <span className="text-[11px] text-text-muted block mb-1">Intent Terdeteksi:</span>
            <span className="badge badge-blue font-mono text-xs">{activeIntent}</span>
          </div>

          <div>
            <span className="text-[11px] text-text-muted block mb-1.5">Modul Penjualan Aktif:</span>
            <div className="flex flex-wrap gap-1.5">
              {activeSkills.map((sk) => (
                <span key={sk} className="badge badge-slate text-[11px] font-mono py-1 px-2 border border-slate-200">
                  {sk}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Cross-Sell Engine */}
        <div className="card p-4 space-y-2.5">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-600" />
            Rekomendasi Produk Terkait (Cross-Sell)
          </h4>
          <div className="space-y-2">
            {recommendations.map((r, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-surface-secondary text-xs space-y-1 border border-border-light">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-text-primary">{r.name}</p>
                  <span className="font-mono text-primary-700 font-bold">
                    Rp {r.price.toLocaleString("id-ID")}/{r.unit || "pcs"}
                  </span>
                </div>
                <p className="text-text-secondary text-[10px] font-mono">SKU: {r.sku}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== PLAYWRIGHT WHATSAPP CONNECT PAGE =====
function PlaywrightConnectPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [sessionId, setSessionId] = useState("default");
  const [sessionStatus, setSessionStatus] = useState<"disconnected" | "starting" | "qr_ready" | "connected">("disconnected");
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<"online" | "offline" | "checking">("checking");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [screenshotTime, setScreenshotTime] = useState(Date.now());

  // Test message states
  const [testTo, setTestTo] = useState("");
  const [testText, setTestText] = useState("Halo dari AIWA Sales WhatsApp Playwright! Sistem siap melayani pelanggan.");
  const [sendingTest, setSendingTest] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const PLAYWRIGHT_URL = process.env.NEXT_PUBLIC_PLAYWRIGHT_URL || "/api/playwright";

  // Check health and session status on mount
  const checkStatus = async () => {
    try {
      const healthRes = await fetch(`${PLAYWRIGHT_URL}/health`).catch(() => null);
      if (!healthRes || !healthRes.ok) {
        setServerStatus("offline");
        return;
      }
      setServerStatus("online");

      const statusRes = await fetch(`${PLAYWRIGHT_URL}/sessions/${sessionId}/status`).catch(() => null);
      if (statusRes && statusRes.ok) {
        const data = await statusRes.json();
        if (data.status === "connected") {
          setSessionStatus("connected");
          setUserPhone(data.userPhone || "+6281234567890");
          setQrCodeData(null);
        } else if (data.status === "qr_ready" && data.qr) {
          setSessionStatus("qr_ready");
          setQrCodeData(data.qr);
        } else {
          setSessionStatus(data.status === "draft" ? "disconnected" : data.status || "disconnected");
        }
      }
    } catch (e: any) {
      setServerStatus("offline");
    }
  };

  // Check on mount and poll regularly until connected
  useEffect(() => {
    checkStatus();
    const interval = setInterval(() => {
      if (sessionStatus !== "connected") {
        checkStatus();
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [sessionStatus, sessionId]);

  // Start Playwright Chrome session
  const handleStartSession = async () => {
    setLoading(true);
    setStatusMessage("Membuka browser Google Chrome via Playwright...");
    setSessionStatus("starting");

    try {
      const res = await fetch(`${PLAYWRIGHT_URL}/sessions/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.status === "connected") {
          setSessionStatus("connected");
          setUserPhone(data.userPhone || "+6281234567890");
          setStatusMessage("Sesi tersambung ke WhatsApp Web!");
        } else {
          setSessionStatus("qr_ready");
          if (data.qr) setQrCodeData(data.qr);
          setStatusMessage(data.message || "Silakan pindai kode QR di bawah dengan aplikasi WhatsApp HP Anda.");
        }
      } else {
        setStatusMessage(`Gagal: ${data.error || "Gagal memulai sesi Playwright"}`);
        setSessionStatus("disconnected");
      }
    } catch (err: any) {
      setStatusMessage(`Gagal menghubungi service Playwright: ${err.message}`);
      setSessionStatus("disconnected");
    } finally {
      setLoading(false);
    }
  };

  // Logout / Disconnect session
  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch(`${PLAYWRIGHT_URL}/sessions/${sessionId}/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      setSessionStatus("disconnected");
      setQrCodeData(null);
      setUserPhone(null);
      setStatusMessage("Sesi WhatsApp Web telah diputus.");
    } catch (err: any) {
      setStatusMessage(`Gagal logout: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Send Test Message
  const handleSendTestMessage = async () => {
    if (!testTo.trim() || !testText.trim()) {
      setTestFeedback({ success: false, message: "Nomor tujuan dan teks pesan wajib diisi." });
      return;
    }

    setSendingTest(true);
    setTestFeedback(null);

    try {
      const res = await fetch(`${PLAYWRIGHT_URL}/messages/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          to: testTo,
          text: testText,
        }),
      });

      const data = await res.json();
      if (res.ok && (data.success || data.messageId)) {
        setTestFeedback({ success: true, message: `Pesan sukses terkirim via Playwright ke ${testTo}!` });
      } else {
        setTestFeedback({ success: false, message: data.error || "Gagal mengirim pesan." });
      }
    } catch (err: any) {
      setTestFeedback({ success: false, message: `Koneksi error: ${err.message}` });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Status */}
      <div className="card p-5 bg-gradient-to-r from-surface via-surface to-emerald-50/30 border border-border-light shadow-xs animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              sessionStatus === "connected"
                ? "bg-emerald-600 text-white"
                : sessionStatus === "qr_ready"
                ? "bg-amber-500 text-white"
                : "bg-slate-100 text-slate-600"
            }`}>
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-text-primary">Koneksi WhatsApp Web (Playwright)</h3>
                {serverStatus === "online" ? (
                  <span className="badge badge-green text-[11px] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Service Online ({PLAYWRIGHT_URL.replace("http://", "")})
                  </span>
                ) : (
                  <span className="badge badge-red text-[11px] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Service Offline
                  </span>
                )}
                <span className="badge badge-slate text-[11px] font-mono">Session: {sessionId}</span>
              </div>

              <p className="text-xs text-text-secondary mt-1">
                {sessionStatus === "connected"
                  ? `Terhubung dengan nomor ${userPhone || "+6281234567890"}. Mode Browser Chrome Anti-Deteksi Meta aktif.`
                  : sessionStatus === "qr_ready"
                  ? "Kode QR siap. Buka WhatsApp di smartphone Anda lalu pindai kode di bawah ini."
                  : sessionStatus === "starting"
                  ? "Sedang membuka Google Chrome dan memuat WhatsApp Web..."
                  : "Browser Playwright belum terhubung. Klik tombol Mulai Sesi untuk menghubungkan nomor WhatsApp bisnis Anda."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {sessionStatus === "connected" ? (
              <>
                <button
                  onClick={() => {
                    setScreenshotTime(Date.now());
                    setShowScreenshotModal(true);
                  }}
                  className="btn-secondary text-xs flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Pratinjau Layar Chrome
                </button>
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="btn-ghost text-xs text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-200"
                >
                  <Power className="w-3.5 h-3.5" />
                  Putus Sesi
                </button>
              </>
            ) : (
              <button
                onClick={handleStartSession}
                disabled={loading || serverStatus === "offline"}
                className="btn-primary text-xs py-2.5 px-4 flex items-center gap-2 bg-[#075e54] hover:bg-[#128c7e]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Membuka Browser...
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4" />
                    Mulai Sesi & Scan QR
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 flex items-center gap-2.5 animate-fade-in font-medium">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: QR Code Box & Steps (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="card p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border-light">
              <div>
                <h4 className="text-sm font-bold text-text-primary">Pindai Kode QR WhatsApp Web</h4>
                <p className="text-xs text-text-muted mt-0.5">Tautkan akun WhatsApp resmi bisnis Anda ke sistem AIWA</p>
              </div>
              <button
                onClick={checkStatus}
                className="btn-ghost p-1.5 text-text-muted hover:text-text-primary rounded-lg"
                title="Segarkan Status"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* QR Card Container */}
            <div className="flex flex-col sm:flex-row items-center gap-6 justify-center p-6 bg-slate-50/70 rounded-2xl border border-slate-100">
              <div className="w-56 h-56 rounded-2xl bg-white p-3 border border-slate-200 shadow-sm flex items-center justify-center relative overflow-hidden group">
                {sessionStatus === "connected" ? (
                  <div className="text-center p-4 space-y-3">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-2xs">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-800">WhatsApp Terhubung!</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{userPhone || "+6281234567890"}</p>
                    </div>
                  </div>
                ) : qrCodeData ? (
                  <img
                    src={qrCodeData}
                    alt="WhatsApp QR Code"
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-center p-4 space-y-2">
                    <QrCode className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">Klik &ldquo;Mulai Sesi & Scan QR&rdquo; untuk memuat kode</p>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="space-y-3 max-w-xs text-xs text-slate-600">
                <p className="font-bold text-text-primary uppercase tracking-wider text-[11px]">Cara Menghubungkan:</p>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                    <p>Buka aplikasi <strong>WhatsApp</strong> di smartphone Anda.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                    <p>Buka Menu <strong>(titik tiga)</strong> atau <strong>Pengaturan</strong> &rarr; pilih <strong>Perangkat Tertaut</strong>.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                    <p>Ketuk tombol <strong>Tautkan Perangkat</strong>.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0">4</span>
                    <p>Arahkan kamera ponsel Anda ke kode QR di layar ini.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-surface-secondary border border-border-light text-center space-y-1">
                <Laptop className="w-4 h-4 text-primary-600 mx-auto" />
                <p className="text-xs font-semibold text-text-primary">Chrome Asli</p>
                <p className="text-[10px] text-text-muted">Anti-deteksi Meta Webhook</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-secondary border border-border-light text-center space-y-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto" />
                <p className="text-xs font-semibold text-text-primary">Multi-Perangkat</p>
                <p className="text-[10px] text-text-muted">Sesi tersimpan di local data</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-secondary border border-border-light text-center space-y-1">
                <Bot className="w-4 h-4 text-blue-600 mx-auto" />
                <p className="text-xs font-semibold text-text-primary">Otomasi AI</p>
                <p className="text-[10px] text-text-muted">Auto-reply & kalkulasi harga</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Test Message Console & Service Details (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Test Sender */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-light">
              <h4 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                <Send className="w-4 h-4 text-primary-600" />
                Uji Kirim Pesan via Playwright
              </h4>
              <span className="badge badge-slate text-[10px]">Test Console</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">Nomor WhatsApp Tujuan</label>
                <input
                  type="text"
                  placeholder="Contoh: 6281234567890"
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                  className="input font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">Pesan Uji Coba</label>
                <textarea
                  rows={3}
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  className="input text-xs resize-none"
                />
              </div>

              <button
                onClick={handleSendTestMessage}
                disabled={sendingTest || sessionStatus !== "connected"}
                className="btn-primary w-full text-xs py-2 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {sendingTest ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Mengirim via Chrome Playwright...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Kirim Pesan WhatsApp Sekarang
                  </>
                )}
              </button>

              {testFeedback && (
                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  testFeedback.success
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}>
                  {testFeedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{testFeedback.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Service Specs */}
          <div className="card p-5 space-y-3">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-slate-600" />
              Detail Integrasi Layanan
            </h4>

            <div className="space-y-2 text-xs divide-y divide-border-light">
              <div className="flex justify-between py-1.5">
                <span className="text-text-muted">Playwright Service URL:</span>
                <span className="font-mono font-medium text-text-primary">{PLAYWRIGHT_URL}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-text-muted">Mode Eksekusi:</span>
                <span className="font-medium text-text-primary">Google Chrome Anti-Deteksi</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-text-muted">Target Session:</span>
                <span className="font-mono text-primary-700 font-semibold">{sessionId}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-text-muted">Kapasitas Sesi:</span>
                <span className="font-medium text-emerald-600">Multi-Account Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Screenshot Modal */}
      {showScreenshotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-4xl w-full border border-border-light shadow-2xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-border-light flex items-center justify-between bg-surface-secondary">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-primary-600" />
                  Pratinjau Layar Langsung WhatsApp Web (Chrome)
                </h3>
                <p className="text-xs text-text-muted mt-0.5">Tampilan aktual browser Playwright di sistem Anda</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setScreenshotTime(Date.now())}
                  className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Ambil Tangkapan Layar Baru
                </button>
                <button onClick={() => setShowScreenshotModal(false)} className="btn-ghost p-1.5 text-text-muted rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-900 flex items-center justify-center min-h-[420px] max-h-[70vh] overflow-auto">
              <img
                src={`${PLAYWRIGHT_URL}/debug/screenshot?t=${screenshotTime}`}
                alt="Live WhatsApp Web Screenshot"
                className="max-w-full h-auto rounded-lg shadow-lg border border-slate-700"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>

            <div className="px-6 py-3 border-t border-border-light bg-surface flex justify-between items-center text-xs text-text-muted">
              <span>Endpoint: <code>/debug/screenshot</code></span>
              <button onClick={() => setShowScreenshotModal(false)} className="btn-primary text-xs">
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== MAIN PAGE =====
export default function Home() {
  const [activePage, setActivePage] = useState("dashboard");
  const [conversations, setConversations] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionStatus, setSessionStatus] = useState<string>("disconnected");
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [selectedChatPhone, setSelectedChatPhone] = useState<string | null>(null);

  // Sync real-time WhatsApp inbox data from API
  const fetchInboxData = useCallback(async () => {
    try {
      const res = await fetch("/api/webhooks/playwright");
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          if (data.status) setSessionStatus(data.status);
          if (data.qrDataUrl !== undefined) setQrCodeData(data.qrDataUrl);
          if (Array.isArray(data.conversations)) {
            setConversations(data.conversations);
          }
          if (typeof data.unreadCount === "number") {
            setUnreadCount(data.unreadCount);
          }
        }
      }
    } catch (err) {}
  }, []);

  useEffect(() => {
    fetchInboxData();
    const interval = setInterval(fetchInboxData, 3000);
    return () => clearInterval(interval);
  }, [fetchInboxData]);

  const handleSelectChat = (phone: string) => {
    setSelectedChatPhone(phone);
    setActivePage("inbox");
  };

  const pageTitles: Record<string, { title: string; subtitle?: string }> = {
    dashboard: { title: "Dashboard", subtitle: "Ringkasan aktivitas AI sales" },
    playwright: { title: "Koneksi WhatsApp Web", subtitle: "Integrasi Playwright Browser Automation & Scanner QR" },
    inbox: { title: "Inbox", subtitle: "Percakapan WhatsApp" },
    pipeline: { title: "Pipeline", subtitle: "Tahapan deal" },
    contacts: { title: "Kontak", subtitle: "Manajemen pelanggan" },
    catalog: { title: "Katalog", subtitle: "Manajemen produk" },
    documents: { title: "Dokumen", subtitle: "PDF company profile & brosur" },
    analytics: { title: "Analitik", subtitle: "Laporan & metrik" },
    playground: { title: "Playground", subtitle: "Uji bot AI" },
    settings: { title: "Pengaturan", subtitle: "Konfigurasi tenant" },
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <DashboardPage
            onNavigate={setActivePage}
            conversations={conversations}
            unreadCount={unreadCount}
            onSelectChat={handleSelectChat}
            sessionStatus={sessionStatus}
            qrCodeData={qrCodeData}
          />
        );
      case "playwright":
        return <PlaywrightConnectPage onNavigate={setActivePage} />;
      case "inbox":
        return (
          <InboxPage
            initialConversations={conversations}
            selectedPhone={selectedChatPhone}
            onSelectPhone={setSelectedChatPhone}
            onRefresh={fetchInboxData}
          />
        );
      case "pipeline":
        return (
          <PipelinePage
            conversations={conversations}
            onSelectChat={handleSelectChat}
          />
        );
      case "contacts":
        return (
          <ContactsPage
            conversations={conversations}
            onSelectChat={handleSelectChat}
          />
        );
      case "catalog":
        return <CatalogPage />;
      case "settings":
        return <SettingsPage />;
      case "documents":
        return <DocumentsPage />;
      case "analytics":
        return <AnalyticsPage />;
      case "playground":
        return <PlaygroundPage />;
      default:
        return (
          <DashboardPage
            onNavigate={setActivePage}
            conversations={conversations}
            unreadCount={unreadCount}
            onSelectChat={handleSelectChat}
          />
        );
    }
  };

  const pageInfo = pageTitles[activePage] || pageTitles.dashboard;

  return (
    <div className="flex min-h-screen">
      <Sidebar active={activePage} onNavigate={setActivePage} unreadCount={unreadCount} />
      <main className="flex-1 ml-[260px]">
        <Header
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          unreadCount={unreadCount}
          onNavigate={setActivePage}
        />
        <div className="p-6">{renderPage()}</div>
      </main>
    </div>
  );
}
