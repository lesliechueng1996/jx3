# @jx3/jx3api

Typed client library for third-party JX3 (剑网3) game APIs.

## Structure

```
src/
  client.ts          # Shared HTTP helpers (fetchJson)
  errors.ts          # Jx3ApiError
  index.ts           # Public barrel exports
  providers/
    <provider>/      # One folder per upstream source (e.g. jx3box)
      config.ts      # Base URLs and provider constants
      types/         # Raw + normalized response types, mappers
      *.ts           # One module per upstream endpoint
```

Add new upstream APIs under `providers/<name>/`. Export stable methods from
`src/index.ts` (or a subpath like `@jx3/jx3api/jx3box` for provider-only imports).

## Usage

```typescript
import { getServerStates } from '@jx3/jx3api';

const servers = await getServerStates();
```

Provider-scoped import:

```typescript
import { getServerStates } from '@jx3/jx3api/jx3box';
```

## Integrated APIs

| Provider | Method | Endpoint | Auth |
|----------|--------|----------|------|
| jx3box | `getServerStates()` | `GET /api/spider/server/server_state` | None |
