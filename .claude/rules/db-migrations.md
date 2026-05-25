---
description: When modifying schema files in packages/db or packages/auth/src/schema.ts
paths:
  - packages/db/src/schema/**
  - packages/auth/src/schema.ts
---

After modifying database schema files, remind the user to run:

1. `bun run --filter @jx3/db db:generate` — generate migration SQL from schema changes
2. `bun run --filter @jx3/db db:migrate` — apply migrations to the database
