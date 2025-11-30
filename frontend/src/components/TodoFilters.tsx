/**
 * src/components/TodoFilters.tsx - Panneau de filtres et tri
 *
 * Composant pour filtrer et trier les todos.
 *
 * @author Claude Code
 * @version 1.0.0
 */

import type { TodoFilter, TodoSortField, SortOrder, TodoPriority } from '../types';

interface TodoFiltersProps {
  filter: TodoFilter;
  sortBy: TodoSortField;
  sortOrder: SortOrder;
  search: string;
  priority: TodoPriority | null;

  onFilterChange: (filter: TodoFilter) => void;
  onSortByChange: (sortBy: TodoSortField) => void;
  onSortOrderChange: (order: SortOrder) => void;
  onSearchChange: (search: string) => void;
  onPriorityChange: (priority: TodoPriority | null) => void;
  onClearFilters: () => void;
}

export default function TodoFilters({
  filter,
  sortBy,
  sortOrder,
  search,
  priority,
  onFilterChange,
  onSortByChange,
  onSortOrderChange,
  onSearchChange,
  onPriorityChange,
  onClearFilters
}: TodoFiltersProps) {
  return (
    <div className="filters-panel">
      <h3 className="filters-title">Filtres et tri</h3>

      {/* Recherche */}
      <div className="filter-group">
        <label htmlFor="search">Rechercher</label>
        <input
          type="search"
          id="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher une tâche..."
          className="filter-input"
        />
      </div>

      {/* Filtre par statut */}
      <div className="filter-group">
        <label>Statut</label>
        <div className="filter-buttons">
          <button
            onClick={() => onFilterChange('all')}
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          >
            Tous
          </button>
          <button
            onClick={() => onFilterChange('active')}
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          >
            Actifs
          </button>
          <button
            onClick={() => onFilterChange('completed')}
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          >
            Complétés
          </button>
        </div>
      </div>

      {/* Filtre par priorité */}
      <div className="filter-group">
        <label htmlFor="priority">Priorité</label>
        <select
          id="priority"
          value={priority || ''}
          onChange={(e) => onPriorityChange(e.target.value as TodoPriority || null)}
          className="filter-select"
        >
          <option value="">Toutes</option>
          <option value="low">Basse</option>
          <option value="medium">Moyenne</option>
          <option value="high">Haute</option>
        </select>
      </div>

      {/* Tri */}
      <div className="filter-group">
        <label htmlFor="sortBy">Trier par</label>
        <select
          id="sortBy"
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as TodoSortField)}
          className="filter-select"
        >
          <option value="createdAt">Date de création</option>
          <option value="updatedAt">Date de modification</option>
          <option value="title">Titre</option>
          <option value="priority">Priorité</option>
          <option value="dueDate">Date d'échéance</option>
        </select>

        <button
          onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="sort-order-btn"
          aria-label="Changer l'ordre de tri"
        >
          {sortOrder === 'asc' ? '↑ Croissant' : '↓ Décroissant'}
        </button>
      </div>

      {/* Bouton pour réinitialiser */}
      <button onClick={onClearFilters} className="btn btn-secondary btn-block">
        Réinitialiser les filtres
      </button>
    </div>
  );
}
