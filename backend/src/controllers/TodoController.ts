/**
 * controllers/TodoController.ts - Contrôleur HTTP pour les todos
 *
 * Ce fichier gère toutes les requêtes HTTP liées aux todos.
 * Il fait le pont entre les routes Express et le service métier.
 *
 * Fonctionnalités principales :
 * - Handlers pour tous les endpoints CRUD
 * - Handlers pour les endpoints avancés (stats, bulk)
 * - Extraction et validation des paramètres de requête
 * - Formatage des réponses HTTP
 *
 * Dépendances :
 * - express : Types Request, Response, NextFunction
 * - services/TodoService : Logique métier
 * - types : Interfaces de l'application
 *
 * @author Claude Code
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import TodoService from '../services/TodoService';
import { CreateTodoDto, UpdateTodoDto, TodoQueryParams } from '../types';
import logger from '../utils/logger';

/**
 * Classe TodoController
 *
 * Implémente tous les handlers HTTP pour les todos.
 * Chaque méthode correspond à un endpoint de l'API.
 */
export class TodoController {
  /**
   * Instance du service pour la logique métier
   */
  private service: typeof TodoService;

  /**
   * Constructeur du contrôleur
   *
   * @param {TodoService} service - Instance du service (injection de dépendance)
   */
  constructor(service: typeof TodoService) {
    this.service = service;

    // Bind des méthodes pour conserver le contexte 'this'
    // Nécessaire car les méthodes sont passées comme callbacks à Express
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.getStats = this.getStats.bind(this);
    this.bulkCreate = this.bulkCreate.bind(this);
    this.bulkDelete = this.bulkDelete.bind(this);
    this.deleteCompleted = this.deleteCompleted.bind(this);
  }

  /**
   * GET /api/todos
   *
   * Récupère tous les todos avec filtres, tri et pagination.
   *
   * Query params :
   * - filter : all | active | completed
   * - sortBy : createdAt | updatedAt | title | priority | dueDate
   * - sortOrder : asc | desc
   * - page : numéro de page (1-indexed)
   * - limit : nombre d'items par page
   * - search : terme de recherche
   * - priority : low | medium | high
   * - tags : tags séparés par virgules
   *
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   * @param {NextFunction} next - Fonction next pour le middleware
   *
   * @example
   * GET /api/todos?filter=active&sortBy=createdAt&page=1&limit=20
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Les query params ont déjà été validés par le middleware validator
      const params = req.query as unknown as TodoQueryParams;

      logger.debug('Controller: getAll', { params });

      // Appeler le service
      const result = await this.service.getAllTodos(params);

      // Répondre avec les données paginées
      res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta
      });
    } catch (error) {
      // Passer l'erreur au gestionnaire d'erreurs
      next(error);
    }
  }

  /**
   * GET /api/todos/:id
   *
   * Récupère un todo spécifique par son ID.
   *
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   * @param {NextFunction} next - Fonction next
   *
   * @example
   * GET /api/todos/123e4567-e89b-12d3-a456-426614174000
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // L'ID a déjà été validé par le middleware validator
      const { id } = req.params;
      if (!id) throw new Error('ID is required');

      logger.debug('Controller: getById', { id });

      // Appeler le service
      const todo = await this.service.getTodoById(id);

      // Répondre avec le todo
      res.status(200).json({
        success: true,
        data: todo
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/todos
   *
   * Crée un nouveau todo.
   *
   * Body (JSON) :
   * {
   *   "title": "string" (required, 3-100 chars),
   *   "description": "string" (optional, max 500 chars),
   *   "priority": "low" | "medium" | "high" (optional, default: medium),
   *   "dueDate": "ISO 8601 date string" (optional),
   *   "tags": ["string", ...] (optional, max 10)
   * }
   *
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   * @param {NextFunction} next - Fonction next
   *
   * @example
   * POST /api/todos
   * Body: { "title": "Acheter du lait", "priority": "high" }
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Le body a déjà été validé par le middleware validator
      const dto: CreateTodoDto = req.body;

      logger.debug('Controller: create', { dto });

      // Appeler le service
      const todo = await this.service.createTodo(dto);

      // Répondre avec le todo créé (code 201 Created)
      res.status(201).json({
        success: true,
        data: todo,
        message: 'Todo créé avec succès'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/todos/:id
   *
   * Met à jour un todo existant (mise à jour partielle).
   *
   * Body (JSON) :
   * {
   *   "title": "string" (optional),
   *   "description": "string" (optional),
   *   "completed": boolean (optional),
   *   "priority": "low" | "medium" | "high" (optional),
   *   "dueDate": "ISO 8601 date string" (optional),
   *   "tags": ["string", ...] (optional)
   * }
   *
   * Au moins un champ doit être fourni.
   *
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   * @param {NextFunction} next - Fonction next
   *
   * @example
   * PATCH /api/todos/abc-123
   * Body: { "completed": true }
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // L'ID et le body ont déjà été validés
      const { id } = req.params;
      if (!id) throw new Error('ID is required');
      const dto: UpdateTodoDto = req.body;

      logger.debug('Controller: update', { id, dto });

      // Appeler le service
      const todo = await this.service.updateTodo(id, dto);

      // Répondre avec le todo mis à jour
      res.status(200).json({
        success: true,
        data: todo,
        message: 'Todo mis à jour avec succès'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/todos/:id
   *
   * Supprime un todo.
   *
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   * @param {NextFunction} next - Fonction next
   *
   * @example
   * DELETE /api/todos/abc-123
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // L'ID a déjà été validé
      const { id } = req.params;
      if (!id) throw new Error('ID is required');

      logger.debug('Controller: delete', { id });

      // Appeler le service
      await this.service.deleteTodo(id);

      // Répondre avec un code 204 No Content (pas de body)
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/todos/stats
   *
   * Récupère les statistiques des todos.
   *
   * Retourne :
   * - total : nombre total de todos
   * - completed : nombre de todos complétés
   * - active : nombre de todos actifs
   * - overdue : nombre de todos en retard
   * - byPriority : répartition par priorité
   * - completionRate : taux de complétion en %
   *
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   * @param {NextFunction} next - Fonction next
   *
   * @example
   * GET /api/todos/stats
   */
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.debug('Controller: getStats');

      // Appeler le service
      const stats = await this.service.getStats();

      // Répondre avec les statistiques
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/todos/bulk
   *
   * Crée plusieurs todos en une seule requête (max 100).
   *
   * Body (JSON) :
   * {
   *   "todos": [
   *     { "title": "Tâche 1", ... },
   *     { "title": "Tâche 2", ... },
   *     ...
   *   ]
   * }
   *
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   * @param {NextFunction} next - Fonction next
   *
   * @example
   * POST /api/todos/bulk
   * Body: { "todos": [{ "title": "A" }, { "title": "B" }] }
   */
  async bulkCreate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Le body a déjà été validé
      const dto = req.body;

      logger.debug('Controller: bulkCreate', { count: dto.todos.length });

      // Appeler le service
      const todos = await this.service.bulkCreate(dto);

      // Répondre avec les todos créés
      res.status(201).json({
        success: true,
        data: todos,
        message: `${todos.length} todos créés avec succès`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/todos/bulk
   *
   * Supprime plusieurs todos en une seule requête (max 100).
   *
   * Body (JSON) :
   * {
   *   "ids": ["uuid1", "uuid2", ...]
   * }
   *
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   * @param {NextFunction} next - Fonction next
   *
   * @example
   * DELETE /api/todos/bulk
   * Body: { "ids": ["abc-123", "def-456"] }
   */
  async bulkDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Le body a déjà été validé
      const dto = req.body;

      logger.debug('Controller: bulkDelete', { count: dto.ids.length });

      // Appeler le service
      const deletedCount = await this.service.bulkDelete(dto);

      // Répondre avec le nombre de todos supprimés
      res.status(200).json({
        success: true,
        data: {
          deletedCount,
          requested: dto.ids.length
        },
        message: `${deletedCount} todo(s) supprimé(s) avec succès`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/todos/completed
   *
   * Supprime tous les todos complétés.
   *
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   * @param {NextFunction} next - Fonction next
   *
   * @example
   * DELETE /api/todos/completed
   */
  async deleteCompleted(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.debug('Controller: deleteCompleted');

      // Appeler le service
      const deletedCount = await this.service.deleteCompleted();

      // Répondre avec le nombre de todos supprimés
      res.status(200).json({
        success: true,
        data: {
          deletedCount
        },
        message: `${deletedCount} todo(s) complété(s) supprimé(s) avec succès`
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export d'une instance singleton du contrôleur
export default new TodoController(TodoService);
