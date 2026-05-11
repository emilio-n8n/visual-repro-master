/**
 * @fileoverview Types partagés pour l'application FORMA
 * Ce fichier définit toutes les interfaces TypeScript utilisées dans l'application,
 * notamment pour les utilisateurs, espaces de travail, projets, rendu 3D, et autres entités.
 */

/**
 * Types relatifs aux utilisateurs
 * Représente les données d'un utilisateur connecté dans la plateforme FORMA.
 * @typedef {Object} User
 * @property {string} id - Identifiant unique de l'utilisateur (UUID)
 * @property {string} email - Adresse email de l'utilisateur (unique)
 * @property {string} created_at - Date de création du compte au format ISO
 * @property {Object} [user_metadata] - Métadonnées optionnelles du profil
 * @property {string} [user_metadata.full_name] - Nom complet de l'utilisateur
 * @property {string} [user_metadata.avatar_url] - URL de l'avatar
 */
export interface User {
  id: string;
  email: string;
  created_at: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

/**
 * Types relatifs aux espaces de travail (Workspaces)
 * Un workspace représente un environnement collaboratif contenant des projets et des membres.
 * @typedef {Object} Workspace
 * @property {string} id - Identifiant unique du workspace
 * @property {string} name - Nom du workspace
 * @property {string} created_at - Date de création au format ISO
 * @property {string} owner_id - ID de l'utilisateur propriétaire du workspace
 * @property {WorkspaceMember[]} [members] - Liste des membres du workspace
 */

/**
 * Représente un membre d'un workspace avec son rôle.
 * @typedef {Object} WorkspaceMember
 * @property {string} user_id - ID de l'utilisateur
 * @property {"owner"|"admin"|"member"} role - Rôle du membre dans le workspace
 * @property {User} [user] - Objet utilisateur complet (optionnel, hydrate si besoin)
 */
export interface Workspace {
  id: string;
  name: string;
  created_at: string;
  owner_id: string;
  members?: WorkspaceMember[];
}

export interface WorkspaceMember {
  user_id: string;
  role: "owner" | "admin" | "member";
  user?: User;
}

/**
 * Types relatifs aux projets
 * Un projet est un conteneur qui appartient à un workspace et contient des rendus.
 * @typedef {Object} Project
 * @property {string} id - Identifiant unique du projet
 * @property {string} workspace_id - ID du workspace parent
 * @property {string} name - Nom du projet
 * @property {string} [description] - Description optionnelle du projet
 * @property {string} created_at - Date de création au format ISO
 * @property {string} updated_at - Date de dernière modification au format ISO
 * @property {string[]} [tags] - Liste des tags associés au projet
 */
export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
}

/**
 * Types relatifs aux rendus 3D
 * Un render représente une image générée par IA à partir d'un prompt.
 * @typedef {Object} Render
 * @property {string} id - Identifiant unique du rendu
 * @property {string} project_id - ID du projet parent
 * @property {string} user_id - ID de l'utilisateur qui a demandé le rendu
 * @property {string} title - Titre du rendu
 * @property {string} prompt - Prompt utilisé pour générer le rendu
 * @property {"pending"|"processing"|"completed"|"failed"} status - Statut actuel du rendu
 * @property {string} [image_url] - URL de l'image générée (une fois completed)
 * @property {string} created_at - Date de création de la demande de rendu
 */

/**
 * Types relatifs aux artefacts
 * Un artefact est un document généré par l'agent IA (document, spreadsheet, HTML).
 * @typedef {Object} Artifact
 * @property {string} id - Identifiant unique de l'artefact
 * @property {"document"|"spreadsheet"|"html"} type - Type de contenu de l'artefact
 * @property {string} title - Titre de l'artefact
 * @property {string} content - Contenu de l'artefact (format dépend du type)
 * @property {string} [project_id] - ID du projet associé (optionnel)
 * @property {string} created_at - Date de création au format ISO
 * @property {string} updated_at - Date de dernière modification au format ISO
 */

/**
 * Types relatifs aux tâches d'agent IA
 * Une tâche d'agent représente une demande de traitement par l'IA.
 * @typedef {Object} AgentTask
 * @property {string} id - Identifiant unique de la tâche
 * @property {string} user_id - ID de l'utilisateur qui a lancé la tâche
 * @property {string} prompt - Prompt ou instructions pour l'agent
 * @property {"pending"|"processing"|"completed"|"failed"} status - Statut de la tâche
 * @property {string} [result] - Résultat retourné par l'agent (si completed)
 * @property {Artifact[]} [artifacts] - Artefacts générés par la tâche
 * @property {string} created_at - Date de création de la tâche
 */
export interface Render {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  prompt: string;
  status: "pending" | "processing" | "completed" | "failed";
  image_url?: string;
  created_at: string;
}

// Artifact types
export interface Artifact {
  id: string;
  type: "document" | "spreadsheet" | "html";
  title: string;
  content: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
}

// Agent types
export interface AgentTask {
  id: string;
  user_id: string;
  prompt: string;
  status: "pending" | "processing" | "completed" | "failed";
  result?: string;
  artifacts?: Artifact[];
  created_at: string;
}

/**
 * Types relatifs aux notifications
 * Une notification informe l'utilisateur d'un événement dans la plateforme.
 * @typedef {Object} Notification
 * @property {string} id - Identifiant unique de la notification
 * @property {string} user_id - ID de l'utilisateur destinataire
 * @property {"info"|"success"|"warning"|"error"} type - Type de notification (détermine l'icône)
 * @property {string} title - Titre de la notification
 * @property {string} message - Corps du message de la notification
 * @property {string} [read_at] - Date de lecture de la notification (si lue)
 * @property {string} [action_url] - URL vers laquelle naviguer au clic (optionnel)
 * @property {string} created_at - Date d'émission de la notification
 */

/**
 * Types relatifs aux commentaires
 * Un commentaire peut être attaché à un artefact ou un rendu.
 * @typedef {Object} Comment
 * @property {string} id - Identifiant unique du commentaire
 * @property {string} user_id - ID de l'auteur du commentaire
 * @property {string} [artifact_id] - ID de l'artefact commenté (optionnel)
 * @property {string} [render_id] - ID du rendu commenté (optionnel)
 * @property {string} content - Contenu textuel du commentaire
 * @property {string} created_at - Date de création du commentaire
 * @property {User} [user] - Objet auteur complet (optionnel)
 */

/**
 * Types relatifs aux liens de partage
 * Un shareLink permet de partager un artefact ou rendu publiquement.
 * @typedef {Object} ShareLink
 * @property {string} id - Identifiant unique du lien de partage
 * @property {string} [artifact_id] - ID de l'artefact partagé (optionnel)
 * @property {string} [render_id] - ID du rendu partagé (optionnel)
 * @property {string} token - Jeton unique pour accéder au lien
 * @property {string} [expires_at] - Date d'expiration du lien (optionnel)
 * @property {string} created_by - ID de l'utilisateur qui a créé le lien
 * @property {string} created_at - Date de création du lien
 */

/**
 * Types relatifs aux tags
 * Un tag permet de catégoriser des éléments dans un workspace.
 * @typedef {Object} Tag
 * @property {string} id - Identifiant unique du tag
 * @property {string} name - Nom affiché du tag
 * @property {string} color - Code couleur hexadécimal du tag
 * @property {string} workspace_id - ID du workspace auquel appartient le tag
 */

/**
 * Types relatifs aux échéances
 * Une deadline représente une date limite associée à un projet.
 * @typedef {Object} Deadline
 * @property {string} id - Identifiant unique de l'échéance
 * @property {string} project_id - ID du projet associé
 * @property {string} title - Titre ou description de l'échéance
 * @property {string} due_date - Date d'échéance au format ISO
 * @property {boolean} completed - Indique si l'échéance est atteinte
 * @property {string} created_at - Date de création de l'échéance
 */
export interface Notification {
  id: string;
  user_id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  read_at?: string;
  action_url?: string;
  created_at: string;
}

// Comment types
export interface Comment {
  id: string;
  user_id: string;
  artifact_id?: string;
  render_id?: string;
  content: string;
  created_at: string;
  user?: User;
}

// Share link types
export interface ShareLink {
  id: string;
  artifact_id?: string;
  render_id?: string;
  token: string;
  expires_at?: string;
  created_by: string;
  created_at: string;
}

// Tag types
export interface Tag {
  id: string;
  name: string;
  color: string;
  workspace_id: string;
}

// Deadline types
export interface Deadline {
  id: string;
  project_id: string;
  title: string;
  due_date: string;
  completed: boolean;
  created_at: string;
}

/**
 * Types de réponses API génériques
 * Utilisés pour standardiser les réponses de l'API REST.
 * @typedef {Object} ApiResponse
 * @template T - Type de données contenues dans la réponse
 * @property {T} [data] - Données retournées en cas de succès
 * @property {string} [error] - Message d'erreur en cas d'échec
 * @property {string} [message] - Message d'information additionnel
 */

/**
 * Réponse paginée pour les listes d'éléments.
 * @typedef {Object} PaginatedResponse
 * @template T - Type des éléments contenus dans la page
 * @property {T[]} data - Tableau des éléments de la page courante
 * @property {number} total - Nombre total d'éléments sur toutes les pages
 * @property {number} page - Numéro de la page actuelle
 * @property {number} pageSize - Nombre d'éléments par page
 * @property {boolean} hasMore - Indique s'il reste des pages à charger
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Types de formulaires pour la création/mise à jour d'entités
 * Utilisés pour typer les données envoyées lors de la soumission de formulaires.
 */

/**
 * Données requises pour créer un nouveau projet.
 * @typedef {Object} CreateProjectForm
 * @property {string} name - Nom du projet (requis)
 * @property {string} [description] - Description optionnelle
 * @property {string[]} [tags] - Tags optionnels à associer
 */

/**
 * Données pour mettre à jour un projet existant.
 * Seuls les champs définis seront modifiés.
 * @typedef {Object} UpdateProjectForm
 * @property {string} [name] - Nouveau nom du projet
 * @property {string} [description] - Nouvelle description
 * @property {string[]} [tags] - Nouveaux tags (remplace les existants)
 */

/**
 * Données pour créer une demande de rendu 3D.
 * @typedef {Object} CreateRenderForm
 * @property {string} project_id - ID du projet cible
 * @property {string} prompt - Description textuelle de la scène à rendre
 * @property {string} [title] - Titre optionnel pour le rendu
 */
export interface CreateProjectForm {
  name: string;
  description?: string;
  tags?: string[];
}

export interface UpdateProjectForm {
  name?: string;
  description?: string;
  tags?: string[];
}

export interface CreateRenderForm {
  project_id: string;
  prompt: string;
  title?: string;
}

/**
 * Types pour l'état de l'interface utilisateur
 * Utilisés pour gérer les états de chargement, modales, et filtres dans les composants React.
 */

/**
 * État de chargement d'un composant avec gestion d'erreur optionnelle.
 * @typedef {Object} LoadingState
 * @property {boolean} isLoading - Indique si le composant est en cours de chargement
 * @property {string} [error] - Message d'erreur si le chargement a échoué
 */

/**
 * État d'une fenêtre modale.
 * @typedef {Object} ModalState
 * @property {boolean} isOpen - Indique si la modale est actuellement ouverte
 * @property {unknown} [data] - Données passées à la modale lors de l'ouverture
 */

/**
 * État des filtres pour les listes d'éléments.
 * @typedef {Object} FilterState
 * @property {string} [search] - Texte de recherche à filtrer
 * @property {"asc"|"desc"} [sort] - Ordre de tri souhaité
 * @property {Object} [dateRange] - Plage de dates pour le filtrage
 * @property {string} [dateRange.start] - Date de début
 * @property {string} [dateRange.end] - Date de fin
 */
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface ModalState {
  isOpen: boolean;
  data?: unknown;
}

export interface FilterState {
  search?: string;
  sort?: "asc" | "desc";
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Types pour le module Mini Archi (génération de plans architecturaux)
 * Utilisés par l'outil de création de plans de maison assistée par IA.
 */

/**
 * Représente un plan d'étage généré avec son visuel SVG.
 * @typedef {Object} FloorPlan
 * @property {string} id - Identifiant unique du plan
 * @property {string} title - Titre ou nom du plan
 * @property {string} description - Description textuelle du plan
 * @property {string} svg - Code SVG représentant graphiquement le plan
 * @property {boolean} selected - Indique si le plan est actuellement sélectionné pour comparaison
 */

/**
 * Contraintes utilisateur pour la génération de plans architecturaux.
 * @typedef {Object} ArConstraint
 * @property {string} [surface] - Surface souhaitée en m²
 * @property {string} [rooms] - Nombre et type de pièces souhaitées
 * @property {string} [budget] - Budget alloué pour la construction
 * @property {string} constraints - Contraintes additionnelles libres (accessibilité, orientation, etc.)
 */

/**
 * Estimation de budget par catégorie de travaux.
 * @typedef {Object} BudgetEstimate
 * @property {string} category - Catégorie de travaux (gros oeuvre, électricité, etc.)
 * @property {number} min - Budget minimum estimé
 * @property {number} max - Budget maximum estimé
 * @property {string[]} items - Liste des postes de dépenses inclus
 */
export interface FloorPlan {
  id: string;
  title: string;
  description: string;
  svg: string;
  selected: boolean;
}

export interface ArConstraint {
  surface?: string;
  rooms?: string;
  budget?: string;
  constraints: string;
}

export interface BudgetEstimate {
  category: string;
  min: number;
  max: number;
  items: string[];
}