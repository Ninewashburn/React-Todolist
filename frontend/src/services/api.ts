/**
 * src/services/api.ts - Service API Frontend
 *
 * Service pour communiquer avec l'API backend Todo.
 * Fournit des méthodes typées pour toutes les opérations CRUD et avancées.
 *
 * @author Claude Code
 * @version 1.0.1
 */

import type {
  Todo,
  CreateTodoDto,
  UpdateTodoDto,
  TodoQueryParams,
  PaginatedResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  TodoStats,
  BulkCreateDto,
  BulkDeleteDto
} from '../types';

/**
 * URL de base de l'API
 * Configurable via la variable d'environnement VITE_API_URL
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Classe d'erreur personnalisée pour les erreurs API
 *
 * Encapsule les informations d'erreur retournées par le backend.
 */
export class ApiError extends Error {
  /**
   * Code de statut HTTP de l'erreur
   */
  status: number;

  /**
   * Code d'erreur machine (ex: TODO_NOT_FOUND)
   */
  code: string;

  /**
   * Détails additionnels de l'erreur
   */
  details?: any;

  /**
   * Constructeur de ApiError
   *
   * @param {number} status - Code HTTP (404, 500, etc.)
   * @param {string} message - Message d'erreur lisible
   * @param {string} code - Code d'erreur machine
   * @param {any} details - Détails optionnels
   */
  constructor(status: number, message: string, code: string = 'UNKNOWN_ERROR', details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Fonction générique pour les requêtes API
 *
 * Gère l'envoi de requêtes HTTP et le parsing des réponses.
 * Propage les erreurs sous forme d'ApiError.
 *
 * @param {string} endpoint - Endpoint de l'API (ex: '/todos')
 * @param {RequestInit} options - Options fetch (method, body, headers, etc.)
 * @returns {Promise<T>} Données de la réponse
 * @throws {ApiError} Si la requête échoue
 */
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    // Construire l'URL complète
    const url = `${API_BASE_URL}${endpoint}`;

    // Effectuer la requête avec les headers par défaut
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...options.headers,
      },
      cache: 'no-store',
      ...options,
    });

    // Pour les réponses 204 No Content, retourner undefined
    if (response.status === 204) {
      return undefined as T;
    }

    // Parser la réponse JSON
    const data = await response.json();

    // Gérer les erreurs HTTP
    if (!response.ok) {
      const errorData = data as ApiErrorResponse;
      throw new ApiError(
        response.status,
        errorData.error?.message || 'Erreur lors de la requête',
        errorData.error?.code || 'UNKNOWN_ERROR',
        errorData.error?.details
      );
    }

    // Retourner les données (en extrayant le champ 'data' si c'est une ApiSuccessResponse)
    if (data && typeof data === 'object' && 'data' in data) {
      return data.data as T;
    }

    return data as T;
  } catch (error) {
    // Si c'est déjà une ApiError, la propager
    if (error instanceof ApiError) {
      throw error;
    }

    // Si c'est une erreur réseau ou autre
    if (error instanceof Error) {
      throw new ApiError(0, error.message, 'NETWORK_ERROR');
    }

    // Erreur inconnue
    throw new ApiError(0, 'Une erreur inconnue est survenue', 'UNKNOWN_ERROR');
  }
}

/**
 * Construit une query string à partir d'un objet de paramètres
 *
 * @param {Record<string, any>} params - Paramètres de requête
 * @returns {string} Query string (ex: '?filter=active&page=1')
 */
function buildQueryString(params: Record<string, any>): string {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      // Gérer les tableaux (ex: tags)
      if (Array.isArray(value)) {
        value.forEach((item) => queryParams.append(key, String(item)));
      } else {
        queryParams.append(key, String(value));
      }
    }
  });

  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * API Todos
 *
 * Objet regroupant toutes les méthodes API pour les todos.
 */
export const todosApi = {
  /**
   * Liste tous les todos avec filtres et pagination
   *
   * @param {TodoQueryParams} params - Paramètres de requête
   * @returns {Promise<PaginatedResponse<Todo>>} Résultats paginés
   *
   * @example
   * const result = await todosApi.getAll({
   *   filter: 'active',
   *   page: 1,
   *   limit: 20
   * });
   */
  getAll: async (params: TodoQueryParams = {}): Promise<PaginatedResponse<Todo>> => {
    const queryString = buildQueryString(params);
    // fetchApi extrait automatiquement le champ 'data', donc on doit faire la requête différemment
    // pour récupérer l'objet complet avec meta
    const url = `${API_BASE_URL}/todos${queryString}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new ApiError(
        response.status,
        errorData.error?.message || 'Erreur lors de la requête',
        errorData.error?.code || 'UNKNOWN_ERROR',
        errorData.error?.details
      );
    }

    const fullResponse = await response.json() as ApiSuccessResponse<Todo[]>;

    return {
      data: fullResponse.data,
      meta: fullResponse.meta!
    };
  },

  /**
   * Récupère un todo par son ID
   *
   * @param {string} id - UUID du todo
   * @returns {Promise<Todo>} Le todo trouvé
   * @throws {ApiError} Si le todo n'existe pas (404)
   *
   * @example
   * const todo = await todosApi.getById('abc-123');
   */
  getById: (id: string): Promise<Todo> => {
    return fetchApi<Todo>(`/todos/${id}`);
  },

  /**
   * Crée un nouveau todo
   *
   * @param {CreateTodoDto} data - Données du todo à créer
   * @returns {Promise<Todo>} Le todo créé
   *
   * @example
   * const todo = await todosApi.create({
   *   title: 'Nouvelle tâche',
   *   priority: 'high'
   * });
   */
  create: (data: CreateTodoDto): Promise<Todo> => {
    return fetchApi<Todo>('/todos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Met à jour un todo existant
   *
   * @param {string} id - UUID du todo
   * @param {UpdateTodoDto} data - Champs à mettre à jour
   * @returns {Promise<Todo>} Le todo mis à jour
   * @throws {ApiError} Si le todo n'existe pas (404)
   *
   * @example
   * const updated = await todosApi.update('abc-123', {
   *   completed: true
   * });
   */
  update: (id: string, data: UpdateTodoDto): Promise<Todo> => {
    return fetchApi<Todo>(`/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Supprime un todo
   *
   * @param {string} id - UUID du todo à supprimer
   * @returns {Promise<void>}
   * @throws {ApiError} Si le todo n'existe pas (404)
   *
   * @example
   * await todosApi.delete('abc-123');
   */
  delete: (id: string): Promise<void> => {
    return fetchApi<void>(`/todos/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Récupère les statistiques des todos
   *
   * @returns {Promise<TodoStats>} Statistiques complètes
   *
   * @example
   * const stats = await todosApi.getStats();
   * console.log(`Taux de complétion: ${stats.completionRate}%`);
   */
  getStats: (): Promise<TodoStats> => {
    return fetchApi<TodoStats>('/todos/stats');
  },

  /**
   * Crée plusieurs todos en une seule requête
   *
   * @param {BulkCreateDto} data - Tableau de todos à créer (max 100)
   * @returns {Promise<Todo[]>} Todos créés
   *
   * @example
   * const todos = await todosApi.bulkCreate({
   *   todos: [
   *     { title: 'Tâche 1' },
   *     { title: 'Tâche 2' }
   *   ]
   * });
   */
  bulkCreate: (data: BulkCreateDto): Promise<Todo[]> => {
    return fetchApi<Todo[]>('/todos/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Supprime plusieurs todos en une seule requête
   *
   * @param {BulkDeleteDto} data - Tableau d'IDs à supprimer (max 100)
   * @returns {Promise<{ deletedCount: number; requested: number }>}
   *
   * @example
   * const result = await todosApi.bulkDelete({
   *   ids: ['id1', 'id2', 'id3']
   * });
   * console.log(`${result.deletedCount} todos supprimés`);
   */
  bulkDelete: (data: BulkDeleteDto): Promise<{ deletedCount: number; requested: number }> => {
    return fetchApi<{ deletedCount: number; requested: number }>('/todos/bulk', {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  },

  /**
   * Supprime tous les todos complétés
   *
   * @returns {Promise<{ deletedCount: number }>}
   *
   * @example
   * const result = await todosApi.deleteCompleted();
   * console.log(`${result.deletedCount} todos complétés supprimés`);
   */
  deleteCompleted: (): Promise<{ deletedCount: number }> => {
    return fetchApi<{ deletedCount: number }>('/todos/completed', {
      method: 'DELETE',
    });
  },
};

/**
 * Fonction helper pour vérifier la santé de l'API
 *
 * @returns {Promise<boolean>} true si l'API est accessible, false sinon
 *
 * @example
 * const isHealthy = await checkApiHealth();
 * if (!isHealthy) {
 *   console.error('API non disponible');
 * }
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

export default todosApi;
