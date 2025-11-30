/**
 * repositories/TodoRepository.ts - Couche d'accès aux données
 *
 * Ce fichier implémente le pattern Repository pour abstraire
 * toutes les opérations de base de données liées aux todos.
 *
 * Fonctionnalités principales :
 * - CRUD complet (Create, Read, Update, Delete)
 * - Recherche et filtrage avancés
 * - Pagination
 * - Statistiques
 * - Opérations en masse (bulk)
 *
 * Dépendances :
 * - database/connection : Connexion SQLite
 * - models/Todo : Modèle de domaine
 * - types : Interfaces et types
 *
 * @author Claude Code
 * @version 1.0.0
 */

import { getDatabase } from '../database/connection';
import { Todo } from '../models/Todo';
import {
  Todo as ITodo,
  TodoQueryParams,
  PaginatedResponse,
  PaginationMeta,
  TodoStats,
  TodoFilter,
  TodoSortField,
  SortOrder,
  TodoPriority
} from '../types';

/**
 * Classe TodoRepository
 *
 * Gère toutes les interactions avec la table 'todos' en base de données.
 * Utilise le pattern Repository pour séparer la logique métier de l'accès aux données.
 */
export class TodoRepository {
  /**
   * Trouve tous les todos avec filtres, tri et pagination
   *
   * Cette méthode est très flexible et supporte :
   * - Filtrage par statut (all/active/completed)
   * - Filtrage par priorité
   * - Filtrage par tags
   * - Recherche full-text (titre et description)
   * - Tri sur plusieurs champs
   * - Pagination
   *
   * @param {TodoQueryParams} params - Paramètres de requête
   * @returns {Promise<PaginatedResponse<ITodo>>} Résultats paginés
   *
   * @example
   * const result = await repo.findAll({
   *   filter: 'active',
   *   sortBy: 'createdAt',
   *   sortOrder: 'desc',
   *   page: 1,
   *   limit: 20
   * });
   */
  async findAll(params: TodoQueryParams = {}): Promise<PaginatedResponse<ITodo>> {
    const db = getDatabase();

    // Extraction et valeurs par défaut des paramètres
    const {
      filter = TodoFilter.ALL,
      sortBy = TodoSortField.CREATED_AT,
      sortOrder = SortOrder.DESC,
      page = 1,
      limit = 50,
      search,
      priority,
      tags
    } = params;

    // Construction de la requête SQL de base
    let query = 'SELECT * FROM todos WHERE 1=1';
    const queryParams: any[] = [];

    // FILTRES

    // Filtre par statut de complétion
    if (filter === TodoFilter.ACTIVE) {
      query += ' AND completed = 0';
    } else if (filter === TodoFilter.COMPLETED) {
      query += ' AND completed = 1';
    }
    // Si filter === 'all', on ne filtre pas

    // Filtre par priorité
    if (priority) {
      query += ' AND priority = ?';
      queryParams.push(priority);
    }

    // Recherche full-text dans le titre et la description
    // Utilise LIKE pour une recherche insensible à la casse
    if (search && search.trim().length > 0) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      const searchPattern = `%${search.trim()}%`;
      queryParams.push(searchPattern, searchPattern);
    }

    // Filtre par tags (logique OR : au moins un tag doit correspondre)
    // Les tags sont stockés en JSON, donc on utilise json_each pour les extraire
    if (tags && tags.length > 0) {
      // Pour chaque tag, vérifier s'il existe dans le JSON
      const tagConditions = tags.map(() => 'json_array_length(tags) > 0 AND tags LIKE ?').join(' OR ');
      query += ` AND (${tagConditions})`;
      tags.forEach(tag => {
        queryParams.push(`%"${tag}"%`);
      });
    }

    // COMPTAGE TOTAL (pour pagination)
    const countQuery = query.replace('SELECT * FROM todos', 'SELECT COUNT(*) as count FROM todos');
    const countResult = db.prepare(countQuery).get(...queryParams) as { count: number };
    const totalItems = countResult.count;

    // TRI
    // Mapping des champs de tri vers les noms de colonnes SQL
    const sortFieldMap: Record<TodoSortField, string> = {
      [TodoSortField.CREATED_AT]: 'created_at',
      [TodoSortField.UPDATED_AT]: 'updated_at',
      [TodoSortField.TITLE]: 'title',
      [TodoSortField.PRIORITY]: 'priority',
      [TodoSortField.DUE_DATE]: 'due_date'
    };

    const sortColumn = sortFieldMap[sortBy] || 'created_at';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Pour le tri par priorité, utiliser CASE pour définir l'ordre personnalisé
    if (sortBy === TodoSortField.PRIORITY) {
      query += ` ORDER BY CASE priority
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 3
        END ${sortDirection}`;
    } else {
      query += ` ORDER BY ${sortColumn} ${sortDirection}`;
    }

    // PAGINATION
    // Calculer l'offset (nombre d'items à sauter)
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    // EXÉCUTION DE LA REQUÊTE
    const rows = db.prepare(query).all(...queryParams);

    // Conversion des lignes brutes en objets Todo
    const todos = rows.map((row: any) => Todo.fromDatabase(row).toJSON());

    // MÉTADONNÉES DE PAGINATION
    const totalPages = Math.ceil(totalItems / limit);
    const meta: PaginationMeta = {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };

    return {
      data: todos,
      meta
    };
  }

  /**
   * Trouve un todo par son ID
   *
   * @param {string} id - UUID du todo
   * @returns {Promise<ITodo | null>} Le todo ou null si introuvable
   *
   * @example
   * const todo = await repo.findById('123e4567-e89b-12d3-a456-426614174000');
   * if (!todo) throw new Error('Todo not found');
   */
  async findById(id: string): Promise<ITodo | null> {
    const db = getDatabase();

    // Préparer et exécuter la requête
    const row = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);

    // Si aucun résultat, retourner null
    if (!row) {
      return null;
    }

    // Convertir la ligne en objet Todo
    return Todo.fromDatabase(row).toJSON();
  }

  /**
   * Crée un nouveau todo
   *
   * @param {Todo} todo - Instance de Todo à créer
   * @returns {Promise<ITodo>} Le todo créé
   * @throws {Error} Si l'insertion échoue
   *
   * @example
   * const todo = Todo.create({ title: 'Nouvelle tâche' });
   * const created = await repo.create(todo);
   */
  async create(todo: Todo): Promise<ITodo> {
    const db = getDatabase();

    // Convertir le todo en format base de données
    const dbData = todo.toDatabase();

    // Préparer la requête d'insertion
    const stmt = db.prepare(`
      INSERT INTO todos (
        id, title, description, completed, priority,
        due_date, tags, created_at, updated_at, completed_at
      ) VALUES (
        @id, @title, @description, @completed, @priority,
        @due_date, @tags, @created_at, @updated_at, @completed_at
      )
    `);

    // Exécuter l'insertion
    const result = stmt.run(dbData);

    // Vérifier que l'insertion a réussi
    if (result.changes === 0) {
      throw new Error('Failed to create todo');
    }

    // Retourner le todo créé
    return todo.toJSON();
  }

  /**
   * Met à jour un todo existant
   *
   * Effectue une mise à jour partielle (PATCH semantics).
   * Seuls les champs fournis sont modifiés.
   *
   * @param {string} id - UUID du todo à modifier
   * @param {Partial<ITodo>} updates - Champs à mettre à jour
   * @returns {Promise<ITodo | null>} Le todo mis à jour ou null si introuvable
   *
   * @example
   * const updated = await repo.update('abc-123', {
   *   title: 'Nouveau titre',
   *   completed: true
   * });
   */
  async update(id: string, updates: Partial<ITodo>): Promise<ITodo | null> {
    const db = getDatabase();

    // Récupérer le todo existant
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    // Reconstruire le todo depuis la DB
    const todo = Todo.fromDatabase(
      db.prepare('SELECT * FROM todos WHERE id = ?').get(id)
    );

    // Appliquer les mises à jour via la méthode update() du modèle
    todo.update(updates);

    // Convertir en format DB
    const dbData = todo.toDatabase();

    // Préparer la requête de mise à jour
    const stmt = db.prepare(`
      UPDATE todos SET
        title = @title,
        description = @description,
        completed = @completed,
        priority = @priority,
        due_date = @due_date,
        tags = @tags,
        updated_at = @updated_at,
        completed_at = @completed_at
      WHERE id = @id
    `);

    // Exécuter la mise à jour
    const result = stmt.run(dbData);

    // Vérifier que la mise à jour a réussi
    if (result.changes === 0) {
      throw new Error('Failed to update todo');
    }

    // Retourner le todo mis à jour
    return todo.toJSON();
  }

  /**
   * Supprime un todo
   *
   * @param {string} id - UUID du todo à supprimer
   * @returns {Promise<boolean>} true si supprimé, false si introuvable
   *
   * @example
   * const deleted = await repo.delete('abc-123');
   * if (deleted) console.log('Todo supprimé');
   */
  async delete(id: string): Promise<boolean> {
    const db = getDatabase();

    // Exécuter la suppression
    const result = db.prepare('DELETE FROM todos WHERE id = ?').run(id);

    // Retourner true si au moins une ligne a été supprimée
    return result.changes > 0;
  }

  /**
   * Compte le nombre de todos
   *
   * @param {TodoFilter} filter - Filtre optionnel (all/active/completed)
   * @returns {Promise<number>} Nombre de todos
   *
   * @example
   * const totalActive = await repo.count('active');
   */
  async count(filter: TodoFilter = TodoFilter.ALL): Promise<number> {
    const db = getDatabase();

    let query = 'SELECT COUNT(*) as count FROM todos';

    // Appliquer le filtre si nécessaire
    if (filter === TodoFilter.ACTIVE) {
      query += ' WHERE completed = 0';
    } else if (filter === TodoFilter.COMPLETED) {
      query += ' WHERE completed = 1';
    }

    const result = db.prepare(query).get() as { count: number };
    return result.count;
  }

  /**
   * Récupère les statistiques des todos
   *
   * Calcule diverses métriques utiles pour le dashboard.
   *
   * @returns {Promise<TodoStats>} Statistiques complètes
   *
   * @example
   * const stats = await repo.getStats();
   * console.log(`Taux de complétion: ${stats.completionRate}%`);
   */
  async getStats(): Promise<TodoStats> {
    const db = getDatabase();

    // Compter le total de todos
    const total = await this.count(TodoFilter.ALL);

    // Compter les todos complétés
    const completed = await this.count(TodoFilter.COMPLETED);

    // Compter les todos actifs
    const active = await this.count(TodoFilter.ACTIVE);

    // Compter les todos en retard (due_date passée et non complété)
    const overdueQuery = `
      SELECT COUNT(*) as count FROM todos
      WHERE completed = 0
      AND due_date IS NOT NULL
      AND datetime(due_date) < datetime('now')
    `;
    const overdueResult = db.prepare(overdueQuery).get() as { count: number };
    const overdue = overdueResult.count;

    // Compter par priorité
    const priorityStats = {
      low: 0,
      medium: 0,
      high: 0
    };

    const priorityQuery = 'SELECT priority, COUNT(*) as count FROM todos GROUP BY priority';
    const priorityRows = db.prepare(priorityQuery).all() as { priority: string; count: number }[];

    priorityRows.forEach(row => {
      if (row.priority in priorityStats) {
        priorityStats[row.priority as keyof typeof priorityStats] = row.count;
      }
    });

    // Calculer le taux de complétion (pourcentage)
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      active,
      overdue,
      byPriority: priorityStats,
      completionRate
    };
  }

  /**
   * Création en masse de todos
   *
   * Crée plusieurs todos en une seule transaction pour garantir l'atomicité.
   *
   * @param {Todo[]} todos - Tableau de todos à créer
   * @returns {Promise<ITodo[]>} Todos créés
   * @throws {Error} Si la transaction échoue
   *
   * @example
   * const todos = [
   *   Todo.create({ title: 'Tâche 1' }),
   *   Todo.create({ title: 'Tâche 2' })
   * ];
   * const created = await repo.bulkCreate(todos);
   */
  async bulkCreate(todos: Todo[]): Promise<ITodo[]> {
    const db = getDatabase();

    // Préparer la requête d'insertion
    const stmt = db.prepare(`
      INSERT INTO todos (
        id, title, description, completed, priority,
        due_date, tags, created_at, updated_at, completed_at
      ) VALUES (
        @id, @title, @description, @completed, @priority,
        @due_date, @tags, @created_at, @updated_at, @completed_at
      )
    `);

    // Créer une transaction pour garantir l'atomicité
    // Soit tous les todos sont créés, soit aucun
    const insertMany = db.transaction((todosToInsert: Todo[]) => {
      for (const todo of todosToInsert) {
        stmt.run(todo.toDatabase());
      }
    });

    // Exécuter la transaction
    insertMany(todos);

    // Retourner les todos créés
    return todos.map(todo => todo.toJSON());
  }

  /**
   * Suppression en masse de todos
   *
   * Supprime plusieurs todos par leurs IDs en une seule transaction.
   *
   * @param {string[]} ids - Tableau d'UUIDs à supprimer
   * @returns {Promise<number>} Nombre de todos supprimés
   *
   * @example
   * const deletedCount = await repo.bulkDelete(['id1', 'id2', 'id3']);
   * console.log(`${deletedCount} todos supprimés`);
   */
  async bulkDelete(ids: string[]): Promise<number> {
    const db = getDatabase();

    // Si le tableau est vide, retourner 0
    if (ids.length === 0) {
      return 0;
    }

    // Créer des placeholders pour les paramètres (?, ?, ?)
    const placeholders = ids.map(() => '?').join(',');

    // Préparer la requête de suppression
    const query = `DELETE FROM todos WHERE id IN (${placeholders})`;

    // Exécuter la suppression dans une transaction
    const deleteMany = db.transaction(() => {
      return db.prepare(query).run(...ids);
    });

    const result = deleteMany();

    // Retourner le nombre de lignes supprimées
    return result.changes;
  }

  /**
   * Marque plusieurs todos comme complétés
   *
   * @param {string[]} ids - Tableau d'UUIDs à marquer comme complétés
   * @returns {Promise<number>} Nombre de todos mis à jour
   *
   * @example
   * const updated = await repo.bulkComplete(['id1', 'id2']);
   */
  async bulkComplete(ids: string[]): Promise<number> {
    const db = getDatabase();

    if (ids.length === 0) {
      return 0;
    }

    const placeholders = ids.map(() => '?').join(',');
    const query = `
      UPDATE todos SET
        completed = 1,
        completed_at = datetime('now'),
        updated_at = datetime('now')
      WHERE id IN (${placeholders})
      AND completed = 0
    `;

    const result = db.prepare(query).run(...ids);
    return result.changes;
  }

  /**
   * Marque plusieurs todos comme actifs (non complétés)
   *
   * @param {string[]} ids - Tableau d'UUIDs à marquer comme actifs
   * @returns {Promise<number>} Nombre de todos mis à jour
   *
   * @example
   * const updated = await repo.bulkUncomplete(['id1', 'id2']);
   */
  async bulkUncomplete(ids: string[]): Promise<number> {
    const db = getDatabase();

    if (ids.length === 0) {
      return 0;
    }

    const placeholders = ids.map(() => '?').join(',');
    const query = `
      UPDATE todos SET
        completed = 0,
        completed_at = NULL,
        updated_at = datetime('now')
      WHERE id IN (${placeholders})
      AND completed = 1
    `;

    const result = db.prepare(query).run(...ids);
    return result.changes;
  }

  /**
   * Supprime tous les todos complétés
   *
   * Utile pour nettoyer la base de données.
   *
   * @returns {Promise<number>} Nombre de todos supprimés
   *
   * @example
   * const deleted = await repo.deleteCompleted();
   * console.log(`${deleted} todos complétés supprimés`);
   */
  async deleteCompleted(): Promise<number> {
    const db = getDatabase();

    const result = db.prepare('DELETE FROM todos WHERE completed = 1').run();
    return result.changes;
  }

  /**
   * Vérifie si un todo existe
   *
   * @param {string} id - UUID du todo
   * @returns {Promise<boolean>} true si existe, false sinon
   *
   * @example
   * const exists = await repo.exists('abc-123');
   * if (!exists) throw new Error('Todo not found');
   */
  async exists(id: string): Promise<boolean> {
    const db = getDatabase();

    const result = db
      .prepare('SELECT COUNT(*) as count FROM todos WHERE id = ?')
      .get(id) as { count: number };

    return result.count > 0;
  }
}

// Export d'une instance singleton du repository
export default new TodoRepository();
