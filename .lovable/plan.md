## Objectif

Afficher, directement dans le chat Agent IA, la liste des types de livrables que l'agent peut générer, pour que l'utilisateur sache ce qu'il peut demander.

## Ce que je vais faire

Dans `src/pages/dashboard/Agent.tsx`, ajouter un bloc "Livrables disponibles" visible :

1. **Sur l'écran vide** (quand aucune conversation active ou 0 message) : une grille de cartes cliquables, une par type d'artifact, avec icône + libellé + courte description. Cliquer pré-remplit le champ de saisie avec un prompt d'exemple (ex. "Crée un diaporama de présentation du projet…").

2. **Sous le composer en permanence** : une ligne discrète de "puces" (chips) listant les mêmes types, cliquables pour insérer le prompt rapide.

### Types listés (déjà supportés par l'edge function `forma-agent`)

- Document (texte/HTML)
- Tableur (CSV)
- Diaporama (slides HTML)
- Visualisation de données (dataviz)
- Site web (HTML)
- Moodboard (images IA)
- Rendu 3D / image (create_render)

## Détails techniques

- Pas de changement backend — les outils existent déjà côté `forma-agent`.
- Nouveau composant local `ArtifactQuickActions` dans `Agent.tsx` (ou fichier séparé `src/components/ArtifactQuickActions.tsx`).
- Réutiliser les icônes Lucide déjà importées dans `ArtifactPreview.tsx` pour la cohérence visuelle.
- Style accordé à la charte existante (tons `#C4A264` / `#F0EAE0` sur fond sombre).

Aucune modification de la base de données, des migrations ou des edge functions.
