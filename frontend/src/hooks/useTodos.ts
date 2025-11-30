/**
 * src/hooks/useTodos.ts - Hook React pour gérer les todos
 *
 * Hook personnalisé pour gérer l'état et les opérations CRUD des todos.
 * Gère la pagination, le chargement, et les erreurs.
 *
 * @author Claude Code
 * @version 2.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  Todo,
  CreateTodoDto,
  UpdateTodoDto,
  TodoQueryParams,
  PaginationMeta
} from '../types';
import { todosApi } from '../services/api';

/**
 * Interface pour le retour du hook useTodos
 */
interface UseTodosReturn {
  // État
  todos: Todo[];
  loading: boolean;
  error: string | null;
  meta: PaginationMeta | null;

  // Actions CRUD
  addTodo: (data: CreateTodoDto) => Promise<void>;
  updateTodo: (id: string, data: UpdateTodoDto) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  refreshTodos: () => Promise<void>;

  // Pagination
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
}

/**
 * Hook personnalisé pour gérer les todos avec pagination
 *
 * @param {TodoQueryParams} initialParams - Paramètres de requête initiaux
 * @returns {UseTodosReturn} État et fonctions pour gérer les todos
 *
 * @example
 * const { todos, loading, addTodo, updateTodo, deleteTodo } = useTodos();
 */
export function useTodos(initialParams: TodoQueryParams = {}): UseTodosReturn {
  // État des todos
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  // Paramètres de requête
  const [params, setParams] = useState<TodoQueryParams>({
    page: 1,
    limit: 50,
    ...initialParams
  });

  /**
   * Fonction pour charger tous les todos avec les paramètres actuels
   */
  const loadTodos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Appeler l'API avec les paramètres actuels
      const response = await todosApi.getAll(params);

      // Mettre à jour l'état avec les données paginées
      setTodos(response.data);
      setMeta(response.meta);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement des todos';
      setError(errorMessage);
      console.error('Erreur lors du chargement des todos:', err);
    } finally {
      setLoading(false);
    }
  }, [params]);

  /**
   * Charger les todos au montage et quand les params changent
   */
  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  /**
   * Ajoute un nouveau todo
   *
   * Utilise l'optimistic update : ajoute le todo immédiatement à l'état,
   * puis recharge tous les todos pour avoir les données fraîches du serveur.
   *
   * @param {CreateTodoDto} data - Données du todo à créer
   * @throws {Error} Si la création échoue
   */
  const addTodo = async (data: CreateTodoDto) => {
    try {
      setError(null);

      // Créer le todo via l'API
      const newTodo = await todosApi.create(data);

      // Ajouter le nouveau todo à la liste (optimistic update)
      setTodos((prev) => [newTodo, ...prev]);

      // Recharger pour avoir les données fraîches (pagination, tri, etc.)
      await loadTodos();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du todo';
      setError(errorMessage);
      console.error('Erreur lors de la création:', err);
      throw err; // Propager pour que le composant puisse réagir
    }
  };

  /**
   * Met à jour un todo existant
   *
   * @param {string} id - UUID du todo à mettre à jour
   * @param {UpdateTodoDto} data - Données à mettre à jour
   * @throws {Error} Si la mise à jour échoue
   */
  const updateTodo = async (id: string, data: UpdateTodoDto) => {
    try {
      setError(null);

      // Mettre à jour via l'API
      const updated = await todosApi.update(id, data);

      // Mettre à jour dans l'état local (optimistic update)
      setTodos((prev) =>
        prev.map((todo) => (todo.id === id ? updated : todo))
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      setError(errorMessage);
      console.error('Erreur lors de la mise à jour:', err);
      throw err;
    }
  };

  /**
   * Supprime un todo
   *
   * @param {string} id - UUID du todo à supprimer
   * @throws {Error} Si la suppression échoue
   */
  const deleteTodo = async (id: string) => {
    try {
      setError(null);

      // Supprimer via l'API
      await todosApi.delete(id);

      // Supprimer de l'état local (optimistic update)
      setTodos((prev) => prev.filter((todo) => todo.id !== id));

      // Si on est sur la dernière page et qu'il ne reste plus de todos,
      // revenir à la page précédente
      if (todos.length === 1 && meta && meta.currentPage > 1) {
        setParams((prev) => ({ ...prev, page: meta.currentPage - 1 }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      setError(errorMessage);
      console.error('Erreur lors de la suppression:', err);
      throw err;
    }
  };

  /**
   * Change la page courante
   *
   * @param {number} page - Numéro de page (1-indexed)
   */
  const setPage = (page: number) => {
    setParams((prev) => ({ ...prev, page }));
  };

  /**
   * Change le nombre d'items par page
   *
   * @param {number} limit - Nombre d'items par page
   */
  const setLimit = (limit: number) => {
    setParams((prev) => ({ ...prev, limit, page: 1 })); // Reset à la page 1
  };

  // Retourner l'état et les fonctions du hook
  return {
    todos,
    loading,
    error,
    meta,
    addTodo,
    updateTodo,
    deleteTodo,
    refreshTodos: loadTodos,
    setPage,
    setLimit,
  };
}
