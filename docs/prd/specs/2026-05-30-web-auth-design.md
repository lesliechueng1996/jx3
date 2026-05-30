# Web Auth Design (PRD)

- **Date**: 2026-05-30
- **Status**: Approved
- **Scope**: Login and registration UI in `apps/web` using Better Auth (email/password + GitHub SSO)

## 1. Goals

- Provide login and registration on `/login` with email + password and GitHub OAuth.
- Use the existing Better Auth client (`@jx3/auth/client`) and BFF proxy (`/api/auth/*`).
- Client-side validation before API calls; API failures surfaced via shadcn Sonner toasts.
- Redirect to `/` after successful authentication; home page displays minimal `index` content.
- Follow frontend conventions: shadcn/ui, two-layer form pattern, TanStack Query mutations.
- Ship Vitest unit tests for schema, form validation, and auth proxy helpers.

## 2. Non-Goals (first version)

- Email verification, password reset, or forgot-password flows.
- Protected routes / session-aware navigation in root layout.
- Sign-out UI or user profile display on the home page.
- Production-grade auth page design beyond a centered card layout.

## 3. Architecture

```
/login (LoginComponent)
  ├─ AuthCredentialsFormComponent  — zod validation, shadcn fields
  └─ useMutation → authClient.signIn.email | signUp.email | signIn.social
        ↓ same-origin
  /api/auth/* (BFF proxy) → apps/api Better Auth handler
        ↓ success
  navigate('/') → index page ("index")
```

## 4. Components

| File | Role |
|------|------|
| `routes/login/-components/auth-credentials-schema.ts` | Zod schema (email, password min 8) |
| `routes/login/-components/AuthCredentialsFormComponent.tsx` | Presentational form + field errors |
| `routes/login/-components/LoginComponent.tsx` | Mutations, Sonner toasts, redirect |

## 5. UI & Feedback

- shadcn: `Card`, `Field`, `Input`, `Button`, `Separator`, `Toaster` (Sonner).
- Validation errors: inline on fields (`data-invalid`, `FieldError`).
- API / network errors: `toast.error()` via Sonner.

## 6. Testing

| Test file | Covers |
|-----------|--------|
| `tests/routes/login/-components/auth-credentials-schema.test.ts` | Zod valid/invalid cases |
| `tests/routes/login/-components/AuthCredentialsFormComponent.test.tsx` | Field validation, submit callbacks |
| `tests/lib/proxy.test.ts` | `buildUpstreamRequest`, `proxyAuth` |

Runner: Vitest + Testing Library + jsdom.

## 7. Environment

No new env vars. Reuses `API_URL` (web BFF → API) and Better Auth config on the API.
