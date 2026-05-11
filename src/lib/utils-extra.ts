/**
 * @fileoverview Fonctions utilitaires supplémentaires pour FORMA
 * Ce module fournit des fonctions de formattage, manipulation de données,
 * et utilitaires UI utilisés à travers l'application.
 */

/**
 * Formate une date en locale française.
 * Convertit une date en chaîne lisible au format français par défaut
 * (ex: "25 décembre 2024"). Utilise Intl.DateTimeFormat pour le formattage.
 * @param {string|Date} date - Date à formater (string ISO ou objet Date)
 * @param {Intl.DateTimeFormatOptions} [options] - Options optionnelles de formattage Intl
 * @returns {string} Date formatée en français
 * @example
 * formatDate("2024-12-25"); // "25 décembre 2024"
 * @example
 * formatDate(new Date(), { year: 'numeric', month: '2-digit', day: '2-digit' }); // "10/05/2026"
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", options || {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

/**
 * Formate un temps relatif en français ("il y a X min").
 * Calcule la différence entre la date passée et maintenant, puis retourne
 * une chaîne lisible décrivant cette durée de manière humaine.
 * @param {string|Date} date - Date à comparer avec maintenant
 * @returns {string} Chaîne de temps relatif en français
 * @example
 * formatRelativeTime("2026-05-10T10:00:00Z"); // "à l'instant" si récent
 * formatRelativeTime("2026-05-10T09:00:00Z"); // "il y a 1h"
 * formatRelativeTime("2026-05-05T09:00:00Z"); // "il y a 5j"
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = Date.now();
  const diff = now - d.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  if (hours < 24) return `il y a ${hours}h`;
  if (days < 7) return `il y a ${days}j`;
  return formatDate(d);
}

/**
 * Formate un nombre avec les séparateurs français.
 * Utilise Intl.NumberFormat pour afficher les milliers avec des espaces
 * et la virgule comme séparateur décimal.
 * @param {number} num - Nombre à formater
 * @returns {string} Nombre formaté en locale française
 * @example
 * formatNumber(1234567); // "1 234 567"
 * formatNumber(1234.56); // "1 234,56"
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("fr-FR").format(num);
}

/**
 * Formate un montant en devise avec le symbole approprié.
 * Utilise Intl.NumberFormat pour un formattage correct (symbole, séparateurs).
 * @param {number} amount - Montant à formater
 * @param {string} [currency="EUR"] - Code devise ISO (EUR, USD, GBP, etc.)
 * @returns {string} Montant formaté avec le symbole de la devise
 * @example
 * formatCurrency(1234.56); // "1 234,56 €"
 * formatCurrency(1234.56, "USD"); // "1 234,56 $US"
 */
export function formatCurrency(amount: number, currency: string = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency
  }).format(amount);
}

/**
 * Formate une taille de fichier en bytes vers une chaîne lisible.
 * Convertit automatiquement vers l'unité appropriée (B, KB, MB, GB)
 * avec une décimale significative.
 * @param {number} bytes - Taille en bytes
 * @returns {string} Taille formatée avec unité
 * @example
 * formatFileSize(500); // "500,0 B"
 * formatFileSize(1536); // "1,5 KB"
 * formatFileSize(1048576); // "1,0 MB"
 */
export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Tronque un texte à une longueur maximale et ajoute "...".
 * Utile pour afficher des aperçus de texte long dans les listes ou cartes.
 * @param {string} text - Texte à tronquer
 * @param {number} maxLength - Longueur maximale autorisée (hors "...")
 * @returns {string} Texte tronqué avec "..." si nécessaire
 * @example
 * truncate("Ceci est un texte très long", 10); // "Ceci est..."
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Génère un ID aléatoire unique (13 caractères).
 * Utilise Math.random pour créer une chaîne alphanumérique.
 * À utiliser pour les identifiants temporaires côté client uniquement.
 * @returns {string} ID aléatoire de 13 caractères
 * @example
 * generateId(); // "abc123def456ghi"
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Crée une fonction debounced qui postpone l'exécution
 * jusqu'à ce que delay millisecondes se soient écoulées sans nouvel appel.
 * Utile pour limiter la fréquence d'appels API lors de la saisie utilisateur.
 * @template T - Type de la fonction à debouncer
 * @param {T} fn - Fonction à exécuter avec debounce
 * @param {number} delay - Délai d'attente en millisecondes
 * @returns {function} Fonction debounced qui accepte les mêmes paramètres que fn
 * @example
 * const debouncedSearch = debounce((query) => {
 *   API.search(query);
 * }, 300);
 * // Les appels consécutifs dans les 300ms ne thérapeut qu'un seul appel API
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Crée une copie profonde (deep clone) d'un objet via sérialisation JSON.
 * Attention: cette méthode ne gère pas les fonctions, dates, ou objets spéciaux.
 * @template T - Type de l'objet à cloner
 * @param {T} obj - Objet à cloner
 * @returns {T} Copie profonde de l'objet
 * @example
 * const original = { a: 1, b: { c: 2 } };
 * const clone = deepClone(original);
 * clone.b.c = 3;
 * original.b.c; // 2 (non modifié)
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Vérifie si un objet ne contient aucune propriété propre.
 * @param {object} obj - Objet à vérifier
 * @returns {boolean} true si l'objet n'a aucune clé, false sinon
 * @example
 * isEmpty({}); // true
 * isEmpty({ a: 1 }); // false
 */
export function isEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Helper pour construire des classes CSS conditionnelles.
 * Filtre les valeurs falsy (undefined, null, false) et joint les chaînes restantes.
 * @param {...(string|boolean|undefined|null)} classes - Classes à combiner
 * @returns {string} Chaîne de classes CSS jointe par un espace
 * @example
 * cn("btn", "btn-primary", isActive && "active", undefined);
 * // "btn btn-primary active" si isActive=true
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Regroupe les éléments d'un tableau par la valeur d'une clé.
 * Retourne un objet où chaque clé correspond à une valeur unique du champ groupé.
 * @template T - Type des éléments du tableau
 * @param {T[]} array - Tableau d'éléments à grouper
 * @param {keyof T} key - Nom de la propriété utilisée pour legroupement
 * @returns {Record<string, T[]>} Objet avec les éléments groupés par clé
 * @example
 * const users = [{ role: 'admin', name: 'Alice' }, { role: 'user', name: 'Bob' }];
 * groupBy(users, 'role'); // { admin: [Alice], user: [Bob] }
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((acc, item) => {
    const groupKey = String(item[key]);
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

/**
 * Trie un tableau par une propriété numérique ou string.
 * Crée une copie du tableau pour éviter de modifier l'original.
 * @template T - Type des éléments du tableau
 * @param {T[]} array - Tableau à trier
 * @param {keyof T} key - Propriété utilisée pour le tri
 * @param {"asc"|"desc"} [order="asc"] - Ordre de tri (ascendant ou descendant)
 * @returns {T[]} Nouveau tableau trié
 * @example
 * const items = [{ name: 'Charlie', age: 30 }, { name: 'Alice', age: 25 }];
 * sortBy(items, 'name'); // [Alice, Charlie]
 * sortBy(items, 'age', 'desc'); // [Charlie, Alice]
 */
export function sortBy<T>(array: T[], key: keyof T, order: "asc" | "desc" = "asc"): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return order === "asc" ? -1 : 1;
    if (aVal > bVal) return order === "asc" ? 1 : -1;
    return 0;
  });
}

/**
 * Copie un texte dans le presse-papiers du système.
 * Utilise l'API Clipboard du navigateur. Retourne un boolean indiquant le succès.
 * @param {string} text - Texte à copier
 * @returns {Promise<boolean>} true si la copie a réussi, false sinon
 * @example
 * const success = await copyToClipboard("Texte à copier");
 * if (success) console.log("Copié!");
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Déclenche le téléchargement d'un fichier dans le navigateur.
 * Crée un lien temporaire avec un objet Blob et le clique automatiquement.
 * Nettoie l'URL créée après le téléchargement.
 * @param {string} content - Contenu du fichier à télécharger
 * @param {string} filename - Nom du fichier téléchargé
 * @param {string} [type="text/plain"] - Type MIME du contenu
 * @returns {void}
 * @example
 * downloadFile("Bonjour le monde!", "hello.txt", "text/plain");
 */
export function downloadFile(content: string, filename: string, type: string = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Détecte le type d'appareil basé sur la largeur de la fenêtre du navigateur.
 * Utilisé pour adapter l'interface aux différents écrans (responsive design).
 * @returns {"mobile"|"tablet"|"desktop"} Type d'appareil détecté
 * @example
 * getDeviceType(); // "desktop" sur écran large, "mobile" sur téléphone
 */
export function getDeviceType(): "mobile" | "tablet" | "desktop" {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

/**
 * Vérifie si le navigateur est actuellement connecté à Internet.
 * Utilise la propriété navigator.onLine du navigateur.
 * @returns {boolean} true si connecté, false si hors ligne
 * @example
 * if (isOnline()) {
 *   // Faire les appels API
 * } else {
 *   // Afficher message hors ligne
 * }
 */
export function isOnline(): boolean {
  return navigator.onLine;
}