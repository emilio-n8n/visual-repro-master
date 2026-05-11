# FORMA — Updates pendant l'absence de Lovable

## Résumé

Plusieurs nouvelles fonctionnalités ont été ajoutées au projet FORMA. **Toutes les migrations SQL doivent être appliquées** pour que le frontend fonctionne correctement.

---

## 1. Nouvelles Tables SQL (à appliquer)

### Migration 1: `supabase/migrations/20260510120000_add_cloud_tables.sql`
- `favorites` — favoris synchronisés cloud
- `templates` — templates cloud
- `analytics` — tracking usage
- `activity_log` — historique des actions

### Migration 2: `supabase/migrations/20260510140000_add_advanced_features.sql`
- `project_tags` — tags sur les projets
- `project_deadlines` — deadlines avec dates
- `comments` — commentaires sur artifacts/rendus
- `share_links` — liens de partage expirables
- `presence` — présence utilisateurs temps réel
- `notifications` — colonnes `read_at` et `action_url`

---

## 2. Nouveaux Hooks (cloud-based)

Tous les hooks utilisent maintenant Supabase au lieu de localStorage :

- `src/hooks/useFavorites.tsx` — favoris cloud (supprime localStorage)
- `src/hooks/useTemplates.tsx` — templates cloud
- `src/hooks/useAnalytics.ts` — logging vers DB
- `src/hooks/useActivity.ts` — nouveau: audit trail
- `src/hooks/useTags.tsx` — gestion tags projets
- `src/hooks/useDeadlines.tsx` — gestion échéances
- `src/hooks/useComments.tsx` — gestion commentaires
- `src/hooks/useShareLinks.tsx` — création liens partage
- `src/hooks/usePresence.tsx` — présence utilisateurs
- `src/hooks/useNotifications.tsx` — centre notifications

---

## 3. Nouveaux Composants UI

- `src/components/PresenceIndicator.tsx` — affiche qui est en ligne
- `src/components/NotificationCenter.tsx` — hub central notifications
- `src/components/TagManager.tsx` — interface gestion tags
- `src/components/ShareButton.tsx` — partager artifacts/rendus
- `src/components/KanbanBoard.tsx` — vue Kanban projets
- `src/components/DeadlineCalendar.tsx` — vue Calendrier échéances

---

## 4. Améliorations App.tsx

Les nouveaux providers ont été ajoutés à l'arbre React :
```tsx
<NotificationsProvider>
  <PresenceProvider>
    <TagsProvider>
      <CommentsProvider>
        <ShareLinksProvider>
          <DeadlinesProvider>
```

---

## 5. Améliorations DashboardLayout

- Remplacé l'ancien système de notifications par `NotificationCenter`
- Ajouté `PresenceIndicator` dans la sidebar

---

## 6. Améliorations ArtifactPreview

- Ajouté `ShareButton` pour partager les livrables

---

## 7. Corrections de Bugs Précédentes

- **Studio.tsx** — refonte complète des 3 mini-studios (Document, Spreadsheet, HTML)
- **App.tsx** — ErrorBoundary, lazy loading, code splitting
- **Render.tsx** — fix null assertions, infinite re-renders
- **Agent.tsx** — try/catch, dedup artifactIds

---

## Instructions pour Lovable

1. **Appliquer les migrations** dans Supabase Dashboard → Migrations → Run
2. **Pusher le frontend** — le code est prêt et build correctement
3. **Déployer la fonction edge Mini Archi**:
   ```bash
   supabase functions deploy forma-archi-generator --no-verify-jwt
   ```
4. Les nouvelles features (Kanban, Calendar, Tags, etc.) sont prêtes à être utilisées
5. Tester la fonctionnalité Mini Archi: constraints → génération IA → 6 plans → sélection → vue 3D

---

## 8. Nouvelles Fonctionnalités Mini Archi

### a) Estimateur de Budget
- Calcul automatique basé sur la surface, nombre de pièces et niveau de budget
- Catégories: Gros œuvre, Second œuvre, Finitions, Extérieur, Honoraires
- 3 niveaux: économique, moyen, haut de gamme
- Affichage du total estimé

### b) Comparateur de Plans
- Permet de sélectionner 2 plans pour les comparer côte à côte
- Vue juxtaposée avec analyse comparative
- Accessible depuis la page des 6 propositions

### c) Export STL
- Bouton d'export pour impression 3D
- Intégration Three.js requise pour la génération réelle du fichier STL

---

## 9. Améliorations pour la Commercialisation

### SEO & Performance
- `public/manifest.json` — Manifest PWA pour installation mobile
- `public/sitemap.xml` — sitemap pour les moteurs de recherche
- `index.html` — Ajout de:
  - Canonical URL
  - JSON-LD Structured Data (Schema.org)
  - Preconnect pour Google Fonts
  - Theme color pour mobile
  - Apple touch icon

### Robustesse & Error Handling
- `src/components/ErrorBoundary.tsx` — Error boundaries réutilisables
- `src/components/Skeleton.tsx` — Composants de chargement skeleton
- `src/lib/api-utils.ts` — Utilitaires pour gestion d'erreurs API
- `src/components/OfflineIndicator.tsx` — Amélioré avec feedback de reconnexion

### UI/UX
- `App.tsx` — PageLoader amélioré avec spinner moderne
- `src/components/ThemeToggle.tsx` — Toggle dark/light mode
- `src/components/ExportMenu.tsx` — Menu export JSON/CSV
- `src/components/EmptyState.tsx` — États vides/loading/error
- `src/components/SkipLink.tsx` — Skip link accessibilité
- Keyboard shortcuts (Ctrl+K, Ctrl+G, etc.)

### i18n & Types
- `src/lib/i18n.ts` — Système i18n FR/EN avec detection navigateur
- `src/lib/types.ts` — Types TypeScript partagés pour tous les entités
- `src/hooks/useTheme.ts` — Hook pour gérer le thème dark/light
- `src/hooks/useKeyboardShortcuts.ts` — Raccourcis clavier globaux

### PWA Offline
- `public/sw.js` — Service Worker pour cache offline
- `main.tsx` — Enregistrement du Service Worker
- Améliorations manifest.json et index.html pour PWA

---

## Stack Actuelle

- Frontend: React 18 + Vite + TypeScript + Tailwind + shadcn/ui
- Backend: Supabase (Postgres + RLS + Auth + Storage + Edge Functions)
- IA: Google Gemini via OpenAI-compatible endpoint
- Exports: docx, xlsx, jspdf, file-saver, html2canvas

---

## 10. Fonctionnalités Upload & MCP (2026-05-11)

### Migration SQL à appliquer: `supabase/migrations/20260511160000_add_conversations_files_storage.sql`
- Bucket `conversations-files` — stockage des fichiers/uploads dans les conversations
- RLS policies: utilisateurs authentifiés peuvent uploader dans leur dossier `userId/`

### Nouveaux Hooks
- `src/hooks/useRenderMode.tsx` — Mode jour/nuit pour les renders
- `src/hooks/useUploadProgress.ts` — Suivi progression upload avec AbortController
- `src/hooks/useMCP.ts` — Intégration MCP tools
- `src/hooks/useArtifactVersions.ts` — Historique des versions d'artifacts
- `src/hooks/useCustomizableShortcuts.ts` — Raccourcis clavier personnalisables

### Nouveaux Composants
- `src/components/FileUploader.tsx` — Drag & drop pour images/fichiers (jpg, png, gif, webp, pdf)
- `src/components/RenderModeToggle.tsx` — Toggle jour/nuit avec icône Soleil/Lune
- `src/components/PresentationMode.tsx` — Vue plein écran avec navigation flèches (Ctrl+P)
- `src/components/MCPToolsPanel.tsx` — Panel de gestion des tools MCP

### Fonctionnalités MCP
- Templates prédéfinis: Filesystem, Web Search, Calculator, Slack, GitHub, Notion
- Configuration dans Settings → section "Outils MCP"
- Ajout/suppression/activation de serveurs MCP personnalisés

### Nouveaux Types
- `src/lib/mcp-types.ts` — Types MCP (MCPServer, MCPTool, MCPToolCall)
- `src/lib/mcp-config.ts` — Configuration et templates MCP
- `src/lib/keybindings.ts` — Configuration par défaut des raccourcis clavier

### Nouveaux Services
- `src/services/mcp-service.ts` — Service de connexion/exécution des tools MCP

---

## 11. Refactorisation & Optimisations (2026-05-11)

### Corrections
- **KanbanBoard.tsx** — Bug critique corrigé (useState utilisé comme useEffect)
- **api-utils.ts** — Conflit de nommage ApiError → FormaApiError

### Optimisations Performance
- `React.memo()` ajouté sur 7 composants (CommandPalette, ArtifactPreview, OfflineIndicator, ProjectSwitcher, DashboardLayout, KanbanBoard, MoodboardView)
- `useCallback` pour les handlers dans KanbanBoard

### Statut Final
- Tests: 75/75 passent
- Lint: 0 erreurs, 0 warnings
- Build: Réussi