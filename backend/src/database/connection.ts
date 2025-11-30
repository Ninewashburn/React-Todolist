/**
 * database/connection.ts - Gestion de la connexion SQLite
 *
 * Ce fichier gère la connexion à la base de données SQLite
 * en utilisant better-sqlite3 pour des performances optimales.
 *
 * Fonctionnalités principales :
 * - Connexion singleton à la base de données
 * - Configuration WAL pour performances
 * - Création automatique du dossier data
 * - Gestion propre de la fermeture
 *
 * Dépendances :
 * - better-sqlite3 : Driver SQLite haute performance
 * - config : Configuration de l'application
 *
 * @author Claude Code
 * @version 1.0.0
 */

// @ts-ignore - better-sqlite3 nécessite Visual Studio Build Tools sur Windows
// Alternative: installer Build Tools ou utiliser sql.js (implémentation JavaScript pure)
// Pour installer Build Tools: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import config from '../config';

/**
 * Instance singleton de la base de données
 * null avant l'initialisation
 */
let db: Database.Database | null = null;

/**
 * Initialise la connexion à la base de données
 *
 * Crée le dossier de données si nécessaire, établit la connexion
 * et configure les paramètres de performance (WAL mode, foreign keys).
 *
 * @returns {Database.Database} Instance de la base de données
 * @throws {Error} Si la connexion échoue
 *
 * @example
 * const db = initDatabase();
 * const todos = db.prepare('SELECT * FROM todos').all();
 */
export function initDatabase(): Database.Database {
  // Si déjà initialisée, retourner l'instance existante
  if (db) {
    return db;
  }

  try {
    // Extraire le dossier parent du chemin de la base de données
    const dbDir = path.dirname(config.database.path);

    // Créer le dossier s'il n'existe pas
    // { recursive: true } crée aussi les dossiers parents si nécessaire
    if (!fs.existsSync(dbDir)) {
      console.log(`📁 Création du dossier de données: ${dbDir}`);
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Créer la connexion à la base de données
    // verbose: callback pour logger toutes les requêtes SQL en mode debug
    console.log(`🔌 Connexion à la base de données: ${config.database.path}`);
    db = new Database(config.database.path, {
      verbose: config.server.env === 'development' ? console.log : undefined
    });

    // Activer le mode WAL (Write-Ahead Logging)
    // WAL améliore les performances en permettant les lectures concurrentes
    // pendant les écritures
    if (config.database.enableWAL) {
      db.pragma('journal_mode = WAL');
      console.log('✅ Mode WAL activé');
    }

    // Activer les contraintes de clés étrangères
    // SQLite ne les active pas par défaut pour la compatibilité
    db.pragma('foreign_keys = ON');

    // Optimisation : synchroniser moins souvent pour de meilleures performances
    // NORMAL est un bon compromis entre sécurité et performance
    db.pragma('synchronous = NORMAL');

    // Optimisation : augmenter le cache pour de meilleures performances
    // 10000 pages * 4KB = ~40MB de cache
    db.pragma('cache_size = -10000');

    console.log('✅ Base de données initialisée avec succès');

    return db;
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
    throw error;
  }
}

/**
 * Récupère l'instance de la base de données
 *
 * Si la base n'est pas encore initialisée, l'initialise automatiquement.
 *
 * @returns {Database.Database} Instance de la base de données
 *
 * @example
 * const db = getDatabase();
 * const count = db.prepare('SELECT COUNT(*) as count FROM todos').get();
 */
export function getDatabase(): Database.Database {
  // Initialiser si nécessaire
  if (!db) {
    return initDatabase();
  }
  return db;
}

/**
 * Ferme proprement la connexion à la base de données
 *
 * Doit être appelée avant l'arrêt de l'application pour éviter
 * la corruption de données.
 *
 * @returns {void}
 *
 * @example
 * process.on('SIGINT', () => {
 *   closeDatabase();
 *   process.exit(0);
 * });
 */
export function closeDatabase(): void {
  if (db) {
    console.log('🔒 Fermeture de la base de données...');
    db.close();
    db = null;
    console.log('✅ Base de données fermée');
  }
}

/**
 * Exécute une fonction dans une transaction
 *
 * La transaction est automatiquement committée si la fonction
 * s'exécute sans erreur, ou rollbackée en cas d'erreur.
 *
 * @param {Function} fn - Fonction à exécuter dans la transaction
 * @returns {T} Résultat de la fonction
 * @throws {Error} Si la transaction échoue
 *
 * @example
 * const result = runInTransaction(() => {
 *   db.prepare('INSERT INTO todos ...').run();
 *   db.prepare('UPDATE stats ...').run();
 *   return { success: true };
 * });
 */
export function runInTransaction<T>(fn: () => T): T {
  const database = getDatabase();

  // Créer une fonction de transaction avec better-sqlite3
  // Cette fonction gère automatiquement BEGIN, COMMIT et ROLLBACK
  const transaction = database.transaction(fn);

  // Exécuter la transaction
  return transaction();
}

/**
 * Vérifie si la base de données est initialisée
 *
 * @returns {boolean} true si initialisée, false sinon
 *
 * @example
 * if (!isDatabaseInitialized()) {
 *   initDatabase();
 * }
 */
export function isDatabaseInitialized(): boolean {
  return db !== null;
}

/**
 * Reset la base de données (DANGER - Uniquement pour tests)
 *
 * Ferme la connexion et supprime le fichier de base de données.
 * NE DOIT JAMAIS ÊTRE UTILISÉ EN PRODUCTION.
 *
 * @returns {void}
 *
 * @example
 * // Dans les tests uniquement
 * afterEach(() => {
 *   resetDatabase();
 * });
 */
export function resetDatabase(): void {
  // Vérifier qu'on n'est pas en production
  if (config.server.env === 'production') {
    throw new Error('❌ resetDatabase() ne peut pas être utilisé en production!');
  }

  // Fermer la connexion si ouverte
  closeDatabase();

  // Supprimer le fichier de base de données
  if (fs.existsSync(config.database.path)) {
    fs.unlinkSync(config.database.path);
    console.log('🗑️  Base de données supprimée');
  }

  // Supprimer aussi les fichiers WAL
  const walPath = config.database.path + '-wal';
  const shmPath = config.database.path + '-shm';

  if (fs.existsSync(walPath)) {
    fs.unlinkSync(walPath);
  }

  if (fs.existsSync(shmPath)) {
    fs.unlinkSync(shmPath);
  }
}

// Gestion propre de l'arrêt de l'application
// Fermer la base de données avant de quitter

process.on('SIGINT', () => {
  console.log('\n📛 Signal SIGINT reçu');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n📛 Signal SIGTERM reçu');
  closeDatabase();
  process.exit(0);
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('❌ Erreur non capturée:', error);
  closeDatabase();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesse rejetée non gérée:', reason);
  closeDatabase();
  process.exit(1);
});
