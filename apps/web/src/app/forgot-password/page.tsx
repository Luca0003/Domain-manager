"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, CheckIcon, ClockIcon, GlobeIcon, LockIcon, MailIcon } from "@/components/icons";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const payload = await response.json() as { accepted?: boolean; queued?: boolean; message?: string };
      if (!response.ok || payload.accepted === false) {
        setDone(false);
        setMessage(payload.message || "Non è stato possibile elaborare la richiesta.");
        return;
      }
      if (!payload.queued) {
        setDone(false);
        setMessage(payload.message || "Il link non è stato messo in coda. Verifica l'email di recupero e Postfix.");
        return;
      }
      setDone(true);
      setMessage(payload.message || "Link di recupero messo in coda per la consegna.");
    } catch {
      setMessage("Servizio di recupero non raggiungibile.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="account-flow-shell">
      <section className="account-flow-brand">
        <div className="account-flow-brand-inner">
          <button className="account-flow-logo account-flow-logo-button" type="button" onClick={()=>router.replace("/login")} aria-label="Torna al login" title="Torna al login"><GlobeIcon size={50}/></button>
          <span className="account-flow-kicker">DOMAIN MANAGER</span>
          <h1>Recupera l’accesso in sicurezza.</h1>
          <p>Richiedi un link monouso. Non inviamo mai password via email e il link scade automaticamente dopo 30 minuti.</p>
          <div className="account-flow-points">
            <span><LockIcon size={18}/> Token monouso</span>
            <span><ClockIcon size={18}/> Validità 30 minuti</span>
            <span><MailIcon size={18}/> Consegna tramite Postfix</span>
          </div>
        </div>
      </section>

      <section className="account-flow-main">
        <button className="account-flow-back-button" type="button" onClick={()=>router.replace("/login")}><ChevronLeftIcon size={16}/> Torna al login</button>
        <div className="account-flow-card">
          <div className="account-flow-stepbar"><span className="active">1</span><i/><span>2</span><i/><span>3</span></div>
          {!done ? (
            <>
              <header className="account-flow-heading">
                <span className="account-flow-eyebrow">RECUPERO PASSWORD</span>
                <h2>Trova il tuo account</h2>
                <p>Inserisci l’email di accesso oppure la tua email personale di recupero configurata nell’account.</p>
              </header>
              <form className="account-flow-form" onSubmit={submit}>
                <label>Email account o recupero
                  <div className="account-flow-input"><MailIcon size={20}/><input type="email" required autoFocus value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="nome@azienda.it o tuaemail@gmail.com" autoComplete="email"/></div>
                </label>
                {message ? <div className="account-flow-alert error">{message}</div> : null}
                <button className="account-flow-primary" type="submit" disabled={busy}>{busy ? "Invio richiesta..." : "Invia link di recupero"}</button>
              </form>
            </>
          ) : (
            <div className="account-flow-success">
              <span className="account-flow-success-icon"><CheckIcon size={28}/></span>
              <span className="account-flow-eyebrow">RICHIESTA RICEVUTA</span>
              <h2>Controlla la tua email</h2>
              <p>{message}</p>
              <div className="account-flow-info"><ClockIcon size={18}/><span>Il link è valido per 30 minuti e può essere usato una sola volta.</span></div>
              <button className="account-flow-primary" type="button" onClick={()=>router.replace("/login")}>Torna al login</button>
              <button className="account-flow-secondary" type="button" onClick={()=>{setDone(false);setMessage(null);}}>Invia una nuova richiesta</button>
            </div>
          )}
          <footer className="account-flow-footer"><button type="button" onClick={()=>router.replace("/login")}>← Torna al login</button><span>Domain Manager · Accesso protetto</span></footer>
        </div>
      </section>
    </main>
  );
}
