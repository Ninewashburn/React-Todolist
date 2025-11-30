/**
 * migrations/001_create_todos_table.ts - Migration initiale
 *
 * Crée la table 'todos' avec tous les champs nécessaires,
 * les contraintes et les index pour les performances.
 *
 * Fonctionnalités :
 * - Création de la table todos
 * - Contraintes (NOT NULL, CHECK, DEFAULT)
 * - Index pour les recherches fréquentes
 * - Support rollback pour annuler la migration
 *
 * @author Claude Code
 * @version 1.0.0
 */

// @ts-ignore - better-sqlite3 nécessite Visual Studio Build Tools sur Windows
import { Database } from 'better-sqlite3';

/**
 * Migration UP - Applique la migration
 *
 * Crée la table todos avec le schéma complet incluant :
 * - Tous les champs (id, title, description, etc.)
 * - Contraintes de validation (longueur, valeurs autorisées)
 * - Index pour optimiser les requêtes fréquentes
 *
 * @param {Database} db - Instance de la base de données
 * @returns {void}
 */
export function up(db: Database): void {
  console.log('🔄 Exécution de la migration 001: create_todos_table');

  // Créer la table todos
  // Utilisation de TEXT pour les UUIDs (SQLite n'a pas de type UUID natif)
  // Utilisation de INTEGER pour les booléens (0 = false, 1 = true)
  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      -- Identifiant unique (UUID v4 généré par l'application)
      id TEXT PRIMARY KEY NOT NULL,

      -- Titre de la tâche (obligatoire, 3-100 caractères)
      title TEXT NOT NULL CHECK(length(title) >= 3 AND length(title) <= 100),

      -- Description détaillée optionnelle (max 500 caractères)
      description TEXT CHECK(description IS NULL OR length(description) <= 500),

      -- Statut de complétion (0 = actif, 1 = complété)
      completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0, 1)),

      -- Priorité (low, medium, high)
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),

      -- Date d'échéance optionnelle (format ISO 8601)
      due_date TEXT CHECK(due_date IS NULL OR due_date IS datetime(due_date)),

      -- Tags/catégories en JSON (tableau de strings)
      tags TEXT NOT NULL DEFAULT '[]',

      -- Date de création (générée automatiquement, immuable)
      created_at TEXT NOT NULL DEFAULT (datetime('now')),

      -- Date de dernière modification (mise à jour automatiquement)
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),

      -- Date de complétion (NULL si non complété)
      completed_at TEXT CHECK(completed_at IS NULL OR completed_at IS datetime(completed_at))
    )
  `);

  console.log('✅ Table "todos" créée');

  // Créer un index sur le champ 'completed' pour optimiser les filtres
  // Les requêtes "SELECT * FROM todos WHERE completed = 0" seront plus rapides
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_todos_completed
    ON todos(completed)
  `);

  console.log('✅ Index "idx_todos_completed" créé');

  // Créer un index sur le champ 'priority' pour optimiser les filtres
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_todos_priority
    ON todos(priority)
  `);

  console.log('✅ Index "idx_todos_priority" créé');

  // Créer un index sur 'created_at' pour optimiser les tris par date
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_todos_created_at
    ON todos(created_at DESC)
  `);

  console.log('✅ Index "idx_todos_created_at" créé');

  // Créer un index sur 'due_date' pour optimiser les requêtes de todos en retard
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_todos_due_date
    ON todos(due_date)
  `);

  console.log('✅ Index "idx_todos_due_date" créé');

  // Créer un index composite pour optimiser les requêtes combinant completed et due_date
  // Utile pour trouver rapidement les todos actifs en retard
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_todos_completed_due_date
    ON todos(completed, due_date)
  `);

  console.log('✅ Index composite "idx_todos_completed_due_date" créé');

  // Créer un trigger pour mettre à jour automatiquement updated_at
  // À chaque UPDATE, le champ updated_at sera mis à jour avec la date actuelle
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_todos_updated_at
    AFTER UPDATE ON todos
    FOR EACH ROW
    BEGIN
      UPDATE todos SET updated_at = datetime('now') WHERE id = NEW.id;
    END
  `);

  console.log('✅ Trigger "update_todos_updated_at" créé');

  console.log('✅ Migration 001 terminée avec succès');
}

/**
 * Migration DOWN - Annule la migration
 *
 * Supprime la table todos et tous les objets associés
 * (index, triggers). Utilisé pour rollback en cas de problème.
 *
 * ATTENTION : Supprime toutes les données !
 *
 * @param {Database} db - Instance de la base de données
 * @returns {void}
 */
export function down(db: Database): void {
  console.log('🔄 Rollback de la migration 001: create_todos_table');

  // Supprimer le trigger
  db.exec('DROP TRIGGER IF EXISTS update_todos_updated_at');
  console.log('✅ Trigger supprimé');

  // Supprimer les index
  // Les index seront automatiquement supprimés avec la table,
  // mais on les supprime explicitement pour plus de clarté
  db.exec('DROP INDEX IF EXISTS idx_todos_completed');
  db.exec('DROP INDEX IF EXISTS idx_todos_priority');
  db.exec('DROP INDEX IF EXISTS idx_todos_created_at');
  db.exec('DROP INDEX IF EXISTS idx_todos_due_date');
  db.exec('DROP INDEX IF EXISTS idx_todos_completed_due_date');
  console.log('✅ Index supprimés');

  // Supprimer la table todos
  // ATTENTION : Cela supprime toutes les données !
  db.exec('DROP TABLE IF EXISTS todos');
  console.log('✅ Table "todos" supprimée');

  console.log('✅ Rollback 001 terminé');
}
