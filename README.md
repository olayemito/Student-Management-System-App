# School Management System (MVP)

Secondary School Management System — MVP per spec v9.
Single school, ~500 students. Nigerian secondary school structure
(JSS1–SS3, Arms A/B/C, Terms 1st/2nd/3rd, Sessions = academic years).

## Tech stack (per §1, fixed)

- Vite + React + TypeScript SPA
- shadcn/ui + Tailwind CSS (default theme)
- Supabase (Postgres + Auth + RLS) — client SDK direct from frontend
- Cloudflare Pages (Phase 5 deploy target, but used from Phase 0 for testing)

No Next.js, no custom backend server, no different DB/host.

## Deployment workflow (push-to-deploy)

The intended workflow is **never localhost**. You push to GitHub, Cloudflare
auto-deploys via Workers Build mode, you test against the deployed URL.

1. Push this repo to your GitHub repo (the one created per §1A item 1).
2. Cloudflare Pages is linked to the GitHub repo (per §1A item 3) and
   auto-deploys on push to `main`. Per-branch preview URLs are also
   available.
3. Set the following environment variables in Cloudflare Pages
   (Settings → Environment variables):
   - `VITE_SUPABASE_URL` — Supabase dev project URL
   - `VITE_SUPABASE_ANON_KEY` — Supabase dev project anon key (safe to
     expose per §9; RLS is the real security boundary)
   - `VITE_PUBLIC_SITE_URL` — your deployed Cloudflare URL
     (e.g. `https://student-management-system-app.pages.dev`); used as the
     redirect target for Supabase password-reset emails
4. Build settings in Cloudflare Pages:
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
   - Node version: 18 or higher
5. SPA routing is handled by `wrangler.jsonc` (committed to repo root) via
   `assets.not_found_handling: "single-page-application"`. Any non-file
   path serves `/index.html` so deep links like `/admin` work on refresh.
   **Do not add a `public/_redirects` file** — it conflicts with this
   setting and causes an infinite-loop error during deploy.

## Phase 0 — Setup

What Phase 0 delivers:

- Vite + React + TS scaffold with Tailwind + shadcn/ui
- Supabase client wired with the dev project's URL + anon key
- `supabase/migrations/0001_users_table.sql` — creates `public.users` (id, email,
  full_name, role), enables RLS, defines `public.set_updated_at()` trigger fn
- `supabase/seed/phase0_test_users.sql` — creates 3 dev auth users + matching
  `public.users` rows (admin / teacher / bursar) for verifying the redirect
- Auth flow: login (email/password), forgot-password, reset-password, logout
- Role-based dashboard redirect: `/dashboard` → `/admin` | `/teacher` | `/bursar`
  based on the logged-in user's `public.users.role`
- Three empty role-specific dashboard shells with logout

Phase 0 does **not** include user provisioning UI (admin "Create User" action is
Phase 1), student/class/subject CRUD (Phase 1), or any other §3 tables
(Phase 1+).

### One-time Supabase setup (manual — per-project dashboard settings)

These four steps are performed once in the Supabase dev project dashboard
(`https://mwmghlvnxfrpbckprmnq.supabase.co`). They cannot be done from a
code commit because they are per-project Auth settings.

1. **Apply the database migration.**
   Open Supabase SQL Editor → new query → paste contents of
   `supabase/migrations/0001_users_table.sql` → Run. This creates
   `public.users`, enables RLS, and creates the `public.set_updated_at()`
   trigger function.

2. **Disable email verification.**
   Supabase dashboard → Authentication → Sign In / Providers → Email →
   toggle "Confirm email" **OFF**. Per spec: admin creates every account
   and vets identity at creation time — a confirmation email step would
   just block first login for no security benefit.

3. **Add the password-reset redirect URL to the allowlist.**
   Supabase dashboard → Authentication → URL Configuration → add your
   deployed Cloudflare Pages URL with the `/reset-password` path
   (e.g. `https://your-project.pages.dev/reset-password`) to "Redirect URLs".
   Also add `http://localhost:5173/reset-password` only if you intend to
   run `npm run dev` locally for debugging.

4. **Seed the 3 test users.**
   Supabase SQL Editor → new query → paste contents of
   `supabase/seed/phase0_test_users.sql` → Run. This creates:

   | Email                  | Password      | Role    |
   | ---------------------- | ------------- | ------- |
   | admin@example.com      | Password123!  | admin   |
   | teacher@example.com    | Password123!  | teacher |
   | bursar@example.com     | Password123!  | bursar  |

   The script inserts into `auth.users` (which requires superuser
   privileges and bypasses RLS — that's intentional for a dev seed).
   Never run this against prod.

### Deploy and verify

After completing the 4 Supabase steps above:

1. Push the repo to GitHub.
2. Wait for Cloudflare Pages to finish the auto-deploy.
3. Open your deployed Cloudflare Pages URL.
4. Log in with each of the three test accounts in turn. Each should land
   on the matching role dashboard:
   - `admin@example.com` → `/admin`
   - `teacher@example.com` → `/teacher`
   - `bursar@example.com` → `/bursar`

### Phase 0 "Done when" verification

Per §6: *"a user can log in and land on a role-specific empty dashboard."*

- Log in as `admin@example.com` → should land on `/admin`
- Log in as `teacher@example.com` → should land on `/teacher`
- Log in as `bursar@example.com` → should land on `/bursar`
- Visit `/dashboard` while logged in → redirects to role dashboard
- Visit `/admin` while logged in as teacher → bounced to `/teacher`
- Click "Sign out" → returns to `/login`
- Use "Forgot password?" → recovery email flow is wired (Supabase handles
  the email send; redirect URL is `VITE_PUBLIC_SITE_URL/reset-password`)

## Project layout

```
school-mgmt/
├── index.html
├── package.json
├── package-lock.json
├── vite.config.ts          # Vite + React + @cloudflare/vite-plugin
├── wrangler.jsonc          # Cloudflare Workers config (SPA routing + project name)
├── tsconfig.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── components.json         # shadcn config (default slate base color)
├── .env.example            # committed template
├── .env.local              # gitignored, contains dev Supabase creds
├── .gitignore
├── README.md
├── src/
│   ├── main.tsx
│   ├── App.tsx             # router
│   ├── index.css           # Tailwind + shadcn CSS variables
│   ├── vite-env.d.ts
│   ├── lib/
│   │   ├── supabase.ts     # Supabase client
│   │   └── utils.ts        # cn() helper
│   ├── types/
│   │   └── database.ts     # hand-written Phase 0 types
│   ├── contexts/
│   │   └── AuthContext.tsx # session + profile loader
│   ├── components/
│   │   ├── ui/             # shadcn primitives (button, input, label, card)
│   │   └── layout/
│   │       └── AppShell.tsx # top-bar + logout
│   ├── routes/
│   │   └── ProtectedRoute.tsx
│   └── pages/
│       ├── Login.tsx
│       ├── ForgotPassword.tsx
│       ├── ResetPassword.tsx
│       ├── Dashboard.tsx           # role-based redirect
│       ├── admin/AdminDashboard.tsx
│       ├── teacher/TeacherDashboard.tsx
│       └── bursar/BursarDashboard.tsx
└── supabase/
    ├── migrations/
    │   └── 0001_users_table.sql    # public.users + RLS + set_updated_at()
    └── seed/
        └── phase0_test_users.sql   # dev-only 3 test users
```

## Conventions established in Phase 0

- **All schema/RLS/triggers live in versioned SQL migration files under
  `supabase/migrations/`.** Never hand-applied in the Supabase dashboard
  only. Files are numbered `NNNN_description.sql`.
- **RLS is the security boundary, not the frontend.** Every table gets
  RLS enabled in its migration. UI route guards (`ProtectedRoute`) are a
  UX nicety, not the security enforcement.
- **The Supabase anon key in `.env.local` is expected to be visible in
  the frontend bundle** — per §9 this is correct Supabase SPA
  architecture. Do not try to "fix" this with a hidden backend.
- **`public.set_updated_at()`** is defined once in `0001` and reused by
  every subsequent table that has an `updated_at` column.
- **The `users` table's `role` column is the single source of truth for
  role-based access.** All RLS policies on Phase 1+ tables will consult
  this column.
- **`VITE_PUBLIC_SITE_URL`** is set per-environment in Cloudflare Pages
  and is used as the redirect target for password-reset emails so the
  recovery link lands on the deployed site, not localhost.
- **Cloudflare Workers Build mode** (not legacy Pages mode) is the deploy
  target. `wrangler.jsonc` at repo root configures the project name
  (`student-management-system-app` — must match the Cloudflare project
  name) and SPA routing (`assets.not_found_handling: "single-page-application"`).
  The `@cloudflare/vite-plugin` (loaded in `vite.config.ts`) processes
  `wrangler.jsonc` during build and emits `dist/wrangler.json`, which
  `npx wrangler deploy` consumes. Never add a `public/_redirects` file —
  it conflicts with the SPA-routing setting and triggers an infinite-loop
  error during deploy.
