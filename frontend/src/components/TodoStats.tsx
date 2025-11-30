/**
 * src/components/TodoStats.tsx - Dashboard de statistiques
 *
 * Affiche les statistiques des todos.
 *
 * @author Claude Code
 * @version 1.0.0
 */

import type { TodoStats as ITodoStats } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface TodoStatsProps {
  stats: ITodoStats | null;
  loading: boolean;
}

export default function TodoStats({ stats, loading }: TodoStatsProps) {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="stats-dashboard">
      <h2 className="stats-title">Statistiques</h2>

      {/* Stats principales */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total</div>
        </div>

        <div className="stat-card stat-active">
          <div className="stat-value">{stats.active}</div>
          <div className="stat-label">Actifs</div>
        </div>

        <div className="stat-card stat-completed">
          <div className="stat-value">{stats.completed}</div>
          <div className="stat-label">Complétés</div>
        </div>

        <div className="stat-card stat-overdue">
          <div className="stat-value">{stats.overdue}</div>
          <div className="stat-label">En retard</div>
        </div>
      </div>

      {/* Taux de complétion */}
      <div className="completion-rate">
        <div className="rate-label">
          Taux de complétion: <strong>{stats.completionRate}%</strong>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${stats.completionRate}%` }}
            role="progressbar"
            aria-valuenow={stats.completionRate}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Répartition par priorité */}
      <div className="priority-stats">
        <h3 className="priority-title">Par priorité</h3>
        <div className="priority-grid">
          <div className="priority-item priority-high">
            <span className="priority-label">Haute</span>
            <span className="priority-count">{stats.byPriority.high}</span>
          </div>
          <div className="priority-item priority-medium">
            <span className="priority-label">Moyenne</span>
            <span className="priority-count">{stats.byPriority.medium}</span>
          </div>
          <div className="priority-item priority-low">
            <span className="priority-label">Basse</span>
            <span className="priority-count">{stats.byPriority.low}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
