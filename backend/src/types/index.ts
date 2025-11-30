/**
 * types/index.ts - Définitions TypeScript centralisées
 *
 * Ce fichier contient toutes les interfaces, types et énumérations utilisés
 * dans l'application backend. Il assure la cohérence des types à travers
 * toute l'architecture.
 *
 * Fonctionnalités principales :
 * - Interfaces de domaine (Todo)
 * - DTOs (Data Transfer Objects) pour validation
 * - Types utilitaires et énumérations
 * - Types pour les requêtes et réponses API
 *
 * Dépendances :
 * - Aucune (fichier de base)
 *
 * @author Claude Code
 * @version 1.0.0
 */

/**
 * Énumération des niveaux de priorité pour les todos
 *
 * Utilisé pour catégoriser l'importance d'une tâche :
 * - low : Tâche de faible priorité, peut être reportée
 * - medium : Priorité normale, traitement standard
 * - high : Haute priorité, nécessite attention rapide
 */
export enum TodoPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

/**
 * Énumération des filtres disponibles pour les todos
 *
 * Permet de filtrer les todos selon leur statut :
 * - all : Affiche tous les todos (complétés et actifs)
 * - active : Affiche uniquement les todos non complétés
 * - completed : Affiche uniquement les todos complétés
 */
export enum TodoFilter {
  ALL = 'all',
  ACTIVE = 'active',
  COMPLETED = 'completed'
}

/**
 * Énumération des champs de tri disponibles
 *
 * Définit les colonnes sur lesquelles on peut trier :
 * - createdAt : Tri par date de création
 * - updatedAt : Tri par date de dernière modification
 * - title : Tri alphabétique par titre
 * - priority : Tri par niveau de priorité
 * - dueDate : Tri par date d'échéance
 */
export enum TodoSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TITLE = 'title',
  PRIORITY = 'priority',
  DUE_DATE = 'dueDate'
}

/**
 * Énumération de l'ordre de tri
 *
 * - asc : Ordre croissant (A-Z, 0-9, anciens→récents)
 * - desc : Ordre décroissant (Z-A, 9-0, récents→anciens)
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

/**
 * Interface Todo - Modèle principal de l'application
 *
 * Représente une tâche complète avec tous ses attributs.
 * Cette interface correspond exactement au schéma de la base de données.
 *
 * @property {string} id - Identifiant unique UUID v4
 * @property {string} title - Titre de la tâche (3-100 caractères)
 * @property {string} [description] - Description détaillée optionnelle (max 500 chars)
 * @property {boolean} completed - Statut de complétion (true/false)
 * @property {TodoPriority} priority - Niveau de priorité (low/medium/high)
 * @property {Date} [dueDate] - Date d'échéance optionnelle
 * @property {string[]} tags - Liste de tags/catégories (max 10)
 * @property {Date} createdAt - Date de création (auto-générée)
 * @property {Date} updatedAt - Date de dernière modification (auto-mise à jour)
 * @property {Date} [completedAt] - Date de complétion (null si non complété)
 */
export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: TodoPriority;
  dueDate?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/**
 * DTO pour la création d'un todo
 *
 * Définit les champs requis et optionnels lors de la création.
 * Les champs auto-générés (id, dates) sont exclus.
 *
 * @property {string} title - Titre obligatoire (validé par Zod)
 * @property {string} [description] - Description optionnelle
 * @property {TodoPriority} [priority] - Priorité (défaut: medium)
 * @property {Date} [dueDate] - Date d'échéance optionnelle
 * @property {string[]} [tags] - Tags optionnels (défaut: [])
 */
export interface CreateTodoDto {
  title: string;
  description?: string;
  priority?: TodoPriority;
  dueDate?: Date;
  tags?: string[];
}

/**
 * DTO pour la mise à jour d'un todo
 *
 * Tous les champs sont optionnels pour permettre des mises à jour partielles.
 * Seuls les champs fournis seront modifiés (PATCH semantics).
 *
 * @property {string} [title] - Nouveau titre
 * @property {string} [description] - Nouvelle description
 * @property {boolean} [completed] - Nouveau statut de complétion
 * @property {TodoPriority} [priority] - Nouvelle priorité
 * @property {Date} [dueDate] - Nouvelle date d'échéance
 * @property {string[]} [tags] - Nouveaux tags
 */
export interface UpdateTodoDto {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: TodoPriority;
  dueDate?: Date;
  tags?: string[];
}

/**
 * Interface pour les paramètres de requête
 *
 * Utilisée pour parser et valider les query parameters des endpoints GET.
 * Supporte filtrage, tri, pagination et recherche.
 *
 * @property {TodoFilter} [filter] - Filtre par statut (all/active/completed)
 * @property {TodoSortField} [sortBy] - Champ de tri
 * @property {SortOrder} [sortOrder] - Ordre de tri (asc/desc)
 * @property {number} [page] - Numéro de page (1-indexed)
 * @property {number} [limit] - Nombre d'items par page
 * @property {string} [search] - Terme de recherche (titre et description)
 * @property {TodoPriority} [priority] - Filtre par priorité
 * @property {string[]} [tags] - Filtre par tags (OR logic)
 */
export interface TodoQueryParams {
  filter?: TodoFilter;
  sortBy?: TodoSortField;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
  search?: string;
  priority?: TodoPriority;
  tags?: string[];
}

/**
 * Interface pour la réponse paginée
 *
 * Encapsule les résultats paginés avec métadonnées.
 * Suit le pattern standard de pagination REST.
 *
 * @property {Todo[]} data - Tableau des todos de la page courante
 * @property {PaginationMeta} meta - Métadonnées de pagination
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Interface pour les métadonnées de pagination
 *
 * Fournit toutes les informations nécessaires pour implémenter
 * une pagination complète côté client.
 *
 * @property {number} currentPage - Page actuelle (1-indexed)
 * @property {number} totalPages - Nombre total de pages
 * @property {number} totalItems - Nombre total d'items
 * @property {number} itemsPerPage - Nombre d'items par page
 * @property {boolean} hasNextPage - Indique s'il y a une page suivante
 * @property {boolean} hasPreviousPage - Indique s'il y a une page précédente
 */
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Interface pour les statistiques des todos
 *
 * Agrège des métriques utiles pour le dashboard.
 * Calculées via des requêtes SQL optimisées.
 *
 * @property {number} total - Nombre total de todos
 * @property {number} completed - Nombre de todos complétés
 * @property {number} active - Nombre de todos actifs (non complétés)
 * @property {number} overdue - Nombre de todos en retard (dueDate passée et non complété)
 * @property {Object} byPriority - Répartition par priorité
 * @property {number} completionRate - Taux de complétion en pourcentage (0-100)
 */
export interface TodoStats {
  total: number;
  completed: number;
  active: number;
  overdue: number;
  byPriority: {
    low: number;
    medium: number;
    high: number;
  };
  completionRate: number;
}

/**
 * Interface pour les opérations en masse (bulk)
 *
 * Permet de créer plusieurs todos en une seule requête.
 * Limite raisonnable pour éviter les abus (max 100 items).
 *
 * @property {CreateTodoDto[]} todos - Tableau de todos à créer (max 100)
 */
export interface BulkCreateDto {
  todos: CreateTodoDto[];
}

/**
 * Interface pour la suppression en masse
 *
 * Permet de supprimer plusieurs todos par leurs IDs.
 * Utilise une transaction pour garantir l'atomicité.
 *
 * @property {string[]} ids - Tableau d'IDs UUID à supprimer (max 100)
 */
export interface BulkDeleteDto {
  ids: string[];
}

/**
 * Interface pour les réponses d'erreur standardisées
 *
 * Format uniforme pour toutes les erreurs API.
 * Facilite le parsing côté client.
 *
 * @property {number} statusCode - Code HTTP de l'erreur
 * @property {string} message - Message d'erreur lisible par l'humain
 * @property {string} code - Code d'erreur machine (ex: TODO_NOT_FOUND)
 * @property {any} [details] - Détails additionnels (ex: erreurs de validation)
 * @property {string} [stack] - Stack trace (uniquement en développement)
 */
export interface ErrorResponse {
  statusCode: number;
  message: string;
  code: string;
  details?: any;
  stack?: string;
}

/**
 * Interface pour les réponses de succès standardisées
 *
 * Encapsule les réponses réussies avec métadonnées optionnelles.
 *
 * @property {boolean} success - Toujours true pour les succès
 * @property {T} data - Données de la réponse (type générique)
 * @property {string} [message] - Message de succès optionnel
 */
export interface SuccessResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Type utilitaire pour les champs partiels
 *
 * Crée un type avec tous les champs optionnels.
 * Utilisé pour les updates partiels (PATCH).
 */
export type PartialTodo = Partial<Todo>;

/**
 * Type utilitaire pour les champs requis de création
 *
 * Extrait uniquement les champs obligatoires.
 */
export type RequiredTodoFields = Pick<Todo, 'title'>;

/**
 * Type utilitaire pour les IDs
 *
 * Garantit que les IDs sont des strings non vides.
 */
export type TodoId = string;

/**
 * Type pour les résultats de validation
 *
 * @property {boolean} valid - Indique si la validation a réussi
 * @property {string[]} [errors] - Messages d'erreur si validation échouée
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}
