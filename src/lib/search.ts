/**
 * @fileoverview Module de recherche full-text avec support fuzzy et index inversé
 * Ce fichier fournit les fonctions de recherche avec tolerance aux fautes de frappe,
 * construction d'index et filtrage par type pour l'application FORMA.
 */

import type { Project, Render, Artifact } from "./types";

/**
 * Type d'élément recherchable dans le système
 */
export type SearchableType = "project" | "render" | "file" | "page" | "action";

/**
 * Élément searchable avec tous les champs possibles
 */
export interface SearchableItem {
  id: string;
  type: SearchableType;
  title: string;
  content?: string;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  projectId?: string;
  prompt?: string;
}

/**
 * Résultat de recherche avec score et correspondances
 */
export interface SearchResult {
  item: SearchableItem;
  score: number;
  matches: {
    field: string;
    indices: number[][];
  }[];
}

/**
 * Filtres de recherche optionnels
 */
export interface SearchFilters {
  type?: SearchableType;
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
}

/**
 * Structure d'index inversé pour recherche rapide
 */
export interface SearchIndex {
  tokens: Map<string, Set<string>>;
  items: Map<string, SearchableItem>;
  typeIndex: Map<SearchableType, Set<string>>;
}

/**
 * Constantes de configuration de la recherche
 */
export const SEARCH_CONFIG = {
  /** Seuil de similarité pour la recherche fuzzy (0-1) */
  fuzzyThreshold: 0.7,
  /** Poids pour le titre dans le calcul du score */
  titleWeight: 2.0,
  /** Poids pour les tags dans le calcul du score */
  tagsWeight: 1.5,
  /** Poids pour le contenu dans le calcul du score */
  contentWeight: 1.0,
  /** Nombre maximum de résultats */
  maxResults: 50,
  /** Nombre maximum d'historique */
  maxHistory: 10,
  /** Clé localStorage pour l'historique */
  historyKey: "forma_search_history",
};

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 * @param a Première chaîne
 * @param b Deuxième chaîne
 * @returns Distance de Levenshtein
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calcule la similarité entre deux chaînes (0-1)
 * @param a Première chaîne
 * @param b Deuxième chaîne
 * @returns Score de similarité
 */
function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const maxLength = Math.max(a.length, b.length);
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  return 1 - distance / maxLength;
}

/**
 * Tokenise une chaîne en mots
 * @param text Texte à tokeniser
 * @returns Tableau de tokens
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

/**
 * Cherche les indices de correspondance dans un texte
 * @param text Texte à rechercher
 * @param query Query de recherche
 * @returns Indices de début et fin des correspondances
 */
function findMatchIndices(text: string, query: string): number[][] {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const indices: number[][] = [];
  let start = 0;

  while (true) {
    const index = lowerText.indexOf(lowerQuery, start);
    if (index === -1) break;
    indices.push([index, index + query.length]);
    start = index + 1;
  }

  return indices;
}

/**
 * Construit un index inversé à partir d'une liste d'éléments
 * @param items Liste d'éléments à indexer
 * @returns Index de recherche
 */
export function buildSearchIndex(items: SearchableItem[]): SearchIndex {
  const index: SearchIndex = {
    tokens: new Map(),
    items: new Map(),
    typeIndex: new Map(),
  };

  for (const item of items) {
    index.items.set(item.id, item);

    // Index par type
    if (!index.typeIndex.has(item.type)) {
      index.typeIndex.set(item.type, new Set());
    }
    index.typeIndex.get(item.type)!.add(item.id);

    // Index par tokens
    const titleTokens = tokenize(item.title);
    const contentTokens = item.content ? tokenize(item.content) : [];
    const tagsTokens = item.tags ? item.tags.map((t) => t.toLowerCase()) : [];
    const allTokens = [...titleTokens, ...contentTokens, ...tagsTokens];

    for (const token of allTokens) {
      if (!index.tokens.has(token)) {
        index.tokens.set(token, new Set());
      }
      index.tokens.get(token)!.add(item.id);
    }
  }

  return index;
}

/**
 * Recherche fuzzy avec tolerance aux fautes de frappe
 * @param query Texte de recherche
 * @param items Éléments à rechercher
 * @param threshold Seuil de similarité (optionnel)
 * @returns Résultats triés par score
 */
export function fuzzySearch(
  query: string,
  items: SearchableItem[],
  threshold: number = SEARCH_CONFIG.fuzzyThreshold
): SearchResult[] {
  if (!query.trim()) return [];

  const results: SearchResult[] = [];
  const queryTokens = tokenize(query);

  for (const item of items) {
    const matches: { field: string; indices: number[][] }[] = [];
    let totalScore = 0;

    // Recherche dans le titre (poids le plus élevé)
    const titleSimilarity = stringSimilarity(item.title, query);
    if (titleSimilarity >= threshold) {
      totalScore += titleSimilarity * SEARCH_CONFIG.titleWeight;
      matches.push({
        field: "title",
        indices: findMatchIndices(item.title, query),
      });
    } else {
      // Recherche par tokens avec fuzzy
      for (const queryToken of queryTokens) {
        for (const titleToken of tokenize(item.title)) {
          const tokenSim = stringSimilarity(titleToken, queryToken);
          if (tokenSim >= threshold) {
            totalScore += tokenSim * SEARCH_CONFIG.titleWeight * 0.5;
            break;
          }
        }
      }
    }

    // Recherche dans les tags
    if (item.tags) {
      for (const tag of item.tags) {
        const tagSimilarity = stringSimilarity(tag, query);
        if (tagSimilarity >= threshold) {
          totalScore += tagSimilarity * SEARCH_CONFIG.tagsWeight;
          matches.push({
            field: "tags",
            indices: findMatchIndices(tag, query),
          });
        }
      }
    }

    // Recherche dans le contenu
    if (item.content) {
      const contentLower = item.content.toLowerCase();
      const queryLower = query.toLowerCase();
      if (contentLower.includes(queryLower)) {
        totalScore += SEARCH_CONFIG.contentWeight;
        matches.push({
          field: "content",
          indices: findMatchIndices(item.content, query),
        });
      } else {
        for (const queryToken of queryTokens) {
          for (const contentToken of tokenize(item.content)) {
            const tokenSim = stringSimilarity(contentToken, queryToken);
            if (tokenSim >= threshold) {
              totalScore += tokenSim * SEARCH_CONFIG.contentWeight * 0.3;
              break;
            }
          }
        }
      }
    }

    if (totalScore > 0) {
      results.push({
        item,
        score: totalScore,
        matches,
      });
    }
  }

  // Fallback: recherche exacte si pas de résultats fuzzy
  if (results.length === 0) {
    const exactLower = query.toLowerCase();
    for (const item of items) {
      if (
        item.title.toLowerCase().includes(exactLower) ||
        item.content?.toLowerCase().includes(exactLower) ||
        item.tags?.some((t) => t.toLowerCase().includes(exactLower))
      ) {
        results.push({
          item,
          score: 1,
          matches: [],
        });
      }
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, SEARCH_CONFIG.maxResults);
}

/**
 * Filtre les résultats par type
 * @param results Résultats de recherche
 * @param type Type à filtrer
 * @returns Résultats filtrés
 */
export function filterByType(
  results: SearchResult[],
  type: SearchableType
): SearchResult[] {
  return results.filter((r) => r.item.type === type);
}

/**
 * Recherche par type spécifique
 * @param items Éléments à rechercher
 * @param query Texte de recherche
 * @param type Type de filtre
 * @param threshold Seuil de similarité
 * @returns Résultats filtrés par type
 */
export function searchByType(
  items: SearchableItem[],
  query: string,
  type: SearchableType,
  threshold: number = SEARCH_CONFIG.fuzzyThreshold
): SearchResult[] {
  const filteredItems = items.filter((item) => item.type === type);
  return fuzzySearch(query, filteredItems, threshold);
}

/**
 * Recherche principale avec filtres optionnels
 * @param query Texte de recherche
 * @param items Éléments à rechercher
 * @param filters Filtres optionnels
 * @returns Résultats de recherche
 */
export function search(
  query: string,
  items: SearchableItem[],
  filters?: SearchFilters
): SearchResult[] {
  let results = fuzzySearch(query, items, filters?.type ? 0.6 : SEARCH_CONFIG.fuzzyThreshold);

  // Appliquer les filtres
  if (filters?.type) {
    results = filterByType(results, filters.type);
  }

  if (filters?.dateFrom) {
    results = results.filter(
      (r) => r.item.createdAt && r.item.createdAt >= filters.dateFrom!
    );
  }

  if (filters?.dateTo) {
    results = results.filter(
      (r) => r.item.createdAt && r.item.createdAt <= filters.dateTo!
    );
  }

  if (filters?.tags && filters.tags.length > 0) {
    results = results.filter(
      (r) => r.item.tags?.some((t) => filters.tags!.includes(t))
    );
  }

  return results;
}

/**
 * Convertit les données du projet en éléments searchables
 * @param projects Liste des projets
 * @param renders Liste des rendus
 * @param artifacts Liste des artefacts
 * @returns Éléments searchables combinés
 */
export function combineSearchableItems(
  projects: Project[],
  renders: Render[],
  artifacts: Artifact[]
): SearchableItem[] {
  const items: SearchableItem[] = [];

  // Ajouter les projets
  for (const project of projects) {
    items.push({
      id: project.id,
      type: "project",
      title: project.name,
      content: project.description,
      tags: project.tags,
      createdAt: new Date(project.created_at),
      updatedAt: new Date(project.updated_at),
    });
  }

  // Ajouter les rendus
  for (const render of renders) {
    items.push({
      id: render.id,
      type: "render",
      title: render.title,
      content: render.prompt,
      createdAt: new Date(render.created_at),
      projectId: render.project_id,
    });
  }

  // Ajouter les artefacts comme fichiers
  for (const artifact of artifacts) {
    items.push({
      id: artifact.id,
      type: "file",
      title: artifact.title,
      content: artifact.content.substring(0, 500),
      createdAt: new Date(artifact.created_at),
      updatedAt: new Date(artifact.updated_at),
      projectId: artifact.project_id,
    });
  }

  return items;
}

/**
 * Groupe les résultats par type
 * @param results Résultats à grouper
 * @returns Map des résultats par type
 */
export function groupResultsByType(
  results: SearchResult[]
): Map<SearchableType, SearchResult[]> {
  const grouped = new Map<SearchableType, SearchResult[]>();

  for (const result of results) {
    const type = result.item.type;
    if (!grouped.has(type)) {
      grouped.set(type, []);
    }
    grouped.get(type)!.push(result);
  }

  return grouped;
}

// ============ Gestion de l'historique ============

/**
 * Charge l'historique des recherches depuis localStorage
 * @returns Tableau de requêtes précédentes
 */
export function loadSearchHistory(): string[] {
  try {
    const stored = localStorage.getItem(SEARCH_CONFIG.historyKey);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Sauvegarde une requête dans l'historique
 * @param query Requête à sauvegarder
 */
export function saveSearchToHistory(query: string): void {
  if (!query.trim()) return;

  try {
    const history = loadSearchHistory();
    const filtered = history.filter((q) => q !== query);
    const updated = [query, ...filtered].slice(0, SEARCH_CONFIG.maxHistory);
    localStorage.setItem(SEARCH_CONFIG.historyKey, JSON.stringify(updated));
  } catch {
    // Silencieux si localStorage non disponible
  }
}

/**
 * Efface l'historique des recherches
 */
export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(SEARCH_CONFIG.historyKey);
  } catch {
    // Silencieux
  }
}

/**
 * Supprime une requête spécifique de l'historique
 * @param query Requête à supprimer
 */
export function removeFromHistory(query: string): void {
  try {
    const history = loadSearchHistory();
    const updated = history.filter((q) => q !== query);
    localStorage.setItem(SEARCH_CONFIG.historyKey, JSON.stringify(updated));
  } catch {
    // Silencieux
  }
}