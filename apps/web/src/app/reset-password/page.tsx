"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, CheckIcon, ClockIcon, EyeIcon, GlobeIcon, LockIcon, MailIcon } from "@/components/icons";

type ResetValidation = { valid: boolean; email?: string; name?: string; expiresAt?: string; message?: string };

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [validation, setValidation] = useState<ResetValidation | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const checks = useMemo(() => ({ length: password.length >= 10, upper: /[A-Z]/.test(password), lower: /[a-z]/.test(password), number: /\d/.test(password), symbol: /[^A-Za-z0-9]/.test(password) }), [password]);
  const passwordValid = Object.values(checks).every(Boolean);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("token") ?? "";
    setToken(value);
    if (!value) { setValidation({ valid: false, message: "Link di recupero non valido." }); setLoading(false); return; }
    void fetch(`/api/auth/password-reset/validate?token=${encodeURIComponent(value)}`, { cache: "no-store" })
      .then(async (response) => await response.json() as ResetValidation)
      .then(setValidation)
      .catch(() => setValidation({ valid: false, message: "Servizio reset password non raggiungibile." }))
      .finally(()=>setLoading(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (!passwordValid) { setMessage("Completa tutti i requisiti della password."); return; }
    if (password !== confirmPassword) { setMessage("Le due password non coincidono."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/password-reset/complete", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({token,password}) });
      const payload = await response.json() as { reset?: boolean; message?: string };
      setMessage(payload.message || "Impossibile completare il reset.");
      setSuccess(Boolean(payload.reset));
    } catch { setMessage("Servizio reset password non raggiungibile."); }
    finally { setBusy(false); }
  }

  return <main className="account-flow-shell reset-flow-shell">
    <section className="account-flow-brand"><div className="account-flow-brand-inner"><button className="account-flow-logo account-flow-logo-button" type="button" onClick={()=>router.replace("/login")} aria-label="Torna al login" title="Torna al login"><GlobeIcon size={50}/></button><span className="account-flow-kicker">DOMAIN MANAGER</span><h1>Riprendi il controllo del tuo account.</h1><p>Scegli una nuova password robusta. Il link ricevuto via email è monouso e scade automaticamente.</p><div className="account-flow-points"><span><LockIcon size={18}/> Password mai inviata via email</span><span><ClockIcon size={18}/> Token a scadenza</span><span><MailIcon size={18}/> Recupero protetto</span></div></div></section>
    <section className="account-flow-main">
        <button className="account-flow-back-button" type="button" onClick={()=>router.replace("/login")}><ChevronLeftIcon size={16}/> Torna al login</button><div className="account-flow-card">
      {loading ? <div className="account-flow-loading"><span/><h2>Verifica link...</h2></div> : !validation?.valid ? <div className="account-flow-success invalid"><span className="account-flow-success-icon warning">!</span><span className="account-flow-eyebrow">LINK NON DISPONIBILE</span><h2>Richiedi un nuovo link</h2><p>{validation?.message || "Il link è scaduto o già utilizzato."}</p><button className="account-flow-primary" onClick={()=>router.replace("/forgot-password")}>Nuova richiesta</button><button className="account-flow-secondary" onClick={()=>router.replace("/login")}>Torna al login</button></div> : success ? <div className="account-flow-success"><span className="account-flow-success-icon"><CheckIcon size={28}/></span><span className="account-flow-eyebrow">PASSWORD AGGIORNATA</span><h2>Accesso ripristinato</h2><p>{message}</p><button className="account-flow-primary" onClick={()=>router.replace("/login")}>Accedi a Domain Manager</button></div> : <>
        <div className="account-flow-stepbar"><span className="active">1</span><i className="active"/><span className="active">2</span><i className="active"/><span className="active">3</span></div>
        <header className="account-flow-heading"><span className="account-flow-eyebrow">NUOVA PASSWORD</span><h2>Crea una nuova password</h2><p>{validation.name ? `Ciao ${validation.name}. ` : ""}Il link scade {validation.expiresAt ? new Date(validation.expiresAt).toLocaleString("it-IT", { dateStyle:"medium", timeStyle:"short" }) : "tra poco"}.</p></header>
        <div className="account-flow-account"><MailIcon size={18}/><span><small>Account</small><strong>{validation.email}</strong></span></div>
        <form className="account-flow-form" onSubmit={submit}>
          <label>Nuova password<div className="account-flow-input"><LockIcon size={20}/><input required type={showPassword?"text":"password"} value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="new-password"/><button type="button" onClick={()=>setShowPassword((v)=>!v)} aria-label="Mostra password"><EyeIcon size={20}/></button></div></label>
          <div className="password-requirements"><Requirement ok={checks.length} text="Almeno 10 caratteri"/><Requirement ok={checks.upper} text="Una lettera maiuscola"/><Requirement ok={checks.lower} text="Una lettera minuscola"/><Requirement ok={checks.number} text="Un numero"/><Requirement ok={checks.symbol} text="Un simbolo"/></div>
          <label>Conferma password<div className="account-flow-input"><LockIcon size={20}/><input required type={showPassword?"text":"password"} value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} autoComplete="new-password"/></div></label>
          {message ? <div className="account-flow-alert error">{message}</div> : null}
          <button className="account-flow-primary" type="submit" disabled={busy}>{busy?"Aggiornamento...":"Aggiorna password"}</button>
        </form>
      </>}
      <footer className="account-flow-footer"><button type="button" onClick={()=>router.replace("/login")}>← Torna al login</button><span>Domain Manager · Sicurezza account</span></footer>
    </div></section>
  </main>;
}

function Requirement({ ok, text }: { ok: boolean; text: string }) { return <span className={ok?"ok":""}><i>{ok?"✓":"•"}</i>{text}</span>; }
