# FORMA — Intelligence Architecturale pour Architectes

## Présentation du Produit

FORMA est une plateforme SaaS dédiée aux architectes qui combine deux axes forts :

1. **FORMA Render AI** — Génération de rendus photoréalistes à partir de plans 2D via IA
2. **FORMA Agent** — Assistant IA connecté pour automatiser les tâches quotidiennes (emails, calendrier, fichiers, projets)

---

## Fonctionnalités Principales

### 1. Landing Page (`/`)
- Design premium avec palette sombre (noir/ivoire/gold)
- Animations fluides (fade-in, blur reveal)
- Section hero, démos avant/après, grille fonctionnalités
- Tarifs et FAQ
- SEO complet (meta, JSON-LD, sitemap)
- Responsive mobile/desktop

### 2. Authentification (`/auth`)
- Login/Signup par email + mot de passe
- OAuth Google (via Supabase Auth)
- Mot de passe oublié / Reset
- Gestion de session sécurisée

### 3. Dashboard Principal (`/dashboard`)
- Sidebar avec navigation (Render, Agent, Projets, Intégrations, Paramètres, Billing)
- Workspace switcher pour gérer plusieurs cabinets
- Barre de raccourcis (Ctrl+K)
- Thème sombre par défaut

---

## FORMA Render AI

### Upload et Génération (`/dashboard/render`)
- **Drag & drop** d'images 3D (SketchUp, Revit, Rhino, Blender, ArchiCAD)
- **Contrôles de style** :
  - Moment de la journée (matin, midi, coucher de soleil, nuit)
  - Météo (ensoleillé, nuageux, pluie, neige)
  - Style architectural (moderne, classique, contemporain, méditerranéen...)
  - Type de vue (extérieur, intérieur, perspective, plan)
  -végétation, prompt personnalisé
- **Barre de progression** d'upload avec pourcentage
- **Mode jour/nuit** pour basculer entre rendu clair/sombre

### Historique et Gestion
- Galerie de rendus avec filtres
- Favoris cloud (synchronisés Supabase)
- Téléchargement en PNG/JPG
- Régénération avec nouveaux paramètres

### Mini Archi (`/dashboard/mini-archi`)
- Génération de plans par IA
- **Estimateur de budget** automatique (3 niveaux: économique, moyen, haut de gamme)
- **Comparateur de plans** (vue côte à côte de 2 plans)
- **Export STL** pour impression 3D
- Vue 3D interactive (Three.js)

---

## FORMA Agent

### Interface de Chat (`/dashboard/agent`)
- Interface de conversation type ChatGPT
- Liste des conversations dans la sidebar
- **Streaming des réponses** en temps réel
- Spécialisé en architecture française (PLU, RT/RE2020, BBC, HQE, BIM, IFC, DPE, SHON/SHOB)

### Outils MCP (Model Context Protocol)
- Templates prédéfinis :
  - Filesystem (lecture/écriture fichiers)
  - Web Search (recherche web)
  - Calculator (calculs)
  - Slack (notifications)
  - GitHub (gestion repo)
  - Notion (gestion notes)
- Personnalisable dans Settings → Outils MCP

### Upload de Fichiers
- **Drag & drop** d'images et documents
- Formats supportés : JPG, PNG, GIF, WEBP, PDF
- Bucket Supabase `conversations-files`
- Aperçu inline des images dans les messages

---

## Gestion de Projets

### Vue Kanban (`/dashboard`)
- Tableau Kanban pour les projets
- Colonnes personnalisables
- Drag & drop entre colonnes
- Tags colorés sur les projets

### Calendrier des Échéances
- Vue mensuelle des deadlines
- Notifications in-app
- Associations aux projets

### Tags
- Palette de 10 couleurs
- Attribution aux projets
- Filtrage par tag

---

## Fonctionnalités de Collaboration

### Comments et Partage
- Commentaires sur les artifacts/rendus
- **ShareLinks** — liens de partage expirables
- Présence en temps réel (qui est en ligne)

### Notifications
- Centre de notifications in-app
- Toast pour les événements importants
- Alertes hors ligne

---

## Historique et Versions

### Artifact Versions
- Bouton "Versions" dans Studio
- Sauvegarde automatique du contenu
- Modal pour lister et restaurer les versions précédentes
- Edge function dedicated pour la gestion

---

## Paramètres et Personnalisation

### Settings (`/dashboard/settings`)
- **Profil** : avatar, nom, locale
- **Workspace** : nom, membres, rôles
- **Intégrations** : Google (Gmail, Calendar, Drive), Slack, Notion
- **Raccourcis clavier** : Personnalisables (Ctrl+K, Ctrl+G, Ctrl+S, etc.)
- **Outils MCP** : Configurer les serveurs MCP
- **Billing** : Plans et factures

---

## Exports et Production

### Formats d'Export
- **DOCX** — Documents (paragraphes, tableaux, images)
- **XLSX** — Tableurs (feuilles de calcul, graphiques)
- **PDF** — Rapports (via jsPDF)
- **HTML** — Pages web responsives

### Batch Export
- Export ZIP de plusieurs artifacts
- Progression de l'export

---

## UI/UX

### Composants shadcn/ui
- Button, Dialog, Dropdown, Select
- Toast (sonner), Alert Dialog
- Tabs, Accordion, Calendar
- Data Table, Pagination
- Form avec validation Zod

### Thème FORMA
- **Fond** : `#0b0b0b` (quasi-noir)
- **Texte** : `#F0EAE0` (ivoire)
- **Accent** : `#C4A264` (gold)
- Hover : tout devient gold au survol

### Accessibilité
- Skip links
- Keyboard navigation
- Contraste respecté
- ARIA labels

---

## Technique

### Stack Frontend
- React 18 + Vite
- TypeScript
- Tailwind CSS
- shadcn/ui (Radix UI)
- TanStack Query
- React Router v6
- Recharts (graphiques)

### Backend (Supabase)
- **PostgreSQL** avec RLS (Row Level Security)
- **Auth** (email + Google OAuth)
- **Storage** (buckets pour renders, avatars, fichiers)
- **Edge Functions** (Deno/TypeScript)
- **Realtime** (subscriptions sur tables)

### Services IA
- **Google Gemini** via endpoint OpenAI-compatible
- Intégration MCP pour outils externes

### PWA
- Service Worker pour offline
- Manifest.json pour installation mobile
- Cache des assets statiques

---

## Variables d'Environnement

```env
VITE_SUPABASE_URL=https://hdklvkzefqirdhiangwz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=hdklvkzefqirdhiangwz
```

---

## Commandes

```bash
npm install      # Installer les dépendances
npm run dev      # Mode développement
npm run build    # Build production
npm run preview  # Prévisualisation production
npm run lint     # Linting ESLint
npm test         # Tests Vitest
```

---

## Déploiement

### GitHub Integration (Supabase)
1. Connecter le repo GitHub dans Supabase Dashboard
2. Choisir `main` comme production branch
3. Les migrations SQL s'appliquent automatiquement

### Edge Functions
```bash
supabase functions deploy
# ou individuellement :
supabase functions deploy forma-agent --no-verify-jwt
supabase functions deploy forma-archi-generator --no-verify-jwt
supabase functions deploy forma-artifact-edit --no-verify-jwt
supabase functions deploy forma-artifact-versions --no-verify-jwt
supabase functions deploy forma-render --no-verify-jwt
```

---

## Structure du Projet

```
visual-repro-master/
├── src/
│   ├── components/          # Composants React
│   │   ├── ui/              # Composants shadcn/ui
│   │   ├── FileUploader.tsx
│   │   ├── MCPToolsPanel.tsx
│   │   ├── PresentationMode.tsx
│   │   └── ...
│   ├── hooks/               # Hooks React (useFavorites, useMCP...)
│   ├── lib/                # Utilitaires (i18n, types, utils)
│   ├── pages/              # Pages (Dashboard, Agent, Render...)
│   │   └── dashboard/       # Pages du dashboard
│   ├── services/           # Services (MCP)
│   └── supabase/           # Client Supabase
├── supabase/
│   ├── functions/           # Edge Functions
│   │   ├── forma-agent/
│   │   ├── forma-archi-generator/
│   │   └── ...
│   └── migrations/         # Migrations SQL
├── public/                 # Assets publics (favicon, manifest, sw.js)
└── .env                    # Variables d'environnement
```

---

## Sécurité

- RLS sur toutes les tables PostgreSQL
- Vérification JWT sur les edge functions (sauf `forma-agent`)
- Tokens chiffrés pour les intégrations OAuth
- Sanitization des entrées utilisateur

---

## État Actuel (2026-05-13)

- ✅ Build production réussi
- ✅ 75/75 tests passent
- ✅ Lint: 0 erreurs
- ✅ 5 edge functions déployées
- ⚠️ Tables SQL appliquées via GitHub Integration
- ✅ Migration Lovable → Supabase personnel effectuée