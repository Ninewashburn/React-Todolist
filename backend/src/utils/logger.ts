/**
 * utils/logger.ts - Système de logging centralisé
 *
 * Ce fichier configure Winston pour un logging professionnel
 * avec support des niveaux, formats et transports multiples.
 *
 * Fonctionnalités principales :
 * - Logging multi-niveaux (error, warn, info, debug)
 * - Format JSON pour analyse automatisée
 * - Format coloré pour la console
 * - Rotation des fichiers de log
 * - Métadonnées contextuelles
 *
 * Dépendances :
 * - winston : Bibliothèque de logging
 * - config : Configuration de l'application
 *
 * @author Claude Code
 * @version 1.0.0
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs';
import config from '../config';

/**
 * Crée le dossier de logs s'il n'existe pas
 */
function ensureLogDirectory(): void {
  if (!fs.existsSync(config.logging.dir)) {
    fs.mkdirSync(config.logging.dir, { recursive: true });
    console.log(`📁 Dossier de logs créé: ${config.logging.dir}`);
  }
}

/**
 * Format personnalisé pour les logs console
 *
 * Affiche les logs avec couleurs et formatage lisible :
 * [2024-01-01 12:00:00] INFO: Message de log { metadata }
 */
const consoleFormat = winston.format.combine(
  // Ajouter un timestamp formaté
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),

  // Coloriser le niveau de log
  winston.format.colorize({
    all: false,
    level: true
  }),

  // Formater le message final
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;

    // Message de base avec timestamp et niveau
    let log = `[${timestamp}] ${level}: ${message}`;

    // Ajouter les métadonnées s'il y en a
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

/**
 * Format JSON pour les fichiers de log
 *
 * Permet l'analyse automatisée et l'intégration avec des outils
 * comme ELK (Elasticsearch, Logstash, Kibana)
 */
const fileFormat = winston.format.combine(
  // Ajouter un timestamp ISO 8601
  winston.format.timestamp(),

  // Ajouter les erreurs formatées
  winston.format.errors({ stack: true }),

  // Convertir en JSON
  winston.format.json()
);

/**
 * Configuration des transports (destinations des logs)
 */
const transports: winston.transport[] = [];

// Transport console (développement et production)
if (config.logging.enableConsole) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: config.logging.level
    })
  );
}

// Transports fichiers (production uniquement)
if (config.logging.enableFile) {
  // Créer le dossier de logs si nécessaire
  ensureLogDirectory();

  // Fichier pour tous les logs
  transports.push(
    new winston.transports.File({
      filename: path.join(config.logging.dir, 'combined.log'),
      format: fileFormat,
      level: config.logging.level,
      maxsize: 10485760, // 10MB
      maxFiles: 5 // Garder 5 fichiers de rotation
    })
  );

  // Fichier pour les erreurs uniquement
  transports.push(
    new winston.transports.File({
      filename: path.join(config.logging.dir, 'errors.log'),
      format: fileFormat,
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  );
}

/**
 * Instance du logger Winston
 *
 * Configurée avec les transports et formats définis ci-dessus.
 */
const logger = winston.createLogger({
  // Niveau de log par défaut
  level: config.logging.level,

  // Métadonnées par défaut ajoutées à chaque log
  defaultMeta: {
    service: 'todo-api',
    env: config.server.env
  },

  // Transports (console et/ou fichiers)
  transports,

  // Ne pas quitter sur exception non capturée
  exitOnError: false
});

/**
 * Logger les exceptions non capturées
 *
 * En production, ces logs peuvent être critiques pour le debugging.
 */
if (config.logging.enableFile) {
  ensureLogDirectory();

  logger.exceptions.handle(
    new winston.transports.File({
      filename: path.join(config.logging.dir, 'exceptions.log'),
      format: fileFormat
    })
  );

  logger.rejections.handle(
    new winston.transports.File({
      filename: path.join(config.logging.dir, 'rejections.log'),
      format: fileFormat
    })
  );
}

/**
 * Helper pour logger les requêtes HTTP
 *
 * @param {string} method - Méthode HTTP (GET, POST, etc.)
 * @param {string} url - URL de la requête
 * @param {number} statusCode - Code HTTP de la réponse
 * @param {number} duration - Durée en ms
 * @param {any} meta - Métadonnées additionnelles
 *
 * @example
 * logger.logRequest('GET', '/api/todos', 200, 45, { userId: '123' });
 */
logger.logRequest = function (
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  meta?: any
): void {
  // Déterminer le niveau de log selon le code de statut
  let level: string;
  if (statusCode >= 500) {
    level = 'error';
  } else if (statusCode >= 400) {
    level = 'warn';
  } else {
    level = 'info';
  }

  // Logger la requête avec le niveau approprié
  (this as any)[level]('HTTP Request', {
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
    ...meta
  });
};

/**
 * Helper pour logger les erreurs avec contexte
 *
 * @param {Error} error - L'erreur à logger
 * @param {any} context - Contexte additionnel
 *
 * @example
 * logger.logError(new Error('Database connection failed'), {
 *   operation: 'createTodo',
 *   userId: '123'
 * });
 */
logger.logError = function (error: Error, context?: any): void {
  this.error(error.message, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    ...context
  });
};

/**
 * Helper pour logger les opérations de base de données
 *
 * @param {string} operation - Type d'opération (SELECT, INSERT, etc.)
 * @param {string} table - Nom de la table
 * @param {number} duration - Durée en ms
 * @param {any} meta - Métadonnées additionnelles
 *
 * @example
 * logger.logDbOperation('INSERT', 'todos', 12, { rows: 1 });
 */
logger.logDbOperation = function (
  operation: string,
  table: string,
  duration: number,
  meta?: any
): void {
  this.debug('Database Operation', {
    operation,
    table,
    duration: `${duration}ms`,
    ...meta
  });
};

// Ajouter les types pour les méthodes personnalisées
declare module 'winston' {
  interface Logger {
    logRequest(
      method: string,
      url: string,
      statusCode: number,
      duration: number,
      meta?: any
    ): void;
    logError(error: Error, context?: any): void;
    logDbOperation(operation: string, table: string, duration: number, meta?: any): void;
  }
}

// Logger le démarrage du système de logging
if (config.server.env !== 'test') {
  logger.info('📝 Logger initialisé', {
    level: config.logging.level,
    console: config.logging.enableConsole,
    file: config.logging.enableFile
  });
}

export default logger;
