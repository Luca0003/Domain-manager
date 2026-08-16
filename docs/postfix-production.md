# Postfix: from local Docker demo to real Internet delivery

The included Postfix container is intentionally internal-only. The API submits
messages to `postfix:25`; port 25 is not exposed on the workstation.

## What works locally

With the default Compose configuration you can verify that:

- the Postfix service starts;
- NestJS can connect to it;
- Domain Manager can submit a message;
- Postfix can place that message in its queue and attempt delivery.

This does **not** guarantee that Gmail, Outlook or another destination will
accept the message from a laptop/home connection.

## Recommended production setup

Use a VPS/server with:

1. a static public IPv4 address;
2. outbound TCP port 25 allowed by the hosting provider;
3. a real domain you control;
4. an A record such as `mail.example.it -> PUBLIC_IP`;
5. reverse DNS/PTR from `PUBLIC_IP -> mail.example.it`;
6. an SPF TXT record authorizing that public IP;
7. DKIM signing and a corresponding DNS TXT record before relying on the setup
   for production mail;
8. a DMARC policy once SPF/DKIM alignment has been verified.

Example `.env` identity for the deployed mail server:

```env
POSTFIX_HOSTNAME=mail.example.it
POSTFIX_DOMAIN=example.it
EMAIL_FROM_NAME=Domain Manager
```

Then configure the sender in the Domain Manager UI, for example:

```text
Domain Manager <notifications@example.it>
```

## Example SPF

For a server whose public IPv4 address is `203.0.113.10`, an initial SPF record
would look like:

```text
example.it TXT "v=spf1 ip4:203.0.113.10 -all"
```

Replace the example address with the real server address.

## Important limitation of the current portfolio build

The included container does not yet generate/sign DKIM messages. Direct delivery
can be tested with Postfix, but before using this as a production mail system add
DKIM signing (for example OpenDKIM or an equivalent milter) and publish the
matching DNS key.

## Troubleshooting

Check queue:

```bash
docker compose exec postfix postqueue -p
```

Force retry:

```bash
docker compose exec postfix postqueue -f
```

Follow SMTP delivery errors:

```bash
docker compose logs -f postfix
```

Typical causes of non-delivery are:

- outbound port 25 blocked;
- missing or incorrect PTR/reverse DNS;
- sender domain not authorized by SPF/DKIM;
- recipient server reputation/policy rejection;
- using a `.local` sender/hostname for Internet delivery.
