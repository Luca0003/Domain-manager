# ADR 0001 - Monolite modulare

## Stato
Accettato.

## Decisione
Domain Manager nasce come monolite modulare con web, API e worker distribuibili separatamente nello stesso monorepo.

## Motivazione
Riduce la complessità operativa dell'MVP mantenendo moduli e contratti sufficientemente separati per estrazioni future.

## Conseguenze
- confini di modulo espliciti;
- nessun microservizio prematuro;
- API e worker possono scalare indipendentemente;
- contratti condivisi vengono mantenuti in `packages/contracts`.
