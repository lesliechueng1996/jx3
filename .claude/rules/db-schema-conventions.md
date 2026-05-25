---
description: Database schema conventions for all tables except auth schema (packages/auth/src/schema.ts)
paths:
  - packages/db/src/schema/**
---

## Table Naming

- Table names must use at least 2 words (e.g., `game_server`, not `server`)
- Database column/table names use snake_case
- TypeScript variable names use camelCase

## Required Columns

Every table must include:

1. **`id`** — UUID primary key, auto-generated via `gen_random_uuid()`
2. **`created_at`** — timestamp with timezone, defaults to `now()`
3. **`updated_at`** — timestamp with timezone, defaults to `now()`, updated on modification via `.$onUpdate()`

## Example

```typescript
import * as t from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';

export const gameServer = pgTable('game_server', {
  id: t.uuid('id').primaryKey().defaultRandom(),
  // ... business columns ...
  createdAt: t.timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: t.timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
```
