"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useNavigationProgress } from "@/components/providers/navigation-progress";
import {
  Award,
  BarChart3,
  BookOpen,
  BookMarked,
  Brain,
  BrainCircuit,
  BriefcaseBusiness,
  Bus,
  Building2,
  ClipboardCheck,
  ClipboardList,
  FileBarChart2,
  FileText,
  CalendarCheck2,
  Globe,
  GraduationCap,
  HeartPulse,
  Home,
  IdCard,
  LibraryBig,
  LayoutDashboard,
  MessageSquare,
  Microscope,
  Package,
  MapPin,
  Printer,
  Radio,
  Sparkles,
  Store,
  Settings,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UsersRound,
  UserRound,
  UserPlus,
  UserCheck,
  Users,
  Wallet,
  TrendingDown,
  Smartphone,
  Loader2,
  LogOut,
  Bookmark,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Bell,
  HelpCircle,
  Info,
  Download,
  RefreshCw,
  Compass,
  Send,
  Search,
  Star,
  X,
  ChevronsUpDown,
} from "lucide-react";
import { logout } from "@/domains/auth/actions/login";
import { PWAInstallButton } from "@/components/common/PWAInstallButton";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  badge?: string;
  badgeColor?: string;
  keywords?: string;
};

type NavSection = {
  id: string;
  title: string;
  dotColor: string;
  items: NavItem[];
};

const DEFAULT_PINNED_HREFS = [
  "/dashboard",
  "/dashboard/students",
  "/dashboard/id-cards",
  "/dashboard/academics/grades",
  "/dashboard/finance",
];

const sectionThemes: Record<
  string,
  {
    text: string;
    badgeBg: string;
    badgeBorder: string;
    dot: string;
    divider: string;
  }
> = {
  pinned: {
    text: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-50/90 dark:bg-amber-950/50",
    badgeBorder: "border-amber-200/80 dark:border-amber-800/60",
    dot: "bg-amber-500",
    divider: "from-amber-300/60 dark:from-amber-700/50",
  },
  general: {
    text: "text-indigo-600 dark:text-indigo-400",
    badgeBg: "bg-indigo-50/90 dark:bg-indigo-950/50",
    badgeBorder: "border-indigo-200/80 dark:border-indigo-800/60",
    dot: "bg-indigo-500",
    divider: "from-indigo-300/60 dark:from-indigo-700/50",
  },
  schooling: {
    text: "text-blue-600 dark:text-blue-400",
    badgeBg: "bg-blue-50/90 dark:bg-blue-950/50",
    badgeBorder: "border-blue-200/80 dark:border-blue-800/60",
    dot: "bg-blue-500",
    divider: "from-blue-300/60 dark:from-blue-700/50",
  },
  pedagogie: {
    text: "text-violet-600 dark:text-violet-400",
    badgeBg: "bg-violet-50/90 dark:bg-violet-950/50",
    badgeBorder: "border-violet-200/80 dark:border-violet-800/60",
    dot: "bg-violet-500",
    divider: "from-violet-300/60 dark:from-violet-700/50",
  },
  finance: {
    text: "text-emerald-600 dark:text-emerald-400",
    badgeBg: "bg-emerald-50/90 dark:bg-emerald-950/50",
    badgeBorder: "border-emerald-200/80 dark:border-emerald-800/60",
    dot: "bg-emerald-500",
    divider: "from-emerald-300/60 dark:from-emerald-700/50",
  },
  administration: {
    text: "text-purple-600 dark:text-purple-400",
    badgeBg: "bg-purple-50/90 dark:bg-purple-950/50",
    badgeBorder: "border-purple-200/80 dark:border-purple-800/60",
    dot: "bg-purple-500",
    divider: "from-purple-300/60 dark:from-purple-700/50",
  },
  canevas: {
    text: "text-cyan-600 dark:text-cyan-400",
    badgeBg: "bg-cyan-50/90 dark:bg-cyan-950/50",
    badgeBorder: "border-cyan-200/80 dark:border-cyan-800/60",
    dot: "bg-cyan-500",
    divider: "from-cyan-300/60 dark:from-cyan-700/50",
  },
  resources: {
    text: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-50/90 dark:bg-amber-950/50",
    badgeBorder: "border-amber-200/80 dark:border-amber-800/60",
    dot: "bg-amber-500",
    divider: "from-amber-300/60 dark:from-amber-700/50",
  },
  communication: {
    text: "text-pink-600 dark:text-pink-400",
    badgeBg: "bg-pink-50/90 dark:bg-pink-950/50",
    badgeBorder: "border-pink-200/80 dark:border-pink-800/60",
    dot: "bg-pink-500",
    divider: "from-pink-300/60 dark:from-pink-700/50",
  },
  owner: {
    text: "text-rose-600 dark:text-rose-400",
    badgeBg: "bg-rose-50/90 dark:bg-rose-950/50",
    badgeBorder: "border-rose-200/80 dark:border-rose-800/60",
    dot: "bg-rose-500",
    divider: "from-rose-300/60 dark:from-rose-700/50",
  },
};

const sections: NavSection[] = [
  {
    id: "general",
    title: "VUE GÉNÉRALE",
    dotColor: "bg-indigo-500",
    items: [
      { href: "/dashboard", label: "Tableau de bord", icon: <LayoutDashboard className="size-[18px]" />, color: "text-indigo-500", keywords: "accueil home stats" },
      { href: "/dashboard/reports", label: "Rapports généraux", icon: <BarChart3 className="size-[18px]" />, color: "text-indigo-500", keywords: "statistiques bilan" },
      { href: "/dashboard/data-quality", label: "Qualité des données", icon: <ShieldAlert className="size-[18px]" />, color: "text-rose-500", keywords: "audit erreurs doublons" },
    ],
  },
  {
    id: "schooling",
    title: "SCOLARITÉ",
    dotColor: "bg-blue-500",
    items: [
      { href: "/dashboard/parent", label: "Portail Parents & App", icon: <Smartphone className="size-[18px]" />, color: "text-purple-500", badge: "Mobile", badgeColor: "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400", keywords: "tuteur famille application" },
      { href: "/dashboard/admissions", label: "Inscriptions & Admissions", icon: <UserPlus className="size-[18px]" />, color: "text-emerald-500", badge: "En ligne", badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400", keywords: "nouveau dossier reinscription" },
      { href: "/dashboard/students", label: "Élèves", icon: <Users className="size-[18px]" />, color: "text-blue-500", keywords: "etudiants liste classe matricule" },
      { href: "/dashboard/students/discipline", label: "Discipline", icon: <Shield className="size-[18px]" />, color: "text-rose-500", keywords: "sanctions comportement absences" },
      { href: "/dashboard/students/promote", label: "Promotions", icon: <GraduationCap className="size-[18px]" />, color: "text-indigo-500", keywords: "passage classe superieure" },
      { href: "/dashboard/attendance", label: "Présences élèves", icon: <CalendarCheck2 className="size-[18px]" />, color: "text-emerald-500", keywords: "absences retards appel pointage" },
      { href: "/dashboard/academics", label: "Gestion académique", icon: <BookOpen className="size-[18px]" />, color: "text-blue-500", keywords: "classes matieres coefficients" },
      { href: "/dashboard/academics/lmd", label: "Système LMD / ECTS", icon: <GraduationCap className="size-[18px]" />, color: "text-indigo-600", badge: "Supérieur", badgeColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400", keywords: "universite credits licence master" },
      { href: "/dashboard/academics/sections", label: "Sections / Filières", icon: <Bookmark className="size-[18px]" />, color: "text-amber-500", keywords: "series groupes" },
      { href: "/dashboard/academics/pedagogical-units", label: "Unités pédagogiques", icon: <UsersRound className="size-[18px]" />, color: "text-indigo-500", keywords: "up departements" },
      { href: "/dashboard/academics/exams", label: "Examens", icon: <ClipboardList className="size-[18px]" />, color: "text-indigo-500", keywords: "evaluations compositions" },
      { href: "/dashboard/academics/exams/ai-grader", label: "Correcteur IA Caméra", icon: <Sparkles className="size-[18px]" />, color: "text-amber-500", badge: "Vision IA", badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400", keywords: "scan copies correction automatique" },
      { href: "/dashboard/academics/grades", label: "Notes & résultats", icon: <ClipboardCheck className="size-[18px]" />, color: "text-emerald-500", keywords: "moyennes bulletins saisie" },
      { href: "/dashboard/academics/bulletins-batch", label: "Impression Bulletins", icon: <Printer className="size-[18px]" />, color: "text-blue-500", badge: "Batch PDF", badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400", keywords: "releves notes trimestre semestre" },
      { href: "/dashboard/academics/timetable", label: "Emploi du temps", icon: <CalendarCheck2 className="size-[18px]" />, color: "text-amber-500", keywords: "planning horaires cours" },
      { href: "/dashboard/hr/attendance/teacher/me", label: "Ma présence", icon: <ClipboardCheck className="size-[18px]" />, color: "text-emerald-500", keywords: "pointage enseignant" },
      { href: "/dashboard/academics/homework", label: "Devoirs", icon: <FileBarChart2 className="size-[18px]" />, color: "text-blue-500", keywords: "exercices maison" },
      { href: "/dashboard/academics/devoirs", label: "Devoirs IA", icon: <BriefcaseBusiness className="size-[18px]" />, color: "text-indigo-500", keywords: "generateur exercices ia" },
      { href: "/dashboard/academics/research-graduation", label: "Mémoires & PFE", icon: <GraduationCap className="size-[18px]" />, color: "text-purple-500", keywords: "soutenance stage" },
      { href: "/dashboard/alumni", label: "Alumni & Diplômes", icon: <Award className="size-[18px]" />, color: "text-violet-500", badge: "QR Code", badgeColor: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400", keywords: "anciens eleves certificats" },
      { href: "/verify", label: "Portail Vérification Public", icon: <ShieldCheck className="size-[18px]" />, color: "text-emerald-400", badge: "Officiel", badgeColor: "bg-emerald-500/20 text-emerald-300", keywords: "authentification qr scanner" },
    ],
  },
  {
    id: "pedagogie",
    title: "PÉDAGOGIE",
    dotColor: "bg-violet-500",
    items: [
      { href: "/dashboard/pedagogie/copilot", label: "Copilot Pédagogique IA", icon: <Sparkles className="size-[18px]" />, color: "text-purple-600", badge: "Enterprise", badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400", keywords: "assistant ia fiches cours" },
      { href: "/dashboard/pedagogie", label: "Tableau de bord pédagogique", icon: <LayoutDashboard className="size-[18px]" />, color: "text-violet-600" },
      { href: "/dashboard/pedagogie/ai-analytics", label: "Analytique IA & Décrochage", icon: <BrainCircuit className="size-[18px]" />, color: "text-purple-500" },
      { href: "/dashboard/analytics", label: "Analyses prédictives & BI", icon: <BarChart3 className="size-[18px]" />, color: "text-indigo-500" },
      { href: "/dashboard/pedagogie/cahier-textes", label: "Cahier de textes", icon: <BookMarked className="size-[18px]" />, color: "text-violet-500" },
      { href: "/dashboard/pedagogie/planification", label: "Planification pédagogique", icon: <CalendarCheck2 className="size-[18px]" />, color: "text-indigo-500" },
      { href: "/dashboard/pedagogie/progression", label: "Suivi de progression", icon: <FileBarChart2 className="size-[18px]" />, color: "text-emerald-500" },
      { href: "/dashboard/pedagogie/ressources", label: "Ressources pédagogiques", icon: <LibraryBig className="size-[18px]" />, color: "text-violet-500" },
      { href: "/dashboard/pedagogie/devoirs", label: "Devoirs & corrections", icon: <ClipboardList className="size-[18px]" />, color: "text-amber-500" },
      { href: "/dashboard/pedagogie/remediation", label: "Remédiation pédagogique", icon: <GraduationCap className="size-[18px]" />, color: "text-rose-500" },
      { href: "/dashboard/pedagogie/inspection", label: "Inspection pédagogique", icon: <Microscope className="size-[18px]" />, color: "text-cyan-500" },
      { href: "/dashboard/pedagogie/rapports", label: "Rapports pédagogiques", icon: <FileText className="size-[18px]" />, color: "text-slate-600" },
    ],
  },
  {
    id: "finance",
    title: "FINANCES",
    dotColor: "bg-emerald-500",
    items: [
      { href: "/dashboard/finance", label: "Gestion financière", icon: <Wallet className="size-[18px]" />, color: "text-emerald-500", keywords: "scolarite frais caisse recus" },
      { href: "/dashboard/finance/mobile-money", label: "Mobile Money & UEMOA", icon: <Smartphone className="size-[18px]" />, color: "text-emerald-500", badge: "Direct", badgeColor: "bg-emerald-500/20 text-emerald-400", keywords: "airtel moov zamani nita amana" },
      { href: "/dashboard/finance/bourses-echeanciers", label: "Bourses & Échéanciers", icon: <Award className="size-[18px]" />, color: "text-amber-500", keywords: "reductions tranches" },
      { href: "/dashboard/finance/expenses", label: "Gestion des Dépenses", icon: <TrendingDown className="size-[18px]" />, color: "text-rose-500", keywords: "charges achats" },
      { href: "/dashboard/finance/syscohada", label: "Paiements Mobile & SYSCOHADA", icon: <Smartphone className="size-[18px]" />, color: "text-orange-500", badge: "Phase 3", badgeColor: "bg-orange-500/20 text-orange-400", keywords: "comptabilite journal bilan" },
      { href: "/dashboard/coges", label: "Paiement COGES", icon: <BriefcaseBusiness className="size-[18px]" />, color: "text-indigo-500", keywords: "cotisation parents" },
      { href: "/verify", label: "Vérifier Quittances & Reçus", icon: <ShieldCheck className="size-[18px]" />, color: "text-amber-400", badge: "SYSCOHADA", badgeColor: "bg-amber-500/20 text-amber-300" },
    ],
  },
  {
    id: "administration",
    title: "ADMINISTRATION",
    dotColor: "bg-violet-500",
    items: [
      { href: "/dashboard/admin-docs", label: "Administration & attestations", icon: <FileText className="size-[18px]" />, color: "text-indigo-500", keywords: "certificats scolarite" },
      { href: "/dashboard/admin-docs/admit-cards", label: "Cartes d'admission", icon: <IdCard className="size-[18px]" />, color: "text-emerald-500", keywords: "convocations examen" },
      { href: "/dashboard/id-cards", label: "Cartes d'identité", icon: <IdCard className="size-[18px]" />, color: "text-blue-500", badge: "Studio HD", badgeColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300", keywords: "carte scolaire badge recto verso pdf" },
      { href: "/dashboard/importation", label: "Importation intelligente", icon: <Package className="size-[18px]" />, color: "text-indigo-600", keywords: "excel csv migration" },
      { href: "/dashboard/front-office", label: "Accueil administratif", icon: <Building2 className="size-[18px]" />, color: "text-indigo-500", keywords: "visiteurs courrier" },
      { href: "/dashboard/print-demo", label: "Impression officielle", icon: <Printer className="size-[18px]" />, color: "text-slate-500" },
    ],
  },
  {
    id: "canevas",
    title: "CANEVAS SCOLAIRES",
    dotColor: "bg-cyan-500",
    items: [
      { href: "/dashboard/canevas", label: "Tableau de bord canevas", icon: <FileBarChart2 className="size-[18px]" />, color: "text-indigo-500" },
      { href: "/dashboard/canevas/etablissements", label: "Établissements", icon: <Building2 className="size-[18px]" />, color: "text-blue-500" },
      { href: "/dashboard/canevas/carte-scolaire", label: "Carte Scolaire SIG", icon: <Compass className="size-[18px]" />, color: "text-teal-500", badge: "SIG", badgeColor: "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400" },
      { href: "/dashboard/canevas/early-warning", label: "Alerte & IA Décrochage", icon: <Brain className="size-[18px]" />, color: "text-amber-500", badge: "IA", badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" },
      { href: "/dashboard/ministry", label: "Portail Ministère", icon: <Globe className="size-[18px]" />, color: "text-rose-500" },
      { href: "/dashboard/inspection", label: "Portail Inspection", icon: <Shield className="size-[18px]" />, color: "text-cyan-500" },
      { href: "/dashboard/canevas/reporting", label: "Centre de reporting", icon: <BarChart3 className="size-[18px]" />, color: "text-indigo-500" },
      { href: "/dashboard/canevas/export", label: "Export canevas", icon: <Download className="size-[18px]" />, color: "text-slate-500" },
    ],
  },
  {
    id: "resources",
    title: "RESSOURCES",
    dotColor: "bg-amber-500",
    items: [
      { href: "/dashboard/hr", label: "Personnel", icon: <UserRound className="size-[18px]" />, color: "text-blue-500", keywords: "enseignants professeurs salaires" },
      { href: "/dashboard/hr/self-service", label: "Espace Personnel & RH", icon: <UserCheck className="size-[18px]" />, color: "text-emerald-500", badge: "Agent", badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" },
      { href: "/dashboard/hr/reports", label: "Rapports du personnel", icon: <FileBarChart2 className="size-[18px]" />, color: "text-indigo-500" },
      { href: "/dashboard/inventory", label: "Inventaire", icon: <Package className="size-[18px]" />, color: "text-amber-500" },
      { href: "/dashboard/library", label: "Bibliothèque", icon: <LibraryBig className="size-[18px]" />, color: "text-indigo-500" },
      { href: "/dashboard/transport", label: "Transport", icon: <Bus className="size-[18px]" />, color: "text-blue-500" },
      { href: "/dashboard/transport/live-map", label: "Radar GPS en direct", icon: <Radio className="size-[18px]" />, color: "text-emerald-500", badge: "GPS Live", badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" },
      { href: "/dashboard/health", label: "Infirmerie & Santé", icon: <HeartPulse className="size-[18px]" />, color: "text-rose-500" },
      { href: "/dashboard/hostel", label: "Internat", icon: <Home className="size-[18px]" />, color: "text-emerald-500" },
      { href: "/dashboard/pos", label: "Point de vente (POS)", icon: <Store className="size-[18px]" />, color: "text-purple-500" },
      { href: "/dashboard/lms", label: "Formation en ligne", icon: <BookOpen className="size-[18px]" />, color: "text-indigo-500" },
    ],
  },
  {
    id: "communication",
    title: "COMMUNICATION",
    dotColor: "bg-pink-500",
    items: [
      { href: "/dashboard/messaging", label: "Messagerie", icon: <MessageSquare className="size-[18px]" />, color: "text-pink-500", badge: "12", badgeColor: "bg-pink-50 text-pink-600 dark:bg-pink-500/20 dark:text-pink-300" },
      { href: "/dashboard/messaging/whatsapp-hub", label: "Hub WhatsApp & SMS", icon: <Send className="size-[18px]" />, color: "text-emerald-500", badge: "Direct", badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" },
      { href: "/dashboard/notifications", label: "Notifications", icon: <Bell className="size-[18px]" />, color: "text-amber-500", badge: "5", badgeColor: "bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300" },
    ],
  },
  {
    id: "system",
    title: "SYSTÈME",
    dotColor: "bg-slate-500",
    items: [
      { href: "/dashboard/security", label: "Sécurité", icon: <Shield className="size-[18px]" />, color: "text-emerald-500" },
      { href: "/dashboard/security/users", label: "Utilisateurs & équipes", icon: <UserRound className="size-[18px]" />, color: "text-blue-500" },
      { href: "/dashboard/security/audit-logs", label: "Journal d'audit", icon: <ClipboardList className="size-[18px]" />, color: "text-rose-500" },
      { href: "/dashboard/settings", label: "Paramètres", icon: <Settings className="size-[18px]" />, color: "text-indigo-500" },
      { href: "/dashboard/settings/headers", label: "En-têtes Officiels & Designer", icon: <FileText className="size-[18px]" />, color: "text-purple-500" },
      { href: "/dashboard/synchronisation", label: "Synchronisation", icon: <RefreshCw className="size-[18px]" />, color: "text-blue-500" },
      { href: "/dashboard/campus-setup", label: "Configuration campus", icon: <MapPin className="size-[18px]" />, color: "text-amber-500" },
    ],
  },
  {
    id: "support",
    title: "ASSISTANCE",
    dotColor: "bg-blue-500",
    items: [
      { href: "/dashboard/help", label: "Aide et support", icon: <HelpCircle className="size-[18px]" />, color: "text-blue-500" },
      { href: "/dashboard/about", label: "À propos", icon: <Info className="size-[18px]" />, color: "text-slate-500" },
    ],
  },
];

function normalizeText(str?: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export default function DashboardSidebar({
  user,
  branch,
  branding,
  allBranches = [],
  unreadNotificationsCount,
}: {
  user: any;
  branch: any;
  branding?: {
    name: string;
    logoPath: string | null;
    level: string;
  };
  allBranches?: any[];
  unreadNotificationsCount?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);
  const { startNavigation } = useNavigationProgress();

  // Smart Sidebar State: Collapse Mode, Search Filter, Collapsible Sections, Pinned Favorites
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [collapsedSections, setCollapsedSections] = React.useState<Record<string, boolean>>({});
  const [pinnedHrefs, setPinnedHrefs] = React.useState<string[]>(DEFAULT_PINNED_HREFS);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const activeItemRef = React.useRef<HTMLAnchorElement | null>(null);

  // Load persisted sidebar preferences
  React.useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem("edut_sidebar_collapsed");
      if (savedCollapsed === "true") setIsCollapsed(true);

      const savedPins = localStorage.getItem("edut_sidebar_pinned");
      if (savedPins) {
        const parsed = JSON.parse(savedPins);
        if (Array.isArray(parsed)) setPinnedHrefs(parsed);
      }

      const savedSecs = localStorage.getItem("edut_sidebar_sections");
      if (savedSecs) {
        const parsed = JSON.parse(savedSecs);
        if (parsed && typeof parsed === "object") setCollapsedSections(parsed);
      }
    } catch {}
  }, []);

  // Keyboard shortcut Ctrl+K or / to focus sidebar search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isCollapsed) setIsCollapsed(false);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCollapsed]);

  const toggleSidebarCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("edut_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const toggleSectionCollapse = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = { ...prev, [sectionId]: !prev[sectionId] };
      try {
        localStorage.setItem("edut_sidebar_sections", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const togglePinItem = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPinnedHrefs((prev) => {
      const next = prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href];
      try {
        localStorage.setItem("edut_sidebar_pinned", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleBranchChange = (branchId: string) => {
    document.cookie = `selected_branch_id=${branchId}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.reload();
  };

  const isAdmin = user?.admin === true || user?.superAdmin === true || user?.superAdmin === 1;
  const showBranchSwitcher = isAdmin && allBranches && allBranches.length > 1;

  React.useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const dynamicSections = React.useMemo(() => {
    const isSuperAdmin = Boolean(user?.superAdmin === true || user?.superAdmin === 1);
    const roleNameLower = (user?.role?.roleName || "").toLowerCase();

    const isComptable =
      (roleNameLower.includes("comptable") ||
        roleNameLower.includes("caissier") ||
        roleNameLower.includes("financier")) &&
      !roleNameLower.includes("directeur général") &&
      !roleNameLower.includes("directeur general");

    const isTeacher =
      roleNameLower.includes("professeur") ||
      roleNameLower.includes("enseignant") ||
      roleNameLower.includes("teacher");
    const isStudent =
      roleNameLower.includes("élève") ||
      roleNameLower.includes("etudiant") ||
      roleNameLower.includes("student");
    const isParent =
      roleNameLower.includes("parent") ||
      roleNameLower.includes("tuteur") ||
      roleNameLower.includes("famille");

    const isLevelDirector =
      !isSuperAdmin &&
      ((user?.educationalLevel &&
        !["tous", "all", "tous les niveaux"].includes(user.educationalLevel.toLowerCase())) ||
        roleNameLower.includes("primaire") ||
        roleNameLower.includes("collège") ||
        roleNameLower.includes("college") ||
        roleNameLower.includes("lycée") ||
        roleNameLower.includes("lycee") ||
        roleNameLower.includes("licence") ||
        roleNameLower.includes("master") ||
        roleNameLower.includes("lmd"));

    let filtered = sections.map((section) => {
      let items = [...section.items].map((item) => {
        if (item.href === "/dashboard/notifications") {
          return {
            ...item,
            badge:
              unreadNotificationsCount && unreadNotificationsCount > 0
                ? String(unreadNotificationsCount)
                : undefined,
          };
        }
        return { ...item };
      });

      if (isTeacher) {
        if (section.id === "general") {
          items = items.filter((item) => item.href === "/dashboard");
        } else if (section.id === "schooling") {
          items = items.filter((item) =>
            [
              "/dashboard/students",
              "/dashboard/attendance",
              "/dashboard/academics/exams",
              "/dashboard/academics/grades",
              "/dashboard/academics/timetable",
              "/dashboard/hr/attendance/teacher/me",
              "/dashboard/academics/homework",
              "/dashboard/academics/pedagogical-units",
            ].includes(item.href)
          );
        } else if (["finance", "administration", "canevas", "resources", "system"].includes(section.id)) {
          items = [];
        } else if (section.id === "pedagogie") {
          items = items.filter((item) =>
            [
              "/dashboard/pedagogie",
              "/dashboard/pedagogie/cahier-textes",
              "/dashboard/pedagogie/planification",
              "/dashboard/pedagogie/progression",
              "/dashboard/pedagogie/ressources",
              "/dashboard/pedagogie/devoirs",
              "/dashboard/pedagogie/remediation",
            ].includes(item.href)
          );
        }
      } else if (isStudent) {
        if (section.id === "general") {
          items = items.filter((item) => item.href === "/dashboard");
        } else if (section.id === "schooling") {
          items = items.filter((item) =>
            [
              "/dashboard/attendance",
              "/dashboard/academics/grades",
              "/dashboard/academics/timetable",
              "/dashboard/academics/homework",
            ].includes(item.href)
          );
        } else if (section.id === "pedagogie") {
          items = items.filter((item) =>
            [
              "/dashboard/pedagogie/ressources",
              "/dashboard/pedagogie/devoirs",
              "/dashboard/pedagogie/progression",
            ].includes(item.href)
          );
        } else if (["finance", "administration", "canevas", "resources", "system"].includes(section.id)) {
          items = [];
        }
      } else if (isParent) {
        if (section.id === "general") {
          items = items.filter((item) => item.href === "/dashboard");
        } else if (section.id === "schooling") {
          items = items.filter((item) =>
            [
              "/dashboard/attendance",
              "/dashboard/academics/grades",
              "/dashboard/academics/timetable",
              "/dashboard/academics/homework",
            ].includes(item.href)
          );
        } else if (section.id === "pedagogie") {
          items = items.filter((item) =>
            ["/dashboard/pedagogie/progression", "/dashboard/pedagogie/devoirs"].includes(item.href)
          );
        } else if (["finance", "administration", "canevas", "resources", "system"].includes(section.id)) {
          items = [];
        }
      } else if (isComptable) {
        if (section.id === "general") {
          items = items.filter((item) => ["/dashboard", "/dashboard/reports"].includes(item.href));
        } else if (section.id === "schooling") {
          items = items.filter((item) => ["/dashboard/students"].includes(item.href));
        } else if (section.id === "administration") {
          items = items.filter((item) =>
            [
              "/dashboard/admin-docs",
              "/dashboard/admin-docs/admit-cards",
              "/dashboard/id-cards",
            ].includes(item.href)
          );
        } else if (["pedagogie", "canevas", "resources", "system"].includes(section.id)) {
          items = [];
        }
      } else {
        items = items.filter((item) => item.href !== "/dashboard/hr/attendance/teacher/me");

        if (isLevelDirector && section.id === "system") {
          items = items.filter((item) => ["/dashboard/security/users"].includes(item.href));
        }

        if (isLevelDirector && section.id === "canevas") {
          items = items.filter((item) =>
            [
              "/dashboard/canevas",
              "/dashboard/canevas/etablissements",
              "/dashboard/canevas/carte-scolaire",
              "/dashboard/canevas/early-warning",
              "/dashboard/canevas/reporting",
              "/dashboard/canevas/export",
            ].includes(item.href)
          );
        }
      }

      if (isSuperAdmin && section.id === "system") {
        items = items.filter((item) => item.href !== "/dashboard/security/audit-logs");
      }

      return {
        ...section,
        items,
      };
    });

    filtered = filtered.filter((section) => section.items.length > 0);

    if (isSuperAdmin) {
      filtered.unshift({
        id: "owner",
        title: "PROPRIÉTAIRE",
        dotColor: "bg-red-500",
        items: [
          {
            href: "/platform-admin",
            label: "Gestion de la plateforme",
            icon: <Globe className="size-[18px]" />,
            color: "text-red-500",
          },
          {
            href: "/dashboard/security/audit-logs",
            label: "Audit global",
            icon: <Shield className="size-[18px]" />,
            color: "text-indigo-500",
          },
          {
            href: "/dashboard/super-admin",
            label: "Console administrateur",
            icon: <Settings className="size-[18px]" />,
            color: "text-amber-500",
          },
          {
            href: "/dashboard/subscription",
            label: "Gestion des abonnements",
            icon: <Wallet className="size-[18px]" />,
            color: "text-emerald-500",
          },
          {
            href: "/register-school",
            label: "Inscription école",
            icon: <Building2 className="size-[18px]" />,
            color: "text-pink-500",
          },
        ],
      });
    }

    if (!isTeacher && !isSuperAdmin) {
      const systemSection = filtered.find((section) => section.id === "system");
      if (systemSection && !systemSection.items.some((i) => i.href === "/dashboard/subscription")) {
        systemSection.items.push({
          href: "/dashboard/subscription",
          label: "Mon abonnement",
          icon: <Wallet className="size-[18px]" />,
          color: "text-indigo-600",
        });
      }
    }

    return filtered;
  }, [
    unreadNotificationsCount,
    user?.superAdmin,
    user?.admin,
    user?.role?.roleName,
    user?.educationalLevel,
    user?.id,
  ]);

  const allPlatformItems = React.useMemo(
    () => dynamicSections.flatMap((s) => s.items),
    [dynamicSections]
  );
  const sortedPlatformItems = React.useMemo(
    () => [...allPlatformItems].sort((a, b) => b.href.length - a.href.length),
    [allPlatformItems]
  );

  const activeHref = React.useMemo(() => {
    if (pathname === "/dashboard") return "/dashboard";
    for (const item of sortedPlatformItems) {
      if (
        item.href !== "/dashboard" &&
        (pathname === item.href || pathname.startsWith(`${item.href}/`))
      ) {
        return item.href;
      }
    }
    return "/dashboard";
  }, [pathname, sortedPlatformItems]);

  // Auto-expand the section containing activeHref and scroll active item into view
  React.useEffect(() => {
    const activeSec = dynamicSections.find((s) => s.items.some((i) => i.href === activeHref));
    if (activeSec && collapsedSections[activeSec.id]) {
      setCollapsedSections((prev) => ({ ...prev, [activeSec.id]: false }));
    }
    setTimeout(() => {
      activeItemRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 120);
  }, [activeHref, dynamicSections]);

  // Build Pinned Favorites Section + Filtered Sections by Search Query
  const visibleSections = React.useMemo(() => {
    const q = normalizeText(searchQuery);

    if (q) {
      return dynamicSections
        .map((sec) => ({
          ...sec,
          items: sec.items.filter((item) => {
            const hay = normalizeText(`${item.label} ${sec.title} ${item.keywords || ""} ${item.badge || ""}`);
            return hay.includes(q);
          }),
        }))
        .filter((sec) => sec.items.length > 0);
    }

    const pinnedItems = pinnedHrefs
      .map((href) => allPlatformItems.find((item) => item.href === href))
      .filter(Boolean) as NavItem[];

    if (pinnedItems.length > 0) {
      return [
        {
          id: "pinned",
          title: "ACCÈS RAPIDE ★",
          dotColor: "bg-amber-500",
          items: pinnedItems,
        },
        ...dynamicSections,
      ];
    }

    return dynamicSections;
  }, [dynamicSections, searchQuery, pinnedHrefs, allPlatformItems]);

  const allCollapsed = React.useMemo(
    () => dynamicSections.every((s) => collapsedSections[s.id]),
    [dynamicSections, collapsedSections]
  );

  const handleToggleAllSections = () => {
    const nextState: Record<string, boolean> = {};
    dynamicSections.forEach((s) => {
      nextState[s.id] = !allCollapsed;
    });
    setCollapsedSections(nextState);
    try {
      localStorage.setItem("edut_sidebar_sections", JSON.stringify(nextState));
    } catch {}
  };

  const displaySchoolName = React.useMemo(() => {
    const raw = branding?.name || branch?.branchName || "CES BOURJA";
    return raw.replace(/CEG-RAUAUDA/gi, "CEG RAOUDA");
  }, [branding?.name, branch?.branchName]);

  const handleNavigate = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    if (pathname === href) return;
    setPendingHref(href);
    startNavigation();
    router.push(href);
  };

  return (
    <aside
      className={cn(
        "shrink-0 rounded-[32px] bg-white dark:bg-[#12141d] border border-indigo-200/50 dark:border-slate-800/80 shadow-[0_0_40px_-10px_rgba(99,102,241,0.08)] dark:shadow-[0_20px_80px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-full relative print:hidden transition-all duration-300",
        isCollapsed ? "w-[88px]" : "w-[305px]"
      )}
    >
      {/* HEADER */}
      <div className={cn("shrink-0 flex flex-col gap-3", isCollapsed ? "p-3.5 items-center" : "p-5 pb-3")}>
        <div className={cn("flex items-center justify-between w-full", isCollapsed && "flex-col gap-2.5")}>
          <div className={cn("flex items-center gap-3 min-w-0", isCollapsed && "justify-center")}>
            {(() => {
              const b = branding as any;
              const br = branch as any;
              const s = user?.school as any;
              const ab = (allBranches as any[]) || [];
              const firstBranch = ab.find((x: any) => x.logoPath || x.logo_path || x.logoUrl);
              const logo =
                b?.logoPath ||
                b?.logo_path ||
                b?.logoUrl ||
                br?.logoPath ||
                br?.logo_path ||
                br?.logoUrl ||
                s?.logoPath ||
                s?.logo_path ||
                s?.logoUrl ||
                s?.logo ||
                firstBranch?.logoPath ||
                firstBranch?.logo_path ||
                firstBranch?.logoUrl ||
                "/logo.png";
              return (
                <div className="w-11 h-11 rounded-[16px] bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none overflow-hidden shrink-0 border border-indigo-500/30">
                  {logo ? (
                    <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-indigo-600 font-black text-xl text-white">
                      {displaySchoolName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              );
            })()}
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="font-black text-slate-900 dark:text-white text-[16px] leading-tight truncate">
                  {displaySchoolName}
                </p>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {branding?.level || user?.educationalLevel || "Administration Générale"}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={toggleSidebarCollapse}
            title={isCollapsed ? "Déplier le menu latéral" : "Réduire le menu latéral"}
            className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors shrink-0 cursor-pointer"
          >
            {isCollapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          </button>
        </div>

        {!isCollapsed && showBranchSwitcher && (
          <div className="relative">
            <select
              value={branch?.id?.toString() || "all"}
              onChange={(e) => handleBranchChange(e.target.value)}
              className="w-full appearance-none rounded-xl border border-indigo-100/80 dark:border-slate-800 bg-slate-50 dark:bg-[#181a24] hover:bg-slate-100/70 dark:hover:bg-[#1f2230] px-3 py-2 pr-8 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition-all cursor-pointer shadow-sm"
            >
              <option value="all" className="dark:bg-[#181a24] dark:text-white">
                Administration générale (toutes)
              </option>
              {allBranches.map((b: any) => (
                <option key={b.id} value={b.id?.toString()} className="dark:bg-[#181a24] dark:text-white">
                  {b.branchName} ({b.instType})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-500 dark:text-slate-400 pointer-events-none" />
          </div>
        )}

        {/* SMART INSTANT SEARCH BAR + EXPAND/COLLAPSE ALL */}
        {!isCollapsed ? (
          <div className="flex items-center gap-1.5 pt-0.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un module... (Ctrl+K)"
                className="w-full h-9 pl-8 pr-7 rounded-xl bg-slate-50 dark:bg-[#181a24] border border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleToggleAllSections}
              title={allCollapsed ? "Déplier toutes les sections" : "Plier toutes les sections"}
              className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-[#181a24] border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors shrink-0 cursor-pointer"
            >
              <ChevronsUpDown className="size-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsCollapsed(false);
              setTimeout(() => searchInputRef.current?.focus(), 60);
            }}
            title="Rechercher un module (Ctrl+K)"
            className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-[#181a24] border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <Search className="size-4" />
          </button>
        )}
      </div>

      {/* NAVIGATION */}
      <nav
        className={cn(
          "pb-4 flex-1 overflow-y-auto custom-scrollbar",
          isCollapsed ? "px-2.5 space-y-3" : "px-3.5 space-y-4"
        )}
      >
        {visibleSections.length === 0 ? (
          <div className="py-10 px-4 text-center space-y-2">
            <p className="text-xs font-bold text-slate-400">Aucun module trouvé pour "{searchQuery}"</p>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Réinitialiser la recherche
            </button>
          </div>
        ) : (
          visibleSections.map((section, sIdx) => {
            const theme = sectionThemes[section.id] || {
              text: "text-slate-600 dark:text-slate-400",
              badgeBg: "bg-slate-100/80 dark:bg-slate-800/50",
              badgeBorder: "border-slate-200/80 dark:border-slate-700/60",
              dot: "bg-slate-400",
              divider: "from-slate-200/60 dark:from-slate-700/50",
            };

            const isSecCollapsed = !searchQuery && Boolean(collapsedSections[section.id]);

            return (
              <div
                key={section.id}
                className={cn(
                  "space-y-1.5",
                  sIdx > 0 && "pt-3 mt-2 border-t border-slate-200/60 dark:border-slate-800/80"
                )}
              >
                {/* Interactive Section Header (Click to Collapse/Expand) */}
                {!isCollapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleSectionCollapse(section.id)}
                    className="w-full px-1 flex items-center justify-between gap-2 select-none group cursor-pointer"
                  >
                    <div
                      className={cn(
                        "inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border shadow-xs transition-colors",
                        theme.badgeBg,
                        theme.badgeBorder
                      )}
                    >
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span
                          className={cn(
                            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-60",
                            theme.dot
                          )}
                        />
                        <span className={cn("relative inline-flex rounded-full h-2 w-2", theme.dot)} />
                      </span>
                      <span className={cn("text-[10px] font-black uppercase tracking-wider", theme.text)}>
                        {section.title}
                      </span>
                    </div>

                    <div className={cn("h-px flex-1 bg-gradient-to-r to-transparent", theme.divider)} />

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 px-1.5 py-0.5 rounded-md bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
                        {section.items.length}
                      </span>
                      <ChevronDown
                        className={cn(
                          "size-3.5 text-slate-400 transition-transform duration-200",
                          isSecCollapsed && "-rotate-90"
                        )}
                      />
                    </div>
                  </button>
                ) : (
                  <div className="flex justify-center py-1" title={section.title}>
                    <span className={cn("h-1.5 w-5 rounded-full opacity-70", theme.dot)} />
                  </div>
                )}

                {!isSecCollapsed && (
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const active = activeHref === item.href;
                      const isPending = pendingHref === item.href;
                      const isPinned = pinnedHrefs.includes(item.href);

                      return (
                        <Link
                          key={`${section.id}-${item.href}`}
                          ref={active && section.id !== "pinned" ? activeItemRef : undefined}
                          href={item.href}
                          title={isCollapsed ? `${item.label}${item.badge ? ` (${item.badge})` : ""}` : undefined}
                          onClick={(e) => handleNavigate(e, item.href)}
                          className={cn(
                            "group relative flex items-center justify-between gap-2.5 rounded-2xl transition-all duration-200",
                            isCollapsed ? "p-2 justify-center" : "px-2.5 py-2",
                            active
                              ? "bg-gradient-to-r from-indigo-50/90 via-indigo-50/50 to-indigo-100/60 dark:from-indigo-950/60 dark:via-indigo-950/30 dark:to-indigo-900/40 shadow-xs"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          )}
                        >
                          {/* Active Right Indicator Line */}
                          {active && (
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-indigo-600 dark:bg-indigo-500 rounded-l-full" />
                          )}

                          <span className={cn("flex items-center gap-3 min-w-0", isCollapsed && "justify-center")}>
                            <span
                              className={cn(
                                "w-9 h-9 rounded-[13px] flex items-center justify-center transition-all duration-200 relative shrink-0",
                                active
                                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none"
                                  : cn(
                                      "bg-white dark:bg-[#181a24] border border-slate-100/80 dark:border-slate-800/80 group-hover:border-slate-200 dark:group-hover:border-slate-700 group-hover:bg-slate-50 dark:group-hover:bg-[#1f2230] shadow-xs",
                                      item.color
                                    )
                              )}
                            >
                              {isPending ? (
                                <Loader2 className="size-[17px] animate-spin text-indigo-600 dark:text-indigo-400" />
                              ) : (
                                item.icon
                              )}
                              {isCollapsed && item.badge && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-[#12141d]" />
                              )}
                            </span>

                            {!isCollapsed && (
                              <span
                                className={cn(
                                  "text-[13px] truncate",
                                  active
                                    ? "font-black text-indigo-700 dark:text-indigo-300"
                                    : "font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors"
                                )}
                              >
                                {item.label}
                              </span>
                            )}
                          </span>

                          {/* Right Actions: Pin Star + Badge/Chevron */}
                          {!isCollapsed && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => togglePinItem(e, item.href)}
                                title={isPinned ? "Retirer de l'accès rapide" : "Épingler en accès rapide"}
                                className={cn(
                                  "p-1 rounded-lg transition-opacity",
                                  isPinned
                                    ? "text-amber-400 opacity-90 hover:opacity-100"
                                    : "text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 hover:text-amber-400"
                                )}
                              >
                                <Star className={cn("size-3.5", isPinned && "fill-amber-400")} />
                              </button>

                              {item.badge && !isPending ? (
                                <span
                                  className={cn(
                                    "px-2 py-0.5 rounded-full text-[9.5px] font-black whitespace-nowrap",
                                    item.badgeColor
                                  )}
                                >
                                  {item.badge}
                                </span>
                              ) : !active ? (
                                <ChevronRight className="size-[14px] text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-400 transition-colors" />
                              ) : null}
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </nav>

      {/* PWA Install Action */}
      {!isCollapsed && (
        <div className="px-4 pb-2">
          <PWAInstallButton variant="sidebar" />
        </div>
      )}

      {/* FOOTER (Profile & Logout) */}
      <div className={cn("mt-auto shrink-0 border-t border-slate-50/50 dark:border-slate-800/60", isCollapsed ? "p-2.5" : "p-3.5")}>
        <div
          className={cn(
            "rounded-[22px] bg-indigo-50/50 dark:bg-[#181a24]/90 hover:bg-indigo-50 dark:hover:bg-[#1f2230] border border-indigo-100/30 dark:border-slate-800 p-2 flex items-center justify-between transition-colors group",
            isCollapsed && "flex-col gap-2"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-[13px] bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-md shadow-indigo-200/50 dark:shadow-none overflow-hidden">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.nomPrenom || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.nomPrenom?.charAt(0) || user?.utilisateur?.charAt(0) || "A"
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-[#181a24] shadow-sm" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-[12.5px] font-bold text-slate-900 dark:text-white truncate">
                  {user?.nomPrenom || user?.utilisateur || "Administrateur"}
                </p>
                <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 truncate">
                  {user?.admin || !user?.role
                    ? "Administrateur"
                    : user?.role?.roleName || "Administrateur"}
                </p>
              </div>
            )}
          </div>
          <button
            type="button"
            title="Déconnexion"
            onClick={async () => {
              try {
                localStorage.removeItem("edut_user_session");
                localStorage.removeItem("edut_last_session_user");
                localStorage.removeItem("edut_offline_mode");
                document.cookie = "edut_session_user=; path=/; max-age=0";
              } catch (_) {}
              await logout();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
