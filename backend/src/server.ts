/**
 * server.ts - Point d'entrée principal du serveur
 *
 * Ce fichier initialise et configure le serveur Express complet.
 * Il orchestre tous les middlewares, routes et la base de données.
 *
 * Fonctionnalités principales :
 * - Configuration d'Express
 * - Middlewares de sécurité (Helmet, CORS)
 * - Middlewares de performance (compression)
 * - Initialisation de la base de données et migrations
 * - Configuration des routes
 * - Gestion d'erreurs globale
 * - Démarrage du serveur HTTP
 *
 * Dépendances :
 * - express : Framework web
 * - cors : Cross-Origin Resource Sharing
 * - helmet : Headers de sécurité
 * - compression : Compression gzip/deflate
 * - config : Configuration de l'application
 * - database : Connexion et migrations
 * - routes : Routes de l'API
 * - middlewares : Middlewares personnalisés
 *
 * @author Claude Code
 * @version 1.0.0
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import config from './config';
import { initDatabase } from './database/connection';
import runMigrations from './database/migrations';
import todoRoutes from './routes/todoRoutes';
import {
  errorHandler,
  notFoundHandler,
  requestLogger,
  requestId
} from './middlewares/errorHandler';
import { globalRateLimiter } from './middlewares/rateLimiter';
import logger from './utils/logger';

/**
 * Crée et configure l'application Express
 *
 * @returns {Application} Application Express configurée
 */
function createApp(): Application {
  // Créer l'application Express
  const app: Application = express();

  // ============================================================================
  // MIDDLEWARES GLOBAUX (ordre important !)
  // ============================================================================

  // 1. Request ID - Ajouter un ID unique à chaque requête
  //    Doit être en premier pour que l'ID soit disponible dans tous les logs
  app.use(requestId);

  // 2. Request Logger - Logger toutes les requêtes HTTP
  //    Doit être tôt pour capturer toutes les requêtes
  app.use(requestLogger);

  // 3. Helmet - Headers de sécurité HTTP
  //    Protège contre diverses vulnérabilités web
  if (config.security.enableHelmet) {
    app.use(
      helmet({
        // Configuration de Content Security Policy
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"]
          }
        }
      })
    );
    logger.info('✅ Helmet activé (headers de sécurité)');
  }

  // 4. CORS - Cross-Origin Resource Sharing
  //    Permet au frontend d'accéder à l'API
  app.use(
    cors({
      // Origines autorisées (définies dans config)
      origin: config.cors.origins,

      // Autoriser les cookies et credentials
      credentials: config.cors.credentials,

      // Méthodes HTTP autorisées
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

      // Headers autorisés
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'Cache-Control', 'Pragma', 'Expires'],

      // Headers exposés au client
      exposedHeaders: ['X-Request-ID', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset']
    })
  );
  logger.info('✅ CORS configuré', { origins: config.cors.origins });

  // 5. Compression - Compresse les réponses HTTP
  //    Réduit la bande passante (gzip/deflate)
  if (config.security.enableCompression) {
    app.use(
      compression({
        // Niveau de compression (1-9, 6 par défaut)
        level: 6,

        // Seuil minimum pour la compression (1KB)
        threshold: 1024
      })
    );
    logger.info('✅ Compression activée');
  }

  // 6. Body Parsers - Parse les corps de requête
  //    JSON parser avec limite de taille
  app.use(express.json({ limit: '1mb' }));

  //    URL-encoded parser (pour les formulaires)
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  /**
   * GET /health
   *
   * Endpoint de santé pour le monitoring.
   * Retourne l'état du serveur et de la base de données.
   */
  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.server.env,
      version: '1.0.0'
    });
  });

  /**
   * GET /
   *
   * Route racine - Information sur l'API.
   */
  app.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Todo API - Bienvenue !',
      version: '1.0.0',
      documentation: '/api/todos',
      endpoints: {
        health: '/health',
        todos: '/api/todos',
        stats: '/api/todos/stats'
      }
    });
  });

  // ============================================================================
  // ROUTES API
  // ============================================================================

  // Rate limiter global pour toutes les routes /api
  app.use('/api', globalRateLimiter);

  // Routes des todos
  app.use('/api/todos', todoRoutes);

  // ============================================================================
  // GESTION D'ERREURS
  // ============================================================================

  // Handler pour les routes non trouvées (404)
  // Doit être APRÈS toutes les routes
  app.use(notFoundHandler);

  // Handler d'erreurs global
  // Doit être en DERNIER
  app.use(errorHandler);

  return app;
}

/**
 * Initialise la base de données
 *
 * Établit la connexion et exécute les migrations.
 *
 * @returns {Promise<void>}
 */
async function initializeDatabase(): Promise<void> {
  try {
    logger.info('🔄 Initialisation de la base de données...');

    // Initialiser la connexion SQLite
    initDatabase();

    // Exécuter les migrations
    await runMigrations();

    logger.info('✅ Base de données initialisée et migrée');
  } catch (error) {
    logger.error('❌ Erreur lors de l\'initialisation de la base de données', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Démarre le serveur HTTP
 *
 * @param {Application} app - Application Express
 * @returns {Promise<void>}
 */
async function startServer(app: Application): Promise<void> {
  try {
    // Démarrer le serveur HTTP
    const server = app.listen(config.server.port, () => {
      logger.info('🚀 Serveur démarré avec succès !');
      logger.info(`📡 Écoute sur le port ${config.server.port}`);
      logger.info(`🌍 Environnement: ${config.server.env}`);
      logger.info(`📍 URL locale: http://localhost:${config.server.port}`);
      logger.info(`📍 API: http://localhost:${config.server.port}/api/todos`);
      logger.info(`📊 Stats: http://localhost:${config.server.port}/api/todos/stats`);
      logger.info(`💚 Health: http://localhost:${config.server.port}/health`);

      // En développement, afficher les origines CORS
      if (config.server.env === 'development') {
        logger.info('🔓 Origines CORS autorisées:', {
          origins: config.cors.origins
        });
      }
    });

    // Gestion propre de l'arrêt du serveur
    process.on('SIGTERM', () => {
      logger.info('📛 Signal SIGTERM reçu, arrêt du serveur...');
      server.close(() => {
        logger.info('✅ Serveur arrêté proprement');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('📛 Signal SIGINT reçu, arrêt du serveur...');
      server.close(() => {
        logger.info('✅ Serveur arrêté proprement');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('❌ Erreur lors du démarrage du serveur', {
      error: error instanceof Error ? error.message : String(error)
    });
    process.exit(1);
  }
}

/**
 * Fonction principale de démarrage
 *
 * Orchestre l'initialisation complète du serveur.
 */
async function main(): Promise<void> {
  try {
    // Afficher le banner de démarrage
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║               🚀 TODO API - Starting Server 🚀              ║
║                                                              ║
║   ✨ Architecture propre avec Clean Architecture ✨         ║
║   🔒 Sécurité : Helmet + CORS + Rate Limiting 🔒           ║
║   📝 Validation complète avec Zod 📝                        ║
║   💾 Base de données SQLite avec migrations 💾              ║
║   📊 Logging professionnel avec Winston 📊                  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);

    logger.info('🎬 Démarrage de l\'application...');

    // Étape 1 : Initialiser la base de données
    await initializeDatabase();

    // Étape 2 : Créer l'application Express
    const app = createApp();

    // Étape 3 : Démarrer le serveur HTTP
    await startServer(app);
  } catch (error) {
    logger.error('❌ Erreur fatale lors du démarrage', {
      error: error instanceof Error ? error.message : String(error)
    });
    process.exit(1);
  }
}

// ============================================================================
// POINT D'ENTRÉE
// ============================================================================

// Démarrer l'application si ce fichier est exécuté directement
if (require.main === module) {
  main();
}

// Exporter l'app pour les tests
export { createApp, initializeDatabase };
