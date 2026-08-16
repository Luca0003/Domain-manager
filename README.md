# Domain Manager

**Domain Manager** è una piattaforma SaaS per la gestione centralizzata di portfolio di domini.

Il progetto nasce per aiutare aziende, sviluppatori, agenzie e team IT a tenere sotto controllo domini, scadenze, rinnovi, costi, utenti e notifiche all'interno di un'unica applicazione.

Quando il numero di domini cresce, la loro gestione può diventare rapidamente complessa. Le informazioni possono essere distribuite tra registrar differenti, fogli Excel, email, documenti e strumenti separati.

Domain Manager centralizza queste informazioni e fornisce una dashboard unica dalla quale controllare lo stato dell'intero portfolio.

---

# Il problema

Gestire pochi domini manualmente è relativamente semplice.

Quando però un'organizzazione possiede decine o centinaia di domini iniziano a comparire diversi problemi:

* domini distribuiti tra più registrar;
* date di scadenza difficili da controllare;
* rischio di dimenticare un rinnovo;
* mancanza di una vista centralizzata;
* costi annuali difficili da monitorare;
* difficoltà nell'individuare il responsabile di un dominio;
* informazioni distribuite tra email e fogli di calcolo;
* notifiche gestite manualmente;
* difficoltà nel ricostruire chi ha effettuato una modifica;
* gestione poco strutturata di utenti e permessi;
* assenza di un workflow dedicato ai rinnovi.

Un dominio dimenticato o gestito male può diventare un problema operativo importante.

Domain Manager nasce per rendere questo processo più organizzato e controllabile.

---

# La soluzione

Domain Manager raccoglie le principali attività legate alla gestione dei domini all'interno di una singola applicazione.

La piattaforma permette di:

* aggiungere e modificare domini;
* organizzare un portfolio di domini;
* monitorare le date di scadenza;
* individuare i domini che richiedono attenzione;
* gestire i rinnovi;
* monitorare i costi;
* assegnare domini e attività agli utenti;
* gestire utenti e ruoli;
* invitare nuovi membri;
* importare dati tramite CSV;
* esportare dati tramite CSV;
* inviare notifiche email;
* consultare report;
* visualizzare un audit log;
* gestire impostazioni dell'organizzazione;
* gestire configurazioni di sicurezza;
* gestire integrazioni.

L'obiettivo è trasformare la gestione dei domini da una serie di attività sparse e manuali in un workflow centralizzato.

---

# Come funziona

Domain Manager è composto da più servizi che lavorano insieme.

```text
                           ┌───────────────────────┐
                           │        Browser        │
                           └───────────┬───────────┘
                                       │
                         http://localhost:3000
                                       │
                                       ▼
                           ┌───────────────────────┐
                           │    Web / Next.js      │
                           └───────────┬───────────┘
                                       │
                                       │ API
                                       ▼
                           ┌───────────────────────┐
                           │    API / NestJS       │
                           │    localhost:3001     │
                           └─────┬─────┬─────┬─────┘
                                 │     │     │
                   ┌─────────────┘     │     └─────────────┐
                   ▼                   ▼                   ▼
          ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
          │   PostgreSQL   │  │     Redis      │  │    Postfix     │
          │      5432      │  │      6379      │  │       25       │
          └────────────────┘  └───────┬────────┘  └───────┬────────┘
                                      │                   │
                                      ▼                   ▼
                              ┌──────────────┐       Internet / SMTP
                              │    Worker    │
                              │   BullMQ     │
                              └──────────────┘
```

## Frontend — Next.js

Il frontend rappresenta l'interfaccia utilizzata dall'utente.

È accessibile tramite:

```text
http://localhost:3000
```

Da qui l'utente può utilizzare:

* login;
* dashboard;
* gestione domini;
* rinnovi;
* utenti;
* assegnazioni;
* notifiche;
* report;
* audit log;
* impostazioni.

---

## Backend — NestJS

Il backend espone le API utilizzate dall'applicazione.

È disponibile sulla porta:

```text
http://localhost:3001
```

Il backend comunica con gli altri servizi dell'infrastruttura:

```text
NestJS
   │
   ├── PostgreSQL
   ├── Redis
   └── Postfix
```

---

## PostgreSQL

PostgreSQL rappresenta il database relazionale previsto dall'architettura.

Viene eseguito all'interno della rete Docker e non viene pubblicato direttamente sulla macchina host.

Porta interna:

```text
5432
```

---

## Redis e BullMQ

Redis viene utilizzato per supportare code e processi asincroni attraverso BullMQ.

Porta interna:

```text
6379
```

Il worker può quindi elaborare attività che non devono necessariamente essere eseguite direttamente durante una richiesta HTTP.

---

## Worker

Il worker è separato dal processo principale dell'API e comunica con Redis.

```text
API
 │
 ▼
Redis / BullMQ
 │
 ▼
Worker
```

Questo permette di mantenere separata la gestione delle richieste HTTP dall'elaborazione asincrona.

---

## Postfix

Domain Manager utilizza un server Postfix interno per la gestione delle email.

L'applicazione invia i messaggi al servizio:

```text
postfix:25
```

Questo significa che per l'ambiente locale non è necessario utilizzare direttamente servizi email esterni.

Postfix può essere utilizzato per:

* email di test;
* notifiche;
* inviti utenti;
* recupero password;
* comunicazioni transazionali.

---

# Funzionalità principali

## Dashboard

La dashboard permette di ottenere una panoramica immediata del portfolio.

Può mostrare:

* KPI;
* numero di domini;
* domini prioritari;
* scadenze;
* rinnovi;
* costi;
* attività recenti.

Lo scopo è permettere all'utente di capire velocemente quali elementi richiedono attenzione.

---

# Gestione domini

Domain Manager permette di organizzare i domini all'interno dell'applicazione.

Le funzionalità comprendono:

* creazione;
* modifica;
* eliminazione;
* ricerca;
* filtri;
* importazione CSV;
* esportazione CSV;
* visualizzazione delle scadenze;
* gestione rinnovi.

---

# Scadenze e rinnovi

Uno degli obiettivi principali del progetto è rendere più semplice individuare i domini prossimi alla scadenza.

Il sistema mette a disposizione viste dedicate alle scadenze e un workflow per i rinnovi.

In questo modo è possibile distinguere i domini che richiedono attenzione dal resto del portfolio.

---

# Costi e report

Domain Manager include strumenti dedicati al monitoraggio economico del portfolio.

L'applicazione prevede:

* costi dei domini;
* report;
* riepiloghi;
* visualizzazione delle informazioni economiche.

---

# Utenti e ruoli

Domain Manager supporta la gestione di più utenti.

È possibile gestire:

* utenti;
* inviti;
* ruoli;
* assegnazioni.

Questo permette di simulare un ambiente nel quale più persone collaborano alla gestione dello stesso portfolio.

---

# Inviti utenti

Gli utenti possono essere invitati tramite email.

Il flusso prevede:

```text
Amministratore
      │
      ▼
Crea invito
      │
      ▼
Generazione token
      │
      ▼
Email tramite Postfix
      │
      ▼
Utente riceve il link
      │
      ▼
/accept-invite
      │
      ▼
Impostazione nome e password
      │
      ▼
Account attivato
```

Gli inviti possono avere una validità di:

* 7 giorni;
* 14 giorni;
* 30 giorni.

I token utilizzati per gli inviti vengono memorizzati sotto forma di hash.

---

# Recupero password

Domain Manager include un flusso di recupero password.

Dalla pagina di login l'utente può accedere a:

```text
/forgot-password
```

Il funzionamento è:

```text
Richiesta reset password
        │
        ▼
Generazione token monouso
        │
        ▼
Invio email tramite Postfix
        │
        ▼
Utente apre il link
        │
        ▼
Validazione token
        │
        ▼
Inserimento nuova password
        │
        ▼
Password aggiornata
```

Il token di reset ha una durata di:

```text
30 minuti
```

Le password demo vengono salvate utilizzando `scrypt` e non vengono memorizzate in chiaro.

---

# Audit Log

L'applicazione include una sezione dedicata alle attività.

L'obiettivo dell'audit log è permettere di avere una cronologia delle operazioni effettuate all'interno del sistema.

---

# Email

Le email transazionali sono gestite tramite Postfix.

Le tipologie comprendono:

* inviti;
* reset password;
* notifiche;
* test configurazione email.

I template prevedono una versione HTML e un fallback testuale.

---

# Architettura Docker

Domain Manager è stato progettato con un approccio **Docker-first**.

Lo stack locale viene eseguito interamente attraverso Docker Compose.

I principali container sono:

```text
web
api
postgres
redis
worker
migrate
postfix
```

Solo due porte vengono pubblicate verso la macchina host:

| Servizio |  Porta |
| -------- | -----: |
| Web      | `3000` |
| API      | `3001` |

PostgreSQL, Redis e Postfix rimangono invece all'interno della rete Docker.

---

# Installazione su Ubuntu

Questa sezione spiega come installare Domain Manager partendo da una macchina Ubuntu.

## Requisiti

Sono necessari:

* Ubuntu;
* connessione Internet;
* Git;
* Docker Engine;
* Docker Compose Plugin.

Per l'esecuzione standard del progetto non è necessario installare manualmente PostgreSQL, Redis o Postfix sulla macchina: vengono eseguiti nei rispettivi container Docker.

---

# 1. Aggiornare Ubuntu

Aprire il terminale:

```bash
sudo apt update
sudo apt upgrade -y
```

---

# 2. Installare Git

```bash
sudo apt install -y git
```

Verificare:

```bash
git --version
```

---

# 3. Installare Docker Engine

Per Ubuntu è consigliato utilizzare il repository APT ufficiale di Docker.

Prima installare i pacchetti necessari:

```bash
sudo apt update
sudo apt install -y ca-certificates curl
```

Creare la directory delle chiavi:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
```

Scaricare la chiave ufficiale Docker:

```bash
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
```

Impostare i permessi:

```bash
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

Aggiungere il repository Docker:

```bash
sudo tee /etc/apt/sources.list.d/docker.sources > /dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
```

Aggiornare APT:

```bash
sudo apt update
```

Installare Docker Engine e Docker Compose:

```bash
sudo apt install -y \
  docker-ce \
  docker-ce-cli \
  containerd.io \
  docker-buildx-plugin \
  docker-compose-plugin
```

---

# 4. Verificare Docker

Controllare il servizio:

```bash
sudo systemctl status docker
```

Se Docker non fosse attivo:

```bash
sudo systemctl start docker
```

Testare l'installazione:

```bash
sudo docker run hello-world
```

Docker indica `hello-world` come test standard per verificare che Engine sia installato e funzionante.

---

# 5. Utilizzare Docker senza sudo

Questo passaggio è facoltativo ma rende più comodo lavorare con Docker.

Aggiungere il proprio utente al gruppo `docker`:

```bash
sudo usermod -aG docker $USER
```

Applicare la nuova appartenenza al gruppo:

```bash
newgrp docker
```

Verificare:

```bash
docker run hello-world
```

> Il gruppo `docker` concede privilegi elevati sul sistema; questa configurazione va quindi utilizzata consapevolmente.

---

# 6. Clonare Domain Manager

Spostarsi nella directory nella quale si vuole installare il progetto.

Ad esempio:

```bash
cd ~
```

Clonare il repository:

```bash
git clone git@github.com:Luca0003/Domain-manager.git
```

Entrare nella cartella:

```bash
cd Domain-manager
```

In alternativa, tramite HTTPS:

```bash
git clone https://github.com/Luca0003/Domain-manager.git
cd Domain-manager
```

---

# 7. Configurare le variabili d'ambiente

Il progetto contiene un file di esempio:

```text
.env.example
```

Creare il file `.env`:

```bash
cp .env.example .env
```

Il file `.env` contiene la configurazione utilizzata dai servizi Docker.

Prima di utilizzare il progetto in un ambiente reale è consigliato controllare e personalizzare le variabili presenti.

> Non pubblicare password, token o altri segreti nel repository Git.

---

# 8. Avviare Domain Manager

Dalla root del repository:

```bash
docker compose up --build -d
```

Il comando:

* costruisce le immagini;
* crea i container;
* crea la rete Docker;
* avvia i servizi;
* lascia i container in esecuzione in background.

Controllare lo stato:

```bash
docker compose ps
```

Dovrebbero essere visibili i servizi principali del progetto.

---

# 9. Aprire Domain Manager

Una volta terminato l'avvio, aprire il browser.

## Login

```text
http://localhost:3000/login
```

## Dashboard

```text
http://localhost:3000/dashboard
```

## API Health

```text
http://localhost:3001/health
```

## Swagger / API Documentation

```text
http://localhost:3001/docs
```

---

# Credenziali demo

Per accedere all'ambiente demo:

```text
Email: admin@domainmanager.local
Password: Admin123!
```

Queste credenziali sono pensate esclusivamente per l'ambiente demo.

Non devono essere utilizzate in produzione.

---

# Controllare lo stato dell'applicazione

```bash
docker compose ps
```

Per visualizzare tutti i log:

```bash
docker compose logs
```

Per seguirli in tempo reale:

```bash
docker compose logs -f
```

---

# Log del frontend

```bash
docker compose logs -f web
```

---

# Log dell'API

```bash
docker compose logs -f api
```

---

# Log di PostgreSQL

```bash
docker compose logs -f postgres
```

---

# Log Redis

```bash
docker compose logs -f redis
```

---

# Log Postfix

```bash
docker compose logs -f postfix
```

---

# Configurazione email

Dopo aver effettuato il login, aprire:

```text
Impostazioni → Email
```

Verificare che venga mostrato:

```text
POSTFIX ATTIVO
```

Configurare:

1. Nome mittente
2. Email mittente
3. Salvare la configurazione
4. Inserire un destinatario
5. Premere **Invia email test**

---

# Come funziona l'invio email

Il percorso di un messaggio è:

```text
Domain Manager
      │
      ▼
NestJS API
      │
      ▼
Postfix :25
      │
      ▼
Destinazione SMTP
```

Quando Domain Manager comunica che il messaggio è stato accettato da Postfix significa che la comunicazione:

```text
Applicazione → Postfix
```

è avvenuta correttamente.

La consegna finale verso Internet rappresenta uno step separato e dipende dalla configurazione dell'ambiente nel quale Postfix viene eseguito.

Per la configurazione dedicata alla produzione consultare:

```text
docs/postfix-production.md
```

---

# Diagnostica Postfix

## Controllare il container

```bash
docker compose ps postfix
```

## Visualizzare i log

```bash
docker compose logs -f postfix
```

## Controllare la coda email

```bash
docker compose exec postfix postqueue -p
```

## Ritentare l'invio dei messaggi in coda

```bash
docker compose exec postfix postqueue -f
```

## Visualizzare la configurazione attiva

```bash
docker compose exec postfix postconf -n
```

---

# Fermare Domain Manager

Per fermare i container:

```bash
docker compose stop
```

Per fermare e rimuovere container e rete:

```bash
docker compose down
```

I volumi persistenti non vengono eliminati dal normale:

```bash
docker compose down
```

---

# Attenzione ai dati persistenti

Non utilizzare:

```bash
docker compose down -v
```

a meno che non si vogliano eliminare intenzionalmente i volumi Docker e i dati persistenti associati al progetto.

---

# Riavviare Domain Manager

```bash
docker compose restart
```

---

# Rebuild completo

Dopo modifiche significative ai servizi:

```bash
docker compose down
docker compose build --progress=plain
docker compose up -d
docker compose ps
```

Per ricostruire soltanto Postfix, API e Web:

```bash
docker compose down
docker compose build postfix api web --progress=plain
docker compose up -d
docker compose ps
```

---

# Aggiornare il progetto

Per scaricare gli ultimi aggiornamenti dal repository:

```bash
cd ~/Domain-manager
git pull
```

Poi ricostruire i servizi:

```bash
docker compose down
docker compose up --build -d
```

Controllare:

```bash
docker compose ps
```

---

# Sviluppo locale

Il progetto utilizza Node.js e pnpm.

La pipeline CI utilizza Node.js 22.

Il `package.json` definisce:

```text
pnpm@10.15.0
```

Se si vuole lavorare direttamente sul codice fuori dai container è quindi consigliato utilizzare versioni compatibili con il progetto.

Verificare Node:

```bash
node -v
```

Verificare pnpm:

```bash
pnpm -v
```

Installare le dipendenze:

```bash
pnpm install
```

Il progetto utilizza:

```text
pnpm-lock.yaml
```

per mantenere le versioni delle dipendenze coerenti tra sviluppo e CI.

---

# Controlli prima di un commit

Prima di inviare modifiche al repository è possibile eseguire:

```bash
pnpm lint
```

```bash
pnpm typecheck
```

```bash
pnpm test
```

```bash
pnpm build
```

Questi controlli corrispondono alle principali verifiche effettuate dalla pipeline CI.

---

# GitHub Actions

Il repository utilizza GitHub Actions per verificare automaticamente il codice.

Ad ogni push sul branch:

```text
main
```

la pipeline esegue:

```text
Installazione dipendenze
        │
        ▼
Lint
        │
        ▼
Typecheck
        │
        ▼
Test
        │
        ▼
Build
```

In questo modo eventuali problemi vengono individuati prima che le modifiche vengano considerate valide.

---

# Struttura logica del progetto

A livello concettuale il repository è organizzato attorno ai seguenti componenti:

```text
Domain Manager
│
├── Web
│   └── Next.js
│
├── API
│   └── NestJS
│
├── Database
│   └── PostgreSQL
│
├── Queue
│   ├── Redis
│   └── BullMQ
│
├── Worker
│
├── Email
│   └── Postfix
│
├── Docker
│   └── Docker Compose
│
└── Documentation
```

---

# Flusso completo di una richiesta

Quando un utente interagisce con Domain Manager:

```text
1. L'utente apre il browser
             │
             ▼
2. Next.js mostra l'interfaccia
             │
             ▼
3. Il frontend invia una richiesta all'API
             │
             ▼
4. NestJS elabora la richiesta
             │
             ├──> PostgreSQL
             │
             ├──> Redis / BullMQ
             │
             └──> Postfix
             │
             ▼
5. L'API restituisce la risposta
             │
             ▼
6. Next.js aggiorna l'interfaccia
```

---

# Stato attuale del progetto

Domain Manager è attualmente un progetto **portfolio / SaaS demo**.

L'interfaccia comprende già:

* dashboard;
* KPI;
* domini;
* filtri;
* import/export CSV;
* scadenze;
* rinnovi;
* notifiche;
* email;
* assegnazioni;
* utenti;
* inviti;
* ruoli;
* report;
* costi;
* audit log;
* impostazioni organizzazione;
* sicurezza;
* integrazioni.

Parte dei dati relativi ai domini e alle funzionalità business viene ancora mantenuta nel browser tramite:

```text
localStorage
```

Il successivo step architetturale consiste nel portare progressivamente:

```text
autenticazione
utenti
organizzazioni
domini
workflow
```

sul backend basato su:

```text
NestJS
Prisma
PostgreSQL
```

---

# Sicurezza

Il progetto include diverse misure orientate alla sicurezza:

* password demo elaborate tramite `scrypt`;
* token reset password monouso;
* token invito monouso;
* token memorizzati sotto forma di hash;
* scadenza dei token;
* PostgreSQL non esposto direttamente sull'host;
* Redis non esposto direttamente sull'host;
* Postfix isolato nella rete Docker;
* separazione tra frontend e API.

---

# Troubleshooting

## `docker: command not found`

Docker non è installato oppure non è disponibile nel `PATH`.

Verificare:

```bash
docker --version
```

---

## `docker compose: command not found`

Verificare che il Docker Compose Plugin sia installato:

```bash
docker compose version
```

Se necessario:

```bash
sudo apt install docker-compose-plugin
```

---

## Permission denied su Docker

Se compare un errore simile a:

```text
permission denied while trying to connect to the Docker daemon
```

eseguire:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

e riprovare:

```bash
docker compose ps
```

---

## Porta 3000 già occupata

Controllare quale processo sta utilizzando la porta:

```bash
sudo ss -ltnp | grep :3000
```

---

## Porta 3001 già occupata

```bash
sudo ss -ltnp | grep :3001
```

---

## Un container non parte

Controllare:

```bash
docker compose ps
```

Poi leggere i log:

```bash
docker compose logs NOME_SERVIZIO
```

Ad esempio:

```bash
docker compose logs api
```

---

## Ricostruire tutto da zero senza cancellare i volumi

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

# Documentazione aggiuntiva

Per informazioni specifiche:

```text
docs/password-reset.md
docs/account-onboarding.md
docs/postfix-production.md
```

---

# Stack tecnologico

| Area                  | Tecnologia     |
| --------------------- | -------------- |
| Frontend              | Next.js        |
| Backend               | NestJS         |
| Database              | PostgreSQL     |
| Queue                 | Redis          |
| Job processing        | BullMQ         |
| Email                 | Postfix        |
| Container             | Docker         |
| Orchestrazione locale | Docker Compose |
| Package Manager       | pnpm           |
| CI                    | GitHub Actions |

---

# Obiettivo del progetto

Domain Manager è stato sviluppato come progetto portfolio con l'obiettivo di rappresentare un'applicazione SaaS moderna completa.

Il progetto non vuole mostrare soltanto un'interfaccia grafica, ma l'intero ciclo di funzionamento di un'applicazione:

```text
Frontend
   +
Backend
   +
Database
   +
Code asincrone
   +
Email
   +
Autenticazione
   +
Container
   +
CI
```

L'obiettivo finale è offrire una piattaforma dalla quale un'organizzazione possa controllare in modo centralizzato il proprio portfolio di domini, riducendo attività manuali, aumentando la visibilità sulle scadenze e rendendo più strutturata la collaborazione tra gli utenti.

---
