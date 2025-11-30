/**
 * models/Todo.ts - Modèle de domaine Todo
 *
 * Ce fichier contient la classe Todo qui représente l'entité métier.
 * Elle encapsule la logique de domaine et les règles métier associées.
 *
 * Fonctionnalités principales :
 * - Factory methods pour créer des instances
 * - Validation des règles métier
 * - Méthodes utilitaires (isOverdue, toggle, etc.)
 *
 * Dépendances :
 * - uuid : Génération d'identifiants uniques
 * - types : Interfaces et énumérations
 *
 * @author Claude Code
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';
import { Todo as ITodo, TodoPriority, CreateTodoDto } from '../types';

/**
 * Classe Todo - Représente une tâche dans le système
 *
 * Cette classe encapsule toutes les données et comportements
 * associés à une tâche. Elle assure l'intégrité des données
 * via des validations métier.
 */
export class Todo implements ITodo {
  /**
   * Identifiant unique UUID v4
   * Généré automatiquement à la création
   */
  id: string;

  /**
   * Titre de la tâche
   * Contraintes : 3-100 caractères
   */
  title: string;

  /**
   * Description détaillée optionnelle
   * Contraintes : max 500 caractères
   */
  description?: string;

  /**
   * Statut de complétion
   * true = tâche terminée, false = tâche en cours
   */
  completed: boolean;

  /**
   * Niveau de priorité
   * Valeurs possibles : low, medium, high
   */
  priority: TodoPriority;

  /**
   * Date d'échéance optionnelle
   * null = pas de deadline
   */
  dueDate?: Date;

  /**
   * Liste de tags/catégories
   * Permet de classifier et filtrer les tâches
   */
  tags: string[];

  /**
   * Date de création
   * Générée automatiquement, immuable
   */
  createdAt: Date;

  /**
   * Date de dernière modification
   * Mise à jour automatiquement lors des updates
   */
  updatedAt: Date;

  /**
   * Date de complétion
   * null si non complété, Date si complété
   */
  completedAt?: Date;

  /**
   * Constructeur privé
   *
   * Utilisé uniquement par les factory methods pour garantir
   * la cohérence des données lors de la création.
   *
   * @param {Partial<ITodo>} props - Propriétés partielles du todo
   */
  private constructor(props: Partial<ITodo>) {
    this.id = props.id || uuidv4();
    this.title = props.title || '';
    this.description = props.description;
    this.completed = props.completed || false;
    this.priority = props.priority || TodoPriority.MEDIUM;
    this.dueDate = props.dueDate;
    this.tags = props.tags || [];
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
    this.completedAt = props.completedAt;
  }

  /**
   * Factory method pour créer un nouveau todo
   *
   * Crée une nouvelle instance de Todo à partir d'un DTO.
   * Génère automatiquement l'ID et les timestamps.
   *
   * @param {CreateTodoDto} dto - Données de création du todo
   * @returns {Todo} Instance de Todo nouvellement créée
   *
   * @example
   * const todo = Todo.create({
   *   title: "Acheter du lait",
   *   priority: TodoPriority.HIGH,
   *   tags: ["courses"]
   * });
   */
  static create(dto: CreateTodoDto): Todo {
    // Création de l'instance avec les données fournies
    return new Todo({
      // L'ID sera généré par le constructeur
      title: dto.title,
      description: dto.description,
      // Par défaut, un todo est créé comme non complété
      completed: false,
      // Priorité par défaut : medium si non spécifiée
      priority: dto.priority || TodoPriority.MEDIUM,
      dueDate: dto.dueDate,
      // Tags par défaut : tableau vide si non spécifié
      tags: dto.tags || [],
      // Dates générées automatiquement
      createdAt: new Date(),
      updatedAt: new Date(),
      // Pas de date de complétion à la création
      completedAt: undefined
    });
  }

  /**
   * Factory method pour reconstruire un todo depuis la DB
   *
   * Utilisé par le repository pour recréer des instances
   * à partir des données brutes de la base de données.
   *
   * @param {any} raw - Données brutes de la base de données
   * @returns {Todo} Instance de Todo reconstruite
   *
   * @example
   * const todo = Todo.fromDatabase(dbRow);
   */
  static fromDatabase(raw: any): Todo {
    return new Todo({
      id: raw.id,
      title: raw.title,
      description: raw.description || undefined,
      completed: Boolean(raw.completed),
      priority: raw.priority as TodoPriority,
      // Conversion des timestamps SQL en objets Date
      dueDate: raw.due_date ? new Date(raw.due_date) : undefined,
      // Parsing du JSON des tags stocké en DB
      tags: raw.tags ? JSON.parse(raw.tags) : [],
      createdAt: new Date(raw.created_at),
      updatedAt: new Date(raw.updated_at),
      completedAt: raw.completed_at ? new Date(raw.completed_at) : undefined
    });
  }

  /**
   * Convertit le todo en objet plain pour la DB
   *
   * Transforme l'instance en un objet compatible avec
   * le schéma de la base de données SQLite.
   *
   * @returns {any} Objet prêt pour l'insertion/update en DB
   *
   * @example
   * const dbData = todo.toDatabase();
   * db.insert(dbData);
   */
  toDatabase(): any {
    return {
      id: this.id,
      title: this.title,
      description: this.description || null,
      completed: this.completed ? 1 : 0, // SQLite utilise 0/1 pour boolean
      priority: this.priority,
      // Conversion Date -> ISO string pour SQLite
      due_date: this.dueDate ? this.dueDate.toISOString() : null,
      // Sérialisation des tags en JSON
      tags: JSON.stringify(this.tags),
      created_at: this.createdAt.toISOString(),
      updated_at: this.updatedAt.toISOString(),
      completed_at: this.completedAt ? this.completedAt.toISOString() : null
    };
  }

  /**
   * Convertit le todo en objet JSON pour l'API
   *
   * Prépare l'instance pour la sérialisation JSON
   * dans les réponses API.
   *
   * @returns {ITodo} Objet conforme à l'interface Todo
   *
   * @example
   * res.json(todo.toJSON());
   */
  toJSON(): ITodo {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      completed: this.completed,
      priority: this.priority,
      dueDate: this.dueDate,
      tags: this.tags,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      completedAt: this.completedAt
    };
  }

  /**
   * Bascule le statut de complétion
   *
   * Marque le todo comme complété/non-complété.
   * Met à jour automatiquement completedAt et updatedAt.
   *
   * @returns {void}
   *
   * @example
   * todo.toggle(); // completed: false -> true
   * todo.toggle(); // completed: true -> false
   */
  toggle(): void {
    // Inverse le statut de complétion
    this.completed = !this.completed;

    // Si le todo est maintenant complété, enregistrer la date
    if (this.completed) {
      this.completedAt = new Date();
    } else {
      // Si on dé-complète, supprimer la date de complétion
      this.completedAt = undefined;
    }

    // Mettre à jour le timestamp de modification
    this.updatedAt = new Date();
  }

  /**
   * Marque le todo comme complété
   *
   * Force le todo à l'état complété avec timestamp.
   *
   * @returns {void}
   *
   * @example
   * todo.complete();
   */
  complete(): void {
    // Si déjà complété, ne rien faire
    if (this.completed) return;

    // Marquer comme complété
    this.completed = true;
    this.completedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Marque le todo comme non complété
   *
   * Force le todo à l'état actif (non complété).
   *
   * @returns {void}
   *
   * @example
   * todo.uncomplete();
   */
  uncomplete(): void {
    // Si déjà actif, ne rien faire
    if (!this.completed) return;

    // Marquer comme actif
    this.completed = false;
    this.completedAt = undefined;
    this.updatedAt = new Date();
  }

  /**
   * Vérifie si le todo est en retard
   *
   * Un todo est en retard si :
   * - Il a une date d'échéance définie
   * - Cette date est dans le passé
   * - Le todo n'est pas complété
   *
   * @returns {boolean} true si en retard, false sinon
   *
   * @example
   * if (todo.isOverdue()) {
   *   console.log("Tâche en retard !");
   * }
   */
  isOverdue(): boolean {
    // Pas de date d'échéance = jamais en retard
    if (!this.dueDate) return false;

    // Si complété, pas considéré comme en retard
    if (this.completed) return false;

    // Comparer la date d'échéance avec maintenant
    return this.dueDate < new Date();
  }

  /**
   * Vérifie si le todo a un tag spécifique
   *
   * Recherche insensible à la casse.
   *
   * @param {string} tag - Tag à rechercher
   * @returns {boolean} true si le tag existe, false sinon
   *
   * @example
   * if (todo.hasTag("urgent")) {
   *   // Traitement spécial
   * }
   */
  hasTag(tag: string): boolean {
    // Recherche insensible à la casse
    return this.tags.some(t => t.toLowerCase() === tag.toLowerCase());
  }

  /**
   * Ajoute un tag au todo
   *
   * Évite les doublons (insensible à la casse).
   * Limite à 10 tags maximum.
   *
   * @param {string} tag - Tag à ajouter
   * @returns {boolean} true si ajouté, false si déjà présent ou limite atteinte
   *
   * @example
   * todo.addTag("urgent"); // true
   * todo.addTag("urgent"); // false (déjà présent)
   */
  addTag(tag: string): boolean {
    // Vérifier si le tag existe déjà
    if (this.hasTag(tag)) return false;

    // Limite de 10 tags
    if (this.tags.length >= 10) return false;

    // Ajouter le tag et mettre à jour updatedAt
    this.tags.push(tag);
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Supprime un tag du todo
   *
   * Recherche insensible à la casse.
   *
   * @param {string} tag - Tag à supprimer
   * @returns {boolean} true si supprimé, false si non trouvé
   *
   * @example
   * todo.removeTag("urgent"); // true
   * todo.removeTag("inexistant"); // false
   */
  removeTag(tag: string): boolean {
    // Trouver l'index du tag (insensible à la casse)
    const index = this.tags.findIndex(
      t => t.toLowerCase() === tag.toLowerCase()
    );

    // Tag non trouvé
    if (index === -1) return false;

    // Supprimer le tag et mettre à jour updatedAt
    this.tags.splice(index, 1);
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Met à jour les champs modifiables du todo
   *
   * Applique une mise à jour partielle (PATCH semantics).
   * Met automatiquement à jour updatedAt.
   *
   * @param {Partial<ITodo>} updates - Champs à mettre à jour
   * @returns {void}
   *
   * @example
   * todo.update({
   *   title: "Nouveau titre",
   *   priority: TodoPriority.HIGH
   * });
   */
  update(updates: Partial<ITodo>): void {
    // Mettre à jour uniquement les champs fournis
    if (updates.title !== undefined) this.title = updates.title;
    if (updates.description !== undefined) this.description = updates.description;
    if (updates.priority !== undefined) this.priority = updates.priority;
    if (updates.dueDate !== undefined) this.dueDate = updates.dueDate;
    if (updates.tags !== undefined) this.tags = updates.tags;

    // Gestion spéciale du statut de complétion
    if (updates.completed !== undefined && updates.completed !== this.completed) {
      if (updates.completed) {
        this.complete();
      } else {
        this.uncomplete();
      }
    }

    // Toujours mettre à jour le timestamp de modification
    this.updatedAt = new Date();
  }
}
