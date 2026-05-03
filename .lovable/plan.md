
# FORMA — Build Plan

A SaaS for architects combining **FORMA Render AI** (3D → photoreal images) and **FORMA Agent** (IA assistant connected to email, calendar, files, projects). We'll build it in phases on the Lovable stack (React + Vite + Tailwind + Lovable Cloud), faithfully adapting your Next.js/Prisma brief.

> **Stack note:** Your brief targets Next.js + Prisma + BullMQ + Upstash. Lovable apps are React + Vite + Tailwind, so the equivalents are: Vite SPA instead of Next.js, Lovable Cloud (Supabase) Postgres + Auth + Storage + Edge Functions instead of Prisma + API routes, and webhook-driven async jobs instead of BullMQ. Design system, UX, copy, features and database schema stay 1:1 with the brief.

---

## Phase 1 — Landing page (pixel-faithful port)

Port `forma-landing.html` to a React route at `/`, keeping the design exactly as designed.

- Cormorant Garant + DM Sans via Google Fonts
- Dark palette: `--black #080808`, `--ivory #F0EAE0`, `--gold #C4A264`
- Custom gold cursor + ring (desktop only, disabled on touch)
- All sections: hero, before/after demos, features grid, pricing, FAQ, footer (whatever's in the file)
- Smooth scroll, fade/blur reveal animations, gradient nav
- Fully responsive
- SEO: meta tags, og:image, sitemap, robots, Schema.org SoftwareApplication

## Phase 2 — Auth & dashboard shell

- Lovable Cloud auth: email/password + Google
- Pages: `/auth` (login + signup tabs), `/auth/forgot`, `/auth/reset-password`
- `profiles` table (display name, avatar, locale) + auto-create trigger
- `user_roles` table with `app_role` enum + `has_role()` security-definer function (admin / member / owner)
- `workspaces` + `workspace_members` (architects can collaborate)
- Authenticated `/dashboard` shell: left sidebar (Render, Agent, Projects, Integrations, Settings, Billing), top bar with workspace switcher + usage bar
- Protected routes, session restored via `onAuthStateChange`

## Phase 3 — FORMA Render AI

- `/dashboard/render`: drag-drop upload of 3D viewport export (SketchUp/Revit/Rhino/Blender/ArchiCAD screenshots — PNG/JPG)
- Style controls: time of day, weather, architectural style, view type, vegetation, custom prompt
- Storage buckets `renders-input` / `renders-output` with RLS
- `renders` table (status PENDING / PROCESSING / COMPLETED / FAILED, prompt, params, urls, duration, cost)
- Edge function `create-render` → calls Replicate or Fal.ai → returns prediction id
- Edge function `webhook-replicate` → updates row, stores output to bucket
- Realtime subscription on `renders` row → frontend reveals image with blur→sharp animation
- History gallery with filters, favorites, download, regenerate
- Plan-aware quota check before submission (PlanGate)

## Phase 4 — FORMA Agent

- `/dashboard/agent`: chat UI, conversation list sidebar, streaming responses
- Tables: `conversations`, `messages` (role, content, tool_calls, tokens)
- Edge function `agent-chat` calling **Lovable AI Gateway** (Claude Sonnet 4 / Gemini) with SSE streaming
- French architecture-specialist system prompt (PLU, RT/RE2020, BBC, HQE, BIM, IFC, DPE, SHON/SHOB) per brief
- Tool-calling framework: `list_emails`, `read_email`, `send_email`, `create_draft`, `list_events`, `create_event`, `update_event`, `delete_event`, `list_files`, `read_file`, `search_files`, plus project tools
- Memory: persisted messages + summarisation; "Forget" controls in Settings

## Phase 5 — Integrations

Per-user OAuth (each architect connects their own accounts):
- Gmail + Google Calendar + Google Drive (Google Cloud Console OAuth, tokens encrypted in `integrations` table)
- Notion, Slack (OAuth)
- Phase 2 providers: Outlook, OneDrive, Teams
- `/dashboard/integrations` page: connect / disconnect / re-auth, scope display
- Token refresh edge function

## Phase 6 — Billing (Stripe via Lovable built-in payments)

Plans from the brief: **Studio**, **Cabinet**, **Agence**.

- Run `recommend_payment_provider` then enable Stripe payments
- Products & prices created via batch tool
- `/dashboard/billing`: current plan, invoices, upgrade, cancel
- `subscriptions` + `usage_counters` tables
- `<PlanGate />` HOC + `<UsageBar />` component (renders/month, agent tokens/month)
- Webhook handler resets counters monthly on `invoice.paid`

## Phase 7 — Onboarding, polish, finalisation

- 3-step onboarding wizard (workspace, brand style upload for fine-tune, first integration)
- Settings: profile, workspace, brand style images, memory controls, danger zone
- Notifications (sonner), command-K palette, empty states, loading skeletons
- 404, error boundary, accessibility pass

---

## Database schema (initial migration, expanded over phases)

```text
profiles, user_roles, workspaces, workspace_members,
renders, render_assets,
conversations, messages,
integrations (encrypted tokens), projects,
subscriptions, usage_counters, invoices
```

All tables RLS-protected; roles via `has_role()` security-definer. Storage buckets: `renders-input` (private), `renders-output` (private with signed URLs), `brand-style` (private), `avatars` (public).

---

## Secrets needed (collected as we reach each phase)

- **Phase 3:** `REPLICATE_API_TOKEN` (or `FAL_KEY`) + `REPLICATE_WEBHOOK_SECRET`
- **Phase 4:** none — Lovable AI Gateway is built-in
- **Phase 5:** Google OAuth client ID/secret, Notion & Slack OAuth credentials, `ENCRYPTION_KEY` for stored tokens
- **Phase 6:** Stripe is enabled via Lovable's built-in flow, no manual keys

---

## What this iteration will deliver

To keep things shippable and reviewable, **this first implementation = Phase 1 only** (the pixel-faithful landing page). Once you approve the result, we'll proceed phase by phase. Each later phase is a single follow-up message: "Start Phase 2", etc.

Ready to start with the landing page?
