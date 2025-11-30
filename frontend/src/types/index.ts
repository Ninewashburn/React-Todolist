/**
 * src/types/index.ts - Définitions TypeScript Frontend
 *
 * Types et interfaces pour l'application Todo côté client.
 * Ces types correspondent exactement aux types du backend.
 *
 * @author Claude Code
 * @version 1.0.0
 */

/**
 * Types pour les niveaux de priorité
 */
export type TodoPriority = 'low' | 'medium' | 'high';

export const TodoPriorityValues = {
  LOW: 'low' as const,
  MEDIUM: 'medium' as const,
  HIGH: 'high' as const
};

/**
 * Types pour les filtres disponibles
 */
export type TodoFilter = 'all' | 'active' | 'completed';

export const TodoFilterValues = {
  ALL: 'all' as const,
  ACTIVE: 'active' as const,
  COMPLETED: 'completed' as const
};

/**
 * Types pour les champs de tri
 */
export type TodoSortField = 'createdAt' | 'updatedAt' | 'title' | 'priority' | 'dueDate';

export const TodoSortFieldValues = {
  CREATED_AT: 'createdAt' as const,
  UPDATED_AT: 'updatedAt' as const,
  TITLE: 'title' as const,
  PRIORITY: 'priority' as const,
  DUE_DATE: 'dueDate' as const
};

/**
 * Types pour l'ordre de tri
 */
export type SortOrder = 'asc' | 'desc';

export const SortOrderValues = {
  ASC: 'asc' as const,
  DESC: 'desc' as const
};

/**
 * Interface Todo complète
 *
 * Représente un todo avec tous ses champs.
 */
export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: TodoPriority;
  dueDate?: Date | string;
  tags: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
  completedAt?: Date | string | null;
}

/**
 * DTO pour la création d'un todo
 */
export interface CreateTodoDto {
  title: string;
  description?: string;
  priority?: TodoPriority;
  dueDate?: Date | string;
  tags?: string[];
}

/**
 * DTO pour la mise à jour d'un todo
 */
export interface UpdateTodoDto {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: TodoPriority;
  dueDate?: Date | string;
  tags?: string[];
}

/**
 * Interface pour les paramètres de requête
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
 * Interface pour les métadonnées de pagination
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
 * Interface pour les réponses paginées
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Interface pour les statistiques
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
 * Interface pour la création en masse
 */
export interface BulkCreateDto {
  todos: CreateTodoDto[];
}

/**
 * Interface pour la suppression en masse
 */
export interface BulkDeleteDto {
  ids: string[];
}

/**
 * Interface pour les réponses de succès de l'API
 */
export interface ApiSuccessResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

/**
 * Interface pour les réponses d'erreur de l'API
 */
export interface ApiErrorResponse {
  success: boolean;
  error: {
    statusCode: number;
    code: string;
    message: string;
    details?: any;
    stack?: string;
  };
}

/**
 * Interface pour les résultats de validation
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}
