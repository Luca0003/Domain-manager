## UI v26

Sidebar semplificata: brand cliccabile per logout/login, workspace card rimossa e indicatore blu laterale ripristinato su hover e voce attiva.

# Domain Manager

> v25: navigazione di uscita sempre disponibile e sidebar footer sempre visibile. — Docker-first portfolio build

Domain Manager is a modular-monolith SaaS demo built with Next.js, NestJS,
PostgreSQL, Redis/BullMQ and Docker Compose. The local stack runs entirely in
containers.

## Services

```text
Browser
  |
  +--> localhost:3000 --> web (Next.js)
  |
  +--> localhost:3001 --> api (NestJS)
                           |
                           +--> postgres:5432
                           +--> redis:6379
                           +--> postfix:25

worker ------------------> redis:6379
migrate -----------------> postgres:5432
postfix -----------------> Internet SMTP destinations (when the host/network allows it)
```

Only ports `3000` and `3001` are published to the host. PostgreSQL, Redis and
Postfix are reachable only inside the Docker network.

## Start

```bash
cp .env.example .env
docker compose up --build -d
docker compose ps
```

Open:

- Login: `http://localhost:3000/login`
- Dashboard: `http://localhost:3000/dashboard`
- API health: `http://localhost:3001/health`
- Swagger: `http://localhost:3001/docs`

Demo credentials:

```text
Email: admin@domainmanager.local
Password: Admin123!
```

## Email with local Postfix

This version no longer requires Resend or an external email API account.
Domain Manager submits mail to the internal Docker service `postfix:25`.

In the UI open:

```text
Impostazioni -> Email
```

Then:

1. Verify that **POSTFIX ATTIVO** is shown.
2. Set **Nome mittente**.
3. Set **Email mittente**.
4. Choose **Salva mittente**.
5. Enter a recipient and choose **Invia email test**.

When the UI says that the message was accepted by Postfix, it means the
application-to-mail-server part is working. Final Internet delivery is a
separate step and depends on the machine where Postfix runs.

For reliable delivery to Gmail/Outlook, see:

```text
docs/postfix-production.md
```

## Useful email diagnostics

Postfix container status:

```bash
docker compose ps postfix
```

Follow Postfix logs:

```bash
docker compose logs -f postfix
```

Show the Postfix queue:

```bash
docker compose exec postfix postqueue -p
```

Retry queued mail:

```bash
docker compose exec postfix postqueue -f
```

Show effective Postfix configuration:

```bash
docker compose exec postfix postconf -n
```

## Rebuild after this version

Because the project adds a new Postfix image and a Nodemailer dependency in the
API, rebuild `postfix`, `api` and `web`:

```bash
docker compose down
docker compose build postfix api web --progress=plain
docker compose up -d
docker compose ps
```

Do not use `docker compose down -v` unless you intentionally want to delete
persistent application data.

## UI demo scope

The current portfolio UI includes:

- dashboard and portfolio KPIs;
- domain CRUD demo, filters, CSV import/export;
- expiry views;
- renewal workflow;
- notifications and Postfix email tests;
- assignments;
- users, invitations and roles;
- reports and costs;
- audit log;
- organization/security/integration settings.

Most domain/business data is still demo data persisted in browser localStorage.
The next production milestone is to move authentication, users, organizations,
domains and workflows to NestJS/Prisma/PostgreSQL.

## Password dimenticata (v18)

Il recupero password non è più simulato: usa un token monouso di 30 minuti e invia il link tramite Postfix. La nuova password viene salvata con scrypt nel volume persistente dell'applicazione. Vedi `docs/password-reset.md`.

## v19 — Web type-check fix

Corretto il ritorno opzionale dell'email di recupero con `exactOptionalPropertyTypes` attivo. I file `*.tsbuildinfo` non vengono più inclusi nel contesto Docker, evitando cache TypeScript incrementali obsolete durante le build.

## UI refinements v20

- Email HTML brandizzate Domain Manager per inviti, reset password, test e notifiche, con fallback text/plain.
- Invito utente migliorato: nome opzionale, ruolo con descrizione, scadenza 7/14/30 giorni, messaggio personale e anteprima.
- Gli inviti demo mostrano la data di scadenza; il reinvio estende la validità di 14 giorni.
- Sidebar rifinita: workspace/organizzazione separato dalla navigazione e collegamento diretto alle impostazioni organizzazione.

## v23 — Onboarding utenti e recupero account

Questa versione completa due flussi prima solo parziali:

- **Inviti reali:** l'email contiene un token monouso e apre `/accept-invite`, dove l'utente completa nome e password e diventa autenticabile.
- **Password dimenticata:** la login apre una pagina dedicata `/forgot-password`; il link ricevuto via Postfix viene validato prima di consentire il cambio password.
- Gli inviti scadono dopo 7/14/30 giorni; i reset password dopo 30 minuti.
- Token invito/reset memorizzati solo come hash.
- Password demo memorizzate tramite `scrypt`, mai in chiaro.

Documentazione: `docs/account-onboarding.md`.

## v23 - Password reset e template email

- il recupero password accetta sia l'email di login sia l'email personale di recupero configurata;
- la pagina Password dimenticata mostra successo solo quando Postfix ha realmente preso in carico il messaggio;
- template email riordinato con CTA nel punto corretto;
- rimosso dall'HTML il blocco con URL grezzo sotto al pulsante.


## v23 — Email layout refinement

Template email transazionali riordinato: gerarchia più chiara, dettagli in card, CTA centrale e footer minimale.

## v24 — Email color system

The transactional email template now uses a consistent Domain Manager color system:

- navy (`#071b33`) for the product header and brand identity;
- blue (`#2563eb`) for workspace invitations and primary account onboarding actions;
- violet (`#7c3aed`) for password-reset and account-security actions;
- emerald (`#059669`) for email/configuration tests;
- amber security callouts for warnings that should be noticed without looking like an error.

Detail panels, badges, CTA buttons and administrator notes inherit the contextual accent while the body remains neutral and highly readable. Raw action URLs are not rendered in the HTML email body.

## v30 — Sidebar hover rail fix

Corretto il cursore blu laterale della sidebar: nella v29 era presente ma veniva tagliato da `overflow-x: hidden` perché posizionato fuori dal contenitore. Ora il rail è visibile, animato e segue la voce puntata; quando il puntatore lascia la navigazione torna l'indicatore della sezione attiva.

## UI v32 — ordine pagine interne

Le pagine interne sono state rese più robuste: tabelle con larghezze minime e scroll controllato, toolbar responsive, wrapping dei testi lunghi dentro card e modali, impostazioni e report senza overflow.


## v32 layout pass
Le pagine interne usano ora un reflow strutturale visibile: toolbar/card dedicate, KPI più ampi, tabelle con colonne minime esplicite, settings e modali con spaziature maggiori, e contenimento dei testi lunghi.

## v33 · Dashboard overview reflow

The main Dashboard now uses a dedicated layout independent from internal-page reflow rules. KPI cards, charts, priority-domain table and recent activity keep stable minimum sizes; on short desktop screens only the central dashboard content scrolls instead of squeezing cards until text becomes unreadable.

## v35 - Login alignment
- Pannello login riequilibrato 43/57 su desktop.
- Brand sinistro centrato realmente nel proprio pannello.
- Card e copyright raccolti in un unico stack centrato.
- Correzioni specifiche per monitor bassi e mobile.

## v36 - Login viewport fix
- Login no longer clips the lower card on short screens.
- Desktop login is centered when space permits and scrolls naturally when content exceeds the viewport.
- Compact rules reduce vertical density on laptop-height displays without changing functionality.

## UI v37 — Futuristic login
La pagina `/login` è stata ridisegnata come layout SaaS futuristico a tre zone (rail, hero portfolio, form), mantenendo invariati autenticazione, recupero password e sessione demo.

### UI v38 — login single viewport
La login futuristica è stata ricalibrata per desktop come composizione a viewport singola (`100dvh`) senza scroll verticale. Rail, hero e card mantengono proporzioni coerenti con il concept scelto; su schermi bassi il contenuto viene scalato in modo uniforme anziché compresso o tagliato.


## v39 — Login fidelity pass
Login riallineata al riferimento futuristico scelto: titolo su tre righe, rail e footer, curva luminosa, mini dashboard con stati, badge TLD, decorazione tecnica della card e proporzioni single-viewport.

## UI v40 — Login pixel-oriented reference
La Login desktop usa l'artwork approvato come composizione visiva di riferimento e mantiene sovrapposti controlli reali e accessibili per email, password, ricordami, recupero password, accesso e Google/SSO. Il layout desktop è a viewport singola senza scroll; su mobile viene usato un form responsive nativo.

## Login v43 — implementazione reale

La schermata di accesso futuristica è ora costruita interamente con React/HTML/CSS/SVG. Non utilizza immagini di riferimento o mockup come sfondo. Il form resta collegato a `POST /api/auth/login` e conserva i flussi di recupero password e SSO demo già presenti.


## v45 Login fidelity

La login desktop è costruita interamente in React/HTML/CSS/SVG su una canvas 1648x928 scalata uniformemente alla viewport. Non usa immagini di copertina.


## Login v45 — full bleed

La schermata Login mantiene la canvas 1648×928 proporzionata, ma il fondale ora continua fino ai bordi della viewport. In questo modo non compaiono bande bianche quando il rapporto dello schermo non coincide esattamente con quello del riferimento.


## Login v50 — true fullscreen

La composizione desktop della Login riempie ora esattamente la viewport (`100vw × 100dvh`) tramite scaling indipendente sugli assi X/Y della canvas codificata 1648×928. In questo modo non restano bande o bordi esterni, non viene ritagliato il footer e tutti i controlli restano reali e interattivi. Il layout mobile sotto 901 px continua a usare il flusso responsive dedicato.

## Login v52 — rifinitura spaziature

La Login desktop mantiene il dimensionamento bilanciato della v50, ma corregge le sovrapposizioni osservate su viewport 16:9: area footer della rail riservata, testo hero con righe più corte, pannello "Panoramica" con grafico confinato nella propria colonna e riga TLD separata dal logo centrale. Nessuna immagine di copertina viene usata per costruire la Login.


### Login v52
Micro-rifinitura della login fullscreen: il blocco sicurezza sotto la card e il copyright sono centrati sullo stesso asse della card, senza modificare dimensioni o proporzioni della v51.
