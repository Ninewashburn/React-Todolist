/**
 * config/index.ts - Configuration centralisée de l'application
 *
 * Ce fichier gère toute la configuration de l'application en chargeant
 * les variables d'environnement et en fournissant des valeurs par défaut.
 *
 * Fonctionnalités principales :
 * - Chargement des variables d'environnement
 * - Validation de la configuration
 * - Valeurs par défaut pour le développement
 * - Export d'un objet config immutable
 *
 * Dépendances :
 * - dotenv : Chargement des variables .env
 *
 * @author Claude Code
 * @version 1.0.0
 */

import dotenv from 'dotenv';
import path from 'path';

// Charger les variables d'environnement depuis le fichier .env
// Le fichier doit être à la racine du projet backend
dotenv.config();

/**
 * Interface de configuration typée
 *
 * Définit la structure complète de la configuration
 * avec tous les types appropriés.
 */
interface Config {
  // Configuration du serveur
  server: {
    port: number;
    env: string;
    apiPrefix: string;
    apiVersion: string;
  };

  // Configuration de la base de données
  database: {
    path: string;
    enableWAL: boolean;
  };

  // Configuration CORS
  cors: {
    origins: string[];
    credentials: boolean;
  };

  // Configuration du rate limiting
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };

  // Configuration du logging
  logging: {
    level: string;
    dir: string;
    enableConsole: boolean;
    enableFile: boolean;
  };

  // Configuration de sécurité
  security: {
    enableHelmet: boolean;
    enableCompression: boolean;
  };

  // Configuration de pagination
  pagination: {
    defaultLimit: number;
    maxLimit: number;
  };
}

/**
 * Helper pour parser les entiers depuis les variables d'env
 *
 * @param {string | undefined} value - Valeur de la variable d'env
 * @param {number} defaultValue - Valeur par défaut si non définie
 * @returns {number} Valeur parsée ou valeur par défaut
 */
function parseIntEnv(value: string | undefined, defaultValue: number): number {
  // Si la valeur n'est pas définie, retourner la valeur par défaut
  if (!value) return defaultValue;

  // Parser la valeur en entier
  const parsed = parseInt(value, 10);

  // Si le parsing échoue (NaN), retourner la valeur par défaut
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Helper pour parser les booléens depuis les variables d'env
 *
 * @param {string | undefined} value - Valeur de la variable d'env
 * @param {boolean} defaultValue - Valeur par défaut si non définie
 * @returns {boolean} Valeur parsée ou valeur par défaut
 */
function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  // Si la valeur n'est pas définie, retourner la valeur par défaut
  if (!value) return defaultValue;

  // Considérer 'true', '1', 'yes' comme true
  return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
}

/**
 * Helper pour parser les tableaux depuis les variables d'env
 *
 * @param {string | undefined} value - Valeur de la variable d'env (séparée par virgules)
 * @param {string[]} defaultValue - Valeur par défaut si non définie
 * @returns {string[]} Tableau parsé ou valeur par défaut
 */
function parseArrayEnv(value: string | undefined, defaultValue: string[]): string[] {
  // Si la valeur n'est pas définie, retourner la valeur par défaut
  if (!value) return defaultValue;

  // Séparer par virgules et nettoyer les espaces
  return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
}

/**
 * Objet de configuration principal
 *
 * Charge toutes les variables d'environnement avec des valeurs
 * par défaut appropriées pour le développement.
 */
const config: Config = {
  // Configuration du serveur
  server: {
    // Port d'écoute du serveur (défaut: 3000)
    port: parseIntEnv(process.env['PORT'], 3000),

    // Environnement d'exécution (development, production, test)
    // Affecte le logging et la gestion d'erreurs
    env: process.env['NODE_ENV'] || 'development',

    // Préfixe pour toutes les routes API (ex: /api/todos)
    apiPrefix: process.env['API_PREFIX'] || '/api',

    // Version de l'API (pour versionning futur)
    apiVersion: process.env['API_VERSION'] || 'v1'
  },

  // Configuration de la base de données SQLite
  database: {
    // Chemin vers le fichier de base de données
    // En production, utiliser un chemin absolu sécurisé
    path: process.env['DATABASE_PATH'] || path.join(__dirname, '../../data/todos.db'),

    // Activer le Write-Ahead Logging pour de meilleures performances
    // WAL permet les lectures concurrentes pendant les écritures
    enableWAL: true
  },

  // Configuration CORS (Cross-Origin Resource Sharing)
  cors: {
    // Liste des origines autorisées
    // En développement : localhost avec différents ports
    // En production : domaines spécifiques uniquement
    origins: parseArrayEnv(
      process.env['CORS_ORIGIN'],
      ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000']
    ),

    // Autoriser l'envoi de cookies et credentials
    credentials: true
  },

  // Configuration du rate limiting (limitation de débit)
  rateLimit: {
    // Durée de la fenêtre en millisecondes
    // Convertir les minutes en ms (15 min par défaut)
    windowMs: parseIntEnv(process.env['RATE_LIMIT_WINDOW_MINUTES'], 15) * 60 * 1000,

    // Nombre maximum de requêtes par fenêtre
    // Limite à 100 requêtes par 15 minutes par défaut
    maxRequests: parseIntEnv(process.env['RATE_LIMIT_MAX_REQUESTS'], 100)
  },

  // Configuration du système de logging
  logging: {
    // Niveau de log (error, warn, info, debug, verbose)
    // En production, utiliser 'info' ou 'warn'
    // En développement, utiliser 'debug' pour plus de détails
    level: process.env['LOG_LEVEL'] || (process.env['NODE_ENV'] === 'production' ? 'info' : 'debug'),

    // Dossier de stockage des fichiers de log
    dir: process.env['LOG_DIR'] || path.join(__dirname, '../../logs'),

    // Activer les logs dans la console
    enableConsole: process.env['NODE_ENV'] !== 'test',

    // Activer les logs dans des fichiers
    // Désactivé en développement pour simplifier
    enableFile: process.env['NODE_ENV'] === 'production'
  },

  // Configuration de sécurité
  security: {
    // Activer Helmet pour les headers HTTP de sécurité
    // Helmet définit automatiquement des headers comme CSP, X-Frame-Options, etc.
    enableHelmet: parseBooleanEnv(process.env['ENABLE_HELMET'], true),

    // Activer la compression gzip/deflate des réponses
    // Réduit la bande passante mais augmente légèrement l'utilisation CPU
    enableCompression: parseBooleanEnv(process.env['ENABLE_COMPRESSION'], true)
  },

  // Configuration de la pagination
  pagination: {
    // Nombre d'items par défaut par page
    defaultLimit: parseIntEnv(process.env['DEFAULT_ITEMS_PER_PAGE'], 50),

    // Nombre maximum d'items par page
    // Limite pour éviter les requêtes trop lourdes
    maxLimit: parseIntEnv(process.env['MAX_ITEMS_PER_PAGE'], 100)
  }
};

/**
 * Valide la configuration au démarrage
 *
 * Vérifie que les valeurs critiques sont présentes et valides.
 * Lance une erreur si la configuration est invalide.
 *
 * @throws {Error} Si la configuration est invalide
 */
function validateConfig(): void {
  // Vérifier que le port est dans une plage valide
  if (config.server.port < 1 || config.server.port > 65535) {
    throw new Error(`Port invalide: ${config.server.port}. Doit être entre 1 et 65535.`);
  }

  // Vérifier que l'environnement est valide
  const validEnvs = ['development', 'production', 'test'];
  if (!validEnvs.includes(config.server.env)) {
    throw new Error(
      `Environnement invalide: ${config.server.env}. Doit être: ${validEnvs.join(', ')}`
    );
  }

  // Vérifier que le log level est valide
  const validLogLevels = ['error', 'warn', 'info', 'debug', 'verbose'];
  if (!validLogLevels.includes(config.logging.level)) {
    throw new Error(
      `Niveau de log invalide: ${config.logging.level}. Doit être: ${validLogLevels.join(', ')}`
    );
  }

  // Vérifier que les limites de pagination sont cohérentes
  if (config.pagination.defaultLimit > config.pagination.maxLimit) {
    throw new Error(
      `defaultLimit (${config.pagination.defaultLimit}) ne peut pas être supérieur à maxLimit (${config.pagination.maxLimit})`
    );
  }

  // Vérifier qu'au moins une origine CORS est définie
  if (config.cors.origins.length === 0) {
    console.warn('⚠️  Aucune origine CORS définie. L\'API ne sera pas accessible depuis un navigateur.');
  }
}

// Valider la configuration au chargement du module
validateConfig();

// Logger la configuration au démarrage (sauf en test)
if (config.server.env !== 'test') {
  console.log('📋 Configuration chargée:');
  console.log(`   - Environnement: ${config.server.env}`);
  console.log(`   - Port: ${config.server.port}`);
  console.log(`   - Base de données: ${config.database.path}`);
  console.log(`   - Niveau de log: ${config.logging.level}`);
  console.log(`   - CORS origins: ${config.cors.origins.join(', ')}`);
}

// Exporter la configuration en lecture seule
export default Object.freeze(config);
