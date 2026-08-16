# Recupero password con Postfix

La v18 collega il flusso `Password dimenticata?` al backend e a Postfix.

## Flusso

1. La Login invia l'indirizzo a `/api/auth/password-reset/request`.
2. Next.js inoltra la richiesta internamente alla API NestJS.
3. La API genera un token casuale crittograficamente sicuro.
4. Nel volume persistente viene salvato **solo SHA-256 del token**, con scadenza 30 minuti.
5. Postfix riceve l'email contenente il link `http://localhost:3000/reset-password?token=...`.
6. La pagina Reset Password invia token e nuova password al backend.
7. La password viene salvata con `scrypt` e il token viene invalidato.
8. Il Login usa da quel momento la nuova password.

## Account demo iniziale

- Email: `admin@domainmanager.local`
- Password iniziale: `Admin123!`

Dopo un reset la password iniziale non torna valida, perché lo stato auth è persistito nel volume `email_config_data` insieme alla configurazione locale di Domain Manager.

## Diagnostica

Verifica Postfix:

```bash
docker compose ps
docker compose logs --tail=100 postfix
docker compose exec postfix postqueue -p
```

Verifica API:

```bash
docker compose logs --tail=100 api
```
