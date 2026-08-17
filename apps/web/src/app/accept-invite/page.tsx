"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, CheckIcon, ClockIcon, EyeIcon, GlobeIcon, LockIcon, MailIcon, ShieldIcon, UserIcon } from "@/components/icons";

type InvitationDetails = {
  valid: boolean;
  email?: string;
  name?: string;
  role?: "Organization Administrator" | "Domain Manager" | "Viewer";
  organization?: string;
  expiresAt?: string;
  personalMessage?: string;
  message?: string;
};

export default function AcceptInvitePage() {
  const router = useRouter();
  const tokenRef = useRef("");
  const [details, setDetails] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const checks = useMemo(() => ({
    length: password.length >= 10,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  }), [password]);
  const passwordValid = Object.values(checks).every(Boolean);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("token") ?? "";
    tokenRef.current = value;

    const validationRequest: Promise<InvitationDetails> = value
      ? fetch(`/api/auth/invitations/validate?token=${encodeURIComponent(value)}`, { cache: "no-store" })
          .then(async (response) => await response.json() as InvitationDetails)
      : Promise.resolve({ valid: false, message: "Il link di invito non contiene un token valido." });

    void validationRequest
      .then((payload) => {
        setDetails(payload);
        if (payload.valid) setName(payload.name ?? "");
      })
      .catch(() => setDetails({ valid: false, message: "Servizio inviti non raggiungibile." }))
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (!passwordValid) { setMessage("Completa tutti i requisiti della password."); return; }
    if (password !== confirmPassword) { setMessage("Le due password non coincidono."); return; }
    if (!accepted) { setMessage("Conferma di voler creare l’account e accedere al workspace."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenRef.current, name: name.trim(), password }),
      });
      const payload = await response.json() as { registered?: boolean; message?: string };
      setMessage(payload.message || "Impossibile completare la registrazione.");
      setSuccess(Boolean(payload.registered));
    } catch {
      setMessage("Servizio attivazione account non raggiungibile.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="account-flow-shell invitation-flow-shell">
      <section className="account-flow-brand">
        <div className="account-flow-brand-inner">
          <button className="account-flow-logo account-flow-logo-button" type="button" onClick={()=>router.replace("/login")} aria-label="Torna al login" title="Torna al login"><GlobeIcon size={50}/></button>
          <span className="account-flow-kicker">DOMAIN MANAGER</span>
          <h1>Il tuo workspace è pronto.</h1>
          <p>Completa l’account per entrare nel portafoglio domini della tua organizzazione con il ruolo assegnato.</p>
          {details?.valid ? <div className="invite-side-summary"><span><strong>{details.organization}</strong><small>Workspace</small></span><span><strong>{details.role}</strong><small>Ruolo assegnato</small></span></div> : null}
        </div>
      </section>

      <section className="account-flow-main">
        <button className="account-flow-back-button" type="button" onClick={()=>router.replace("/login")}><ChevronLeftIcon size={16}/> Torna al login</button>
        <div className="account-flow-card account-flow-card-wide">
          {loading ? <div className="account-flow-loading"><span/><h2>Verifica invito...</h2><p>Stiamo controllando validità e scadenza del link.</p></div> : !details?.valid ? (
            <div className="account-flow-success invalid">
              <span className="account-flow-success-icon warning">!</span>
              <span className="account-flow-eyebrow">INVITO NON DISPONIBILE</span>
              <h2>Non possiamo completare la registrazione</h2>
              <p>{details?.message || "Il link non è valido o è scaduto."}</p>
              <button className="account-flow-primary" type="button" onClick={()=>router.replace("/login")}>Vai al login</button>
            </div>
          ) : success ? (
            <div className="account-flow-success">
              <span className="account-flow-success-icon"><CheckIcon size={28}/></span>
              <span className="account-flow-eyebrow">ACCOUNT ATTIVATO</span>
              <h2>Benvenuto in Domain Manager</h2>
              <p>{message}</p>
              <div className="account-flow-info"><MailIcon size={18}/><span>Accedi con <strong>{details.email}</strong> e la password appena scelta.</span></div>
              <button className="account-flow-primary" type="button" onClick={()=>router.replace("/login")}>Accedi al workspace</button>
            </div>
          ) : (
            <>
              <div className="account-flow-stepbar"><span className="active">1</span><i className="active"/><span className="active">2</span><i/><span>3</span></div>
              <header className="account-flow-heading">
                <span className="account-flow-eyebrow">COMPLETA IL TUO ACCOUNT</span>
                <h2>Imposta le credenziali personali</h2>
                <p>L’invito è nominativo e scade {details.expiresAt ? new Date(details.expiresAt).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" }) : "automaticamente"}.</p>
              </header>
              <div className="invite-account-summary">
                <div><MailIcon size={18}/><span><small>Email</small><strong>{details.email}</strong></span></div>
                <div><ShieldIcon size={18}/><span><small>Ruolo</small><strong>{details.role}</strong></span></div>
                <div><ClockIcon size={18}/><span><small>Workspace</small><strong>{details.organization}</strong></span></div>
              </div>
              {details.personalMessage ? <blockquote className="invite-personal-message">“{details.personalMessage}”</blockquote> : null}
              <form className="account-flow-form" onSubmit={submit}>
                <label>Nome e cognome<div className="account-flow-input"><UserIcon size={20}/><input required minLength={2} value={name} onChange={(e)=>setName(e.target.value)} autoComplete="name"/></div></label>
                <label>Password<div className="account-flow-input"><LockIcon size={20}/><input required type={showPassword ? "text" : "password"} value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="new-password"/><button type="button" onClick={()=>setShowPassword((v)=>!v)} aria-label="Mostra password"><EyeIcon size={20}/></button></div></label>
                <div className="password-requirements">
                  <Requirement ok={checks.length} text="Almeno 10 caratteri"/><Requirement ok={checks.upper} text="Una lettera maiuscola"/><Requirement ok={checks.lower} text="Una lettera minuscola"/><Requirement ok={checks.number} text="Un numero"/><Requirement ok={checks.symbol} text="Un simbolo"/>
                </div>
                <label>Conferma password<div className="account-flow-input"><LockIcon size={20}/><input required type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} autoComplete="new-password"/></div></label>
                <label className="account-flow-consent"><input type="checkbox" checked={accepted} onChange={(e)=>setAccepted(e.target.checked)}/><span>Confermo di voler creare il mio account Domain Manager e accedere al workspace indicato.</span></label>
                {message ? <div className="account-flow-alert error">{message}</div> : null}
                <button className="account-flow-primary" type="submit" disabled={busy || !accepted}>{busy ? "Attivazione account..." : "Attiva account"}</button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function Requirement({ ok, text }: { ok: boolean; text: string }) {
  return <span className={ok ? "ok" : ""}><i>{ok ? "✓" : "•"}</i>{text}</span>;
}
