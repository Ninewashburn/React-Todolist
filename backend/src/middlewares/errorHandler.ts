/**
 * middlewares/errorHandler.ts - Gestion centralisée des erreurs
 *
 * Ce fichier contient le middleware global de gestion d'erreurs.
 * Il capture toutes les erreurs non gérées et les formate en réponses HTTP appropriées.
 *
 * Fonctionnalités principales :
 * - Capture toutes les erreurs de l'application
 * - Formate les réponses d'erreur de manière uniforme
 * - Log toutes les erreurs avec contexte
 * - Masque les détails sensibles en production
 *
 * Dépendances :
 * - express : Types Request, Response, NextFunction
 * - utils/errors : Classes d'erreurs personnalisées
 * - utils/logger : Système de logging
 * - config : Configuration de l'application
 *
 * @author Claude Code
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError, isApiError, toApiError } from '../utils/errors';
import logger from '../utils/logger';
import config from '../config';

/**
 * Middleware de gestion d'erreurs global
 *
 * IMPORTANT : Doit être enregistré APRÈS toutes les routes
 * car Express détecte les gestionnaires d'erreurs par le nombre de paramètres (4).
 *
 * @param {Error} error - L'erreur capturée
 * @param {Request} req - Objet de requête Express
 * @param {Response} res - Objet de réponse Express
 * @param {NextFunction} next - Fonction next (non utilisée mais requise)
 *
 * @example
 * // Dans server.ts
 * app.use(routes);
 * app.use(errorHandler); // Après les routes
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Convertir l'erreur en ApiError si ce n'en est pas déjà une
  const apiError = isApiError(error) ? error : toApiError(error);

  // Logger l'erreur avec contexte
  logger.error('Erreur capturée par errorHandler', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: apiError.code,
      statusCode: apiError.statusCode
    },
    request: {
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query,
      // Ne pas logger le body en production pour éviter les données sensibles
      body: config.server.env === 'development' ? req.body : undefined,
      ip: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  // Déterminer si on doit inclure la stack trace
  // Uniquement en développement pour faciliter le debugging
  const includeStack = config.server.env === 'development';

  // Construire la réponse d'erreur
  const errorResponse: any = {
    success: false,
    error: {
      statusCode: apiError.statusCode,
      code: apiError.code,
      message: apiError.message,
      timestamp: apiError.timestamp.toISOString()
    }
  };

  // Ajouter les détails si disponibles
  if (apiError.details) {
    errorResponse.error.details = apiError.details;
  }

  // Ajouter la stack trace en développement
  if (includeStack && apiError.stack) {
    errorResponse.error.stack = apiError.stack;
  }

  // Ajouter un identifiant de requête si disponible (pour le traçage)
  if (req.id) {
    errorResponse.requestId = req.id;
  }

  // Envoyer la réponse avec le bon code HTTP
  res.status(apiError.statusCode).json(errorResponse);
}

/**
 * Middleware pour gérer les routes non trouvées (404)
 *
 * Ce middleware doit être enregistré APRÈS toutes les routes
 * mais AVANT le errorHandler.
 *
 * @param {Request} req - Objet de requête Express
 * @param {Response} res - Objet de réponse Express
 * @param {NextFunction} next - Fonction next
 *
 * @example
 * // Dans server.ts
 * app.use(routes);
 * app.use(notFoundHandler); // Après les routes
 * app.use(errorHandler);    // En dernier
 */
export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  // Logger la route non trouvée
  logger.warn('Route non trouvée', {
    method: req.method,
    url: req.url,
    ip: req.ip
  });

  // Créer une erreur 404
  const error = new ApiError(
    404,
    `Route ${req.method} ${req.url} non trouvée`,
    'ROUTE_NOT_FOUND',
    {
      method: req.method,
      path: req.url
    }
  );

  // Passer au errorHandler
  next(error);
}

/**
 * Middleware pour logger les requêtes HTTP
 *
 * Log toutes les requêtes avec leur durée, code de statut, etc.
 * Utile pour le monitoring et le debugging.
 *
 * @param {Request} req - Objet de requête Express
 * @param {Response} res - Objet de réponse Express
 * @param {NextFunction} next - Fonction next
 *
 * @example
 * // Dans server.ts
 * app.use(requestLogger);
 * app.use(routes);
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Enregistrer le timestamp de début
  const startTime = Date.now();

  // Intercepter la fin de la réponse pour logger
  const originalSend = res.send;
  res.send = function (data: any): Response {
    // Calculer la durée de la requête
    const duration = Date.now() - startTime;

    // Logger la requête via le helper logger.logRequest
    logger.logRequest(req.method, req.url, res.statusCode, duration, {
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    // Appeler la fonction send originale
    return originalSend.call(this, data);
  };

  next();
}

/**
 * Middleware pour ajouter un ID unique à chaque requête
 *
 * Utile pour tracer les requêtes dans les logs.
 *
 * @param {Request} req - Objet de requête Express
 * @param {Response} res - Objet de réponse Express
 * @param {NextFunction} next - Fonction next
 */
export function requestId(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Générer un ID unique simple (timestamp + random)
  req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Ajouter l'ID aux headers de réponse
  res.setHeader('X-Request-ID', req.id);

  next();
}

// Étendre le type Request d'Express pour inclure l'ID
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export default errorHandler;
