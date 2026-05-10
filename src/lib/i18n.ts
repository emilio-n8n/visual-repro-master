// Internationalization utilities for FORMA

type TranslationKey = string;
type TranslationValue = string;
type Translations = Record<TranslationKey, TranslationValue>;

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

// Detect browser language
export function detectLanguage(): string {
  if (typeof window === "undefined") return "fr";

  const browserLang = navigator.language.split("-")[0];
  return translations[browserLang] ? browserLang : "fr";
}

// Get current language (from localStorage or default)
export function getLanguage(): string {
  if (typeof window === "undefined") return "fr";
  return localStorage.getItem("forma-language") || detectLanguage();
}

// Set language
export function setLanguage(lang: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("forma-language", lang);
}

// Translation function
export function t(key: string, lang?: string): string {
  const currentLang = lang || getLanguage();
  return translations[currentLang]?.[key] || translations["fr"]?.[key] || key;
}

// Hook for using translations in components
export function useTranslation() {
  return { t, language: getLanguage(), setLanguage };
}

export default { t, getLanguage, setLanguage, detectLanguage, useTranslation };