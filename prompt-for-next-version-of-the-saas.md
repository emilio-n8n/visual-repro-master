# PROMPT — FORMA v2.0

## 🎯 Objectif

Tu vas construire **FORMA v2**, une plateforme SaaS pour architectes combinant Render AI et Agent IA. Le projet est un scaffold React/Vite/TypeScript avec Supabase.

---

## 🏗️ Stack Technique

```
Frontend:     React 18 + Vite + TypeScript + Tailwind + shadcn/ui
Backend:      Supabase (PostgreSQL + Auth + Storage + Edge Functions)
IA:           Google Gemini (via OpenAI-compatible endpoint)
3D:           Three.js (@react-three/fiber, @react-three/drei)
Tests:        Vitest + React Testing Library
Linting:      ESLint + TypeScript
```

---

## 📋 Structure du Projet

```
src/
├── components/
│   ├── ui/                    # shadcn/ui (Button, Dialog, Select, etc.)
│   ├── FileUploader.tsx       # Upload images/docs dans conversations
│   ├── MCPToolsPanel.tsx      # Panel tools MCP
│   ├── PresentationMode.tsx   # Vue plein écran renders
│   ├── RenderModeToggle.tsx   # Toggle jour/nuit
│   └── ...
├── hooks/
│   ├── useAuth.tsx            # Authentification
│   ├── useMCP.ts              # Gestion MCP tools
│   ├── useArtifactVersions.ts # Historique versions
│   └── ...
├── lib/
│   ├── i18n.ts               # Internationalisation FR/EN
│   ├── types.ts              # Types TypeScript globaux
│   ├── mcp-types.ts          # Types MCP
│   └── mcp-config.ts         # Config MCP templates
├── pages/
│   ├── Index.tsx             # Landing page
│   ├── Auth.tsx              # Login/Signup
│   └── dashboard/
│       ├── DashboardLayout.tsx
│       ├── Render.tsx        # Render AI
│       ├── Agent.tsx         # Agent IA
│       ├── MiniArchi.tsx     # Génération plans
│       ├── Settings.tsx      # Paramètres
│       └── ...
└── services/
    └── mcp-service.ts        # Service MCP

supabase/
├── functions/                # Edge Functions (Deno)
│   ├── forma-agent/
│   ├── forma-archi-generator/
│   └── ...
└── migrations/             # SQL migrations
```

---

## 🎨 Design System FORMA

### Couleurs
```css
--background: #0b0b0b      /* Noir quasi-total */
--foreground: #F0EAE0     /* Ivoire */
--primary: #C4A264        /* Gold */
--primary-foreground: #0b0b0b
--secondary: #1a1a1a
--muted: #2a2a2a
--border: #C4A264/20
```

### Règle UX
- **TOUS les hover** passent en `#C4A264` (gold), JAMAIS en blanc
- Fond sombre systématique
- Composants shadcn/ui stylisés pour le thème sombre

---

## ✅ Checklist des Fonctionnalités Implémentées

### Auth & Dashboard
- [x] Auth email/password + Google OAuth
- [x] Workspace multi-utilisateurs
- [x] Sidebar navigation (Render, Agent, Projets, Intégrations, Settings, Billing)
- [x] Command palette (Ctrl+K)

### FORMA Render AI
- [x] Upload drag & drop images 3D
- [x] Contrôles style (jour/nuit, météo, style architectural)
- [x] Barre progression upload avec %
- [x] Mode jour/nuit toggle
- [x] Galerie history + favoris
- [x] Download PNG/JPG

### Mini Archi
- [x] Génération 6 plans par IA
- [x] Estimateur budget (économique/moyen/haut de gamme)
- [x] Comparateur 2 plans côte à côte
- [x] Export STL
- [x] Vue 3D interactive (Three.js)

### FORMA Agent
- [x] Chat UI avec streaming réponses
- [x] Spécialisation architecture française (PLU, RT/RE2020, BBC, etc.)
- [x] Upload fichiers/images dans conversations
- [x] MCP tools (Filesystem, Web Search, Calculator, Slack, GitHub, Notion)
- [x] Configuration MCP dans Settings

### Projets & Collaboration
- [x] Vue Kanban
- [x] Calendrier échéances
- [x] Tags colorés (10 couleurs)
- [x] Comments sur artifacts
- [x] ShareLinks expirables
- [x] Présence temps réel

### Versions & Export
- [x] Artifact versions (save/restore)
- [x] Export DOCX, XLSX, PDF, HTML
- [x] Batch export ZIP
- [x] Presentation mode (plein écran)

### Paramètres
- [x] Profil utilisateur
- [x] Gestion workspace/membres
- [x] Intégrations OAuth (Google, Slack, Notion)
- [x] Raccourcis clavier personnalisables
- [x] Outils MCP (config servers)

### SEO & PWA
- [x] Meta tags, JSON-LD, sitemap
- [x] Manifest PWA
- [x] Service Worker offline

---

## 🔧 Commandes Utiles

```bash
npm install           # Dépendances
npm run dev           # Développement
npm run build         # Build production
npm run lint          # ESLint
npm test              # Tests Vitest
npm run preview       # Preview production

# Déployer edge functions
npx supabase functions deploy --project-ref <PROJECT_REF>
```

---

## 📄 Variables d'Environnement

```env
VITE_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=<PROJECT_REF>
```

---

## 🚀 Instructions de Déploiement

### 1. Supabase Setup
- Créer un projet Supabase
- Activer GitHub Integration
- Appliquer les migrations SQL automatiquement via GitHub

### 2. Edge Functions
```bash
supabase functions deploy forma-agent --no-verify-jwt
supabase functions deploy forma-archi-generator --no-verify-jwt
supabase functions deploy forma-artifact-edit --no-verify-jwt
supabase functions deploy forma-artifact-versions --no-verify-jwt
supabase functions deploy forma-render --no-verify-jwt
```

### 3. Storage
- Créer bucket `conversations-files` (public)
- Configurer RLS policies

---

## 🔄 Points d'Attention

### Design
- **TOUJOURS** tester les hover — interdit d'avoir du blanc
- Utiliser les variables CSS du thème sombre
- Respecter la palette gold (#C4A264)

### Tables Supabase
- Toutes les tables doivent avoir du **try/catch** dans les hooks pour gérer l'absence de table (retourne 404 si pas encore migrée)

### Service Worker
- Skip les requêtes non-GET et les appels API Supabase pour éviter les erreurs de cache

### Tests
- Maintenir 75+ tests qui passent
- Tests sur i18n (formatage français)

---

## 📝 Structure TypeScript Importante

```typescript
// Types des artifacts
type Artifact = {
  id: string;
  type: "slideshow" | "spreadsheet" | "dataviz" | "website" | "document" | "moodboard";
  title: string;
  content: string;
  mime_type: string;
};

// Types MCP
interface MCPServer {
  id: string;
  name: string;
  command: string;
  enabled: boolean;
}
```

---

## 💡 Idées d'Amélioration Future

- Voice input pour l'agent
- Export vidéo des renders
- Intégrations CRM Architects (Archicad, Revit)
- Mode collaboration temps réel
- Dashboard analytics avancé
- Gamification (badges, achievements)
- Templates de projets architecturaux

---

## 📞 Support

Pour toute question sur le code existant, consulter :
- `REPRODUCE.md` — Documentation complète
- `LOVABLE_UPDATES.md` — Historique des mises à jour
- `.env` — Configuration actuelle