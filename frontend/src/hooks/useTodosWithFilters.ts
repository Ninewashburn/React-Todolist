/**
 * src/hooks/useTodosWithFilters.ts - Hook avancé avec filtres et stats
 *
 * Hook personnalisé qui étend useTodos avec support complet des filtres,
 * tri, recherche, et statistiques.
 *
 * @author Claude Code
 * @version 1.0.0
 */

import { useState, useCallback, useEffect } from 'react';
import type {
  Todo,
  CreateTodoDto,
  UpdateTodoDto,
  TodoQueryParams,
  TodoFilter,
  TodoSortField,
  SortOrder,
  TodoPriority,
  PaginationMeta,
  TodoStats
} from '../types';
import { todosApi } from '../services/api';

/**
 * Interface pour le retour du hook useTodosWithFilters
 */
interface UseTodosWithFiltersReturn {
  // État
  todos: Todo[];
  loading: boolean;
  error: string | null;
  meta: PaginationMeta | null;
  stats: TodoStats | null;
  statsLoading: boolean;

  // Paramètres actuels
  filter: TodoFilter;
  sortBy: TodoSortField;
  sortOrder: SortOrder;
  search: string;
  priority: TodoPriority | null;
  tags: string[];
  page: number;
  limit: number;

  // Actions CRUD
  addTodo: (data: CreateTodoDto) => Promise<void>;
  updateTodo: (id: string, data: UpdateTodoDto) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  deleteCompleted: () => Promise<void>;
  refreshTodos: () => Promise<void>;

  // Filtres et tri
  setFilter: (filter: TodoFilter) => void;
  setSortBy: (sortBy: TodoSortField) => void;
  setSortOrder: (order: SortOrder) => void;
  toggleSortOrder: () => void;
  setSearch: (search: string) => void;
  setPriority: (priority: TodoPriority | null) => void;
  setTags: (tags: string[]) => void;
  clearFilters: () => void;

  // Pagination
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  nextPage: () => void;
  prevPage: () => void;

  // Stats
  refreshStats: () => Promise<void>;
}

/**
 * Hook avancé pour gérer les todos avec filtres, tri et stats
 *
 * @param {TodoQueryParams} initialParams - Paramètres initiaux
 * @returns {UseTodosWithFiltersReturn} État et fonctions complètes
 *
 * @example
 * const {
 *   todos,
 *   loading,
 *   stats,
 *   setFilter,
 *   setSearch,
 *   addTodo
 * } = useTodosWithFilters();
 */
export function useTodosWithFilters(
  initialParams: TodoQueryParams = {}
): UseTodosWithFiltersReturn {
  // Paramètres de requête
  const [filter, setFilter] = useState<TodoFilter>(initialParams.filter || 'all');
  const [sortBy, setSortBy] = useState<TodoSortField>(initialParams.sortBy || 'createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialParams.sortOrder || 'desc');
  const [search, setSearch] = useState(initialParams.search || '');
  const [priority, setPriority] = useState<TodoPriority | null>(initialParams.priority || null);
  const [tags, setTags] = useState<string[]>(initialParams.tags || []);
  const [page, setPage] = useState(initialParams.page || 1);
  const [limit, setLimit] = useState(initialParams.limit || 50);

  // État des todos
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  // État des stats
  const [stats, setStats] = useState<TodoStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  /**
   * Construit les paramètres de requête actuels
   */
  const buildParams = useCallback((): TodoQueryParams => {
    const params: TodoQueryParams = {
      filter,
      sortBy,
      sortOrder,
      page,
      limit
    };

    if (search.trim()) params.search = search.trim();
    if (priority) params.priority = priority;
    if (tags.length > 0) params.tags = tags;

    return params;
  }, [filter, sortBy, sortOrder, search, priority, tags, page, limit]);

  /**
   * Charge les todos avec les paramètres actuels
   */
  const loadTodos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = buildParams();
      const response = await todosApi.getAll(params);

      setTodos(response.data);
      setMeta(response.meta);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement';
      setError(errorMessage);
      console.error('Erreur lors du chargement:', err);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  /**
   * Charge les statistiques
   */
  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const statsData = await todosApi.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Erreur lors du chargement des stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  /**
   * Recharge les todos quand les paramètres changent
   */
  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  /**
   * Charge les stats au montage
   */
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  /**
   * Ajoute un nouveau todo
   */
  const addTodo = async (data: CreateTodoDto) => {
    try {
      setError(null);
      const newTodo = await todosApi.create(data);

      // Optimistic update
      setTodos((prev) => (Array.isArray(prev) ? [newTodo, ...prev] : [newTodo]));

      // Recharger pour avoir les données fraîches
      await Promise.all([loadTodos(), loadStats()]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de création';
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Met à jour un todo
   */
  const updateTodo = async (id: string, data: UpdateTodoDto) => {
    try {
      setError(null);
      const updated = await todosApi.update(id, data);

      // Optimistic update
      setTodos((prev) =>
        Array.isArray(prev) ? prev.map((todo) => (todo.id === id ? updated : todo)) : [updated]
      );

      // Recharger les stats si le statut a changé
      if (data.completed !== undefined) {
        await loadStats();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de mise à jour';
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Supprime un todo
   */
  const deleteTodo = async (id: string) => {
    try {
      setError(null);
      await todosApi.delete(id);

      // Optimistic update
      setTodos((prev) => Array.isArray(prev) ? prev.filter((todo) => todo.id !== id) : []);

      // Recharger stats
      await loadStats();

      // Si plus de todos sur la page, revenir à la page précédente
      if (todos.length === 1 && meta && meta.currentPage > 1) {
        setPage(meta.currentPage - 1);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de suppression';
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Supprime plusieurs todos en une fois
   */
  const bulkDelete = async (ids: string[]) => {
    try {
      setError(null);
      await todosApi.bulkDelete({ ids });

      // Recharger tous les todos et stats
      await Promise.all([loadTodos(), loadStats()]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de suppression en masse';
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Supprime tous les todos complétés
   */
  const deleteCompleted = async () => {
    try {
      setError(null);
      await todosApi.deleteCompleted();

      // Recharger tous les todos et stats
      await Promise.all([loadTodos(), loadStats()]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de suppression des complétés';
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Bascule l'ordre de tri
   */
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  /**
   * Réinitialise tous les filtres
   */
  const clearFilters = () => {
    setFilter('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setSearch('');
    setPriority(null);
    setTags([]);
    setPage(1);
  };

  /**
   * Passe à la page suivante
   */
  const nextPage = () => {
    if (meta && meta.hasNextPage) {
      setPage(meta.currentPage + 1);
    }
  };

  /**
   * Passe à la page précédente
   */
  const prevPage = () => {
    if (meta && meta.hasPreviousPage) {
      setPage(meta.currentPage - 1);
    }
  };

  /**
   * Change le nombre d'items par page
   */
  const handleSetLimit = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset à la page 1
  };

  return {
    // État
    todos,
    loading,
    error,
    meta,
    stats,
    statsLoading,

    // Paramètres actuels
    filter,
    sortBy,
    sortOrder,
    search,
    priority,
    tags,
    page,
    limit,

    // Actions CRUD
    addTodo,
    updateTodo,
    deleteTodo,
    bulkDelete,
    deleteCompleted,
    refreshTodos: loadTodos,

    // Filtres et tri
    setFilter,
    setSortBy,
    setSortOrder,
    toggleSortOrder,
    setSearch,
    setPriority,
    setTags,
    clearFilters,

    // Pagination
    setPage,
    setLimit: handleSetLimit,
    nextPage,
    prevPage,

    // Stats
    refreshStats: loadStats,
  };
}
