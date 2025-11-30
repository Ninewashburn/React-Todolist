/**
 * routes/todoRoutes.ts - Routes pour les todos
 *
 * Ce fichier définit toutes les routes de l'API todos avec leurs middlewares.
 * Chaque route est associée à :
 * - Un ou plusieurs middlewares de validation
 * - Un rate limiter approprié
 * - Un handler du contrôleur
 *
 * Fonctionnalités principales :
 * - Routes CRUD complètes
 * - Routes avancées (stats, bulk)
 * - Validation automatique des requêtes
 * - Rate limiting par type d'opération
 *
 * Dépendances :
 * - express : Router
 * - controllers/TodoController : Handlers HTTP
 * - middlewares/validator : Validation Zod
 * - middlewares/rateLimiter : Limitation de débit
 *
 * @author Claude Code
 * @version 1.0.0
 */

import { Router } from 'express';
import TodoController from '../controllers/TodoController';
import {
  validateBody,
  validateQuery,
  validateParams,
  createTodoSchema,
  updateTodoSchema,
  queryParamsSchema,
  bulkCreateSchema,
  bulkDeleteSchema,
  uuidParamSchema
} from '../middlewares/validator';
import {
  createRateLimiter,
  deleteRateLimiter,
  bulkRateLimiter
} from '../middlewares/rateLimiter';

/**
 * Créer le routeur Express pour les todos
 */
const router = Router();

/**
 * GET /api/todos/stats
 *
 * Récupère les statistiques des todos.
 * IMPORTANT : Cette route doit être AVANT /api/todos/:id
 * sinon 'stats' sera interprété comme un ID.
 *
 * Query params : aucun
 * Response : TodoStats
 */
router.get(
  '/stats',
  TodoController.getStats
);

/**
 * GET /api/todos
 *
 * Liste tous les todos avec filtres, tri et pagination.
 *
 * Query params :
 * - filter : all | active | completed (défaut: all)
 * - sortBy : createdAt | updatedAt | title | priority | dueDate (défaut: createdAt)
 * - sortOrder : asc | desc (défaut: desc)
 * - page : numéro de page >= 1 (défaut: 1)
 * - limit : items par page 1-100 (défaut: 50)
 * - search : terme de recherche (optionnel)
 * - priority : low | medium | high (optionnel)
 * - tags : tags CSV ou array (optionnel)
 *
 * Response : PaginatedResponse<Todo>
 */
router.get(
  '/',
  validateQuery(queryParamsSchema),
  TodoController.getAll
);

/**
 * GET /api/todos/:id
 *
 * Récupère un todo spécifique par son ID.
 *
 * Params :
 * - id : UUID du todo
 *
 * Response : Todo
 * Errors :
 * - 404 : Todo not found
 */
router.get(
  '/:id',
  validateParams(uuidParamSchema),
  TodoController.getById
);

/**
 * POST /api/todos
 *
 * Crée un nouveau todo.
 *
 * Body :
 * - title : string (required, 3-100 chars)
 * - description : string (optional, max 500 chars)
 * - priority : low | medium | high (optional, défaut: medium)
 * - dueDate : ISO 8601 date string (optional)
 * - tags : string[] (optional, max 10)
 *
 * Response : Todo
 * Rate limit : 20 requêtes / 15 minutes
 */
router.post(
  '/',
  createRateLimiter,
  validateBody(createTodoSchema),
  TodoController.create
);

/**
 * POST /api/todos/bulk
 *
 * Crée plusieurs todos en une seule requête.
 *
 * Body :
 * - todos : CreateTodoDto[] (min 1, max 100)
 *
 * Response : Todo[]
 * Rate limit : 5 requêtes / 15 minutes (strict)
 */
router.post(
  '/bulk',
  bulkRateLimiter,
  validateBody(bulkCreateSchema),
  TodoController.bulkCreate
);

/**
 * PATCH /api/todos/:id
 *
 * Met à jour un todo existant (mise à jour partielle).
 *
 * Params :
 * - id : UUID du todo
 *
 * Body (au moins un champ requis) :
 * - title : string (optional)
 * - description : string (optional)
 * - completed : boolean (optional)
 * - priority : low | medium | high (optional)
 * - dueDate : ISO 8601 date string (optional)
 * - tags : string[] (optional)
 *
 * Response : Todo
 * Errors :
 * - 404 : Todo not found
 */
router.patch(
  '/:id',
  validateParams(uuidParamSchema),
  validateBody(updateTodoSchema),
  TodoController.update
);

/**
 * DELETE /api/todos/completed
 *
 * Supprime tous les todos complétés.
 * IMPORTANT : Cette route doit être AVANT /api/todos/:id
 *
 * Response : { deletedCount: number }
 * Rate limit : 30 requêtes / 15 minutes
 */
router.delete(
  '/completed',
  deleteRateLimiter,
  TodoController.deleteCompleted
);

/**
 * DELETE /api/todos/bulk
 *
 * Supprime plusieurs todos en une seule requête.
 * IMPORTANT : Cette route doit être AVANT /api/todos/:id
 *
 * Body :
 * - ids : string[] (min 1, max 100, UUIDs valides)
 *
 * Response : { deletedCount: number, requested: number }
 * Rate limit : 5 requêtes / 15 minutes (strict)
 */
router.delete(
  '/bulk',
  bulkRateLimiter,
  validateBody(bulkDeleteSchema),
  TodoController.bulkDelete
);

/**
 * DELETE /api/todos/:id
 *
 * Supprime un todo spécifique.
 *
 * Params :
 * - id : UUID du todo
 *
 * Response : 204 No Content
 * Errors :
 * - 404 : Todo not found
 * Rate limit : 30 requêtes / 15 minutes
 */
router.delete(
  '/:id',
  deleteRateLimiter,
  validateParams(uuidParamSchema),
  TodoController.delete
);

// Exporter le routeur
export default router;
