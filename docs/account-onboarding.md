# Account onboarding e recupero password

## Invito utente

Il flusso demo persistente ora è completo:

1. Organization Administrator apre **Utenti → Invita utente**.
2. Inserisce nome, email, ruolo, durata e messaggio personale.
3. NestJS genera un token casuale, salva solo l'hash e imposta la scadenza.
4. Postfix invia un'email con il link `/accept-invite?token=...`.
5. L'utente apre il link, vede workspace/ruolo/scadenza e sceglie la propria password.
6. La password viene derivata con `scrypt`; il token invito viene invalidato.
7. L'utente può accedere con la propria email e la password scelta.

Gli inviti sono monouso e hanno durata configurabile fino a 30 giorni.

## Recupero password

1. Dalla login si apre `/forgot-password`.
2. L'utente inserisce l'email di accesso.
3. Il backend genera un token monouso valido 30 minuti e salva solo l'hash.
4. Postfix invia il link `/reset-password?token=...` alla casella di recupero.
5. La pagina verifica il token prima di mostrare il form.
6. La nuova password deve rispettare la policy mostrata nella UI.
7. Dopo il reset il token viene rimosso e non può essere riutilizzato.

Per l'account demo `admin@domainmanager.local`, configurare una casella reale in **Impostazioni → Email → Email di recupero account**.

## Nota architetturale

Questa milestone usa ancora uno stato auth demo persistente su volume Docker (`AUTH_STATE_PATH`) per validare i flussi UX senza introdurre ancora l'intero modello utenti/membership PostgreSQL. Il passaggio successivo per produzione è migrare utenti, membership, inviti e token su PostgreSQL con sessioni server-side e autorizzazione tenant-aware.
