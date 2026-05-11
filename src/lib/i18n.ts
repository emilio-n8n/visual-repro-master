/**
 * @fileoverview Utilitaires d'internationalisation (i18n) pour FORMA
 * Ce module gère la traduction de l'interface utilisateur entre le français et l'anglais,
 * avec détection automatique de la langue du navigateur et stockage local.
 */

/**
 * Clé de traduction représentant un identifiant de texte dans l'interface.
 * @typedef {string} TranslationKey
 * Format: "section.sous-section.texte" (ex: "nav.dashboard", "action.save")
 */

/**
 * Valeur de traduction correspondant au texte traduit dans une langue donnée.
 * @typedef {string} TranslationValue
 */

/**
 * Ensemble des traductions pour une langue spécifique.
 * Correspond à un objet JSON contenant toutes les clés-valeurs pour une locale.
 * @typedef {Record<TranslationKey, TranslationValue>} Translations
 */

const translations: Record<string, Translations> = {
  fr: {
    // Navigation
    "nav.dashboard": "Tableau de bord",
    "nav.render": "Rendus",
    "nav.agent": "Agent IA",
    "nav.settings": "Paramètres",
    "nav.archi": "Mini Archi",
    "nav.logout": "Se déconnecter",

    // Common actions
    "action.save": "Enregistrer",
    "action.cancel": "Annuler",
    "action.delete": "Supprimer",
    "action.edit": "Modifier",
    "action.create": "Créer",
    "action.export": "Exporter",
    "action.import": "Importer",
    "action.search": "Rechercher",
    "action.filter": "Filtrer",
    "action.refresh": "Actualiser",
    "action.retry": "Réessayer",
    "action.close": "Fermer",

    // Status
    "status.loading": "Chargement...",
    "status.saving": "Enregistrement...",
    "status.saved": "Enregistré",
    "status.error": "Erreur",
    "status.success": "Succès",
    "status.offline": "Hors ligne",
    "status.online": "En ligne",

    // Messages
    "error.generic": "Une erreur est survenue",
    "error.network": "Erreur de connexion",
    "error.notFound": "Élément non trouvé",
    "error.unauthorized": "Accès non autorisé",

    // Landing
    "landing.title": "FORMA — L'IA des architectes",
    "landing.subtitle": "Rendus 3D photoréalistes par IA",
    "landing.cta.getStarted": "Commencer gratuitement",
    "landing.cta.signIn": "Se connecter",

    // Dashboard
    "dashboard.welcome": "Bienvenue",
    "dashboard.projects": "Projets",
    "dashboard.renders": "Rendus",
    "dashboard.team": "Équipe",

    // Mini Archi
    "archi.title": "Créez votre maison",
    "archi.constraints": "Contraintes & Envie",
    "archi.generate": "Générer 6 plans",
    "archi.compare": "Comparer",
    "archi.budget": "Estimer le budget",
  },
  en: {
    "nav.dashboard": "Dashboard",
    "nav.render": "Render",
    "nav.agent": "AI Agent",
    "nav.settings": "Settings",
    "nav.archi": "Mini Archi",
    "nav.logout": "Logout",
    "action.save": "Save",
    "action.cancel": "Cancel",
    "action.delete": "Delete",
    "action.edit": "Edit",
    "action.create": "Create",
    "action.export": "Export",
    "action.import": "Import",
    "action.search": "Search",
    "action.filter": "Filter",
    "action.refresh": "Refresh",
    "action.retry": "Retry",
    "action.close": "Close",
    "status.loading": "Loading...",
    "status.saving": "Saving...",
    "status.saved": "Saved",
    "status.error": "Error",
    "status.success": "Success",
    "status.offline": "Offline",
    "status.online": "Online",
    "error.generic": "An error occurred",
    "error.network": "Connection error",
    "error.notFound": "Not found",
    "error.unauthorized": "Unauthorized",
    "landing.title": "FORMA — AI for Architects",
    "landing.subtitle": "AI-powered 3D photorealistic renders",
    "landing.cta.getStarted": "Get started free",
    "landing.cta.signIn": "Sign in",
    "dashboard.welcome": "Welcome",
    "dashboard.projects": "Projects",
    "dashboard.renders": "Renders",
    "dashboard.team": "Team",
    "archi.title": "Design your house",
    "archi.constraints": "Constraints & Wishes",
    "archi.generate": "Generate 6 plans",
    "archi.compare": "Compare",
    "archi.budget": "Estimate budget",
  },
};

/**
 * Détecte la langue du navigateur de l'utilisateur.
 * Extrait la langue principale du navigateur (ex: "fr" de "fr-FR") et vérifie
 * si elle est支持ée par l'application. Retourne "fr" par défaut si non supportée.
 * @returns {string} Code de langue supportée ("fr" ou "en")
 * @example
 * // En supposant que le navigateur est configuré en anglais américain
 * const lang = detectLanguage(); // "en"
 * @example
 * // Si le navigateur est en chinois (non supporté)
 * const lang = detectLanguage(); // "fr" (fallback)
 */
export function detectLanguage(): string {
  if (typeof window === "undefined") return "fr";

  const browserLang = navigator.language.split("-")[0];
  return translations[browserLang] ? browserLang : "fr";
}

/**
 * Récupère la langue actuellement active pour l'utilisateur.
 * Vérifie d'abord le stockage local (localStorage), puis utilise detectLanguage()
 * comme valeur par défaut. Retourne "fr" côté serveur (SSR).
 * @returns {string} Code de langue actuellement active
 * @example
 * // Retourne la langue sauvegardée ou détectée
 * const currentLang = getLanguage(); // "fr" ou "en"
 */
export function getLanguage(): string {
  if (typeof window === "undefined") return "fr";
  if (typeof localStorage === "undefined") return "fr";
  return localStorage.getItem("forma-language") || detectLanguage();
}

/**
 * Définit la langue de l'utilisateur et la persist dans le stockage local.
 * Cette fonction Met à jour la préférence de langue pour les prochaines visites.
 * Ne fait rien côté serveur (SSR) car localStorage n'est pas disponible.
 * @param {string} lang - Code de langue à activer ("fr" ou "en")
 * @returns {void}
 * @example
 * // Changer la langue en anglais
 * setLanguage("en");
 * // La prochaine requête getLanguage() retournera "en"
 */
export function setLanguage(lang: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("forma-language", lang);
}

/**
 * Fonction principale de traduction.
 * Retourne la traduction correspondant à la clé fournie dans la langue cible.
 * Si la traduction n'existe pas, retourne la clé elle-même (fallback).
 * Si la traduction n'existe pas dans la langue cible, fallback sur le français.
 * @param {string} key - Clé de traduction (format: "section.sous-section.texte")
 * @param {string} [lang] - Langue cible optionnelle (si non fournie, utilise la langue active)
 * @returns {string} Texte traduit ou clé originale si non trouvé
 * @example
 * // Traduction simple
 * t("nav.dashboard"); // "Tableau de bord" (si langue = fr)
 * @example
 * // Avec langue forcée
 * t("action.save", "en"); // "Save"
 * @example
 * // Clé inexistante retourne la clé itself
 * t("custom.key"); // "custom.key"
 */
export function t(key: string, lang?: string): string {
  const currentLang = lang || getLanguage();
  return translations[currentLang]?.[key] || translations["fr"]?.[key] || key;
}

/**
 * Hook React pour utiliser les traductions dans les composants.
 * Retourne un objet contenant la fonction de traduction, la langue actuelle,
 * et la fonction pour changer de langue. À utiliser dans les composants fonctionnels.
 * @returns {Object} Objet contenant les méthodes de traduction
 * @returns {function} t - Fonction de traduction (key: string, lang?: string) => string
 * @returns {string} language - Code de langue actuellement active
 * @returns {function} setLanguage - Fonction pour changer la langue (lang: string) => void
 * @example
 * // Dans un composant React
 * function Header() {
 *   const { t, language, setLanguage } = useTranslation();
 *   return (
 *     <nav>
 *       <span>{t("nav.dashboard")}</span>
 *       <button onClick={() => setLanguage("en")}>English</button>
 *     </nav>
 *   );
 * }
 */
export function useTranslation() {
  return { t, language: getLanguage(), setLanguage };
}

export default { t, getLanguage, setLanguage, detectLanguage, useTranslation };