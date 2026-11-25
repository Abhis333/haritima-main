# Authentication, roles and users

Email and password sign-in with Auth.js v5, JWT sessions, and two roles: `USER` and `ADMIN`.

## Files
- `lib/auth.config.ts`: **edge-safe** config used by `middleware.ts`. It holds the JWT and session callbacks that copy `id` and `role` into the token and session, the `authorized` callback, 1-day sessions refreshed at most hourly (`updateAge`), and `pages.signIn = /login`. It must not import Prisma or bcrypt.
- `lib/auth.ts`: full config with the Credentials provider. It validates input with zod, lowercases the email, and rate-limits attempts (5 per email and 20 per client address per 15 minutes, in memory per instance) before doing any bcrypt work. It then checks the password with `bcrypt.compare`. Unknown emails are compared against a dummy hash, so timing doesn't reveal which accounts exist. A throttled attempt shows the same "invalid" error as a wrong password. It exports `auth`, `signIn`, `signOut` and `handlers`.
- `app/api/auth/[...nextauth]/route.ts`: the Auth.js handlers.
- `types/next-auth.d.ts`: adds `id` and `role` to the session and JWT types.
- `lib/guards.ts`: `requireAdmin()` (401 or 403) re-reads the user's role from the database on every call, so a demoted or deleted admin loses API access immediately instead of when the JWT expires. Also `currentUser()` and the `handle()` error wrapper.
- `app/admin/layout.tsx` also re-reads the role from the database before rendering admin pages.
- `middleware.ts`: redirects non-admins from `/admin/*` to `/login?callbackUrl=…` (based on the JWT role), and runs the CSRF Origin check on `/api/*`.
- UI: `app/(public)/login/page.tsx` (uses a server action; `callbackUrl` must be a same-site relative path with no backslashes or control characters, otherwise it falls back to `/`), `app/(public)/register/page.tsx`, `components/AuthForms.tsx`, and the sign-out action in `components/Navbar.tsx`.
- `app/api/register/route.ts`: public sign-up. It is limited to 5 per hour per IP, hashes with bcrypt at 12 rounds, **always** creates the account as `USER`, and returns 409 for a duplicate email.
- `scripts/create-admin.ts` (`npm run create-admin`): creates or promotes an admin from `ADMIN_EMAIL`, `ADMIN_PASSWORD` (at least 10 characters) and `ADMIN_NAME` in `.env`.

## User management (admin)
- `app/admin/users/page.tsx`, `app/api/users/route.ts` (list with conversation counts), `app/api/users/[id]/route.ts` (PATCH role).
- Guards: an admin cannot demote themselves, and at least one admin must always remain. The last-admin check locks the admin rows (`SELECT … FOR UPDATE`) and updates inside one transaction, so two admins demoting each other at the same time can't leave zero admins. The check applies only when the target is currently an admin. Role changes are audited as `ROLE_CHANGE`.

## Rules
- Middleware is only the first line of defense. Every admin API handler must call `requireAdmin()` itself.
- Admin accounts can only be created through the script or by an existing admin. Public sign-up never creates one.

## Redirects behind a proxy
- Login (`app/(public)/login/page.tsx`) and logout (`components/Navbar.tsx`) call Auth.js with `redirect: false` and then `redirect()` to a same-site relative path; the `/admin` guard in `middleware.ts` returns a relative `Location`. Behind Railway the request origin can be the internal `https://localhost:8080`, so no redirect may be built from it.
- Set `AUTH_URL` to the public site address in production (see `.env.example`).
