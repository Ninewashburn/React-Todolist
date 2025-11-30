/**
 * src/components/TodoList.tsx - Liste des todos avec pagination
 *
 * Composant pour afficher une liste de todos avec :
 * - Pagination
 * - Sélection multiple
 * - Actions en masse
 *
 * @author Claude Code
 * @version 1.0.0
 */

import { useState } from 'react';
import type { Todo, PaginationMeta } from '../types';
import TodoItem from './TodoItem';
import LoadingSpinner from './LoadingSpinner';

/**
 * Props du composant TodoList
 */
interface TodoListProps {
  /** Liste des todos à afficher */
  todos: Todo[];

  /** Indique si les données sont en cours de chargement */
  loading: boolean;

  /** Message d'erreur éventuel */
  error: string | null;

  /** Métadonnées de pagination */
  meta: PaginationMeta | null;

  /** Fonction appelée lors du toggle d'un todo */
  onToggle: (id: string, completed: boolean) => Promise<void>;

  /** Fonction appelée lors de la suppression d'un todo */
  onDelete: (id: string) => Promise<void>;

  /** Fonction appelée lors de la suppression en masse */
  onBulkDelete?: (ids: string[]) => Promise<void>;

  /** Fonction appelée pour changer de page */
  onPageChange?: (page: number) => void;
}

/**
 * Composant TodoList
 *
 * Affiche une liste paginée de todos avec sélection multiple.
 */
export default function TodoList({
  todos,
  loading,
  error,
  meta,
  onToggle,
  onDelete,
  onBulkDelete,
  onPageChange
}: TodoListProps) {
  // État de sélection multiple
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /**
   * Sélectionne/désélectionne un todo
   */
  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  /**
   * Sélectionne/désélectionne tous les todos de la page
   */
  const toggleSelectAll = () => {
    if (!todos || todos.length === 0) return;
    if (selectedIds.size === todos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(todos.map(t => t.id)));
    }
  };

  /**
   * Supprime les todos sélectionnés
   */
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0 || !onBulkDelete) return;

    if (confirm(`Supprimer ${selectedIds.size} todo(s) ?`)) {
      await onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  // Afficher le spinner pendant le chargement initial
  if (loading && (!todos || todos.length === 0)) {
    return <LoadingSpinner />;
  }

  // Afficher l'erreur
  if (error) {
    return (
      <div className="error-container" role="alert">
        <p className="error-message">⚠️ {error}</p>
      </div>
    );
  }

  // Afficher un message si pas de todos
  if (!todos || todos.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-message">📝 Aucune tâche pour le moment</p>
        <p className="empty-hint">Créez votre première tâche ci-dessus</p>
      </div>
    );
  }

  return (
    <div className="todo-list-container">
      {/* Barre d'actions en masse */}
      {onBulkDelete && (
        <div className="bulk-actions">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={selectedIds.size === todos.length && todos.length > 0}
              onChange={toggleSelectAll}
              aria-label="Sélectionner tous les todos"
            />
            <span>Tout sélectionner</span>
          </label>

          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="btn btn-danger btn-sm"
              aria-label={`Supprimer ${selectedIds.size} todo(s)`}
            >
              =� Supprimer ({selectedIds.size})
            </button>
          )}
        </div>
      )}

      {/* Liste des todos */}
      <ul className="todo-list" role="list" aria-live="polite">
        {todos.map((todo) => (
          <li key={todo.id} className="todo-list-item">
            {onBulkDelete && (
              <input
                type="checkbox"
                checked={selectedIds.has(todo.id)}
                onChange={() => toggleSelection(todo.id)}
                className="todo-checkbox"
                aria-label={`Sélectionner ${todo.title}`}
              />
            )}
            <TodoItem
              todo={todo}
              onToggle={() => onToggle(todo.id, !todo.completed)}
              onDelete={() => onDelete(todo.id)}
            />
          </li>
        ))}
      </ul>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && onPageChange && (
        <div className="pagination" role="navigation" aria-label="Pagination">
          <button
            onClick={() => onPageChange(meta.currentPage - 1)}
            disabled={!meta.hasPreviousPage || loading}
            className="btn btn-pagination"
            aria-label="Page précédente"
          >
            ← Précédent
          </button>

          <span className="pagination-info">
            Page {meta.currentPage} sur {meta.totalPages}
            ({meta.totalItems} todo{meta.totalItems > 1 ? 's' : ''})
          </span>

          <button
            onClick={() => onPageChange(meta.currentPage + 1)}
            disabled={!meta.hasNextPage || loading}
            className="btn btn-pagination"
            aria-label="Page suivante"
          >
            Suivant →
          </button>
        </div>
      )}

      {/* Indicateur de chargement pendant le rechargement */}
      {loading && <div className="loading-overlay"><LoadingSpinner /></div>}
    </div>
  );
}
