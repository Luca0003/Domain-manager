"use client";

import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertIcon,
  BarChartIcon,
  BellIcon,
  BuildingIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  DollarIcon,
  DownloadIcon,
  EditIcon,
  EyeIcon,
  FileIcon,
  FilterIcon,
  GlobeIcon,
  GridIcon,
  HelpIcon,
  LinkIcon,
  LockIcon,
  MailIcon,
  MoreIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
  TagIcon,
  TrashIcon,
  UploadIcon,
  UserIcon,
  UsersIcon,
  XIcon,
} from "@/components/icons";

export type SectionKey =
  | "dashboard"
  | "domains"
  | "expirations"
  | "renewals"
  | "notifications"
  | "assignments"
  | "users"
  | "reports"
  | "costs"
  | "audit-log"
  | "settings";

type NavItem = { key: SectionKey; label: string; href: string; icon: ReactNode };
type DomainStatus = "ACTIVE" | "WARNING" | "URGENT" | "CRITICAL" | "EXPIRED" | "UNKNOWN";
type RenewalStatus = "Non pianificato" | "Pianificato" | "Richiesto" | "Pagato" | "In verifica" | "Completato" | "Fallito";
type NotificationStatus = "Da leggere" | "Letta" | "Inviata" | "In coda" | "Errore" | "Bozza";
type ToastTone = "success" | "info" | "warning";

type DemoSession = {
  email: string;
  name: string;
  role: string;
  organization: string;
  createdAt?: string;
};

type EmailProviderStatus = {
  provider: "postfix";
  configured: boolean;
  reachable: boolean;
  from: string;
  transport: "smtp-local";
  source: "interface" | "environment" | "none";
  host: string;
  port: number;
  message?: string;
};

type EmailProviderConfiguration = EmailProviderStatus & {
  fromName: string;
  fromEmail: string;
};

type EmailSendResult = {
  sent: boolean;
  configured: boolean;
  provider: "postfix";
  id?: string;
  message: string;
};

type DomainRecord = {
  id: string;
  name: string;
  registrar: string;
  expiresOn: string;
  status: DomainStatus;
  owner: string;
  department: string;
  client: string;
  tags: string[];
  autoRenew: boolean;
  renewalStatus: RenewalStatus;
  expectedCost: number;
  actualCost: number | null;
  currency: "EUR" | "USD";
  lastCheck: string;
  reliability: "Alta" | "Media" | "Manuale";
  source: string;
};

type RenewalRecord = {
  id: string;
  domainId: string;
  assignee: string;
  internalDue: string;
  status: RenewalStatus;
  cost: number | null;
  note: string;
};

type NotificationRecord = {
  id: string;
  domain: string;
  threshold: string;
  channel: "In-app" | "Anteprima email" | "Postfix" | "Webhook";
  recipient: string;
  status: NotificationStatus;
  sentAt: string;
};

type AuditRecord = {
  id: string;
  time: string;
  actor: string;
  action: string;
  entity: string;
  detail: string;
  correlationId: string;
};

type MemberRecord = {
  name: string;
  email: string;
  role: "Organization Administrator" | "Domain Manager" | "Viewer";
  status: "Attivo" | "Disattivato" | "Invitato";
  invitedAt?: string;
  inviteExpiresAt?: string;
};


type InvitationCreateResult = {
  created: boolean;
  queued: boolean;
  email?: string;
  expiresAt?: string;
  message: string;
};

type InviteRequest = {
  name: string;
  email: string;
  role: MemberRecord["role"];
  expiresInDays: 7 | 14 | 30;
  personalMessage: string;
};

type ModalState =
  | { kind: "domain"; domain?: DomainRecord }
  | { kind: "domain-details"; domain: DomainRecord }
  | { kind: "import" }
  | { kind: "renewal"; renewal: RenewalRecord }
  | { kind: "invite" }
  | { kind: "create-user" }
  | null;

const navigation: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: <GridIcon /> },
  { key: "domains", label: "Domini", href: "/dashboard/domains", icon: <GlobeIcon /> },
  { key: "expirations", label: "Scadenze", href: "/dashboard/expirations", icon: <CalendarIcon /> },
  { key: "renewals", label: "Rinnovi", href: "/dashboard/renewals", icon: <RefreshIcon /> },
  { key: "notifications", label: "Notifiche", href: "/dashboard/notifications", icon: <BellIcon /> },
  { key: "assignments", label: "Assegnazioni", href: "/dashboard/assignments", icon: <UsersIcon /> },
  { key: "users", label: "Utenti", href: "/dashboard/users", icon: <UserIcon /> },
  { key: "reports", label: "Report", href: "/dashboard/reports", icon: <BarChartIcon /> },
  { key: "costs", label: "Costi", href: "/dashboard/costs", icon: <DollarIcon /> },
  { key: "audit-log", label: "Audit Log", href: "/dashboard/audit-log", icon: <FileIcon /> },
  { key: "settings", label: "Impostazioni", href: "/dashboard/settings", icon: <SettingsIcon /> },
];

const sectionCopy: Record<Exclude<SectionKey, "dashboard">, { title: string; text: string }> = {
  domains: { title: "Domini", text: "Portafoglio domini, dati tecnici, filtri, importazione ed export." },
  expirations: { title: "Scadenze", text: "Priorità operative, soglie e domini che richiedono attenzione." },
  renewals: { title: "Rinnovi", text: "Assegna, pianifica, registra pagamenti e verifica i rinnovi." },
  notifications: { title: "Notifiche", text: "Regole, canali, destinatari e storico delle consegne." },
  assignments: { title: "Assegnazioni", text: "Responsabili, reparti, clienti e domini senza ownership." },
  users: { title: "Utenti", text: "Registra utenti, invia inviti, assegna ruoli e gestisci gli accessi." },
  reports: { title: "Report", text: "Indicatori del portafoglio ed esportazioni operative." },
  costs: { title: "Costi", text: "Spesa prevista, costi effettivi e distribuzione per registrar." },
  "audit-log": { title: "Audit Log", text: "Storico delle operazioni, attori e correlation ID." },
  settings: { title: "Impostazioni", text: "Organizzazione, utenti, sicurezza, Postfix locale e integrazioni." },
};

async function getEmailProviderStatus(): Promise<EmailProviderStatus> {
  try {
    const response = await fetch("/api/email/status", { cache: "no-store" });
    return (await response.json()) as EmailProviderStatus;
  } catch {
    return { provider: "postfix", configured: false, reachable: false, from: "", transport: "smtp-local", source: "none", host: "postfix", port: 25, message: "Servizio email non raggiungibile." };
  }
}

async function getEmailProviderConfiguration(): Promise<EmailProviderConfiguration> {
  try {
    const response = await fetch("/api/email/config", { cache: "no-store" });
    return (await response.json()) as EmailProviderConfiguration;
  } catch {
    return { provider: "postfix", configured: false, reachable: false, from: "", fromName: "Domain Manager", fromEmail: "", transport: "smtp-local", source: "none", host: "postfix", port: 25, message: "Servizio email non raggiungibile." };
  }
}

async function saveEmailProviderConfiguration(input: { provider: "postfix"; fromName: string; fromEmail: string }): Promise<EmailProviderConfiguration> {
  const response = await fetch("/api/email/config", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = (await response.json()) as EmailProviderConfiguration & { message?: string };
  if (!response.ok) throw new Error(payload.message || "Impossibile salvare la configurazione email.");
  return payload;
}

async function disconnectEmailProvider(): Promise<EmailProviderConfiguration> {
  const response = await fetch("/api/email/config", { method: "DELETE" });
  const payload = (await response.json()) as EmailProviderConfiguration & { message?: string };
  if (!response.ok) throw new Error(payload.message || "Impossibile rimuovere il mittente email.");
  return payload;
}

async function getRecoveryEmail(): Promise<string> {
  try {
    const response = await fetch("/api/auth/recovery-email", { cache: "no-store" });
    const payload = await response.json() as { email?: string };
    return payload.email ?? "";
  } catch {
    return "";
  }
}

async function saveRecoveryEmail(email: string): Promise<{ email: string; message?: string }> {
  const response = await fetch("/api/auth/recovery-email", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const payload = await response.json() as { email?: string; message?: string };
  if (!response.ok || !payload.email) throw new Error(payload.message || "Impossibile salvare l'email di recupero.");
  return payload.message
    ? { email: payload.email, message: payload.message }
    : { email: payload.email };
}


async function createInvitationViaApi(invite: InviteRequest): Promise<InvitationCreateResult> {
  try {
    const response = await fetch("/api/auth/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invite),
    });
    const payload = await response.json() as InvitationCreateResult;
    if (!response.ok) return { created: false, queued: false, message: payload.message || "Impossibile creare l'invito." };
    return payload;
  } catch {
    return { created: false, queued: false, message: "Servizio inviti non raggiungibile." };
  }
}

async function sendEmailViaApi(to: string, subject: string, text: string, idempotencyKey: string): Promise<EmailSendResult> {
  try {
    const response = await fetch("/api/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-idempotency-key": idempotencyKey,
      },
      body: JSON.stringify({ to, subject, text }),
    });
    return (await response.json()) as EmailSendResult;
  } catch {
    return { sent: false, configured: false, provider: "postfix", message: "Servizio email non raggiungibile." };
  }
}

const initialDomains: DomainRecord[] = [
  { id: "d1", name: "azienda.it", registrar: "Aruba", expiresOn: "2026-08-12", status: "CRITICAL", owner: "Giulia Rossi", department: "IT", client: "Interno", tags: ["corporate", "email"], autoRenew: true, renewalStatus: "In verifica", expectedCost: 18.99, actualCost: 18.99, currency: "EUR", lastCheck: "Oggi, 09:42", reliability: "Alta", source: "RDAP" },
  { id: "d2", name: "shoponline.com", registrar: "GoDaddy", expiresOn: "2026-08-26", status: "URGENT", owner: "Luca Bianchi", department: "E-commerce", client: "Interno", tags: ["shop", "brand"], autoRenew: false, renewalStatus: "Pianificato", expectedCost: 24.9, actualCost: null, currency: "EUR", lastCheck: "Oggi, 09:38", reliability: "Alta", source: "RDAP" },
  { id: "d3", name: "brand.net", registrar: "Namecheap", expiresOn: "2026-09-18", status: "WARNING", owner: "Marco Verdi", department: "Marketing", client: "Interno", tags: ["brand"], autoRenew: true, renewalStatus: "Non pianificato", expectedCost: 17.4, actualCost: null, currency: "EUR", lastCheck: "Ieri, 22:10", reliability: "Alta", source: "RDAP" },
  { id: "d4", name: "progetto.org", registrar: "OVHcloud", expiresOn: "2026-10-05", status: "ACTIVE", owner: "Sara Conti", department: "Prodotto", client: "Cliente Alfa", tags: ["project"], autoRenew: false, renewalStatus: "Non pianificato", expectedCost: 14.2, actualCost: null, currency: "EUR", lastCheck: "Ieri, 21:54", reliability: "Media", source: "RDAP" },
  { id: "d5", name: "example.com", registrar: "Cloudflare", expiresOn: "2027-01-24", status: "ACTIVE", owner: "Luca Bianchi", department: "IT", client: "Cliente Beta", tags: ["web"], autoRenew: true, renewalStatus: "Completato", expectedCost: 11.7, actualCost: 11.7, currency: "EUR", lastCheck: "2 giorni fa", reliability: "Alta", source: "RDAP" },
  { id: "d6", name: "vecchiodominio.it", registrar: "Aruba", expiresOn: "2026-08-02", status: "EXPIRED", owner: "Non assegnato", department: "—", client: "Interno", tags: ["legacy"], autoRenew: false, renewalStatus: "Fallito", expectedCost: 18.99, actualCost: null, currency: "EUR", lastCheck: "Oggi, 08:03", reliability: "Alta", source: "RDAP" },
  { id: "d7", name: "campagna.eu", registrar: "Register.it", expiresOn: "2026-11-15", status: "ACTIVE", owner: "Elena Neri", department: "Marketing", client: "Cliente Gamma", tags: ["campaign"], autoRenew: false, renewalStatus: "Non pianificato", expectedCost: 13.5, actualCost: null, currency: "EUR", lastCheck: "3 giorni fa", reliability: "Manuale", source: "Manuale" },
  { id: "d8", name: "servizio-cloud.io", registrar: "Namecheap", expiresOn: "", status: "UNKNOWN", owner: "Paolo Sala", department: "IT", client: "Interno", tags: ["cloud"], autoRenew: true, renewalStatus: "Non pianificato", expectedCost: 34.9, actualCost: null, currency: "EUR", lastCheck: "Errore verifica", reliability: "Media", source: "RDAP" },
];

const initialRenewals: RenewalRecord[] = [
  { id: "r1", domainId: "d1", assignee: "Giulia Rossi", internalDue: "2026-08-09", status: "In verifica", cost: 18.99, note: "Pagamento registrato, attendere nuova data RDAP." },
  { id: "r2", domainId: "d2", assignee: "Luca Bianchi", internalDue: "2026-08-18", status: "Pianificato", cost: null, note: "Controllare metodo di pagamento." },
  { id: "r3", domainId: "d6", assignee: "Marco Verdi", internalDue: "2026-08-01", status: "Fallito", cost: null, note: "Rinnovo non completato. Verificare recovery registrar." },
  { id: "r4", domainId: "d5", assignee: "Luca Bianchi", internalDue: "2026-07-20", status: "Completato", cost: 11.7, note: "Nuova scadenza verificata." },
];

const initialNotifications: NotificationRecord[] = [
  { id: "n1", domain: "azienda.it", threshold: "7 giorni", channel: "Anteprima email", recipient: "giulia@azienda.it", status: "Bozza", sentAt: "Oggi, 08:00" },
  { id: "n2", domain: "azienda.it", threshold: "7 giorni", channel: "In-app", recipient: "Giulia Rossi", status: "Da leggere", sentAt: "Oggi, 08:00" },
  { id: "n3", domain: "shoponline.com", threshold: "30 giorni", channel: "Anteprima email", recipient: "luca@azienda.it", status: "Bozza", sentAt: "Ieri, 08:00" },
  { id: "n4", domain: "servizio-cloud.io", threshold: "Verifica fallita", channel: "In-app", recipient: "Paolo Sala", status: "Da leggere", sentAt: "Ieri, 22:10" },
  { id: "n5", domain: "vecchiodominio.it", threshold: "Scaduto", channel: "Webhook", recipient: "ops-webhook", status: "Errore", sentAt: "2 ago, 08:00" },
];

const initialMembers: MemberRecord[] = [
  { name: "Mario Rossi", email: "mario@azienda.it", role: "Organization Administrator", status: "Attivo" },
  { name: "Giulia Rossi", email: "giulia@azienda.it", role: "Domain Manager", status: "Attivo" },
  { name: "Luca Bianchi", email: "luca@azienda.it", role: "Domain Manager", status: "Attivo" },
  { name: "Elena Neri", email: "elena@azienda.it", role: "Viewer", status: "Attivo" },
];

const initialAudit: AuditRecord[] = [
  { id: "a1", time: "Oggi, 09:42", actor: "Sistema", action: "DOMAIN_CHECK_COMPLETED", entity: "azienda.it", detail: "Scadenza confermata tramite RDAP.", correlationId: "cr_7f12c9" },
  { id: "a2", time: "Oggi, 09:18", actor: "Mario Rossi", action: "RENEWAL_STATUS_CHANGED", entity: "azienda.it", detail: "Rinnovo impostato su In verifica.", correlationId: "cr_2c961a" },
  { id: "a3", time: "Oggi, 08:00", actor: "Worker", action: "NOTIFICATION_SENT", entity: "azienda.it", detail: "Anteprima email soglia 7 giorni generata internamente.", correlationId: "cr_8f180d" },
  { id: "a4", time: "Ieri, 18:32", actor: "Giulia Rossi", action: "DOMAIN_UPDATED", entity: "shoponline.com", detail: "Responsabile aggiornato.", correlationId: "cr_3d11ef" },
  { id: "a5", time: "Ieri, 12:10", actor: "Mario Rossi", action: "CSV_IMPORT_COMPLETED", entity: "Import #32", detail: "18 righe valide, 2 duplicate.", correlationId: "cr_9902af" },
  { id: "a6", time: "5 ago, 15:03", actor: "Sistema", action: "DOMAIN_CHECK_FAILED", entity: "servizio-cloud.io", detail: "Data non verificabile dalla fonte RDAP.", correlationId: "cr_51b700" },
];

const owners = ["Giulia Rossi", "Luca Bianchi", "Marco Verdi", "Sara Conti", "Elena Neri", "Paolo Sala"];
const registrars = ["Aruba", "GoDaddy", "Namecheap", "OVHcloud", "Cloudflare", "Register.it"];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatMoney(value: number | null, currency = "EUR") {
  if (value === null) return "—";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency }).format(value);
}

function downloadText(filename: string, content: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function statusLabel(status: DomainStatus) {
  const labels: Record<DomainStatus, string> = {
    ACTIVE: "Attivo",
    WARNING: "31–60 giorni",
    URGENT: "8–30 giorni",
    CRITICAL: "1–7 giorni",
    EXPIRED: "Scaduto",
    UNKNOWN: "Non verificabile",
  };
  return labels[status];
}

function statusTone(status: DomainStatus) {
  if (status === "ACTIVE") return "success";
  if (status === "WARNING") return "warning";
  if (status === "URGENT") return "orange";
  if (status === "CRITICAL" || status === "EXPIRED") return "danger";
  return "neutral";
}

function KpiCard({ icon, tone, label, value, note }: { icon: ReactNode; tone: string; label: string; value: string; note: string }) {
  return (
    <article className="kpi-card">
      <div className={`kpi-icon ${tone}`}>{icon}</div>
      <div className="kpi-copy"><div className="kpi-label">{label}</div><div className={`kpi-value ${tone}`}>{value}</div></div>
      <p>{note}</p>
    </article>
  );
}

function Avatar({ name, variant = "blue" }: { name: string; variant?: string }) {
  const initials = name === "Non assegnato" ? "?" : name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <span className={`avatar avatar-${variant}`}>{initials}</span>;
}

function Popover({ children, align = "right" }: { children: ReactNode; align?: "left" | "right" }) {
  return <div className={`dashboard-popover popover-${align}`}>{children}</div>;
}

function StatusPill({ status }: { status: DomainStatus }) {
  return <span className={`data-pill ${statusTone(status)}`}>{statusLabel(status)}</span>;
}

function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="app-modal-backdrop" onMouseDown={onClose}>
      <section className={cn("app-modal", wide && "app-modal-wide")} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <header className="app-modal-header"><h2>{title}</h2><button type="button" onClick={onClose} aria-label="Chiudi"><XIcon /></button></header>
        <div className="app-modal-body">{children}</div>
      </section>
    </div>
  );
}

function Toast({ message, tone }: { message: string; tone: ToastTone }) {
  return <div className={`app-toast ${tone}`} role="status"><CheckIcon size={18} />{message}</div>;
}

function Toolbar({
  search,
  onSearch,
  placeholder,
  children,
}: {
  search: string;
  onSearch: (value: string) => void;
  placeholder: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-toolbar">
      <label className="search-box"><SearchIcon size={18} /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder={placeholder} /></label>
      <div className="toolbar-actions">{children}</div>
    </div>
  );
}

function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <div className="empty-state"><span>{icon}</span><strong>{title}</strong><p>{text}</p></div>;
}

export function DashboardApp({ initialSection = "dashboard" }: { initialSection?: SectionKey }) {
  const [currentSection, setCurrentSection] = useState<SectionKey>(initialSection);
  const [collapsed, setCollapsed] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [sidebarHoverRail, setSidebarHoverRail] = useState<{ top: number; height: number } | null>(null);
  const [chartRange, setChartRange] = useState("Prossimi 90 giorni");
  const [domains, setDomains] = useState<DomainRecord[]>(initialDomains);
  const [renewals, setRenewals] = useState<RenewalRecord[]>(initialRenewals);
  const [notifications, setNotifications] = useState<NotificationRecord[]>(initialNotifications);
  const [audit, setAudit] = useState<AuditRecord[]>(initialAudit);
  const [members, setMembers] = useState<MemberRecord[]>(initialMembers);
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  const [mockHydrated, setMockHydrated] = useState(false);
  const [session, setSession] = useState<DemoSession>({ email: "admin@domainmanager.local", name: "Mario Rossi", role: "Organization Administrator", organization: "Acme S.p.A." });

  useEffect(() => {
    function sectionFromPath(pathname: string): SectionKey {
      const part = pathname.split("/").filter(Boolean)[1];
      const known = navigation.some((item) => item.key === part);
      return known ? (part as SectionKey) : "dashboard";
    }

    function onPopState() {
      setCurrentSection(sectionFromPath(window.location.pathname));
      setOpenMenu(null);
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    try {
      const storedSession = window.localStorage.getItem("domain-manager.demo.session");
      if (storedSession) {
        const parsed = JSON.parse(storedSession) as Partial<DemoSession>;
        if (parsed.email && parsed.role && parsed.organization) {
          setSession({
            email: parsed.email,
            name: parsed.name || parsed.email.split("@")[0] || "Utente",
            role: parsed.role,
            organization: parsed.organization,
            ...(parsed.createdAt ? { createdAt: parsed.createdAt } : {}),
          });
        }
      }
      const storedDomains = window.localStorage.getItem("domain-manager.demo.domains");
      const storedRenewals = window.localStorage.getItem("domain-manager.demo.renewals");
      const storedNotifications = window.localStorage.getItem("domain-manager.demo.notifications");
      const storedAudit = window.localStorage.getItem("domain-manager.demo.audit");
      const storedMembers = window.localStorage.getItem("domain-manager.demo.members");
      if (storedDomains) setDomains(JSON.parse(storedDomains) as DomainRecord[]);
      if (storedRenewals) setRenewals(JSON.parse(storedRenewals) as RenewalRecord[]);
      if (storedNotifications) setNotifications(JSON.parse(storedNotifications) as NotificationRecord[]);
      if (storedAudit) setAudit(JSON.parse(storedAudit) as AuditRecord[]);
      if (storedMembers) setMembers(JSON.parse(storedMembers) as MemberRecord[]);
    } catch {
      // Se i dati demo locali sono corrotti, ripartiamo dai seed senza bloccare l'interfaccia.
    } finally {
      setMockHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!mockHydrated) return;

    // Non bloccare il thread principale subito dopo l’hydration: la persistenza
    // demo può aspettare qualche millisecondo senza cambiare il comportamento UI.
    const timer = window.setTimeout(() => {
      window.localStorage.setItem("domain-manager.demo.domains", JSON.stringify(domains));
      window.localStorage.setItem("domain-manager.demo.renewals", JSON.stringify(renewals));
      window.localStorage.setItem("domain-manager.demo.notifications", JSON.stringify(notifications));
      window.localStorage.setItem("domain-manager.demo.audit", JSON.stringify(audit));
      window.localStorage.setItem("domain-manager.demo.members", JSON.stringify(members));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [audit, domains, members, mockHydrated, notifications, renewals]);

  const unreadCount = notifications.filter((item) => item.status === "Da leggere").length;

  function notify(message: string, tone: ToastTone = "success") {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 2400);
  }

  function addAudit(action: string, entity: string, detail: string) {
    setAudit((current) => [
      { id: `a-${Date.now()}`, time: "Adesso", actor: session.name, action, entity, detail, correlationId: `cr_${Math.random().toString(16).slice(2, 8)}` },
      ...current,
    ]);
  }

  function saveDomain(domain: DomainRecord) {
    setDomains((current) => {
      const exists = current.some((item) => item.id === domain.id);
      return exists ? current.map((item) => item.id === domain.id ? domain : item) : [domain, ...current];
    });
    addAudit("DOMAIN_SAVED", domain.name, "Anagrafica dominio aggiornata dalla demo UI.");
    setModal(null);
    notify("Dominio salvato correttamente");
  }

  function deleteDomain(domain: DomainRecord) {
    setDomains((current) => current.filter((item) => item.id !== domain.id));
    setRenewals((current) => current.filter((item) => item.domainId !== domain.id));
    addAudit("DOMAIN_DELETED", domain.name, "Dominio rimosso dalla demo UI.");
    notify(`${domain.name} eliminato`, "warning");
  }

  function verifyDomain(domain: DomainRecord) {
    setDomains((current) => current.map((item) => item.id === domain.id ? { ...item, lastCheck: "Adesso", source: "RDAP (simulato)", reliability: "Alta" } : item));
    addAudit("DOMAIN_CHECK_COMPLETED", domain.name, "Verifica RDAP simulata completata.");
    notify(`Verifica di ${domain.name} completata`);
  }

  function saveRenewal(next: RenewalRecord) {
    setRenewals((current) => current.some((item) => item.id === next.id) ? current.map((item) => item.id === next.id ? next : item) : [next, ...current]);
    setDomains((current) => current.map((domain) => domain.id === next.domainId ? { ...domain, renewalStatus: next.status, actualCost: next.cost } : domain));
    const domainName = domains.find((domain) => domain.id === next.domainId)?.name ?? next.domainId;
    addAudit("RENEWAL_STATUS_CHANGED", domainName, `Stato rinnovo aggiornato a ${next.status}.`);
    setModal(null);
    notify("Workflow rinnovo aggiornato");
  }

  function importDomains(records: DomainRecord[]) {
    const existing = new Set(domains.map((domain) => domain.name.toLowerCase()));
    const unique = records.filter((record) => !existing.has(record.name.toLowerCase()));
    setDomains((current) => [...unique, ...current]);
    addAudit("CSV_IMPORT_COMPLETED", "Import CSV", `${unique.length} domini importati nella demo.`);
    setModal(null);
    notify(`${unique.length} domini importati`);
  }

  async function deliverInvite(invite: InviteRequest): Promise<void> {
    const normalizedEmail = invite.email.trim().toLowerCase();
    const displayName = invite.name.trim() || normalizedEmail.split("@")[0]?.replaceAll(".", " ") || "Nuovo utente";
    const result = await createInvitationViaApi({ ...invite, email: normalizedEmail, name: displayName });

    if (!result.created) {
      notify(result.message, "warning");
      return;
    }

    const expiresAt = result.expiresAt ? new Date(result.expiresAt) : new Date(Date.now() + invite.expiresInDays * 86_400_000);
    const expiresLabel = expiresAt.toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
    setMembers((current) => [
      {
        name: displayName,
        email: normalizedEmail,
        role: invite.role,
        status: "Invitato",
        invitedAt: new Date().toISOString(),
        inviteExpiresAt: expiresAt.toISOString(),
      },
      ...current.filter((member) => member.email !== normalizedEmail),
    ]);
    setModal(null);

    setNotifications((current) => [{
      id: `mail-${Date.now()}`,
      domain: "Account Domain Manager",
      threshold: "Invito utente",
      channel: "Postfix",
      recipient: normalizedEmail,
      status: result.queued ? "In coda" : "Errore",
      sentAt: "Adesso",
    }, ...current]);
    addAudit(
      result.queued ? "USER_INVITED_EMAIL_SENT" : "USER_INVITE_EMAIL_FAILED",
      normalizedEmail,
      `${result.message} Ruolo ${invite.role}; scadenza ${expiresLabel}.`,
    );
    notify(result.queued ? `Invito inviato a ${normalizedEmail}` : result.message, result.queued ? "success" : "warning");
  }

  function navigateTo(href: string) {
    const nextPart = href.split("/").filter(Boolean)[1];
    const nextSection: SectionKey = navigation.some((item) => item.key === nextPart)
      ? (nextPart as SectionKey)
      : "dashboard";

    if (window.location.pathname !== href) {
      window.history.pushState({}, "", href);
    }
    setCurrentSection(nextSection);
    setOpenMenu(null);
  }

  function toggleMenu(name: string) {
    setOpenMenu((current) => current === name ? null : name);
  }

  function exitToLogin() {
    window.localStorage.removeItem("domain-manager.demo.session");
    setOpenMenu(null);
    window.location.assign("/login");
  }

  return (
    <main className={`dashboard-shell ${collapsed ? "sidebar-collapsed" : ""}`} onClick={() => openMenu && setOpenMenu(null)}>
      <aside className="sidebar" onClick={(event) => event.stopPropagation()}>
        <div className="sidebar-top">
          <div className="sidebar-brand-zone">
            <button
              className="sidebar-brand-clean sidebar-brand-home"
              type="button"
              onClick={exitToLogin}
              aria-label="Esci e torna alla pagina di login"
              title="Torna al login"
            >
              <span className="sidebar-logo-link" aria-hidden="true">
                <span className="brand-logo"><GlobeIcon size={27} /></span>
              </span>
              <span className="sidebar-brand-copy">
                <strong>Domain Manager</strong>
                <span>Portfolio control center</span>
              </span>
            </button>
          </div>
          <span className="sidebar-nav-caption">Workspace</span>
          <nav
            className={`sidebar-nav ${sidebarHoverRail ? "is-hovering" : ""}`}
            aria-label="Navigazione principale"
            onPointerLeave={() => setSidebarHoverRail(null)}
          >
            <span
              className="sidebar-hover-rail"
              aria-hidden="true"
              style={{
                top: sidebarHoverRail?.top ?? 0,
                height: sidebarHoverRail?.height ?? 0,
                opacity: sidebarHoverRail ? 1 : 0,
              }}
            />
            {navigation.map((item) => (
              <button
                className={currentSection === item.key ? "nav-item active" : "nav-item"}
                type="button"
                onClick={() => navigateTo(item.href)}
                onPointerEnter={(event) =>
                  setSidebarHoverRail({
                    top: event.currentTarget.offsetTop,
                    height: event.currentTarget.offsetHeight,
                  })
                }
                key={item.key}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-icon">{item.icon}</span><span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="sidebar-footer">
          <div className="sidebar-footer-separator" />
          <button className="collapse-button" type="button" onClick={() => setCollapsed((value) => !value)}>
            <ChevronLeftIcon size={18} /><span>{collapsed ? "Espandi" : "Riduci menu"}</span>
          </button>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>{currentSection === "dashboard" ? "Dashboard" : sectionCopy[currentSection].title}</h1>
            <p>{currentSection === "dashboard" ? "Panoramica operativa del portafoglio domini" : sectionCopy[currentSection].text}</p>
          </div>
          <div className="header-actions" onClick={(event) => event.stopPropagation()}>
            <div className="popover-anchor">
              <button className="header-icon notification-button" aria-label="Notifiche" type="button" onClick={() => toggleMenu("notifications")}> <BellIcon size={23} />{unreadCount > 0 ? <span>{unreadCount}</span> : null}</button>
              {openMenu === "notifications" ? <Popover><strong>Notifiche</strong><p>{unreadCount} avvisi non letti.</p><button onClick={() => navigateTo("/dashboard/notifications")}>Apri notifiche</button></Popover> : null}
            </div>
            <div className="popover-anchor">
              <button className="header-icon" aria-label="Aiuto" type="button" onClick={() => toggleMenu("help")}><HelpIcon size={23} /></button>
              {openMenu === "help" ? <Popover><strong>Centro assistenza</strong><p>Questa demo include i flussi UI dell'MVP. Le email passano dal server Postfix interno; RDAP e registrar restano simulati per ora.</p><button onClick={() => notify("Guida demo aperta", "info")}>Apri guida</button></Popover> : null}
            </div>
            <div className="popover-anchor">
              <button className="language-button" type="button" onClick={() => toggleMenu("language")}>IT <ChevronDownIcon size={17} /></button>
              {openMenu === "language" ? <Popover><button onClick={() => { setOpenMenu(null); notify("Lingua: Italiano", "info"); }}>Italiano ✓</button><button onClick={() => { setOpenMenu(null); notify("English UI sarà collegata al layer i18n", "info"); }}>English</button></Popover> : null}
            </div>
            <span className="header-separator" />
            <div className="popover-anchor">
              <button className="profile-button" type="button" onClick={() => toggleMenu("profile")}><Avatar name={session.name} variant="profile" /><ChevronDownIcon size={17} /></button>
              {openMenu === "profile" ? <Popover><strong>{session.name}</strong><p>{session.role}</p><button onClick={() => navigateTo("/dashboard/settings")}>Impostazioni</button><button onClick={exitToLogin}>Esci</button></Popover> : null}
            </div>
          </div>
        </header>

        <SectionContent
          section={currentSection}
          domains={domains}
          renewals={renewals}
          notifications={notifications}
          audit={audit}
          members={members}
          setMembers={setMembers}
          chartRange={chartRange}
          setChartRange={setChartRange}
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          setModal={setModal}
          setDomains={setDomains}
          setNotifications={setNotifications}
          addAudit={addAudit}
          verifyDomain={verifyDomain}
          deleteDomain={deleteDomain}
          notify={notify}
          navigate={navigateTo}
        />
      </section>

      {modal?.kind === "domain" ? <DomainFormModal domain={modal.domain} onSave={saveDomain} onClose={() => setModal(null)} /> : null}
      {modal?.kind === "domain-details" ? <DomainDetailsModal domain={modal.domain} onClose={() => setModal(null)} onEdit={() => setModal({ kind: "domain", domain: modal.domain })} onVerify={() => verifyDomain(modal.domain)} /> : null}
      {modal?.kind === "import" ? <ImportModal onImport={importDomains} onClose={() => setModal(null)} /> : null}
      {modal?.kind === "renewal" ? <RenewalModal renewal={modal.renewal} domains={domains} onSave={saveRenewal} onClose={() => setModal(null)} /> : null}
      {modal?.kind === "invite" ? <InviteModal onClose={() => setModal(null)} onInvite={(invite) => { void deliverInvite(invite); }} /> : null}
      {modal?.kind === "create-user" ? <CreateUserModal onClose={() => setModal(null)} onCreate={(name, email, role) => { setMembers((current) => [{ name, email, role, status: "Attivo" }, ...current.filter((member) => member.email !== email)]); setModal(null); addAudit("USER_CREATED", email, `Utente demo registrato con ruolo ${role}.`); notify(`Utente ${name} registrato`); }} /> : null}
      {toast ? <Toast {...toast} /> : null}
    </main>
  );
}

type SectionContentProps = {
  section: SectionKey;
  domains: DomainRecord[];
  renewals: RenewalRecord[];
  notifications: NotificationRecord[];
  audit: AuditRecord[];
  members: MemberRecord[];
  setMembers: (updater: MemberRecord[] | ((current: MemberRecord[]) => MemberRecord[])) => void;
  chartRange: string;
  setChartRange: (value: string) => void;
  openMenu: string | null;
  setOpenMenu: (value: string | null) => void;
  setModal: (value: ModalState) => void;
  setDomains: (updater: DomainRecord[] | ((current: DomainRecord[]) => DomainRecord[])) => void;
  setNotifications: (updater: NotificationRecord[] | ((current: NotificationRecord[]) => NotificationRecord[])) => void;
  addAudit: (action: string, entity: string, detail: string) => void;
  verifyDomain: (domain: DomainRecord) => void;
  deleteDomain: (domain: DomainRecord) => void;
  notify: (message: string, tone?: ToastTone) => void;
  navigate: (href: string) => void;
};

function SectionContent(props: SectionContentProps) {
  if (props.section === "dashboard") return <DashboardHome {...props} />;
  if (props.section === "domains") return <DomainsSection {...props} />;
  if (props.section === "expirations") return <ExpirationsSection {...props} />;
  if (props.section === "renewals") return <RenewalsSection {...props} />;
  if (props.section === "notifications") return <NotificationsSection {...props} />;
  if (props.section === "assignments") return <AssignmentsSection {...props} />;
  if (props.section === "users") return <UsersSection {...props} />;
  if (props.section === "reports") return <ReportsSection {...props} />;
  if (props.section === "costs") return <CostsSection {...props} />;
  if (props.section === "audit-log") return <AuditSection {...props} />;
  return <SettingsSection {...props} />;
}

function DashboardHome({ domains, renewals, audit, chartRange, openMenu, setOpenMenu, setChartRange, navigate }: SectionContentProps) {
  const activeCount = domains.filter((domain) => domain.status === "ACTIVE").length;
  const warningCount = domains.filter((domain) => ["WARNING", "URGENT", "CRITICAL"].includes(domain.status)).length;
  const expiredCount = domains.filter((domain) => domain.status === "EXPIRED").length;
  const renewalCount = renewals.filter((renewal) => !["Completato", "Fallito"].includes(renewal.status)).length;
  const tableRows = domains.slice(0, 5);

  return (
    <div className="dashboard-content dashboard-home-content">
      <section className="kpi-grid dashboard-home-kpis">
        <KpiCard icon={<GlobeIcon size={34} />} tone="blue" label="Totale Domini" value={String(domains.length)} note="Portafoglio demo" />
        <KpiCard icon={<CalendarIcon size={34} />} tone="orange" label="Da monitorare" value={String(warningCount)} note="Entro 60 giorni" />
        <KpiCard icon={<AlertIcon size={34} />} tone="red" label="Scaduti" value={String(expiredCount)} note="Azioni richieste" />
        <KpiCard icon={<RefreshIcon size={34} />} tone="green" label="Rinnovi in corso" value={String(renewalCount)} note="Workflow attivi" />
      </section>

      <section className="charts-grid dashboard-home-charts">
        <article className="panel chart-panel">
          <header className="panel-header">
            <h2>Scadenze prossime <span>(demo)</span></h2>
            <div className="chart-controls" onClick={(event) => event.stopPropagation()}>
              <div className="popover-anchor">
                <button type="button" onClick={() => setOpenMenu(openMenu === "chart-range" ? null : "chart-range")}>{chartRange} <ChevronDownIcon size={16} /></button>
                {openMenu === "chart-range" ? <Popover>{["Prossimi 30 giorni", "Prossimi 60 giorni", "Prossimi 90 giorni"].map((range) => <button key={range} onClick={() => { setChartRange(range); setOpenMenu(null); }}>{range}</button>)}</Popover> : null}
              </div>
              <button className="more-button" type="button" aria-label="Apri report" onClick={() => navigate("/dashboard/reports")}><MoreIcon size={18} /></button>
            </div>
          </header>
          <div className="bar-chart">
            <div className="y-axis"><span>8</span><span>6</span><span>4</span><span>2</span><span>0</span></div>
            <div className="chart-area"><div className="grid-lines"><span/><span/><span/><span/><span/></div><div className="bars">
              <div className="bar-column"><strong>{domains.filter((d) => ["CRITICAL", "EXPIRED"].includes(d.status)).length}</strong><div className="bar bar-58"/><span>0–7 giorni</span></div>
              <div className="bar-column"><strong>{domains.filter((d) => d.status === "URGENT").length}</strong><div className="bar bar-74"/><span>8–30 giorni</span></div>
              <div className="bar-column"><strong>{domains.filter((d) => d.status === "WARNING").length}</strong><div className="bar bar-42"/><span>31–60 giorni</span></div>
            </div></div>
          </div>
          <div className="legend-inline"><i /> Numero domini</div>
        </article>

        <article className="panel donut-panel"><header className="panel-header"><h2>Stato domini</h2></header><div className="donut-layout">
          <div className="donut-chart"><div className="donut-center"><strong>{domains.length}</strong><span>Totale</span></div></div>
          <div className="status-legend"><div><i className="dot green"/><span>Attivi</span><strong>{activeCount}</strong></div><div><i className="dot blue"/><span>Da monitorare</span><strong>{warningCount}</strong></div><div><i className="dot orange"/><span>Data non verificabile</span><strong>{domains.filter((d) => d.status === "UNKNOWN").length}</strong></div><div><i className="dot red"/><span>Scaduti</span><strong>{expiredCount}</strong></div></div>
        </div></article>
      </section>

      <section className="bottom-grid dashboard-home-bottom">
        <article className="panel table-panel"><header className="table-title"><h2>Domini prioritari</h2></header><div className="domain-table-wrap"><table className="domain-table"><thead><tr><th>Dominio</th><th>Scadenza</th><th>Registrar</th><th>Stato</th><th>Responsabile</th></tr></thead><tbody>
          {tableRows.map((domain, index) => <tr key={domain.id}><td><button className="domain-name domain-button" onClick={() => navigate("/dashboard/domains")}><GlobeIcon size={16} /> {domain.name}</button></td><td>{domain.expiresOn || "—"}</td><td>{domain.registrar}</td><td><StatusPill status={domain.status} /></td><td><span className="assignee"><Avatar name={domain.owner} variant={index % 2 ? "teal" : "blue"} /> {domain.owner}</span></td></tr>)}
        </tbody></table></div><button className="panel-link" type="button" onClick={() => navigate("/dashboard/domains")}>Gestisci tutti i domini <ChevronRightIcon size={16}/></button></article>

        <article className="panel activity-panel"><header className="table-title"><h2>Attività recenti</h2></header><div className="activity-list">{audit.slice(0,5).map((activity, index) => <div className="activity-row" key={activity.id}><span className={cn("activity-icon", index === 0 ? "success" : index === 2 ? "warning" : "info")}>{index === 0 ? <CheckIcon /> : index === 2 ? <BellIcon /> : <FileIcon />}</span><div className="activity-copy"><strong>{activity.action.replaceAll("_", " ")}</strong><span>{activity.entity} · {activity.detail}</span></div><time>{activity.time}</time></div>)}</div><button className="panel-link" type="button" onClick={() => navigate("/dashboard/audit-log")}>Vedi audit completo <ChevronRightIcon size={16}/></button></article>
      </section>
    </div>
  );
}

function DomainsSection({ domains, setModal, verifyDomain, deleteDomain, notify }: SectionContentProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [registrar, setRegistrar] = useState("ALL");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => domains.filter((domain) => {
    const query = search.trim().toLowerCase();
    const matchesQuery = !query || [domain.name, domain.registrar, domain.owner, domain.client, ...domain.tags].join(" ").toLowerCase().includes(query);
    return matchesQuery && (status === "ALL" || domain.status === status) && (registrar === "ALL" || domain.registrar === registrar);
  }), [domains, registrar, search, status]);

  function exportCsv() {
    const header = "domain,registrar,expiry,status,owner,department,client,autoRenew,expectedCost,currency";
    const rows = filtered.map((d) => [d.name, d.registrar, d.expiresOn, d.status, d.owner, d.department, d.client, d.autoRenew, d.expectedCost, d.currency].join(","));
    downloadText("domain-manager-domains.csv", [header, ...rows].join("\n"));
    notify("CSV esportato");
  }

  function toggleSelected(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <section className="internal-section">
      <Toolbar search={search} onSearch={setSearch} placeholder="Cerca dominio, registrar, responsabile, tag...">
        <select className="toolbar-select" value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">Tutti gli stati</option>{(["ACTIVE","WARNING","URGENT","CRITICAL","EXPIRED","UNKNOWN"] as DomainStatus[]).map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}</select>
        <select className="toolbar-select" value={registrar} onChange={(event) => setRegistrar(event.target.value)}><option value="ALL">Tutti i registrar</option>{registrars.map((item) => <option key={item}>{item}</option>)}</select>
        <button className="secondary-action compact" type="button" onClick={() => setModal({ kind: "import" })}><UploadIcon size={17}/> Importa CSV</button>
        <button className="secondary-action compact" type="button" onClick={exportCsv}><DownloadIcon size={17}/> Esporta</button>
        <button className="primary-action compact" type="button" onClick={() => setModal({ kind: "domain" })}><PlusIcon size={17}/> Aggiungi dominio</button>
      </Toolbar>

      <div className="section-summary-row">
        <span><strong>{filtered.length}</strong> domini visualizzati</span>
        {selected.size > 0 ? <span className="bulk-chip">{selected.size} selezionati <button type="button" onClick={() => { selected.forEach((id) => { const domain = domains.find((item) => item.id === id); if (domain) verifyDomain(domain); }); setSelected(new Set()); }}>Verifica selezionati</button></span> : null}
      </div>

      <article className="panel data-panel">
        <div className="data-table-scroll">
          <table className="app-table domains-app-table">
            <thead><tr><th><input type="checkbox" aria-label="Seleziona tutti" checked={filtered.length > 0 && filtered.every((d) => selected.has(d.id))} onChange={(event) => setSelected(event.target.checked ? new Set(filtered.map((d) => d.id)) : new Set())}/></th><th>Dominio</th><th>Scadenza</th><th>Stato</th><th>Registrar</th><th>Responsabile</th><th>Rinnovo</th><th>Ultima verifica</th><th>Azioni</th></tr></thead>
            <tbody>{filtered.map((domain, index) => <tr key={domain.id}><td><input type="checkbox" checked={selected.has(domain.id)} onChange={() => toggleSelected(domain.id)} /></td><td><button className="table-primary-link" type="button" onClick={() => setModal({ kind: "domain-details", domain })}><GlobeIcon size={16}/><span><strong>{domain.name}</strong><small>{domain.tags.join(" · ")}</small></span></button></td><td>{domain.expiresOn || "Non verificabile"}</td><td><StatusPill status={domain.status}/></td><td>{domain.registrar}</td><td><span className="assignee"><Avatar name={domain.owner} variant={index % 2 ? "teal" : "blue"}/>{domain.owner}</span></td><td><span className={cn("data-pill", domain.autoRenew ? "success" : "neutral")}>{domain.autoRenew ? "Auto" : domain.renewalStatus}</span></td><td><span className="stacked-cell">{domain.lastCheck}<small>{domain.source} · {domain.reliability}</small></span></td><td><div className="row-actions"><button title="Verifica ora" type="button" onClick={() => verifyDomain(domain)}><RefreshIcon size={16}/></button><button title="Modifica" type="button" onClick={() => setModal({ kind: "domain", domain })}><EditIcon size={16}/></button><button title="Elimina" className="danger-button" type="button" onClick={() => { if (window.confirm(`Eliminare ${domain.name}?`)) deleteDomain(domain); }}><TrashIcon size={16}/></button></div></td></tr>)}</tbody>
          </table>
        </div>
        {filtered.length === 0 ? <EmptyState icon={<SearchIcon size={28}/>} title="Nessun dominio trovato" text="Modifica ricerca o filtri per visualizzare altri risultati."/> : null}
      </article>
    </section>
  );
}

function ExpirationsSection({ domains, setModal, verifyDomain, navigate }: SectionContentProps) {
  const [search, setSearch] = useState("");
  const [bucket, setBucket] = useState<DomainStatus | "ALL">("ALL");
  const relevant = domains.filter((domain) => domain.status !== "ACTIVE");
  const filtered = relevant.filter((domain) => (!search || domain.name.toLowerCase().includes(search.toLowerCase())) && (bucket === "ALL" || domain.status === bucket));

  return <section className="internal-section">
    <div className="mini-kpi-grid">
      {(["CRITICAL","URGENT","WARNING","EXPIRED","UNKNOWN"] as DomainStatus[]).map((item) => <button key={item} type="button" className={cn("mini-kpi", bucket === item && "selected")} onClick={() => setBucket(bucket === item ? "ALL" : item)}><span className={`mini-dot ${statusTone(item)}`}/><strong>{domains.filter((d) => d.status === item).length}</strong><small>{statusLabel(item)}</small></button>)}
    </div>
    <Toolbar search={search} onSearch={setSearch} placeholder="Cerca tra le scadenze..."><button className="secondary-action compact" type="button" onClick={() => setBucket("ALL")}><FilterIcon size={17}/> Azzera filtri</button></Toolbar>
    <article className="panel data-panel">
      <div className="data-table-scroll"><table className="app-table"><thead><tr><th>Priorità</th><th>Dominio</th><th>Scadenza</th><th>Responsabile</th><th>Rinnovo</th><th>Auto renew</th><th>Azioni</th></tr></thead><tbody>{filtered.map((domain, index) => <tr key={domain.id}><td><StatusPill status={domain.status}/></td><td><button className="table-primary-link" type="button" onClick={() => setModal({kind:"domain-details", domain})}><GlobeIcon size={16}/><strong>{domain.name}</strong></button></td><td>{domain.expiresOn || "Non verificabile"}</td><td><span className="assignee"><Avatar name={domain.owner} variant={index % 2 ? "teal":"blue"}/>{domain.owner}</span></td><td>{domain.renewalStatus}</td><td><span className={cn("switch-badge", domain.autoRenew && "on")}>{domain.autoRenew ? "Attivo" : "Disattivo"}</span></td><td><div className="row-actions"><button type="button" title="Verifica" onClick={() => verifyDomain(domain)}><RefreshIcon size={16}/></button><button type="button" title="Gestisci rinnovo" onClick={() => navigate("/dashboard/renewals")}><ChevronRightIcon size={16}/></button></div></td></tr>)}</tbody></table></div>
    </article>
  </section>;
}

function RenewalsSection({ domains, renewals, setModal }: SectionContentProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const filtered = renewals.filter((renewal) => {
    const domain = domains.find((item) => item.id === renewal.domainId);
    return (!search || `${domain?.name ?? ""} ${renewal.assignee}`.toLowerCase().includes(search.toLowerCase())) && (status === "ALL" || renewal.status === status);
  });

  return <section className="internal-section">
    <div className="mini-kpi-grid four"><div className="mini-kpi static"><span className="mini-dot info"/><strong>{renewals.length}</strong><small>Task totali</small></div><div className="mini-kpi static"><span className="mini-dot warning"/><strong>{renewals.filter((r) => ["Pianificato","Richiesto","Pagato","In verifica"].includes(r.status)).length}</strong><small>In corso</small></div><div className="mini-kpi static"><span className="mini-dot success"/><strong>{renewals.filter((r) => r.status === "Completato").length}</strong><small>Completati</small></div><div className="mini-kpi static"><span className="mini-dot danger"/><strong>{renewals.filter((r) => r.status === "Fallito").length}</strong><small>Falliti</small></div></div>
    <Toolbar search={search} onSearch={setSearch} placeholder="Cerca dominio o responsabile..."><select className="toolbar-select" value={status} onChange={(e) => setStatus(e.target.value)}><option value="ALL">Tutti gli stati</option>{["Pianificato","Richiesto","Pagato","In verifica","Completato","Fallito"].map((item) => <option key={item}>{item}</option>)}</select><button className="secondary-action compact" type="button" onClick={() => setModal({ kind: "renewal", renewal: { id: `r-${Date.now()}`, domainId: domains[0]?.id ?? "", assignee: owners[0] ?? "Non assegnato", internalDue: "2026-08-15", status: "Pianificato", cost: null, note: "" } })}><PlusIcon size={17}/> Nuovo task</button></Toolbar>
    <article className="panel data-panel"><div className="data-table-scroll"><table className="app-table"><thead><tr><th>Dominio</th><th>Responsabile</th><th>Scadenza interna</th><th>Stato</th><th>Costo</th><th>Nota</th><th>Azioni</th></tr></thead><tbody>{filtered.map((renewal, index) => { const domain = domains.find((item) => item.id === renewal.domainId); return <tr key={renewal.id}><td><strong>{domain?.name ?? renewal.domainId}</strong></td><td><span className="assignee"><Avatar name={renewal.assignee} variant={index % 2 ? "teal":"blue"}/>{renewal.assignee}</span></td><td>{renewal.internalDue}</td><td><span className={cn("data-pill", renewal.status === "Completato" ? "success" : renewal.status === "Fallito" ? "danger" : "warning")}>{renewal.status}</span></td><td>{formatMoney(renewal.cost)}</td><td className="truncate-cell" title={renewal.note}>{renewal.note}</td><td><button className="table-action-button" type="button" onClick={() => setModal({kind:"renewal", renewal})}>Gestisci <ChevronRightIcon size={15}/></button></td></tr>; })}</tbody></table></div></article>
  </section>;
}

function NotificationsSection({ notifications, setNotifications, notify, addAudit }: SectionContentProps) {
  const [search, setSearch] = useState("");
  const [rules, setRules] = useState({ emailPreview: true, inApp: true, webhook: false, thresholds: "90, 60, 30, 15, 7, 3, 1, 0" });
  const filtered = notifications.filter((item) => !search || `${item.domain} ${item.recipient} ${item.threshold}`.toLowerCase().includes(search.toLowerCase()));

  function markAllRead() {
    setNotifications((current) => current.map((item) => item.status === "Da leggere" ? { ...item, status: "Letta" } : item));
    addAudit("NOTIFICATIONS_MARKED_READ", "Notifiche", "Tutte le notifiche in-app sono state segnate come lette.");
    notify("Notifiche segnate come lette");
  }

  return <section className="internal-section notifications-layout">
    <article className="panel rules-panel"><header className="subsection-header"><div><h2>Regole organizzazione</h2><p>Soglie e canali demo</p></div><span className="demo-badge">DEMO</span></header><div className="smtp-info-callout configured"><MailIcon size={20}/><div><strong>Postfix locale</strong><span>Domain Manager consegna le email al container Postfix interno; se il mittente non è configurato mantiene automaticamente l'anteprima interna.</span></div></div><div className="settings-list">
      <label className="setting-row"><span><strong>Notifiche in-app</strong><small>Centro notifiche interno</small></span><input type="checkbox" checked={rules.inApp} onChange={(e) => setRules({...rules, inApp:e.target.checked})}/></label>
      <label className="setting-row"><span><strong>Email transazionale</strong><small>Invio tramite Postfix locale quando configurato, anteprima interna come fallback</small></span><input type="checkbox" checked={rules.emailPreview} onChange={(e) => setRules({...rules, emailPreview:e.target.checked})}/></label>
      <label className="setting-row"><span><strong>Webhook</strong><small>Integrazione esterna simulata</small></span><input type="checkbox" checked={rules.webhook} onChange={(e) => setRules({...rules, webhook:e.target.checked})}/></label>
      <label className="field-inline"><span>Soglie (giorni)</span><input value={rules.thresholds} onChange={(e) => setRules({...rules, thresholds:e.target.value})}/></label>
      <button className="primary-action compact" type="button" onClick={() => { addAudit("NOTIFICATION_RULES_UPDATED", "Regole", "Configurazione demo salvata."); notify("Regole salvate"); }}>Salva regole</button>
    </div></article>
    <div className="notification-deliveries"><Toolbar search={search} onSearch={setSearch} placeholder="Cerca notifiche..."><button className="secondary-action compact" type="button" onClick={markAllRead}><CheckIcon size={17}/> Segna tutte lette</button><button className="secondary-action compact" type="button" onClick={() => { const recipient="demo@azienda.it"; setNotifications((current) => [{ id:`mail-${Date.now()}`, domain:"Domain Manager", threshold:"Test email", channel:"Anteprima email", recipient, status:"Bozza", sentAt:"Adesso" }, ...current]); addAudit("EMAIL_PREVIEW_CREATED", recipient, "Anteprima email di test generata internamente."); notify("Anteprima email di test creata", "info"); }}><MailIcon size={17}/> Genera email test</button></Toolbar><article className="panel data-panel"><div className="data-table-scroll"><table className="app-table"><thead><tr><th>Dominio</th><th>Soglia</th><th>Canale</th><th>Destinatario</th><th>Stato</th><th>Data</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><strong>{item.domain}</strong></td><td>{item.threshold}</td><td>{item.channel}</td><td>{item.recipient}</td><td><span className={cn("data-pill", item.status === "Errore" ? "danger" : item.status === "Da leggere" ? "warning" : item.status === "Bozza" ? "neutral" : "success")}>{item.status}</span></td><td>{item.sentAt}</td></tr>)}</tbody></table></div></article></div>
  </section>;
}

function AssignmentsSection({ domains, setDomains, notify, addAudit }: SectionContentProps) {
  const [search, setSearch] = useState("");
  const [selectedOwner, setSelectedOwner] = useState("ALL");
  const filtered = domains.filter((domain) => (!search || `${domain.name} ${domain.owner} ${domain.department} ${domain.client}`.toLowerCase().includes(search.toLowerCase())) && (selectedOwner === "ALL" || domain.owner === selectedOwner));
  const ownerStats = owners.map((owner) => ({ owner, count: domains.filter((d) => d.owner === owner).length, attention: domains.filter((d) => d.owner === owner && d.status !== "ACTIVE").length }));

  return <section className="internal-section assignments-grid">
    <article className="panel owners-panel"><header className="subsection-header"><div><h2>Responsabili</h2><p>Carico domini</p></div></header><div className="owner-cards">{ownerStats.map((item, index) => <button key={item.owner} type="button" className={cn("owner-card", selectedOwner === item.owner && "active")} onClick={() => setSelectedOwner(selectedOwner === item.owner ? "ALL" : item.owner)}><Avatar name={item.owner} variant={index % 2 ? "teal":"blue"}/><span><strong>{item.owner}</strong><small>{item.count} domini · {item.attention} da monitorare</small></span></button>)}</div></article>
    <div className="assignment-table-area"><Toolbar search={search} onSearch={setSearch} placeholder="Cerca dominio, reparto o cliente..."><button className="secondary-action compact" type="button" onClick={() => setSelectedOwner("ALL")}><FilterIcon size={17}/> Tutti</button></Toolbar><article className="panel data-panel"><div className="data-table-scroll"><table className="app-table"><thead><tr><th>Dominio</th><th>Responsabile</th><th>Reparto</th><th>Cliente</th><th>Stato</th></tr></thead><tbody>{filtered.map((domain) => <tr key={domain.id}><td><strong>{domain.name}</strong></td><td><select className="inline-select" value={domain.owner} onChange={(e) => { const owner = e.target.value; setDomains((current) => current.map((item) => item.id === domain.id ? {...item, owner} : item)); addAudit("DOMAIN_ASSIGNED", domain.name, `Assegnato a ${owner}.`); notify("Assegnazione aggiornata"); }}><option>Non assegnato</option>{owners.map((owner) => <option key={owner}>{owner}</option>)}</select></td><td>{domain.department}</td><td>{domain.client}</td><td><StatusPill status={domain.status}/></td></tr>)}</tbody></table></div></article></div>
  </section>;
}


function UsersSection({ members, setMembers, setModal, notify, addAudit, setNotifications }: SectionContentProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const filtered = members.filter((member) => {
    const matchesSearch = !search || `${member.name} ${member.email} ${member.role}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "ALL" || member.status === status;
    return matchesSearch && matchesStatus;
  });
  const active = members.filter((member) => member.status === "Attivo").length;
  const invited = members.filter((member) => member.status === "Invitato").length;
  const disabled = members.filter((member) => member.status === "Disattivato").length;
  const admins = members.filter((member) => member.role === "Organization Administrator" && member.status !== "Disattivato").length;

  function toggleMember(member: MemberRecord) {
    const nextStatus: MemberRecord["status"] = member.status === "Disattivato" ? "Attivo" : "Disattivato";
    setMembers((current) => current.map((item) => item.email === member.email ? { ...item, status: nextStatus } : item));
    addAudit(nextStatus === "Attivo" ? "USER_ENABLED" : "USER_DISABLED", member.email, `Stato utente aggiornato a ${nextStatus}.`);
    notify(nextStatus === "Attivo" ? "Utente riattivato" : "Utente disattivato", nextStatus === "Attivo" ? "success" : "warning");
  }

  function removeMember(member: MemberRecord) {
    if (member.email === "mario@azienda.it") {
      notify("L'amministratore principale demo non può essere eliminato", "warning");
      return;
    }
    setMembers((current) => current.filter((item) => item.email !== member.email));
    addAudit("USER_REMOVED", member.email, "Utente rimosso dall'organizzazione demo.");
    notify("Utente rimosso", "warning");
  }

  async function resendInvite(member: MemberRecord): Promise<void> {
    const result = await createInvitationViaApi({
      name: member.name,
      email: member.email,
      role: member.role,
      expiresInDays: 14,
      personalMessage: "Ti reinviamo l'invito per completare la registrazione al workspace.",
    });
    const nextExpiry = result.expiresAt ? new Date(result.expiresAt) : new Date(Date.now() + 14 * 86_400_000);
    if (result.created) {
      setMembers((current) => current.map((item) => item.email === member.email ? { ...item, invitedAt: new Date().toISOString(), inviteExpiresAt: nextExpiry.toISOString() } : item));
    }
    setNotifications((current) => [{
      id: `mail-${Date.now()}`,
      domain: "Account Domain Manager",
      threshold: "Reinvio invito",
      channel: "Postfix",
      recipient: member.email,
      status: result.queued ? "In coda" : "Errore",
      sentAt: "Adesso",
    }, ...current]);
    addAudit(result.queued ? "USER_INVITE_RESENT" : "USER_INVITE_RESEND_FAILED", member.email, result.message);
    notify(result.queued ? `Invito reinviato a ${member.email}` : result.message, result.queued ? "success" : "warning");
  }

  return <section className="internal-section users-section">
    <div className="mini-kpi-grid four">
      <div className="mini-kpi static"><span className="mini-dot success"/><strong>{active}</strong><small>Utenti attivi</small></div>
      <div className="mini-kpi static"><span className="mini-dot warning"/><strong>{invited}</strong><small>Inviti pendenti</small></div>
      <div className="mini-kpi static"><span className="mini-dot neutral"/><strong>{disabled}</strong><small>Disattivati</small></div>
      <div className="mini-kpi static"><span className="mini-dot info"/><strong>{admins}</strong><small>Amministratori</small></div>
    </div>
    <Toolbar search={search} onSearch={setSearch} placeholder="Cerca nome, email o ruolo...">
      <select className="toolbar-select" value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">Tutti gli stati</option><option>Attivo</option><option>Invitato</option><option>Disattivato</option></select>
      <button className="secondary-action compact" type="button" onClick={() => setModal({ kind: "invite" })}><MailIcon size={17}/> Invita utente</button>
      <button className="primary-action compact" type="button" onClick={() => setModal({ kind: "create-user" })}><PlusIcon size={17}/> Registra utente</button>
    </Toolbar>
    <article className="panel data-panel">
      <div className="data-table-scroll"><table className="app-table"><thead><tr><th>Utente</th><th>Email</th><th>Ruolo</th><th>Stato</th><th>Azioni</th></tr></thead><tbody>
        {filtered.map((member, index) => <tr key={member.email}>
          <td><span className="assignee"><Avatar name={member.name} variant={index % 2 ? "teal" : "blue"}/><strong>{member.name}</strong></span></td>
          <td>{member.email}</td>
          <td><select className="inline-select" value={member.role} onChange={(event) => { const role = event.target.value as MemberRecord["role"]; setMembers((current) => current.map((item) => item.email === member.email ? { ...item, role } : item)); addAudit("USER_ROLE_CHANGED", member.email, `Ruolo aggiornato a ${role}.`); notify("Ruolo aggiornato"); }}><option>Organization Administrator</option><option>Domain Manager</option><option>Viewer</option></select></td>
          <td><div className="member-status-cell"><span className={cn("data-pill", member.status === "Attivo" ? "success" : member.status === "Invitato" ? "warning" : "neutral")}>{member.status}</span>{member.status === "Invitato" && member.inviteExpiresAt ? <small>Scade {new Date(member.inviteExpiresAt).toLocaleDateString("it-IT")}</small> : null}</div></td>
          <td><div className="row-actions user-row-actions">{member.status === "Invitato" ? <button type="button" title="Reinvia invito" onClick={() => { void resendInvite(member); }}><MailIcon size={16}/></button> : null}<button type="button" title={member.status === "Disattivato" ? "Riattiva" : "Disattiva"} onClick={() => toggleMember(member)}>{member.status === "Disattivato" ? <CheckIcon size={16}/> : <LockIcon size={16}/>}</button><button className="danger-button" type="button" title="Rimuovi" onClick={() => removeMember(member)}><TrashIcon size={16}/></button></div></td>
        </tr>)}
      </tbody></table></div>
      {filtered.length === 0 ? <EmptyState icon={<UserIcon size={24}/>} title="Nessun utente trovato" text="Modifica ricerca o filtri, oppure registra un nuovo utente."/> : null}
    </article>
  </section>;
}

function ReportsSection({ domains, renewals, notifications, audit, notify }: SectionContentProps) {
  const registrarGroups = registrars.map((registrar) => ({ registrar, count: domains.filter((domain) => domain.registrar === registrar).length }));
  function exportFullReport() {
    const payload = JSON.stringify({ generatedAt: new Date().toISOString(), domains, renewals, notifications, audit }, null, 2);
    downloadText("domain-manager-report.json", payload, "application/json");
    notify("Report JSON esportato");
  }

  return <section className="internal-section reports-section">
    <div className="report-cards"><article className="report-card"><BarChartIcon/><span><strong>Portfolio Health</strong><small>{Math.round((domains.filter((d) => d.status === "ACTIVE").length / domains.length) * 100)}% domini senza urgenze</small></span></article><article className="report-card"><RefreshIcon/><span><strong>Renewal Success</strong><small>{renewals.filter((r) => r.status === "Completato").length} completati · {renewals.filter((r) => r.status === "Fallito").length} falliti</small></span></article><article className="report-card"><BellIcon/><span><strong>Notification Health</strong><small>{notifications.filter((n) => n.status !== "Errore").length}/{notifications.length} consegne senza errori</small></span></article><article className="report-card"><FileIcon/><span><strong>Audit Coverage</strong><small>{audit.length} eventi demo disponibili</small></span></article></div>
    <div className="reports-main-grid"><article className="panel report-visual"><header className="subsection-header"><div><h2>Distribuzione per registrar</h2><p>Numero domini nel portafoglio</p></div><button className="secondary-action compact" onClick={exportFullReport}><DownloadIcon size={16}/> Esporta report</button></header><div className="horizontal-bars">{registrarGroups.filter((item) => item.count > 0).map((item) => <div key={item.registrar}><span>{item.registrar}</span><div><i style={{width:`${Math.max(16, item.count / domains.length * 100)}%`}}/></div><strong>{item.count}</strong></div>)}</div></article><article className="panel report-visual"><header className="subsection-header"><div><h2>Scadenze per stato</h2><p>Distribuzione corrente</p></div></header><div className="status-report-list">{(["ACTIVE","WARNING","URGENT","CRITICAL","EXPIRED","UNKNOWN"] as DomainStatus[]).map((status) => <div key={status}><StatusPill status={status}/><strong>{domains.filter((d) => d.status === status).length}</strong></div>)}</div></article></div>
  </section>;
}

function CostsSection({ domains, notify }: SectionContentProps) {
  const [search, setSearch] = useState("");
  const filtered = domains.filter((domain) => !search || `${domain.name} ${domain.registrar}`.toLowerCase().includes(search.toLowerCase()));
  const expected = domains.reduce((sum, domain) => sum + domain.expectedCost, 0);
  const actual = domains.reduce((sum, domain) => sum + (domain.actualCost ?? 0), 0);
  const byRegistrar = registrars.map((registrar) => ({ registrar, value: domains.filter((d) => d.registrar === registrar).reduce((sum, d) => sum + d.expectedCost, 0) })).filter((item) => item.value > 0);

  return <section className="internal-section">
    <div className="mini-kpi-grid four"><div className="mini-kpi static"><span className="mini-dot info"/><strong>{formatMoney(expected)}</strong><small>Spesa prevista</small></div><div className="mini-kpi static"><span className="mini-dot success"/><strong>{formatMoney(actual)}</strong><small>Spesa registrata</small></div><div className="mini-kpi static"><span className="mini-dot warning"/><strong>{formatMoney(expected-actual)}</strong><small>Ancora prevista</small></div><div className="mini-kpi static"><span className="mini-dot neutral"/><strong>{formatMoney(expected/domains.length)}</strong><small>Costo medio</small></div></div>
    <div className="costs-grid"><article className="panel cost-chart"><header className="subsection-header"><div><h2>Spesa per registrar</h2><p>Previsione annuale demo</p></div></header><div className="horizontal-bars money">{byRegistrar.map((item) => <div key={item.registrar}><span>{item.registrar}</span><div><i style={{width:`${Math.max(12,item.value/expected*100)}%`}}/></div><strong>{formatMoney(item.value)}</strong></div>)}</div></article><div className="cost-table-area"><Toolbar search={search} onSearch={setSearch} placeholder="Cerca dominio o registrar..."><button className="secondary-action compact" onClick={() => { const rows = filtered.map((d)=>`${d.name},${d.registrar},${d.expectedCost},${d.actualCost ?? ""},${d.currency}`); downloadText("domain-manager-costs.csv", `domain,registrar,expected,actual,currency\n${rows.join("\n")}`); notify("Costi esportati"); }}><DownloadIcon size={17}/> Esporta</button></Toolbar><article className="panel data-panel"><div className="data-table-scroll"><table className="app-table"><thead><tr><th>Dominio</th><th>Registrar</th><th>Previsto</th><th>Effettivo</th><th>Varianza</th><th>Valuta</th></tr></thead><tbody>{filtered.map((domain) => <tr key={domain.id}><td><strong>{domain.name}</strong></td><td>{domain.registrar}</td><td>{formatMoney(domain.expectedCost,domain.currency)}</td><td>{formatMoney(domain.actualCost,domain.currency)}</td><td>{domain.actualCost === null ? "—" : formatMoney(domain.actualCost-domain.expectedCost,domain.currency)}</td><td>{domain.currency}</td></tr>)}</tbody></table></div></article></div></div>
  </section>;
}

function AuditSection({ audit, notify }: SectionContentProps) {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("ALL");
  const actions = Array.from(new Set(audit.map((item) => item.action)));
  const filtered = audit.filter((item) => (!search || `${item.actor} ${item.entity} ${item.detail} ${item.correlationId}`.toLowerCase().includes(search.toLowerCase())) && (action === "ALL" || item.action === action));
  return <section className="internal-section"><Toolbar search={search} onSearch={setSearch} placeholder="Cerca attore, entità o correlation ID..."><select className="toolbar-select" value={action} onChange={(e)=>setAction(e.target.value)}><option value="ALL">Tutte le azioni</option>{actions.map((item)=><option key={item}>{item}</option>)}</select><button className="secondary-action compact" onClick={() => { const rows=filtered.map((a)=>[a.time,a.actor,a.action,a.entity,a.detail,a.correlationId].join(",")); downloadText("domain-manager-audit.csv",`time,actor,action,entity,detail,correlationId\n${rows.join("\n")}`); notify("Audit esportato"); }}><DownloadIcon size={17}/> Esporta</button></Toolbar><article className="panel data-panel"><div className="data-table-scroll"><table className="app-table audit-table"><thead><tr><th>Data</th><th>Attore</th><th>Azione</th><th>Entità</th><th>Dettaglio</th><th>Correlation ID</th></tr></thead><tbody>{filtered.map((item)=><tr key={item.id}><td>{item.time}</td><td><strong>{item.actor}</strong></td><td><span className="code-pill">{item.action}</span></td><td>{item.entity}</td><td>{item.detail}</td><td><code>{item.correlationId}</code></td></tr>)}</tbody></table></div></article></section>;
}

function SettingsSection({ setModal, notify, addAudit, members, navigate, setNotifications }: SectionContentProps) {
  type SettingsTab = "organization" | "users" | "security" | "email" | "integrations";
  const [tab, setTab] = useState<SettingsTab>("organization");
  const [organization, setOrganization] = useState({ name:"Acme S.p.A.", timezone:"Europe/Rome", language:"Italiano", retention:"365" });
  const [security, setSecurity] = useState({ mfa:true, sessionHours:"8", sso:false, suspiciousLogin:true });
  const [integration, setIntegration] = useState({ webhook:"https://example.invalid/domain-events", slack:false, teams:false, registrar:false });
  const [settingsHydrated, setSettingsHydrated] = useState(false);
  const [emailStatus, setEmailStatus] = useState<EmailProviderConfiguration | null>(null);
  const [emailStatusLoading, setEmailStatusLoading] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailDisconnecting, setEmailDisconnecting] = useState(false);
  const [emailForm, setEmailForm] = useState({ provider: "postfix" as const, fromName: "Domain Manager", fromEmail: "" });
  const [emailTestRecipient, setEmailTestRecipient] = useState("");
  const [emailTestBusy, setEmailTestBusy] = useState(false);
  const [emailResult, setEmailResult] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryEmailSaving, setRecoveryEmailSaving] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("domain-manager.demo.settings");
      if (stored) {
        const value = JSON.parse(stored) as { organization?: typeof organization; security?: typeof security; integration?: typeof integration };
        if (value.organization) setOrganization(value.organization);
        if (value.security) setSecurity(value.security);
        if (value.integration) setIntegration(value.integration);
      }
    } catch {
      // Le impostazioni demo corrotte non devono bloccare la pagina.
    } finally {
      setSettingsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!settingsHydrated) return;
    window.localStorage.setItem("domain-manager.demo.settings", JSON.stringify({ organization, security, integration }));
  }, [integration, organization, security, settingsHydrated]);

  function applyEmailConfiguration(configuration: EmailProviderConfiguration): void {
    setEmailStatus(configuration);
    setEmailForm((current) => ({ ...current, fromName: configuration.fromName || "Domain Manager", fromEmail: configuration.fromEmail || "" }));
  }

  useEffect(() => {
    if (tab !== "email") return;
    let active = true;
    setEmailStatusLoading(true);
    void getEmailProviderConfiguration().then((configuration) => {
      if (!active) return;
      applyEmailConfiguration(configuration);
      setEmailStatusLoading(false);
    });
    return () => { active = false; };
  }, [tab]);

  useEffect(() => {
    if (tab !== "email") return;
    let active = true;
    void getRecoveryEmail().then((value) => { if (active) setRecoveryEmail(value); });
    return () => { active = false; };
  }, [tab]);

  function save(label: string) {
    addAudit("SETTINGS_UPDATED", label, "Configurazione demo salvata.");
    notify("Impostazioni salvate");
  }

  async function refreshEmailStatus(): Promise<void> {
    setEmailStatusLoading(true);
    const configuration = await getEmailProviderConfiguration();
    applyEmailConfiguration(configuration);
    setEmailStatusLoading(false);
    if (!configuration.reachable) {
      notify("Postfix non è raggiungibile", "warning");
    } else if (!configuration.configured) {
      notify("Postfix è attivo: configura il mittente", "info");
    } else {
      notify("Postfix locale attivo", "success");
    }
  }

  async function saveEmailConfiguration(): Promise<void> {
    const fromName = emailForm.fromName.trim();
    const fromEmail = emailForm.fromEmail.trim().toLowerCase();
    if (!fromName) { notify("Inserisci il nome mittente", "warning"); return; }
    if (!fromEmail || !fromEmail.includes("@")) { notify("Inserisci un indirizzo mittente valido", "warning"); return; }

    setEmailSaving(true);
    setEmailResult("");
    try {
      const configuration = await saveEmailProviderConfiguration({ provider: "postfix", fromName, fromEmail });
      applyEmailConfiguration(configuration);
      addAudit("EMAIL_PROVIDER_CONFIGURED", "Postfix", `Mittente Postfix configurato dall'interfaccia: ${configuration.from}.`);
      notify(configuration.reachable ? "Configurazione Postfix salvata" : "Mittente salvato, ma Postfix non è raggiungibile", configuration.reachable ? "success" : "warning");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossibile salvare la configurazione email.";
      setEmailResult(message);
      notify(message, "warning");
    } finally {
      setEmailSaving(false);
    }
  }

  async function removeEmailConfiguration(): Promise<void> {
    if (!window.confirm("Rimuovere il mittente email salvato dall'interfaccia?")) return;
    setEmailDisconnecting(true);
    setEmailResult("");
    try {
      const configuration = await disconnectEmailProvider();
      applyEmailConfiguration(configuration);
      addAudit("EMAIL_PROVIDER_DISCONNECTED", "Postfix", "Configurazione mittente Postfix salvata dall'interfaccia rimossa.");
      notify(configuration.configured ? "Configurazione UI rimossa; resta quella di ambiente" : "Mittente email rimosso", "info");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossibile rimuovere la configurazione email.";
      setEmailResult(message);
      notify(message, "warning");
    } finally {
      setEmailDisconnecting(false);
    }
  }

  async function saveRecoveryAddress(): Promise<void> {
    const value = recoveryEmail.trim().toLowerCase();
    if (!value || !value.includes("@")) { notify("Inserisci una email di recupero valida", "warning"); return; }
    setRecoveryEmailSaving(true);
    try {
      const result = await saveRecoveryEmail(value);
      setRecoveryEmail(result.email);
      addAudit("RECOVERY_EMAIL_UPDATED", "Account amministratore", `Email di recupero aggiornata a ${result.email}.`);
      notify("Email di recupero salvata", "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Impossibile salvare l'email di recupero", "warning");
    } finally {
      setRecoveryEmailSaving(false);
    }
  }

  async function sendTestEmail(): Promise<void> {
    const recipient = emailTestRecipient.trim().toLowerCase();
    if (!recipient || !recipient.includes("@")) { notify("Inserisci un indirizzo email valido", "warning"); return; }
    if (!emailStatus?.reachable) { notify("Postfix non è raggiungibile", "warning"); return; }
    if (!emailStatus.configured) { notify("Prima salva un indirizzo mittente", "warning"); return; }

    setEmailTestBusy(true);
    setEmailResult("");
    const result = await sendEmailViaApi(
      recipient,
      "Test Domain Manager",
      "Questa è un'email di test consegnata da Domain Manager al server Postfix locale.",
      `settings-email-test/${recipient}/${new Date().toISOString().slice(0, 16)}`,
    );
    setEmailTestBusy(false);
    setEmailResult(result.message);

    setNotifications((current) => [{ id: `mail-${Date.now()}`, domain: "Domain Manager", threshold: "Test email", channel: result.sent || result.configured ? "Postfix" : "Anteprima email", recipient, status: result.sent ? "In coda" : result.configured ? "Errore" : "Bozza", sentAt: "Adesso" }, ...current]);
    if (result.sent) {
      addAudit("EMAIL_QUEUED", recipient, `Email di test accettata da Postfix${result.id ? `; message id ${result.id}` : ""}.`);
      notify(`Email accettata da Postfix per ${recipient}`);
    } else {
      addAudit(result.configured ? "EMAIL_SEND_FAILED" : "EMAIL_PREVIEW_CREATED", recipient, result.message);
      notify(result.message, result.configured ? "warning" : "info");
    }
  }

  const settingsTabs: readonly (readonly [SettingsTab, string])[] = [["organization", "Organizzazione"], ["users", "Utenti e ruoli"], ["security", "Sicurezza"], ["email", "Email"], ["integrations", "Integrazioni"]];
  const integrationToggles = [["Slack", "slack"], ["Microsoft Teams", "teams"], ["Registrar API", "registrar"]] as const;
  const sourceLabel = emailStatus?.source === "interface" ? "Mittente da interfaccia" : emailStatus?.source === "environment" ? "Mittente da ambiente" : "Mittente non configurato";

  return <section className="internal-section settings-section"><div className="settings-tabs">{settingsTabs.map(([key,label])=><button key={key} className={tab===key?"active":""} onClick={()=>setTab(key)}>{label}</button>)}</div>
    {tab === "organization" ? <article className="panel settings-card"><header className="subsection-header"><div><h2>Profilo organizzazione</h2><p>Preferenze usate per visualizzazione e pianificazione.</p></div></header><div className="settings-form-grid"><label>Nome organizzazione<input value={organization.name} onChange={(e)=>setOrganization({...organization,name:e.target.value})}/></label><label>Fuso orario<select value={organization.timezone} onChange={(e)=>setOrganization({...organization,timezone:e.target.value})}><option>Europe/Rome</option><option>Europe/London</option><option>America/New_York</option></select></label><label>Lingua predefinita<select value={organization.language} onChange={(e)=>setOrganization({...organization,language:e.target.value})}><option>Italiano</option><option>English</option></select></label><label>Conservazione audit (giorni)<input type="number" value={organization.retention} onChange={(e)=>setOrganization({...organization,retention:e.target.value})}/></label></div><div className="settings-footer"><button className="primary-action" onClick={()=>save("Organizzazione")}>Salva modifiche</button></div></article> : null}
    {tab === "users" ? <article className="panel settings-card"><header className="subsection-header"><div><h2>Utenti e ruoli</h2><p>Gestisci accessi e inviti dell'organizzazione.</p></div><div className="header-inline-actions"><button className="secondary-action compact" onClick={()=>navigate("/dashboard/users")}><UsersIcon size={17}/> Gestisci utenti</button><button className="primary-action compact" onClick={()=>setModal({kind:"invite"})}><PlusIcon size={17}/> Invita</button></div></header><div className="data-table-scroll"><table className="app-table compact-table"><thead><tr><th>Utente</th><th>Email</th><th>Ruolo</th><th>Stato</th></tr></thead><tbody>{members.slice(0,6).map((user)=><tr key={user.email}><td><strong>{user.name}</strong></td><td>{user.email}</td><td>{user.role}</td><td><span className={cn("data-pill", user.status === "Attivo" ? "success" : user.status === "Invitato" ? "warning" : "neutral")}>{user.status}</span></td></tr>)}</tbody></table></div></article> : null}
    {tab === "security" ? <article className="panel settings-card"><header className="subsection-header"><div><h2>Sicurezza</h2><p>Controlli preparati per la futura autenticazione reale.</p></div></header><div className="settings-list wide"><label className="setting-row"><span><strong>MFA obbligatoria</strong><small>Richiede secondo fattore per gli amministratori</small></span><input type="checkbox" checked={security.mfa} onChange={(e)=>setSecurity({...security,mfa:e.target.checked})}/></label><label className="setting-row"><span><strong>Rilevamento accessi sospetti</strong><small>Registra e segnala pattern anomali</small></span><input type="checkbox" checked={security.suspiciousLogin} onChange={(e)=>setSecurity({...security,suspiciousLogin:e.target.checked})}/></label><label className="setting-row"><span><strong>SSO OpenID Connect</strong><small>Predisposizione per provider aziendali</small></span><input type="checkbox" checked={security.sso} onChange={(e)=>setSecurity({...security,sso:e.target.checked})}/></label><label className="setting-row"><span><strong>Durata sessione</strong><small>Ore prima della nuova autenticazione</small></span><select value={security.sessionHours} onChange={(e)=>setSecurity({...security,sessionHours:e.target.value})}><option value="4">4 ore</option><option value="8">8 ore</option><option value="12">12 ore</option><option value="24">24 ore</option></select></label></div><div className="settings-footer"><button className="primary-action" onClick={()=>save("Sicurezza")}>Salva sicurezza</button></div></article> : null}
    {tab === "email" ? <article className="panel settings-card email-api-card">
      <header className="subsection-header"><div><h2>Postfix locale</h2><p>Invio email tramite il mail server interno di Domain Manager, senza account API esterni.</p></div><span className={cn("demo-badge", emailStatus?.reachable && "configured-badge")}>{emailStatusLoading ? "CONTROLLO..." : emailStatus?.reachable ? "POSTFIX ATTIVO" : "POSTFIX OFFLINE"}</span></header>
      <div className={cn("smtp-info-callout", emailStatus?.reachable && "configured")}><MailIcon size={20}/><div><strong>{emailStatus?.reachable ? "Server Postfix raggiungibile" : "Server Postfix non raggiungibile"}</strong><span>{emailStatus?.reachable ? (emailStatus.configured ? `${sourceLabel} · Mittente: ${emailStatus.from}` : "Il server è attivo. Imposta nome e indirizzo mittente per iniziare.") : (emailStatus?.message || "Controlla il container postfix.")}</span></div></div>
      <div className="email-provider-summary"><div><span>Server</span><strong>Postfix</strong><small>Container Docker interno</small></div><div><span>Connessione</span><strong>{emailStatus?.reachable ? "Attiva" : "Non disponibile"}</strong><small>{emailStatus ? `${emailStatus.host}:${emailStatus.port}` : "postfix:25"}</small></div><div><span>Mittente attivo</span><strong>{emailStatus?.from || "Non configurato"}</strong><small>{sourceLabel}</small></div></div>
      <div className="provider-config-panel"><div className="provider-config-heading"><div><h3>Configurazione mittente</h3><p>Non servono API key, username SMTP o password. Il collegamento API → Postfix avviene soltanto nella rete Docker.</p></div><span className="provider-lock"><ShieldIcon size={16}/> Rete Docker interna</span></div><div className="settings-form-grid email-config-grid">
        <label>Modalità<select value={emailForm.provider} onChange={()=>undefined}><option value="postfix">Postfix locale</option></select></label>
        <label>Nome mittente<input value={emailForm.fromName} onChange={(e)=>setEmailForm({...emailForm,fromName:e.target.value})} placeholder="Domain Manager"/></label>
        <label className="email-config-wide">Email mittente<input type="email" value={emailForm.fromEmail} onChange={(e)=>setEmailForm({...emailForm,fromEmail:e.target.value})} placeholder="notifications@tuodominio.it"/><small>Per la consegna Internet affidabile usa un indirizzo appartenente al dominio che configurerai sul server.</small></label>
      </div><div className="provider-actions"><button className="secondary-action" type="button" disabled={emailStatusLoading} onClick={()=>{void refreshEmailStatus();}}><RefreshIcon size={17}/> Ricontrolla</button>{emailStatus?.source === "interface" ? <button className="secondary-action danger-outline" type="button" disabled={emailDisconnecting} onClick={()=>{void removeEmailConfiguration();}}><TrashIcon size={17}/>{emailDisconnecting?" Rimozione...":" Rimuovi mittente"}</button> : null}<button className="primary-action" type="button" disabled={emailSaving} onClick={()=>{void saveEmailConfiguration();}}><CheckIcon size={17}/>{emailSaving?" Salvataggio...":" Salva mittente"}</button></div></div>
      <div className="provider-config-panel recovery-email-panel"><div className="provider-config-heading"><div><h3>Email di recupero account</h3><p>Qui va la tua casella personale reale. Il login demo resta admin@domainmanager.local, ma i link “Password dimenticata?” vengono spediti a questo indirizzo.</p></div><span className="provider-lock"><LockIcon size={16}/> Recupero accesso</span></div><div className="settings-form-grid email-config-grid"><label className="email-config-wide">Email personale di recupero<input type="email" value={recoveryEmail} onChange={(e)=>setRecoveryEmail(e.target.value)} placeholder="tuonome@gmail.com"/><small>Deve essere una casella che puoi ricevere realmente.</small></label></div><div className="provider-actions"><button className="primary-action" type="button" disabled={recoveryEmailSaving} onClick={()=>{void saveRecoveryAddress();}}><CheckIcon size={17}/>{recoveryEmailSaving ? " Salvataggio..." : " Salva email recupero"}</button></div></div>
      <div className="email-test-panel provider-test-panel"><label>Destinatario test<input type="email" value={emailTestRecipient} onChange={(e)=>setEmailTestRecipient(e.target.value)} placeholder="tuaemail@dominio.it"/></label><div><span className="test-panel-label">Test coda Postfix</span><button className="primary-action" type="button" disabled={emailTestBusy || !emailStatus?.configured} onClick={()=>{void sendTestEmail();}}><MailIcon size={17}/>{emailTestBusy ? " Invio..." : " Invia email test"}</button></div>{emailResult ? <div className="email-result-line">{emailResult}</div> : null}</div>
      <div className="info-callout"><AlertIcon size={18}/><span><strong>Importante:</strong> “accettata da Postfix” significa che Domain Manager ha consegnato correttamente il messaggio al mail server locale. Per farlo arrivare davvero a Gmail/Outlook da Internet servono poi IP pubblico adatto, porta 25 in uscita, hostname/PTR e autenticazione DNS del dominio.</span></div>
    </article> : null}
    {tab === "integrations" ? <article className="panel settings-card"><header className="subsection-header"><div><h2>Integrazioni</h2><p>Connessioni simulate, pronte per adapter/API reali.</p></div><span className="demo-badge">SIMULATE</span></header><div className="integration-list"><div className="integration-card"><span className="integration-icon"><LinkIcon/></span><div><strong>Webhook</strong><small>Eventi rinnovo e scadenza</small><input value={integration.webhook} onChange={(e)=>setIntegration({...integration,webhook:e.target.value})}/></div><button onClick={()=>notify("Webhook di test simulato", "info")}>Test</button></div>{integrationToggles.map(([label,key])=><div className="integration-card" key={key}><span className="integration-icon"><BuildingIcon/></span><div><strong>{label}</strong><small>{integration[key]?"Connesso (demo)":"Non connesso"}</small></div><button onClick={()=>setIntegration({...integration,[key]:!integration[key]})}>{integration[key]?"Disconnetti":"Connetti"}</button></div>)}</div><div className="settings-footer"><button className="primary-action" onClick={()=>save("Integrazioni")}>Salva integrazioni</button></div></article> : null}
  </section>;
}

function DomainFormModal({ domain, onSave, onClose }: { domain: DomainRecord | undefined; onSave: (domain: DomainRecord) => void; onClose: () => void }) {
  const [form, setForm] = useState<DomainRecord>(domain ?? { id:`d-${Date.now()}`, name:"", registrar:"Aruba", expiresOn:"", status:"UNKNOWN", owner:"Non assegnato", department:"IT", client:"Interno", tags:[], autoRenew:false, renewalStatus:"Non pianificato", expectedCost:0, actualCost:null, currency:"EUR", lastCheck:"Mai", reliability:"Manuale", source:"Manuale" });
  const [tags, setTags] = useState(form.tags.join(", "));
  function submit(event: FormEvent) { event.preventDefault(); onSave({...form, name:form.name.trim().toLowerCase(), tags:tags.split(",").map((tag)=>tag.trim()).filter(Boolean)}); }
  return <Modal title={domain ? `Modifica ${domain.name}` : "Aggiungi dominio"} onClose={onClose} wide><form className="modal-grid-form" onSubmit={submit}><label>Dominio<input required placeholder="example.com" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}/></label><label>Registrar<select value={form.registrar} onChange={(e)=>setForm({...form,registrar:e.target.value})}>{registrars.map((item)=><option key={item}>{item}</option>)}</select></label><label>Data di scadenza<input type="date" value={form.expiresOn} onChange={(e)=>setForm({...form,expiresOn:e.target.value})}/></label><label>Stato<select value={form.status} onChange={(e)=>setForm({...form,status:e.target.value as DomainStatus})}>{(["ACTIVE","WARNING","URGENT","CRITICAL","EXPIRED","UNKNOWN"] as DomainStatus[]).map((item)=><option key={item} value={item}>{statusLabel(item)}</option>)}</select></label><label>Responsabile<select value={form.owner} onChange={(e)=>setForm({...form,owner:e.target.value})}><option>Non assegnato</option>{owners.map((item)=><option key={item}>{item}</option>)}</select></label><label>Reparto<input value={form.department} onChange={(e)=>setForm({...form,department:e.target.value})}/></label><label>Cliente / progetto<input value={form.client} onChange={(e)=>setForm({...form,client:e.target.value})}/></label><label>Tag<input placeholder="corporate, email" value={tags} onChange={(e)=>setTags(e.target.value)}/></label><label>Costo previsto<input type="number" step="0.01" value={form.expectedCost} onChange={(e)=>setForm({...form,expectedCost:Number(e.target.value)})}/></label><label>Valuta<select value={form.currency} onChange={(e)=>setForm({...form,currency:e.target.value as "EUR"|"USD"})}><option>EUR</option><option>USD</option></select></label><label className="modal-toggle"><input type="checkbox" checked={form.autoRenew} onChange={(e)=>setForm({...form,autoRenew:e.target.checked})}/><span>Rinnovo automatico configurato</span></label><div className="modal-actions"><button type="button" className="secondary-action" onClick={onClose}>Annulla</button><button type="submit" className="primary-action">Salva dominio</button></div></form></Modal>;
}

function DomainDetailsModal({ domain, onClose, onEdit, onVerify }: { domain: DomainRecord; onClose: () => void; onEdit: () => void; onVerify: () => void }) {
  return <Modal title={domain.name} onClose={onClose} wide><div className="domain-detail-grid"><div><span>Stato</span><StatusPill status={domain.status}/></div><div><span>Scadenza</span><strong>{domain.expiresOn || "Non verificabile"}</strong></div><div><span>Registrar</span><strong>{domain.registrar}</strong></div><div><span>Auto renew</span><strong>{domain.autoRenew?"Configurato":"Disattivo"}</strong></div><div><span>Responsabile</span><strong>{domain.owner}</strong></div><div><span>Reparto</span><strong>{domain.department}</strong></div><div><span>Cliente</span><strong>{domain.client}</strong></div><div><span>Fonte</span><strong>{domain.source} · {domain.reliability}</strong></div><div><span>Ultima verifica</span><strong>{domain.lastCheck}</strong></div><div><span>Costo previsto</span><strong>{formatMoney(domain.expectedCost,domain.currency)}</strong></div><div className="detail-tags"><span>Tag</span><strong>{domain.tags.map((tag)=><i key={tag}>{tag}</i>)}</strong></div></div><div className="info-callout"><AlertIcon size={18}/><span>Il rinnovo automatico configurato non viene considerato una conferma dell'avvenuto rinnovo.</span></div><div className="modal-actions"><button className="secondary-action" onClick={onVerify}><RefreshIcon size={17}/> Verifica ora</button><button className="primary-action" onClick={onEdit}><EditIcon size={17}/> Modifica</button></div></Modal>;
}

function RenewalModal({ renewal, domains, onSave, onClose }: { renewal: RenewalRecord; domains: DomainRecord[]; onSave: (record: RenewalRecord)=>void; onClose:()=>void }) {
  const [form,setForm]=useState(renewal);
  const selectedDomain = domains.find((domain) => domain.id === form.domainId);
  return <Modal title={`Rinnovo · ${selectedDomain?.name ?? "Nuovo task"}`} onClose={onClose}><form className="modal-stack-form" onSubmit={(e)=>{e.preventDefault();onSave(form);}}><label>Dominio<select required value={form.domainId} onChange={(e)=>setForm({...form,domainId:e.target.value})}>{domains.map((domain)=><option key={domain.id} value={domain.id}>{domain.name}</option>)}</select></label><label>Responsabile<select value={form.assignee} onChange={(e)=>setForm({...form,assignee:e.target.value})}>{owners.map((owner)=><option key={owner}>{owner}</option>)}</select></label><label>Scadenza operativa<input type="date" value={form.internalDue} onChange={(e)=>setForm({...form,internalDue:e.target.value})}/></label><label>Stato<select value={form.status} onChange={(e)=>setForm({...form,status:e.target.value as RenewalStatus})}>{["Pianificato","Richiesto","Pagato","In verifica","Completato","Fallito"].map((item)=><option key={item}>{item}</option>)}</select></label><label>Costo effettivo<input type="number" step="0.01" value={form.cost ?? ""} onChange={(e)=>setForm({...form,cost:e.target.value?Number(e.target.value):null})}/></label><label>Note<textarea rows={4} value={form.note} onChange={(e)=>setForm({...form,note:e.target.value})}/></label><div className="info-callout"><CheckIcon size={18}/><span>Usa “Completato” solo dopo aver verificato una nuova data o una prova verificabile.</span></div><div className="modal-actions"><button type="button" className="secondary-action" onClick={onClose}>Annulla</button><button type="submit" className="primary-action">Salva rinnovo</button></div></form></Modal>;
}

function ImportModal({ onImport, onClose }: { onImport:(records:DomainRecord[])=>void; onClose:()=>void }) {
  const [preview,setPreview]=useState<string[][]>([]);
  const [error,setError]=useState("");
  function readFile(event: ChangeEvent<HTMLInputElement>) { const file=event.target.files?.[0]; if(!file)return; const reader=new FileReader(); reader.onload=()=>{const text=String(reader.result??""); const rows=text.split(/\r?\n/).filter(Boolean).map((line)=>line.split(",").map((cell)=>cell.trim())); if(rows.length<2){setError("Il CSV deve contenere intestazione e almeno una riga.");return;} setError("");setPreview(rows.slice(0,6));}; reader.readAsText(file); }
  function execute(){
    if(preview.length<2)return;
    const firstRow = preview[0];
    if (!firstRow) return;
    const header=firstRow.map((item)=>item.toLowerCase());
    const nameIndex=Math.max(0,header.findIndex((item)=>["domain","dominio","name"].includes(item)));
    const registrarIndex=header.findIndex((item)=>item==="registrar");
    const expiryIndex=header.findIndex((item)=>["expiry","expireson","scadenza"].includes(item));
    const records=preview.slice(1).map((row,index):DomainRecord=>({id:`imp-${Date.now()}-${index}`,name:(row[nameIndex]||`import-${index}.example`).toLowerCase(),registrar:registrarIndex>=0?(row[registrarIndex]||"Manuale"):"Manuale",expiresOn:expiryIndex>=0?(row[expiryIndex]||""):"",status:"UNKNOWN",owner:"Non assegnato",department:"—",client:"Import CSV",tags:["import"],autoRenew:false,renewalStatus:"Non pianificato",expectedCost:0,actualCost:null,currency:"EUR",lastCheck:"Mai",reliability:"Manuale",source:"CSV"}));
    onImport(records);
  }
  return <Modal title="Importa domini da CSV" onClose={onClose} wide><div className="import-drop"><UploadIcon size={30}/><strong>Seleziona un file CSV</strong><span>Colonne consigliate: domain, registrar, expiry</span><input type="file" accept=".csv,text/csv" onChange={readFile}/></div>{error?<div className="form-error">{error}</div>:null}{preview.length>0?<div className="import-preview"><strong>Anteprima</strong><table><tbody>{preview.map((row,index)=><tr key={index}>{row.map((cell,cellIndex)=><td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table><small>Per la demo vengono importate le righe mostrate in anteprima.</small></div>:null}<div className="modal-actions"><button className="secondary-action" onClick={()=>downloadText("domain-manager-import-template.csv","domain,registrar,expiry\nexample.com,Cloudflare,2027-01-01")}>Scarica modello</button><button className="primary-action" disabled={preview.length<2} onClick={execute}>Importa righe valide</button></div></Modal>;
}

function InviteModal({ onClose, onInvite }: { onClose:()=>void; onInvite:(invite:InviteRequest)=>void }) {
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [role,setRole]=useState<MemberRecord["role"]>("Domain Manager");
  const [expiresInDays,setExpiresInDays]=useState<7|14|30>(14);
  const [personalMessage,setPersonalMessage]=useState("");
  const roleDescriptions: Record<MemberRecord["role"], string> = {
    "Organization Administrator": "Gestisce organizzazione, utenti, ruoli, notifiche e tutti i domini.",
    "Domain Manager": "Gestisce domini assegnati, verifiche e workflow di rinnovo.",
    "Viewer": "Consulta dashboard, domini, report e storico senza modificare i dati.",
  };

  return <Modal title="Invita un nuovo membro" onClose={onClose} wide>
    <form className="invite-form" onSubmit={(event)=>{event.preventDefault();onInvite({name,email,role,expiresInDays,personalMessage});}}>
      <div className="invite-form-grid">
        <div className="invite-form-fields">
          <label>Nome e cognome <span className="field-optional">opzionale</span><input value={name} onChange={(event)=>setName(event.target.value)} placeholder="es. Andrea Verdi"/></label>
          <label>Email aziendale<input type="email" required value={email} onChange={(event)=>setEmail(event.target.value)} placeholder="nome@azienda.it"/></label>
          <label>Ruolo<select value={role} onChange={(event)=>setRole(event.target.value as MemberRecord["role"])}><option>Organization Administrator</option><option>Domain Manager</option><option>Viewer</option></select><small>{roleDescriptions[role]}</small></label>
          <label>Scadenza invito<select value={expiresInDays} onChange={(event)=>setExpiresInDays(Number(event.target.value) as 7|14|30)}><option value={7}>7 giorni</option><option value={14}>14 giorni</option><option value={30}>30 giorni</option></select></label>
          <label>Messaggio personale <span className="field-optional">opzionale</span><textarea rows={4} maxLength={500} value={personalMessage} onChange={(event)=>setPersonalMessage(event.target.value)} placeholder="Aggiungi un breve messaggio per spiegare perché stai invitando questa persona..."/><small>{personalMessage.length}/500 caratteri</small></label>
        </div>
        <aside className="invite-preview-card">
          <span className="invite-preview-kicker">ANTEPRIMA INVITO</span>
          <div className="invite-preview-brand"><span>DM</span><strong>Domain Manager</strong></div>
          <h3>{name.trim() ? `Ciao ${name.trim()},` : "Ciao,"}</h3>
          <p>Sei stato invitato nel workspace <strong>Acme S.p.A.</strong>.</p>
          <div className="invite-preview-role"><ShieldIcon size={17}/><span><strong>{role}</strong><small>{roleDescriptions[role]}</small></span></div>
          {personalMessage.trim() ? <blockquote>{personalMessage.trim()}</blockquote> : null}
          <div className="invite-preview-expiry"><ClockIcon size={16}/> Valido per {expiresInDays} giorni</div>
          <button type="button" disabled>Completa registrazione</button>
          <small className="invite-preview-note">L'email verrà consegnata tramite Postfix con il template grafico Domain Manager.</small>
        </aside>
      </div>
      <div className="modal-actions invite-modal-actions"><span><MailIcon size={17}/> L'utente verrà aggiunto con stato <strong>Invitato</strong>.</span><div><button type="button" className="secondary-action" onClick={onClose}>Annulla</button><button type="submit" className="primary-action"><MailIcon size={17}/> Invia invito</button></div></div>
    </form>
  </Modal>;
}

function CreateUserModal({ onClose, onCreate }: { onClose:()=>void; onCreate:(name:string,email:string,role:MemberRecord["role"])=>void }) {
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [role,setRole]=useState<MemberRecord["role"]>("Domain Manager");
  return <Modal title="Registra nuovo utente" onClose={onClose}><form className="modal-stack-form" onSubmit={(event)=>{event.preventDefault();onCreate(name.trim(),email.trim().toLowerCase(),role);}}><label>Nome e cognome<input required value={name} onChange={(event)=>setName(event.target.value)} placeholder="Nome Cognome"/></label><label>Email aziendale<input type="email" required value={email} onChange={(event)=>setEmail(event.target.value)} placeholder="nome@azienda.it"/></label><label>Ruolo<select value={role} onChange={(event)=>setRole(event.target.value as MemberRecord["role"])}><option>Organization Administrator</option><option>Domain Manager</option><option>Viewer</option></select></label><div className="info-callout"><ShieldIcon size={18}/><span>L'utente viene registrato come attivo solo nella demo UI. Password, verifica email e MFA saranno gestiti dal backend senza memorizzare password in chiaro.</span></div><div className="modal-actions"><button type="button" className="secondary-action" onClick={onClose}>Annulla</button><button type="submit" className="primary-action">Registra utente</button></div></form></Modal>;
}
