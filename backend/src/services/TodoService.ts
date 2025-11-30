/**
 * services/TodoService.ts - Logique métier des todos
 *
 * Ce fichier contient toute la logique métier de l'application.
 * Il fait le pont entre les controllers et le repository.
 *
 * Fonctionnalités principales :
 * - Validation métier
 * - Orchestration des opérations complexes
 * - Gestion des erreurs métier
 * - Logging des opérations
 *
 * Dépendances :
 * - repositories/TodoRepository : Accès aux données
 * - models/Todo : Modèle de domaine
 * - utils/errors : Gestion d'erreurs
 * - utils/logger : Logging
 *
 * @author Claude Code
 * @version 1.0.0
 */

import { TodoRepository } from '../repositories/TodoRepository';
import { Todo } from '../models/Todo';
import {
  CreateTodoDto,
  UpdateTodoDto,
  TodoQueryParams,
  PaginatedResponse,
  TodoStats,
  BulkCreateDto,
  BulkDeleteDto,
  Todo as ITodo
} from '../types';
import {
  TodoNotFoundError,
  ValidationError,
  BadRequestError
} from '../utils/errors';
import logger from '../utils/logger';

/**
 * Classe TodoService
 *
 * Implémente toute la logique métier liée aux todos.
 * Suit le pattern Service Layer pour séparer la logique métier
 * du transport (HTTP) et de la persistance (Database).
 */
export class TodoService {
  /**
   * Instance du repository pour l'accès aux données
   */
  private repository: TodoRepository;

  /**
   * Constructeur du service
   *
   * @param {TodoRepository} repository - Instance du repository (injection de dépendance)
   */
  constructor(repository: TodoRepository) {
    this.repository = repository;
  }

  /**
   * Récupère tous les todos avec filtres et pagination
   *
   * @param {TodoQueryParams} params - Paramètres de requête
   * @returns {Promise<PaginatedResponse<ITodo>>} Résultats paginés
   *
   * @example
   * const result = await service.getAllTodos({
   *   filter: 'active',
   *   page: 1,
   *   limit: 20
   * });
   */
  async getAllTodos(params: TodoQueryParams = {}): Promise<PaginatedResponse<ITodo>> {
    try {
      logger.debug('Service: getAllTodos', { params });

      // Valider les paramètres de pagination
      if (params.page && params.page < 1) {
        throw new ValidationError('Le numéro de page doit être >= 1', {
          field: 'page',
          value: params.page
        });
      }

      if (params.limit && params.limit < 1) {
        throw new ValidationError('La limite doit être >= 1', {
          field: 'limit',
          value: params.limit
        });
      }

      if (params.limit && params.limit > 100) {
        throw new ValidationError('La limite ne peut pas dépasser 100', {
          field: 'limit',
          value: params.limit
        });
      }

      // Déléguer au repository
      const result = await this.repository.findAll(params);

      logger.info('Todos récupérés', {
        count: result.data.length,
        total: result.meta.totalItems,
        page: result.meta.currentPage
      });

      return result;
    } catch (error) {
      logger.logError(error as Error, { operation: 'getAllTodos', params });
      throw error;
    }
  }

  /**
   * Récupère un todo par son ID
   *
   * @param {string} id - UUID du todo
   * @returns {Promise<ITodo>} Le todo trouvé
   * @throws {TodoNotFoundError} Si le todo n'existe pas
   *
   * @example
   * const todo = await service.getTodoById('abc-123');
   */
  async getTodoById(id: string): Promise<ITodo> {
    try {
      logger.debug('Service: getTodoById', { id });

      // Vérifier que l'ID n'est pas vide
      if (!id || id.trim().length === 0) {
        throw new BadRequestError('ID du todo requis');
      }

      // Récupérer le todo
      const todo = await this.repository.findById(id);

      // Vérifier qu'il existe
      if (!todo) {
        throw new TodoNotFoundError(id);
      }

      logger.info('Todo récupéré', { id });
      return todo;
    } catch (error) {
      logger.logError(error as Error, { operation: 'getTodoById', id });
      throw error;
    }
  }

  /**
   * Crée un nouveau todo
   *
   * @param {CreateTodoDto} dto - Données du todo à créer
   * @returns {Promise<ITodo>} Le todo créé
   * @throws {ValidationError} Si les données sont invalides
   *
   * @example
   * const todo = await service.createTodo({
   *   title: 'Nouvelle tâche',
   *   priority: 'high'
   * });
   */
  async createTodo(dto: CreateTodoDto): Promise<ITodo> {
    try {
      logger.debug('Service: createTodo', { dto });

      // Validation métier
      this.validateCreateTodoDto(dto);

      // Créer l'instance de Todo
      const todo = Todo.create(dto);

      // Sauvegarder en base
      const created = await this.repository.create(todo);

      logger.info('Todo créé', { id: created.id, title: created.title });
      return created;
    } catch (error) {
      logger.logError(error as Error, { operation: 'createTodo', dto });
      throw error;
    }
  }

  /**
   * Met à jour un todo existant
   *
   * @param {string} id - UUID du todo
   * @param {UpdateTodoDto} dto - Champs à mettre à jour
   * @returns {Promise<ITodo>} Le todo mis à jour
   * @throws {TodoNotFoundError} Si le todo n'existe pas
   * @throws {ValidationError} Si les données sont invalides
   *
   * @example
   * const updated = await service.updateTodo('abc-123', {
   *   title: 'Nouveau titre',
   *   completed: true
   * });
   */
  async updateTodo(id: string, dto: UpdateTodoDto): Promise<ITodo> {
    try {
      logger.debug('Service: updateTodo', { id, dto });

      // Vérifier que l'ID n'est pas vide
      if (!id || id.trim().length === 0) {
        throw new BadRequestError('ID du todo requis');
      }

      // Vérifier qu'il y a au moins un champ à mettre à jour
      if (Object.keys(dto).length === 0) {
        throw new BadRequestError('Aucun champ à mettre à jour');
      }

      // Validation métier
      this.validateUpdateTodoDto(dto);

      // Mettre à jour le todo
      const updated = await this.repository.update(id, dto);

      // Vérifier que le todo existe
      if (!updated) {
        throw new TodoNotFoundError(id);
      }

      logger.info('Todo mis à jour', { id, updatedFields: Object.keys(dto) });
      return updated;
    } catch (error) {
      logger.logError(error as Error, { operation: 'updateTodo', id, dto });
      throw error;
    }
  }

  /**
   * Supprime un todo
   *
   * @param {string} id - UUID du todo à supprimer
   * @returns {Promise<void>}
   * @throws {TodoNotFoundError} Si le todo n'existe pas
   *
   * @example
   * await service.deleteTodo('abc-123');
   */
  async deleteTodo(id: string): Promise<void> {
    try {
      logger.debug('Service: deleteTodo', { id });

      // Vérifier que l'ID n'est pas vide
      if (!id || id.trim().length === 0) {
        throw new BadRequestError('ID du todo requis');
      }

      // Supprimer le todo
      const deleted = await this.repository.delete(id);

      // Vérifier que le todo existait
      if (!deleted) {
        throw new TodoNotFoundError(id);
      }

      logger.info('Todo supprimé', { id });
    } catch (error) {
      logger.logError(error as Error, { operation: 'deleteTodo', id });
      throw error;
    }
  }

  /**
   * Récupère les statistiques des todos
   *
   * @returns {Promise<TodoStats>} Statistiques complètes
   *
   * @example
   * const stats = await service.getStats();
   * console.log(`Taux de complétion: ${stats.completionRate}%`);
   */
  async getStats(): Promise<TodoStats> {
    try {
      logger.debug('Service: getStats');

      const stats = await this.repository.getStats();

      logger.info('Statistiques récupérées', stats);
      return stats;
    } catch (error) {
      logger.logError(error as Error, { operation: 'getStats' });
      throw error;
    }
  }

  /**
   * Création en masse de todos
   *
   * @param {BulkCreateDto} dto - Tableau de todos à créer
   * @returns {Promise<ITodo[]>} Todos créés
   * @throws {ValidationError} Si les données sont invalides
   *
   * @example
   * const created = await service.bulkCreate({
   *   todos: [
   *     { title: 'Tâche 1' },
   *     { title: 'Tâche 2' }
   *   ]
   * });
   */
  async bulkCreate(dto: BulkCreateDto): Promise<ITodo[]> {
    try {
      logger.debug('Service: bulkCreate', { count: dto.todos.length });

      // Validation : vérifier que le tableau n'est pas vide
      if (!dto.todos || dto.todos.length === 0) {
        throw new ValidationError('Le tableau de todos ne peut pas être vide');
      }

      // Validation : limite de 100 todos par requête
      if (dto.todos.length > 100) {
        throw new ValidationError('Maximum 100 todos par requête en masse', {
          provided: dto.todos.length,
          max: 100
        });
      }

      // Valider chaque todo
      dto.todos.forEach((todoDto, index) => {
        try {
          this.validateCreateTodoDto(todoDto);
        } catch (error) {
          throw new ValidationError(`Validation échouée pour le todo à l'index ${index}`, {
            index,
            error: (error as Error).message
          });
        }
      });

      // Créer les instances de Todo
      const todos = dto.todos.map(todoDto => Todo.create(todoDto));

      // Sauvegarder en masse
      const created = await this.repository.bulkCreate(todos);

      logger.info('Todos créés en masse', { count: created.length });
      return created;
    } catch (error) {
      logger.logError(error as Error, { operation: 'bulkCreate', count: dto.todos.length });
      throw error;
    }
  }

  /**
   * Suppression en masse de todos
   *
   * @param {BulkDeleteDto} dto - Tableau d'IDs à supprimer
   * @returns {Promise<number>} Nombre de todos supprimés
   * @throws {ValidationError} Si les données sont invalides
   *
   * @example
   * const deletedCount = await service.bulkDelete({
   *   ids: ['id1', 'id2', 'id3']
   * });
   */
  async bulkDelete(dto: BulkDeleteDto): Promise<number> {
    try {
      logger.debug('Service: bulkDelete', { count: dto.ids.length });

      // Validation : vérifier que le tableau n'est pas vide
      if (!dto.ids || dto.ids.length === 0) {
        throw new ValidationError('Le tableau d\'IDs ne peut pas être vide');
      }

      // Validation : limite de 100 IDs par requête
      if (dto.ids.length > 100) {
        throw new ValidationError('Maximum 100 IDs par requête en masse', {
          provided: dto.ids.length,
          max: 100
        });
      }

      // Valider que tous les IDs sont des strings non vides
      dto.ids.forEach((id, index) => {
        if (!id || typeof id !== 'string' || id.trim().length === 0) {
          throw new ValidationError(`ID invalide à l'index ${index}`, { index, id });
        }
      });

      // Supprimer en masse
      const deletedCount = await this.repository.bulkDelete(dto.ids);

      logger.info('Todos supprimés en masse', {
        requested: dto.ids.length,
        deleted: deletedCount
      });

      return deletedCount;
    } catch (error) {
      logger.logError(error as Error, { operation: 'bulkDelete', count: dto.ids.length });
      throw error;
    }
  }

  /**
   * Supprime tous les todos complétés
   *
   * @returns {Promise<number>} Nombre de todos supprimés
   *
   * @example
   * const deleted = await service.deleteCompleted();
   * console.log(`${deleted} todos complétés supprimés`);
   */
  async deleteCompleted(): Promise<number> {
    try {
      logger.debug('Service: deleteCompleted');

      const deletedCount = await this.repository.deleteCompleted();

      logger.info('Todos complétés supprimés', { count: deletedCount });
      return deletedCount;
    } catch (error) {
      logger.logError(error as Error, { operation: 'deleteCompleted' });
      throw error;
    }
  }

  /**
   * Valide un CreateTodoDto
   *
   * @param {CreateTodoDto} dto - DTO à valider
   * @throws {ValidationError} Si la validation échoue
   */
  private validateCreateTodoDto(dto: CreateTodoDto): void {
    // Valider le titre (obligatoire)
    if (!dto.title || dto.title.trim().length === 0) {
      throw new ValidationError('Le titre est obligatoire', {
        field: 'title'
      });
    }

    if (dto.title.length < 3) {
      throw new ValidationError('Le titre doit contenir au moins 3 caractères', {
        field: 'title',
        minLength: 3,
        provided: dto.title.length
      });
    }

    if (dto.title.length > 100) {
      throw new ValidationError('Le titre ne peut pas dépasser 100 caractères', {
        field: 'title',
        maxLength: 100,
        provided: dto.title.length
      });
    }

    // Valider le titre avec regex (caractères autorisés)
    const titleRegex = /^[a-zA-ZÀ-ÿ0-9 \-_'.,!?]+$/;
    if (!titleRegex.test(dto.title)) {
      throw new ValidationError(
        'Le titre contient des caractères invalides. Seuls les lettres, chiffres et ponctuation basique sont autorisés',
        { field: 'title', value: dto.title }
      );
    }

    // Valider la description (optionnelle)
    if (dto.description !== undefined && dto.description !== null) {
      if (dto.description.length > 500) {
        throw new ValidationError('La description ne peut pas dépasser 500 caractères', {
          field: 'description',
          maxLength: 500,
          provided: dto.description.length
        });
      }
    }

    // Valider les tags (optionnels)
    if (dto.tags !== undefined && dto.tags !== null) {
      if (!Array.isArray(dto.tags)) {
        throw new ValidationError('Les tags doivent être un tableau', {
          field: 'tags'
        });
      }

      if (dto.tags.length > 10) {
        throw new ValidationError('Maximum 10 tags par todo', {
          field: 'tags',
          max: 10,
          provided: dto.tags.length
        });
      }

      // Valider chaque tag
      dto.tags.forEach((tag, index) => {
        if (typeof tag !== 'string' || tag.trim().length === 0) {
          throw new ValidationError(`Tag invalide à l'index ${index}`, {
            field: 'tags',
            index
          });
        }
      });
    }

    // Valider la date d'échéance (optionnelle)
    if (dto.dueDate !== undefined && dto.dueDate !== null) {
      const date = new Date(dto.dueDate);
      if (isNaN(date.getTime())) {
        throw new ValidationError('Date d\'échéance invalide', {
          field: 'dueDate',
          value: dto.dueDate
        });
      }
    }
  }

  /**
   * Valide un UpdateTodoDto
   *
   * @param {UpdateTodoDto} dto - DTO à valider
   * @throws {ValidationError} Si la validation échoue
   */
  private validateUpdateTodoDto(dto: UpdateTodoDto): void {
    // Valider le titre s'il est fourni
    if (dto.title !== undefined) {
      if (!dto.title || dto.title.trim().length === 0) {
        throw new ValidationError('Le titre ne peut pas être vide', {
          field: 'title'
        });
      }

      if (dto.title.length < 3) {
        throw new ValidationError('Le titre doit contenir au moins 3 caractères', {
          field: 'title',
          minLength: 3,
          provided: dto.title.length
        });
      }

      if (dto.title.length > 100) {
        throw new ValidationError('Le titre ne peut pas dépasser 100 caractères', {
          field: 'title',
          maxLength: 100,
          provided: dto.title.length
        });
      }

      const titleRegex = /^[a-zA-ZÀ-ÿ0-9 \-_'.,!?]+$/;
      if (!titleRegex.test(dto.title)) {
        throw new ValidationError(
          'Le titre contient des caractères invalides',
          { field: 'title' }
        );
      }
    }

    // Valider la description si fournie
    if (dto.description !== undefined && dto.description !== null) {
      if (dto.description.length > 500) {
        throw new ValidationError('La description ne peut pas dépasser 500 caractères', {
          field: 'description',
          maxLength: 500,
          provided: dto.description.length
        });
      }
    }

    // Valider les tags si fournis
    if (dto.tags !== undefined) {
      if (!Array.isArray(dto.tags)) {
        throw new ValidationError('Les tags doivent être un tableau', {
          field: 'tags'
        });
      }

      if (dto.tags.length > 10) {
        throw new ValidationError('Maximum 10 tags par todo', {
          field: 'tags',
          max: 10,
          provided: dto.tags.length
        });
      }

      dto.tags.forEach((tag, index) => {
        if (typeof tag !== 'string' || tag.trim().length === 0) {
          throw new ValidationError(`Tag invalide à l'index ${index}`, {
            field: 'tags',
            index
          });
        }
      });
    }

    // Valider la date d'échéance si fournie
    if (dto.dueDate !== undefined && dto.dueDate !== null) {
      const date = new Date(dto.dueDate);
      if (isNaN(date.getTime())) {
        throw new ValidationError('Date d\'échéance invalide', {
          field: 'dueDate',
          value: dto.dueDate
        });
      }
    }

    // Valider completed si fourni
    if (dto.completed !== undefined) {
      if (typeof dto.completed !== 'boolean') {
        throw new ValidationError('Le champ completed doit être un booléen', {
          field: 'completed'
        });
      }
    }
  }
}

// Export d'une instance singleton du service
export default new TodoService(new TodoRepository());
