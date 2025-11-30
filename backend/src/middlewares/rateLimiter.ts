/**
 * middlewares/rateLimiter.ts - Limitation de débit (Rate Limiting)
 *
 * Ce fichier configure le rate limiting pour protéger l'API contre les abus
 * et les attaques par déni de service (DoS).
 *
 * Fonctionnalités principales :
 * - Limite le nombre de requêtes par IP
 * - Configuration flexible via variables d'environnement
 * - Messages d'erreur personnalisés
 * - Headers standards de rate limiting
 *
 * Dépendances :
 * - express-rate-limit : Bibliothèque de rate limiting
 * - config : Configuration de l'application
 * - utils/errors : Classes d'erreurs
 *
 * @author Claude Code
 * @version 1.0.0
 */

import rateLimit from 'express-rate-limit';
import config from '../config';
import { TooManyRequestsError } from '../utils/errors';

/**
 * Rate limiter global pour toute l'API
 *
 * Limite le nombre total de requêtes qu'un client peut faire sur l'API.
 * Configuration par défaut : 100 requêtes par 15 minutes.
 *
 * @example
 * // Dans server.ts
 * app.use('/api', globalRateLimiter);
 */
export const globalRateLimiter = rateLimit({
  // Durée de la fenêtre en millisecondes
  // Configurée via RATE_LIMIT_WINDOW_MINUTES dans .env
  windowMs: config.rateLimit.windowMs,

  // Nombre maximum de requêtes par fenêtre
  // Configuré via RATE_LIMIT_MAX_REQUESTS dans .env
  max: config.rateLimit.maxRequests,

  // Message personnalisé quand la limite est atteinte
  message: {
    success: false,
    error: {
      statusCode: 429,
      code: 'TOO_MANY_REQUESTS',
      message: `Trop de requêtes depuis cette IP. Veuillez réessayer dans ${
        config.rateLimit.windowMs / 60000
      } minutes.`,
      details: {
        limit: config.rateLimit.maxRequests,
        windowMinutes: config.rateLimit.windowMs / 60000
      }
    }
  },

  // Code de statut HTTP à retourner
  statusCode: 429,

  // Headers standards de rate limiting (RFC 6585)
  standardHeaders: true, // Ajoute les headers RateLimit-*

  // Headers legacy X-RateLimit-* (pour compatibilité)
  legacyHeaders: false,

  // Fonction pour identifier le client (par IP par défaut)
  // On pourrait aussi utiliser un token d'authentification si implémenté
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },

  // Ne pas compter les requêtes qui ont réussi (optionnel)
  // Par défaut, toutes les requêtes sont comptées
  skipSuccessfulRequests: false,

  // Ne pas compter les requêtes qui ont échoué (optionnel)
  skipFailedRequests: false,

  // Handler personnalisé quand la limite est atteinte
  handler: (req, res, next, options) => {
    // Créer une erreur TooManyRequestsError
    const error = new TooManyRequestsError(
      `Trop de requêtes depuis cette IP. Limite : ${options.max} requêtes par ${
        options.windowMs / 60000
      } minutes.`,
      {
        limit: options.max,
        windowMinutes: options.windowMs / 60000,
        retryAfter: res.getHeader('Retry-After')
      }
    );

    // Passer au gestionnaire d'erreurs
    next(error);
  }
});

/**
 * Rate limiter strict pour les endpoints de création
 *
 * Limite plus stricte pour les opérations d'écriture (POST, PUT, PATCH, DELETE)
 * pour prévenir le spam et les abus.
 *
 * Configuration : 20 requêtes par 15 minutes.
 *
 * @example
 * // Dans les routes
 * router.post('/todos', createRateLimiter, validate(...), controller.create);
 */
export const createRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limite stricte de 20 requêtes

  message: {
    success: false,
    error: {
      statusCode: 429,
      code: 'TOO_MANY_REQUESTS',
      message: 'Trop de créations depuis cette IP. Veuillez réessayer dans 15 minutes.',
      details: {
        limit: 20,
        windowMinutes: 15
      }
    }
  },

  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res, next, options) => {
    const error = new TooManyRequestsError(
      'Trop de créations depuis cette IP.',
      {
        limit: options.max,
        windowMinutes: 15,
        retryAfter: res.getHeader('Retry-After')
      }
    );
    next(error);
  }
});

/**
 * Rate limiter pour les opérations en masse (bulk)
 *
 * Limite très stricte pour les opérations bulk qui sont plus coûteuses.
 * Configuration : 5 requêtes par 15 minutes.
 *
 * @example
 * router.post('/todos/bulk', bulkRateLimiter, validate(...), controller.bulkCreate);
 */
export const bulkRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limite très stricte de 5 requêtes

  message: {
    success: false,
    error: {
      statusCode: 429,
      code: 'TOO_MANY_REQUESTS',
      message: 'Trop d\'opérations en masse depuis cette IP. Veuillez réessayer dans 15 minutes.',
      details: {
        limit: 5,
        windowMinutes: 15
      }
    }
  },

  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res, next, options) => {
    const error = new TooManyRequestsError(
      'Trop d\'opérations en masse depuis cette IP.',
      {
        limit: options.max,
        windowMinutes: 15,
        retryAfter: res.getHeader('Retry-After')
      }
    );
    next(error);
  }
});

/**
 * Rate limiter pour les endpoints de suppression
 *
 * Limite modérée pour les suppressions.
 * Configuration : 30 requêtes par 15 minutes.
 *
 * @example
 * router.delete('/todos/:id', deleteRateLimiter, validate(...), controller.delete);
 */
export const deleteRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limite de 30 requêtes

  message: {
    success: false,
    error: {
      statusCode: 429,
      code: 'TOO_MANY_REQUESTS',
      message: 'Trop de suppressions depuis cette IP. Veuillez réessayer dans 15 minutes.',
      details: {
        limit: 30,
        windowMinutes: 15
      }
    }
  },

  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res, next, options) => {
    const error = new TooManyRequestsError(
      'Trop de suppressions depuis cette IP.',
      {
        limit: options.max,
        windowMinutes: 15,
        retryAfter: res.getHeader('Retry-After')
      }
    );
    next(error);
  }
});

export default globalRateLimiter;
