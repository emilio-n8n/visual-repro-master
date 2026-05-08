# FORMA — Studio IA pour cabinets d'architecture

Application React + Vite + Tailwind + Supabase. Agent conversationnel multi-tools, mini-studios d'édition (document, tableur), génération de rendus image, mémoire multi-niveaux, gestion d'équipe et de projets.

---

## 🚀 Migration depuis Lovable Cloud vers Supabase + Gemini API

Ce projet a été conçu sur Lovable Cloud (Supabase managé + Lovable AI Gateway). Il est entièrement portable : le code des edge functions accepte n'importe quel endpoint compatible OpenAI via variables d'environnement.

### 1. Créer un projet Supabase

1. Crée un projet sur https://supabase.com.
2. Récupère :
   - `Project URL` (ex. `https://xxx.supabase.co`)
   - `anon / publishable key`
   - `service_role key` (secret)
3. Installe le CLI Supabase :
   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref <ton-project-ref>
   ```

### 2. Appliquer le schéma de base

Toutes les migrations SQL sont dans `supabase/migrations/`. Applique-les dans l'ordre :

```bash
supabase db push
```

Tables créées : `profiles`, `user_roles`, `workspaces`, `workspace_members`, `cabinet_profile`, `team_members`, `projects`, `conversations`, `messages`, `artifacts`, `memories`, `notifications`, `renders`. Toutes ont du RLS activé.

Buckets storage à créer (privés) :
- `render-inputs`
- `render-outputs`

```sql
insert into storage.buckets (id, name, public) values
  ('render-inputs','render-inputs', false),
  ('render-outputs','render-outputs', false);
```

(Les politiques d'accès storage sont dans les migrations.)

### 3. Variables d'environnement frontend

Crée un `.env` à la racine :

```bash
VITE_SUPABASE_URL=https://<ton-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key>
VITE_SUPABASE_PROJECT_ID=<ton-ref>
```

Puis :
```bash
bun install   # ou npm/pnpm install
bun run dev
```

### 4. Edge Functions — config IA (Gemini direct)

Les 3 edge functions (`forma-agent`, `forma-artifact-edit`, `forma-render`) lisent ces variables (avec fallback sur `LOVABLE_API_KEY` pour rétrocompatibilité) :

| Variable | Description | Exemple Gemini direct |
|---|---|---|
| `AI_API_KEY` | Clé API du fournisseur LLM | Ta clé Google AI Studio |
| `AI_GATEWAY_URL` | Endpoint OpenAI-compatible (sans `/chat/completions`) | `https://generativelanguage.googleapis.com/v1beta/openai` |
| `AI_MODEL` | Modèle texte / tools | `gemini-2.5-flash` |
| `AI_IMAGE_MODEL` | Modèle image (forma-render) | `gemini-2.5-flash-image-preview` |

> Google expose un endpoint **OpenAI-compatible** pour Gemini : aucun changement de code requis. Récupère ta clé sur https://aistudio.google.com/apikey.

Configure les secrets côté Supabase :
```bash
supabase secrets set \
  AI_API_KEY=<gemini-api-key> \
  AI_GATEWAY_URL=https://generativelanguage.googleapis.com/v1beta/openai \
  AI_MODEL=gemini-2.5-flash \
  AI_IMAGE_MODEL=gemini-2.5-flash-image-preview
```

> ⚠️ La génération d'image via l'endpoint OpenAI-compat de Gemini retourne le format `modalities`. Si ça ne fonctionne pas, bascule `forma-render` sur l'API native Gemini (`https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent`) — voir section *Alternative* en bas.

### 5. Déployer les edge functions

```bash
supabase functions deploy forma-agent --no-verify-jwt
supabase functions deploy forma-artifact-edit --no-verify-jwt
supabase functions deploy forma-render --no-verify-jwt
```

(L'auth est validée en interne via `Authorization` header.)

### 6. Auth

Active dans Supabase Dashboard → Authentication :
- Email/password
- (Optionnel) Google OAuth

Désactive « Confirm email » si tu veux un onboarding sans vérification.

---

## 🧱 Architecture

```
src/
  pages/
    Auth.tsx              Connexion / signup
    Onboarding.tsx        Questionnaire cabinet (3 niveaux) + équipe
    Join.tsx              Acceptation invitation team
    dashboard/
      Agent.tsx           Chat principal (streaming SSE)
      Studio.tsx          Mini-studio doc/tableur (WYSIWYG, exports xlsx/docx/pdf)
      Settings.tsx        Profil cabinet, équipe, invitations
      Render.tsx          Génération d'images
  components/
    ProjectSwitcher.tsx   Sélecteur de projets
    ArtifactPreview.tsx   Carte artefact (open/preview/download)
  hooks/
    useAuth.tsx
    useWorkspace.tsx      Workspace + projet actif (localStorage)

supabase/
  functions/
    forma-agent/          Agent IA streaming + tool-calling (memory, projects, team, web search, artifacts, mentions)
    forma-artifact-edit/  Edition IA d'un artefact existant (full ou sélection)
    forma-render/         Génération/édition d'image
  migrations/             Schéma + RLS + RPC
```

### Tools de l'agent (forma-agent)

- `web_search` — recherche internet (DuckDuckGo)
- `create_artifact` / `list_artifacts` — documents & tableurs
- `generate_image` — déclenche un render
- `remember` / `recall_memories` — mémoire `project` / `workspace` / `global`
- `list_projects` / `list_team_work` — visibilité inter-équipe
- `mention_member` — notification temps réel

---

## 🔁 Alternative : Gemini natif (sans OpenAI-compat)

Si tu préfères l'API native (`generateContent`), remplace dans chaque edge function le bloc `fetch(...chat/completions...)` par un adaptateur. Squelette :

```ts
async function callGemini(messages, model, key, tools?) {
  const contents = messages
    .filter(m => m.role !== "system")
    .map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const systemInstruction = messages.find(m => m.role === "system")?.content;

  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents, systemInstruction: { parts: [{ text: systemInstruction }] } }) }
  );
  return r.json();
}
```

Le streaming et le tool-calling Gemini ont une syntaxe différente — consulte https://ai.google.dev/api/generate-content.

---

## 🛠 Stack

- **Frontend** : React 18, Vite 5, TypeScript, Tailwind v3, shadcn/ui, react-router
- **Backend** : Supabase (Postgres + RLS + Auth + Storage + Edge Functions Deno)
- **IA** : Google Gemini (texte + image) via endpoint OpenAI-compat
- **Exports** : `docx`, `xlsx`, `jspdf`, `file-saver`, `html2canvas`

---

## 📝 Scripts

```bash
bun run dev        # serveur de dev
bun run build      # build prod
bun run preview    # preview du build
bun run test       # vitest
```

---

## 📦 Déploiement frontend

N'importe quel hébergeur statique (Vercel, Netlify, Cloudflare Pages) :
```bash
bun run build
# déploie le dossier dist/
```

N'oublie pas d'ajouter les `VITE_SUPABASE_*` dans les variables du host.

---

## 🆘 Troubleshooting

- **Agent ne répond pas / 500** → vérifie `supabase functions logs forma-agent` et que `AI_API_KEY` est bien set.
- **`AI key missing`** → secrets non déployés ; relance `supabase secrets set ...` puis redéploie les functions.
- **RLS denies** → l'utilisateur doit appartenir à un workspace (`workspace_members`). L'onboarding s'en charge.
- **Image generation vide** → l'endpoint OpenAI-compat de Gemini ne supporte pas toujours `modalities`. Passe à l'API native (section Alternative).

---

Bonne continuation ! 🏛️
