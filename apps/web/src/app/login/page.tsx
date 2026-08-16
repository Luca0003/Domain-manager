"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { useRouter } from "next/navigation";

type AuthPayload = {
  authenticated?: boolean;
  message?: string;
  user?: {
    email: string;
    name?: string;
    role: string;
    organization: string;
  };
};

async function readAuthPayload(response: Response): Promise<AuthPayload> {
  const raw = await response.text();
  if (!raw) return {};
  try {
    return JSON.parse(raw) as AuthPayload;
  } catch {
    return { message: "Risposta del servizio di autenticazione non valida." };
  }
}

function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 72 72" aria-hidden="true">
      <defs>
        <linearGradient id="dmHex" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d5e3ff" />
        </linearGradient>
        <linearGradient id="dmCube" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#38a7ff" />
          <stop offset=".55" stopColor="#126bff" />
          <stop offset="1" stopColor="#1739b8" />
        </linearGradient>
      </defs>
      <path d="M36 3 64 19v34L36 69 8 53V19Z" fill="url(#dmHex)" />
      <path d="M36 12 56 23.5v25L36 60 16 48.5v-25Z" fill="#071c58" />
      <path d="m36 20 14 8v16l-14 8-14-8V28Z" fill="url(#dmCube)" />
      <path d="m36 20 14 8-14 8-14-8Z" fill="#54b8ff" opacity=".72" />
      <path d="m36 36 14-8v16l-14 8Z" fill="#1649da" />
    </svg>
  );
}

function ShieldGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8 19 5.6v5.8c0 4.6-3 8-7 9.8-4-1.8-7-5.2-7-9.8V5.6Z" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="m9 12 2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
  );
}

function MailGlyph() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}

function LockGlyph() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}

function EyeGlyph() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.8 12s3.4-5 9.2-5 9.2 5 9.2 5-3.4 5-9.2 5-9.2-5-9.2-5Z" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.8"/></svg>;
}

function RailIcon({ kind }: { kind: "login" | "globe" | "shield" | "chart" | "settings" }) {
  if (kind === "login") return <svg viewBox="0 0 24 24"><path d="M10 7H5v10h5M13 8l4 4-4 4M17 12H8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (kind === "globe") return <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="M3 12h18M12 3c2.5 2.4 3.8 5.4 3.8 9S14.5 18.6 12 21M12 3c-2.5 2.4-3.8 5.4-3.8 9S9.5 18.6 12 21" fill="none" stroke="currentColor" strokeWidth="1.4"/></svg>;
  if (kind === "shield") return <ShieldGlyph />;
  if (kind === "chart") return <svg viewBox="0 0 24 24"><path d="M4 20V5M4 20h16M7 16l4-5 3 2 5-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  return <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [viewport, setViewport] = useState({
    scale: 1,
    logicalWidth: 1648,
    logicalHeight: 928,
    extraX: 0,
    extraY: 0,
    offsetY: 0,
    copyShiftX: 0,
    sceneShiftX: 0,
  });
  const [ready, setReady] = useState(false);

  const canSubmit = useMemo(() => email.trim().length > 0 && password.length > 0 && !submitting, [email, password, submitting]);

  useEffect(() => {
    router.prefetch("/dashboard");
    const updateScale = () => {
      const width = document.documentElement.clientWidth || window.innerWidth;
      const height = document.documentElement.clientHeight || window.innerHeight;

      // v49: render directly at the real viewport size. Do not zoom or transform
      // the whole interface: responsive CSS grows the individual regions while
      // text/SVG stay at their native browser resolution.
      setViewport({
        scale: 1,
        logicalWidth: width,
        logicalHeight: height,
        extraX: Math.max(0, width - 1648),
        extraY: Math.max(0, height - 928),
        offsetY: 0,
        copyShiftX: 0,
        sceneShiftX: 0,
      });
      setReady(true);
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    const remembered = window.localStorage.getItem("domain-manager.remembered-email");
    if (remembered) {
      setEmail(remembered);
      setRemember(true);
    }
    return () => window.removeEventListener("resize", updateScale);
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setMessage(null);
    const normalizedEmail = email.trim().toLowerCase();
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
        cache: "no-store",
        signal: controller.signal,
      });
      const payload = await readAuthPayload(response);
      if (!response.ok || !payload.authenticated || !payload.user) {
        setMessage(payload.message || "Credenziali non valide.");
        return;
      }
      if (remember) window.localStorage.setItem("domain-manager.remembered-email", normalizedEmail);
      else window.localStorage.removeItem("domain-manager.remembered-email");
      window.localStorage.setItem("domain-manager.demo.session", JSON.stringify({
        email: payload.user.email,
        name: payload.user.name || payload.user.email.split("@")[0] || "Utente",
        role: payload.user.role,
        organization: payload.user.organization,
        createdAt: new Date().toISOString(),
      }));
      router.replace("/dashboard");
    } catch (error) {
      setMessage(error instanceof DOMException && error.name === "AbortError"
        ? "Il servizio di autenticazione non risponde. Riprova tra qualche secondo."
        : "Servizio di autenticazione non raggiungibile.");
    } finally {
      window.clearTimeout(timeoutId);
      setSubmitting(false);
    }
  }

  return (
    <main className="exact-login-shell">
      <h1 className="sr-only">Accedi a Domain Manager</h1>
      <div
        className="exact-login-stage"
        style={{
          width: `${viewport.logicalWidth}px`,
          height: `${viewport.logicalHeight}px`,
          "--stage-zoom": `${viewport.scale}`,
          "--extra-x": `${viewport.extraX}px`,
          "--extra-y": `${viewport.extraY}px`,
          "--offset-y": `${viewport.offsetY}px`,
          "--copy-shift-x": `${viewport.copyShiftX}px`,
          "--scene-shift-x": `${viewport.sceneShiftX}px`,
          opacity: ready ? 1 : 0,
        } as CSSProperties}
      >
        <svg
          className="exact-login-light-field"
          viewBox="0 0 1648 928"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <radialGradient id="exactLoginLightSurface" cx="78%" cy="42%" r="72%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="47%" stopColor="#f9fbff" />
              <stop offset="78%" stopColor="#f2f6fd" />
              <stop offset="100%" stopColor="#edf3fc" />
            </radialGradient>
          </defs>
          <path
            className="exact-login-light-fill"
            d="M 995 -40 C 895 45 855 180 840 340 C 825 500 770 540 710 625 C 650 710 600 835 560 980 L 1725 980 L 1725 -40 Z"
          />
          <path
            className="exact-login-light-edge-glow"
            d="M 995 -40 C 895 45 855 180 840 340 C 825 500 770 540 710 625 C 650 710 600 835 560 980"
            vectorEffect="non-scaling-stroke"
          />
          <path
            className="exact-login-light-edge"
            d="M 995 -40 C 895 45 855 180 840 340 C 825 500 770 540 710 625 C 650 710 600 835 560 980"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <aside className="exact-login-rail">
          <div className="exact-login-rail-brand">
            <BrandMark className="exact-login-mark exact-login-mark-rail" />
            <strong>Domain<br />Manager</strong>
          </div>
          <nav className="exact-login-rail-nav" aria-label="Anteprima piattaforma">
            <button className="active" type="button" onClick={() => document.getElementById("login-email")?.focus()}><RailIcon kind="login"/><span>Accesso</span></button>
            <button type="button"><RailIcon kind="globe"/><span>Domini</span></button>
            <button type="button"><RailIcon kind="shield"/><span>Sicurezza</span></button>
            <button type="button"><RailIcon kind="chart"/><span>Insight</span></button>
            <button type="button"><RailIcon kind="settings"/><span>Impostazioni</span></button>
          </nav>
          <div className="exact-login-rail-footer">
            <span className="exact-login-rail-footer-icon"><ShieldGlyph /></span>
            <div><strong>Sicuro. Affidabile.</strong><span>Infrastruttura enterprise<br/>e massima protezione.</span></div>
          </div>
        </aside>

        <section className="exact-login-hero">
          <div className="exact-login-hero-dots" aria-hidden="true" />
          <div className="exact-login-copy">
            <div className="exact-login-eyebrow"><span><ShieldGlyph /></span> PIATTAFORMA ALL-IN-ONE</div>
            <h2>Gestisci il tuo<br/>portfolio<br/><em>domini</em></h2>
            <p>La piattaforma completa per registrare,<br/>gestire e proteggere i tuoi domini.<br/>Tutto sotto controllo, ovunque tu sia.</p>
          </div>

          <div className="exact-login-scene" aria-hidden="true">
            <span className="exact-login-orbit orbit-a"/><span className="exact-login-orbit orbit-b"/><span className="exact-login-orbit orbit-c"/>
            <span className="exact-login-glow-floor"/>
            <div className="exact-login-console">
              <div className="exact-login-console-left">
                <div className="exact-login-console-title">I tuoi domini</div>
                {["mioazienda.com", "brand.it", "progetto.net"].map((domain) => <div className="exact-login-domain-row" key={domain}><span className="dot"/><div><strong>{domain}</strong><small>Attivo</small></div><b>›</b></div>)}
              </div>
              <div className="exact-login-console-right">
                <div className="exact-login-console-title">Panoramica</div>
                <span className="exact-login-console-muted">Domini attivi</span>
                <div className="exact-login-console-count">24 <small>+12%</small></div>
                <span className="exact-login-console-note">4 mese scorso</span>
                <svg className="exact-login-chart" viewBox="0 0 180 80"><defs><linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1d77ff" stopOpacity=".68"/><stop offset="1" stopColor="#1d77ff" stopOpacity="0"/></linearGradient></defs><path d="M2 66 24 53 44 58 64 45 84 50 103 33 123 39 143 17 162 24 178 16 178 80 2 80Z" fill="url(#chartArea)"/><path d="M2 66 24 53 44 58 64 45 84 50 103 33 123 39 143 17 162 24 178 16" fill="none" stroke="#2d8cff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
            <div className="exact-login-core"><BrandMark className="exact-login-mark exact-login-mark-core"/></div>
            <div className="exact-login-pill pill-com">.Com</div>
            <div className="exact-login-pill pill-it">.it</div>
            <div className="exact-login-pill pill-net">.net</div>
          </div>
        </section>

        <section className="exact-login-auth-zone">
          <div className="exact-login-auth-ring" aria-hidden="true" />
          <form className="exact-login-card" onSubmit={submit} noValidate>
            <span className="exact-login-tech-corner" aria-hidden="true" />
            <div className="exact-login-card-shield"><ShieldGlyph /></div>
            <div className="exact-login-card-heading"><h2>Bentornato</h2><p>Accedi al tuo account Domain Manager</p></div>

            <label className="exact-login-field"><span>Email</span><div><i><MailGlyph/></i><input id="login-email" name="email" type="email" autoComplete="email" placeholder="Inserisci la tua email" value={email} onChange={(e)=>{setEmail(e.target.value);setMessage(null);}} required/></div></label>
            <label className="exact-login-field"><span>Password</span><div><i><LockGlyph/></i><input id="login-password" name="password" type={showPassword?"text":"password"} autoComplete="current-password" placeholder="Inserisci la tua password" value={password} onChange={(e)=>{setPassword(e.target.value);setMessage(null);}} required/><button type="button" className="exact-login-eye" onClick={()=>setShowPassword((v)=>!v)} aria-label={showPassword?"Nascondi password":"Mostra password"}><EyeGlyph/></button></div></label>

            <div className="exact-login-options"><label><input type="checkbox" checked={remember} onChange={(e)=>setRemember(e.target.checked)}/><span>Ricordami</span></label><button type="button" onClick={()=>router.push("/forgot-password")}>Password dimenticata?</button></div>
            {message ? <div className="exact-login-error" role="alert">{message}</div> : null}
            <button className="exact-login-submit" type="submit" disabled={!canSubmit}><span>↪</span>{submitting?"Accesso in corso...":"Accedi"}</button>
            <div className="exact-login-divider"><span>oppure</span></div>
            <button className="exact-login-google" type="button" onClick={()=>setMessage("SSO Google non configurato in questa demo.")}><b>G</b><span>Continua con Google</span></button>
          </form>
          <div className="exact-login-trust"><span><ShieldGlyph/></span><div><strong>Sicurezza, controllo e visione d’insieme.</strong><p>Tutto il tuo portfolio di domini, in un unico posto.</p></div></div>
          <p className="exact-login-copyright">© 2026 Domain Manager. Tutti i diritti riservati.</p>
        </section>
      </div>
    </main>
  );
}
