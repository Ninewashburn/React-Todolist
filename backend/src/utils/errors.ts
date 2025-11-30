/**
 * utils/errors.ts - Classes d'erreurs personnalisées
 *
 * Ce fichier définit une hiérarchie d'erreurs personnalisées pour
 * l'application, facilitant la gestion et le debugging des erreurs.
 *
 * Fonctionnalités principales :
 * - Classe de base ApiError
 * - Erreurs spécifiques avec codes HTTP appropriés
 * - Support des détails additionnels
 * - Stack traces préservées
 *
 * Dépendances :
 * - Aucune (fichier de base)
 *
 * @author Claude Code
 * @version 1.0.0
 */

/**
 * Classe de base pour toutes les erreurs API
 *
 * Hérite de Error et ajoute des propriétés utiles pour les API REST :
 * - statusCode : Code HTTP de l'erreur
 * - code : Code d'erreur machine (ex: TODO_NOT_FOUND)
 * - details : Détails additionnels (ex: erreurs de validation)
 */
export class ApiError extends Error {
  /**
   * Code HTTP de l'erreur (ex: 404, 500)
   */
  public readonly statusCode: number;

  /**
   * Code d'erreur machine en SNAKE_CASE
   * Facilite le traitement côté client
   */
  public readonly code: string;

  /**
   * Détails additionnels de l'erreur
   * Peut contenir des informations de validation, etc.
   */
  public readonly details?: any;

  /**
   * Timestamp de l'erreur
   * Utile pour le logging et le debugging
   */
  public readonly timestamp: Date;

  /**
   * Constructeur de ApiError
   *
   * @param {number} statusCode - Code HTTP (400, 404, 500, etc.)
   * @param {string} message - Message d'erreur lisible par l'humain
   * @param {string} code - Code d'erreur machine (SNAKE_CASE)
   * @param {any} details - Détails additionnels optionnels
   */
  constructor(
    statusCode: number,
    message: string,
    code: string,
    details?: any
  ) {
    // Appeler le constructeur parent (Error)
    super(message);

    // Définir le nom de l'erreur (affiché dans la stack trace)
    this.name = this.constructor.name;

    // Propriétés personnalisées
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date();

    // Capturer la stack trace (V8 seulement)
    // Exclut le constructeur de la stack pour plus de clarté
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convertit l'erreur en objet JSON pour l'API
   *
   * @param {boolean} includeStack - Inclure la stack trace (dev only)
   * @returns {object} Représentation JSON de l'erreur
   */
  toJSON(includeStack: boolean = false): object {
    const json: any = {
      statusCode: this.statusCode,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp.toISOString()
    };

    // Ajouter les détails s'ils existent
    if (this.details) {
      json.details = this.details;
    }

    // Ajouter la stack trace en développement uniquement
    if (includeStack && this.stack) {
      json.stack = this.stack;
    }

    return json;
  }
}

/**
 * Erreur 400 - Bad Request
 *
 * Utilisée quand la requête du client est invalide
 * (paramètres manquants, format incorrect, etc.)
 */
export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad Request', details?: any) {
    super(400, message, 'BAD_REQUEST', details);
  }
}

/**
 * Erreur 404 - Not Found
 *
 * Utilisée quand une ressource demandée n'existe pas
 */
export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource Not Found', details?: any) {
    super(404, message, 'NOT_FOUND', details);
  }
}

/**
 * Erreur spécifique - Todo Not Found
 *
 * Sous-classe de NotFoundError pour les todos spécifiquement
 */
export class TodoNotFoundError extends ApiError {
  constructor(todoId: string) {
    super(404, `Todo with ID "${todoId}" not found`, 'TODO_NOT_FOUND', { todoId });
  }
}

/**
 * Erreur 422 - Unprocessable Entity
 *
 * Utilisée quand la requête est bien formée mais contient
 * des erreurs de validation métier
 */
export class ValidationError extends ApiError {
  constructor(message: string = 'Validation Error', details?: any) {
    super(422, message, 'VALIDATION_ERROR', details);
  }
}

/**
 * Erreur 409 - Conflict
 *
 * Utilisée quand il y a un conflit avec l'état actuel
 * (ex: création d'une ressource qui existe déjà)
 */
export class ConflictError extends ApiError {
  constructor(message: string = 'Conflict', details?: any) {
    super(409, message, 'CONFLICT', details);
  }
}

/**
 * Erreur 401 - Unauthorized
 *
 * Utilisée quand l'authentification est requise mais absente
 * (pas encore implémentée dans cette app)
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(401, message, 'UNAUTHORIZED', details);
  }
}

/**
 * Erreur 403 - Forbidden
 *
 * Utilisée quand l'utilisateur est authentifié mais n'a pas
 * les permissions nécessaires
 * (pas encore implémentée dans cette app)
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden', details?: any) {
    super(403, message, 'FORBIDDEN', details);
  }
}

/**
 * Erreur 429 - Too Many Requests
 *
 * Utilisée par le rate limiter quand un client dépasse
 * le nombre de requêtes autorisées
 */
export class TooManyRequestsError extends ApiError {
  constructor(message: string = 'Too Many Requests', details?: any) {
    super(429, message, 'TOO_MANY_REQUESTS', details);
  }
}

/**
 * Erreur 500 - Internal Server Error
 *
 * Utilisée pour les erreurs inattendues du serveur
 */
export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal Server Error', details?: any) {
    super(500, message, 'INTERNAL_SERVER_ERROR', details);
  }
}

/**
 * Erreur 503 - Service Unavailable
 *
 * Utilisée quand le serveur est temporairement indisponible
 * (ex: base de données inaccessible)
 */
export class ServiceUnavailableError extends ApiError {
  constructor(message: string = 'Service Unavailable', details?: any) {
    super(503, message, 'SERVICE_UNAVAILABLE', details);
  }
}

/**
 * Helper pour vérifier si une erreur est une ApiError
 *
 * @param {any} error - L'erreur à vérifier
 * @returns {boolean} true si c'est une ApiError, false sinon
 *
 * @example
 * if (isApiError(error)) {
 *   console.log(error.statusCode);
 * }
 */
export function isApiError(error: any): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Convertit n'importe quelle erreur en ApiError
 *
 * Utile pour normaliser les erreurs inattendues.
 *
 * @param {any} error - L'erreur à convertir
 * @returns {ApiError} Une instance de ApiError
 *
 * @example
 * try {
 *   // code...
 * } catch (err) {
 *   const apiError = toApiError(err);
 *   logger.error(apiError);
 * }
 */
export function toApiError(error: any): ApiError {
  // Si c'est déjà une ApiError, la retourner telle quelle
  if (isApiError(error)) {
    return error;
  }

  // Si c'est une Error standard, la convertir
  if (error instanceof Error) {
    return new InternalServerError(error.message, {
      originalError: error.name,
      stack: error.stack
    });
  }

  // Pour tout autre type, créer une erreur générique
  return new InternalServerError('An unknown error occurred', {
    originalError: String(error)
  });
}
