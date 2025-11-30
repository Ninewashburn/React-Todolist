/**
 * migrations/index.ts - Système de gestion des migrations
 *
 * Ce fichier orchestre l'exécution des migrations de base de données.
 * Il suit quelles migrations ont été appliquées et exécute les nouvelles.
 *
 * Fonctionnalités principales :
 * - Table de suivi des migrations
 * - Exécution séquentielle des migrations
 * - Support rollback
 * - Protection contre les exécutions multiples
 *
 * Dépendances :
 * - database/connection : Connexion à la base
 * - Fichiers de migration individuels
 *
 * @author Claude Code
 * @version 1.0.0
 */

// @ts-ignore - better-sqlite3 nécessite Visual Studio Build Tools sur Windows
import { Database } from 'better-sqlite3';
import { getDatabase } from '../connection';
import * as migration001 from './001_create_todos_table';

/**
 * Interface pour une migration
 *
 * Chaque migration doit implémenter cette interface
 * avec une fonction up() et down().
 */
interface Migration {
  up: (db: Database) => void;
  down: (db: Database) => void;
}

/**
 * Registre de toutes les migrations disponibles
 *
 * Les migrations sont exécutées dans l'ordre du tableau.
 * Pour ajouter une nouvelle migration :
 * 1. Créer un fichier 00X_description.ts
 * 2. Importer le fichier en haut de ce fichier
 * 3. Ajouter l'import au tableau ci-dessous
 */
const migrations: { name: string; migration: Migration }[] = [
  { name: '001_create_todos_table', migration: migration001 }
];

/**
 * Crée la table de suivi des migrations
 *
 * Cette table enregistre quelles migrations ont été appliquées
 * pour éviter de les ré-exécuter.
 *
 * @param {Database} db - Instance de la base de données
 * @returns {void}
 */
function createMigrationsTable(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      -- Nom de la migration (ex: 001_create_todos_table)
      name TEXT PRIMARY KEY NOT NULL,

      -- Date d'exécution de la migration
      executed_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

/**
 * Vérifie si une migration a déjà été exécutée
 *
 * @param {Database} db - Instance de la base de données
 * @param {string} name - Nom de la migration
 * @returns {boolean} true si déjà exécutée, false sinon
 */
function isMigrationExecuted(db: Database, name: string): boolean {
  const result = db
    .prepare('SELECT COUNT(*) as count FROM migrations WHERE name = ?')
    .get(name) as { count: number };

  return result.count > 0;
}

/**
 * Enregistre une migration comme exécutée
 *
 * @param {Database} db - Instance de la base de données
 * @param {string} name - Nom de la migration
 * @returns {void}
 */
function recordMigration(db: Database, name: string): void {
  db.prepare('INSERT INTO migrations (name) VALUES (?)').run(name);
}

/**
 * Supprime l'enregistrement d'une migration
 *
 * Utilisé lors du rollback d'une migration.
 *
 * @param {Database} db - Instance de la base de données
 * @param {string} name - Nom de la migration
 * @returns {void}
 */
function removeMigrationRecord(db: Database, name: string): void {
  db.prepare('DELETE FROM migrations WHERE name = ?').run(name);
}

/**
 * Exécute toutes les migrations en attente
 *
 * Parcourt le registre des migrations et exécute celles
 * qui n'ont pas encore été appliquées.
 *
 * @returns {Promise<void>}
 * @throws {Error} Si une migration échoue
 *
 * @example
 * await runMigrations();
 * console.log('Migrations appliquées avec succès');
 */
export async function runMigrations(): Promise<void> {
  const db = getDatabase();

  console.log('🔄 Début de l\'exécution des migrations...');

  try {
    // Créer la table de suivi des migrations si elle n'existe pas
    createMigrationsTable(db);

    let executedCount = 0;

    // Parcourir toutes les migrations enregistrées
    for (const { name, migration } of migrations) {
      // Vérifier si la migration a déjà été exécutée
      if (isMigrationExecuted(db, name)) {
        console.log(`⏭️  Migration ${name} déjà exécutée, passage à la suivante`);
        continue;
      }

      // Exécuter la migration dans une transaction
      // Si la migration échoue, la transaction est rollbackée automatiquement
      const transaction = db.transaction(() => {
        console.log(`▶️  Exécution de la migration: ${name}`);

        // Exécuter la fonction up() de la migration
        migration.up(db);

        // Enregistrer la migration comme exécutée
        recordMigration(db, name);

        console.log(`✅ Migration ${name} exécutée avec succès`);
      });

      // Exécuter la transaction
      transaction();
      executedCount++;
    }

    // Afficher le résumé
    if (executedCount === 0) {
      console.log('✅ Aucune migration à exécuter, base de données à jour');
    } else {
      console.log(`✅ ${executedCount} migration(s) exécutée(s) avec succès`);
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des migrations:', error);
    throw error;
  }
}

/**
 * Rollback de la dernière migration
 *
 * Annule la dernière migration appliquée en exécutant
 * sa fonction down().
 *
 * ATTENTION : Peut entraîner une perte de données !
 *
 * @returns {Promise<void>}
 * @throws {Error} Si le rollback échoue
 *
 * @example
 * await rollbackLastMigration();
 * console.log('Dernière migration annulée');
 */
export async function rollbackLastMigration(): Promise<void> {
  const db = getDatabase();

  console.log('🔄 Début du rollback de la dernière migration...');

  try {
    // Créer la table de suivi si elle n'existe pas
    createMigrationsTable(db);

    // Récupérer la dernière migration exécutée
    const lastMigration = db
      .prepare('SELECT name FROM migrations ORDER BY executed_at DESC LIMIT 1')
      .get() as { name: string } | undefined;

    // Vérifier qu'il y a une migration à rollback
    if (!lastMigration) {
      console.log('ℹ️  Aucune migration à rollback');
      return;
    }

    // Trouver la migration dans le registre
    const migrationEntry = migrations.find((m) => m.name === lastMigration.name);

    if (!migrationEntry) {
      throw new Error(`Migration ${lastMigration.name} introuvable dans le registre`);
    }

    // Exécuter le rollback dans une transaction
    const transaction = db.transaction(() => {
      console.log(`◀️  Rollback de la migration: ${lastMigration.name}`);

      // Exécuter la fonction down() de la migration
      migrationEntry.migration.down(db);

      // Supprimer l'enregistrement de la migration
      removeMigrationRecord(db, lastMigration.name);

      console.log(`✅ Rollback de ${lastMigration.name} effectué avec succès`);
    });

    // Exécuter la transaction
    transaction();
  } catch (error) {
    console.error('❌ Erreur lors du rollback:', error);
    throw error;
  }
}

/**
 * Rollback de toutes les migrations
 *
 * Annule toutes les migrations dans l'ordre inverse.
 * Remet la base de données à l'état initial.
 *
 * DANGER : Supprime toutes les données !
 *
 * @returns {Promise<void>}
 * @throws {Error} Si le rollback échoue
 *
 * @example
 * // Uniquement pour les tests ou le développement
 * await rollbackAllMigrations();
 */
export async function rollbackAllMigrations(): Promise<void> {
  const db = getDatabase();

  console.log('🔄 Début du rollback de toutes les migrations...');

  try {
    // Créer la table de suivi si elle n'existe pas
    createMigrationsTable(db);

    // Récupérer toutes les migrations exécutées (ordre inverse)
    const executedMigrations = db
      .prepare('SELECT name FROM migrations ORDER BY executed_at DESC')
      .all() as { name: string }[];

    // Vérifier qu'il y a des migrations à rollback
    if (executedMigrations.length === 0) {
      console.log('ℹ️  Aucune migration à rollback');
      return;
    }

    // Rollback chaque migration
    for (const { name } of executedMigrations) {
      const migrationEntry = migrations.find((m) => m.name === name);

      if (!migrationEntry) {
        console.warn(`⚠️  Migration ${name} introuvable dans le registre, passage à la suivante`);
        continue;
      }

      // Exécuter le rollback dans une transaction
      const transaction = db.transaction(() => {
        console.log(`◀️  Rollback de la migration: ${name}`);
        migrationEntry.migration.down(db);
        removeMigrationRecord(db, name);
        console.log(`✅ Rollback de ${name} effectué`);
      });

      transaction();
    }

    console.log(`✅ ${executedMigrations.length} migration(s) rollbackée(s)`);
  } catch (error) {
    console.error('❌ Erreur lors du rollback complet:', error);
    throw error;
  }
}

/**
 * Affiche l'état des migrations
 *
 * Liste toutes les migrations disponibles et leur statut
 * (exécutée ou en attente).
 *
 * @returns {Promise<void>}
 *
 * @example
 * await getMigrationStatus();
 */
export async function getMigrationStatus(): Promise<void> {
  const db = getDatabase();

  console.log('\n📋 État des migrations:\n');

  // Créer la table de suivi si elle n'existe pas
  createMigrationsTable(db);

  // Parcourir toutes les migrations
  for (const { name } of migrations) {
    const executed = isMigrationExecuted(db, name);
    const status = executed ? '✅ Exécutée' : '⏳ En attente';

    if (executed) {
      // Récupérer la date d'exécution
      const result = db
        .prepare('SELECT executed_at FROM migrations WHERE name = ?')
        .get(name) as { executed_at: string };

      console.log(`  ${status} - ${name} (${result.executed_at})`);
    } else {
      console.log(`  ${status} - ${name}`);
    }
  }

  console.log('');
}

// Export par défaut de la fonction principale
export default runMigrations;
