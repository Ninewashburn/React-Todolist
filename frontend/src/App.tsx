/**
 * src/App.tsx - Composant principal de l'application
 *
 * Point d'entrée de l'application Todo List.
 * Intègre tous les composants et gère l'état global.
 *
 * @author Claude Code
 * @version 1.0.0
 */

import { useState } from 'react';
import { useTodosWithFilters } from './hooks/useTodosWithFilters';
import TodoForm from './components/TodoForm';
import TodoList from './components/TodoList';
import TodoFilters from './components/TodoFilters';
import TodoStats from './components/TodoStats';
import './App.css';

/**
 * Composant principal App
 *
 * Gère l'état global de l'application et coordonne tous les composants.
 */
export default function App() {
  // Hook principal avec filtres, tri et stats
  const {
    todos,
    loading,
    error,
    meta,
    stats,
    statsLoading,
    filter,
    sortBy,
    sortOrder,
    search,
    priority,
    addTodo,
    updateTodo,
    deleteTodo,
    bulkDelete,
    deleteCompleted,
    setFilter,
    setSortBy,
    setSortOrder,
    setSearch,
    setPriority,
    clearFilters,
    setPage,
  } = useTodosWithFilters();

  // État local pour l'affichage des panneaux
  const [showFilters, setShowFilters] = useState(true);
  const [showStats, setShowStats] = useState(true);

  /**
   * Gère le toggle d'un todo
   */
  const handleToggle = async (id: string, completed: boolean) => {
    try {
      await updateTodo(id, { completed });
    } catch (err) {
      console.error('Erreur lors du toggle:', err);
    }
  };

  /**
   * Gère la suppression d'un todo
   */
  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      try {
        await deleteTodo(id);
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
      }
    }
  };

  /**
   * Gère la suppression en masse
   */
  const handleBulkDelete = async (ids: string[]) => {
    try {
      await bulkDelete(ids);
    } catch (err) {
      console.error('Erreur lors de la suppression en masse:', err);
    }
  };

  /**
   * Gère la suppression des complétés
   */
  const handleDeleteCompleted = async () => {
    if (confirm('Supprimer tous les todos complétés ?')) {
      try {
        await deleteCompleted();
      } catch (err) {
        console.error('Erreur lors de la suppression des complétés:', err);
      }
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">📝 Todo List</h1>
        <p className="app-subtitle">Gérez vos tâches efficacement</p>
      </header>

      {/* Container principal */}
      <div className="app-container">
        {/* Sidebar gauche - Statistiques */}
        <aside className="sidebar sidebar-left">
          <div className="sidebar-header">
            <h2>Statistiques</h2>
            <button
              onClick={() => setShowStats(!showStats)}
              className="toggle-btn"
              aria-label="Afficher/masquer les statistiques"
            >
              {showStats ? '−' : '+'}
            </button>
          </div>

          {showStats && <TodoStats stats={stats} loading={statsLoading} />}

          {/* Action rapide */}
          {stats && stats.completed > 0 && (
            <button
              onClick={handleDeleteCompleted}
              className="btn btn-danger btn-block mt-2"
            >
              🗑️ Supprimer les complétés ({stats.completed})
            </button>
          )}
        </aside>

        {/* Contenu principal */}
        <main className="main-content">
          {/* Formulaire de création */}
          <section className="form-section">
            <h2 className="section-title">Nouvelle tâche</h2>
            <TodoForm onSubmit={addTodo} />
          </section>

          {/* Liste des todos */}
          <section className="list-section">
            <div className="list-header">
              <h2 className="section-title">
                Mes tâches
                {meta && (
                  <span className="todo-count">
                    ({meta.totalItems} total{meta.totalItems > 1 ? 's' : ''})
                  </span>
                )}
              </h2>
            </div>

            <TodoList
              todos={todos}
              loading={loading}
              error={error}
              meta={meta}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDelete}
              onPageChange={setPage}
            />
          </section>
        </main>

        {/* Sidebar droite - Filtres */}
        <aside className="sidebar sidebar-right">
          <div className="sidebar-header">
            <h2>Filtres</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="toggle-btn"
              aria-label="Afficher/masquer les filtres"
            >
              {showFilters ? '−' : '+'}
            </button>
          </div>

          {showFilters && (
            <TodoFilters
              filter={filter}
              sortBy={sortBy}
              sortOrder={sortOrder}
              search={search}
              priority={priority}
              onFilterChange={setFilter}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
              onSearchChange={setSearch}
              onPriorityChange={setPriority}
              onClearFilters={clearFilters}
            />
          )}
        </aside>
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          Made with ❤️ by Claude Code | {' '}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}
