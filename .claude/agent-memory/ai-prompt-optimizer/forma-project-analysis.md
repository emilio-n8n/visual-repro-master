---
name: FORMA project analysis
description: Analyse du projet FORMA - Edge Functions et prompts AI pour génération de plans architecturaux
type: project
---

# Analyse du Projet FORMA

## Travail Accompli

### 1. forma-archi-generator (Edge Function)

**Chemin**: `/home/emilio_developpeur/visual-repro-master/supabase/functions/forma-archi-generator/index.ts`

**Ce qui fonctionne**:
- Génère exactement 6 plans d'étage SVG différents
- System prompt détaillé en français avec règles SVG strictes
- Couleurs définies: murs #C4A264, sol #2a2a2a, texte #F0EAE0
- Parsing JSON avec 3 méthodes de fallback (direct, markdown, regex)
- Fallback SVG complet en cas d'erreur

**Configuration AI**:
- Modèle par défaut: `google/gemini-2.5-flash`
- Temperature: 0.9 (élevée, risque d'incohérence)
- Max tokens: 4000

### 2. MiniArchi.tsx (Frontend)

**Chemin**: `/home/emilio_developpeur/visual-repro-master/src/pages/dashboard/MiniArchi.tsx`

**Ce qui fonctionne**:
- Workflow complet en 6 étapes: contraintes → génération → plans → compare → budget → 3D
- Comparaison de 2 plans côte à côte avec analyse
- Estimation budgétaire détaillée (5 catégories: gros œuvre, second œuvre, finitions, extérieur, honoraires)
- Export STL placeholder avec alerte
- Graceful degradation avec SVG mock

---

## Suggestions d'Amélioration

### A. Prompts AI

**1. Améliorer le System Prompt de forma-archi-generator**

Le prompt actuel (lignes 11-44) est correct mais manque d'exemples. Suggestions:

```typescript
// Ajouter des exemples de plans dans le system prompt
const ARCHI_SYSTEM_PROMPT = `Tu es un architecte IA spécialisé dans la génération de plans d'étage résidentiels créatifs et fonctionnels.

Tâche: générer EXACTEMENT 6 plans d'étage différents en SVG, basés sur les contraintes du client.

EXEMPLES DE PLANS ACCEPTABLES:
- Plan Ouvert: espace salon/cuisine ouvert, chambres séparées
- Plan Classique: couloir central, pièces de chaque côté
- Plan en L: aile jour d'un côté, nuit de l'autre, patio
- Plan Circulaire: nucleus central, circulation autour
- Plan Biologique: formes organiques, maximum lumière
- Plan Compact: optimisation espace, open space

RÈGLES SVG TRÈS IMPORTANTES:
1. viewBox="0 0 100 100" OBLIGATOIRE
2. Couleurs précises: murs #C4A264, sol #2a2a2a, texte #F0EAE0
3. Labels lisibles pour chaque pièce
4. Style minimaliste architectural, pas de gradients

FORMAT DE RÉPONSE - JSON strict:
{"plans": [{"title": "...", "description": "...", "svg": "..."}]}`;
```

**2. Réduire la Temperature**

La temperature de 0.9 est trop élevée pour de la génération structurée. Recommandation: 0.7-0.8 pour un bon équilibre entre créativité et cohérence.

```typescript
// Ligne 131, remplacer:
temperature: 0.9,
// Par:
temperature: 0.7,
```

**3. Ajouter du Few-Shot Learning**

Inclure 1-2 exemples de plans dans le prompt pour guider le format de sortie.

**4. Validation JSON côté Edge Function**

Ajouter une validation stricte avec schema:

```typescript
// Après le parsing (ligne ~185), ajouter:
const schema = {
  type: "object",
  properties: {
    plans: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          svg: { type: "string" }
        },
        required: ["title", "description", "svg"]
      }
    }
  },
  required: ["plans"]
};
// Validator avec schema validate (si disponible) ou validation manuelle
```

---

### B. Edge Functions

**1. Timeout et Retry Logic**

Ajouter un timeout explicite et retry avec exponential backoff:

```typescript
// Dans MiniArchi.tsx, utiliser le hook useFetchWithTimeout existant
const { fetchWithTimeout } = useFetchWithTimeout(60000); // 60s timeout

const response = await fetchWithTimeout(url, {
  method: "POST",
  // ...
});

// Ajouter retry automatique:
let retries = 3;
while (retries > 0 && !response.ok) {
  await new Promise(r => setTimeout(r, 1000 * (4 - retries)));
  retries--;
}
```

**2. Logging Amélioré**

Ajouter plus de détails pour le debugging:

```typescript
// Dans forma-archi-generator
console.log("Request constraints:", { constraints, surface, rooms, budget });
console.log("User prompt length:", userPrompt.length);
console.log("AI response length:", content.length);
console.log("Parsed plans count:", plans?.plans?.length);
```

**3. Gestion d'Erreur Améliorée**

Messages d'erreur plus utiles pour l'utilisateur:

```typescript
// Remplacer les erreurs génériques par des messages spécifiques
return new Response(JSON.stringify({ 
  error: "La génération a échoué. Veuillez reformuler vos contraintes.",
  suggestion: "Essayez de préciser le nombre de chambres et la surface souhaitée."
}), { ... });
```

---

### C. MiniArchi.tsx - Améliorations UI/UX

**1. Suggestions de Contraintes**

Ajouter des suggestions intelligentes basée sur les champs:

```typescript
const constraintSuggestions = [
  "Terrain en pente avec vue sur...",
  "Orientation nord/sud...",
  "Famille avec enfants en bas âge...",
  "Bureau à domicile nécessaire...",
];

// Dans le placeholder de la Textarea:
placeholder="Ex: Terrain en pente, vue sur montagne au sud, famille avec 2 enfants..."
```

**2. Barre de Progression**

Afficher la progression de la génération:

```typescript
// État supplémentaire
const [progress, setProgress] = useState(0);

// Dans generatePlans:
setStep("generating");
setProgress(10); // Début
// Après appel API
setProgress(50); // Réponse reçue
setProgress(100); // Traitement terminé
```

**3. Métadonnées des Plans**

Calculer et afficher la superficie par pièce:

```typescript
// Après génération, ajouter pour chaque plan:
const calculateRoomArea = (svg: string) => {
  // Parser le SVG et calculer les surfaces approximatives
  // Retourner un objet { salon: "25m²", chambre1: "15m²", etc. }
};
```

**4. Export PDF du Budget**

Utiliser jsPDF ou react-pdf:

```typescript
import { jsPDF } from "jspdf";

const exportBudgetPDF = () => {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text("Estimation Budgétaire", 20, 20);
  // Ajouter les catégories et prix
  doc.save("estimation-budget.pdf");
};
```

**5. Intégration Three.js pour Vue 3D**

Remplacer le placeholder par une vraie implémentation:

```typescript
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function FloorPlan3D({ svg }) {
  // Convertir SVG en géométrie Three.js
  // Utiliser svg-loader ou parser manuellement
  return (
    <Canvas camera={{ position: [0, 5, 5] }}>
      <ambientLight />
      <mesh>...</mesh>
      <OrbitControls />
    </Canvas>
  );
}
```

---

### D. Structure de Mémoire à Sauvegarder

**Pourquoi ces informations sont pertinentes**: Le projet FORMA est en évolution constante avec des Edge Functions qui comunicarse avec différents modèles AI. Les configurations de prompts et les patterns d'erreur sont des informations utiles pour les sessions futures.

**Comment appliquer**: Ces suggestions doivent être implémentées progressivement, en commençant par les modifications de prompts (temperature, examples) qui ont le plus grand impact avec le moins de changements.

---

## Résumé des Priorités

| Priorité | Amélioration | Impact |
|----------|--------------|--------|
| Haute | Réduire temperature à 0.7 | Cohérence des plans |
| Haute | Validation JSON stricte | Moins d'erreurs de parsing |
| Moyenne | Timeout + retry frontend | Meilleure UX |
| Moyenne | Export PDF budget | Fonctionnalité attendue |
| Basse | Intégration Three.js | Complexe, à planifier |