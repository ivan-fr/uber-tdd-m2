# Projet Uber

Le code du projet se trouve a la racine du depot.

- `app/` contient les objets et les regles de reservation et d'annulation.
- `infra/` contient le stockage Knex, les migrations et Docker Compose pour PostgreSQL.
- `test/` contient les tests unitaires et les tests d'integration.

Conserver un code simple et facile a comprendre.
Utiliser `FakeUberRepository` dans les tests unitaires et PostgreSQL Docker dans les tests d'integration.

```bash
npm ci
npm test -- --run
npm run typecheck
npm run test:integration
npm run db:start
npm run knex migrate:latest
npm run db:stop
```

Faire un commit par micro-etape TDD : test rouge, code vert, puis refactoring si necessaire.
