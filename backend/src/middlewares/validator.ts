/**
 * middlewares/validator.ts - Validation Zod des requêtes
 *
 * Ce fichier contient les schémas de validation Zod et le middleware
 * pour valider les requêtes entrantes automatiquement.
 *
 * Fonctionnalités principales :
 * - Schémas Zod pour tous les DTOs
 * - Middleware de validation générique
 * - Messages d'erreur en français
 * - Validation runtime type-safe
 *
 * Dépendances :
 * - zod : Bibliothèque de validation runtime
 * - types : Interfaces de l'application
 * - utils/errors : Gestion d'erreurs
 *
 * @author Claude Code
 * @version 1.0.0
 */

import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';
import { TodoPriority, TodoFilter, TodoSortField, SortOrder } from '../types';

/**
 * Messages d'erreur personnalisés en français
 */
const errorMessages = {
  required: 'Ce champ est obligatoire',
  tooShort: (min: number) => `Minimum ${min} caractères requis`,
  tooLong: (max: number) => `Maximum ${max} caractères autorisés`,
  invalidFormat: 'Format invalide',
  invalidCharacters: 'Caractères invalides détectés'
};

/**
 * Schéma Zod pour la création d'un todo
 *
 * Valide tous les champs requis et optionnels avec leurs contraintes.
 */
export const createTodoSchema = z.object({
  // Titre : obligatoire, 3-100 caractères, caractères autorisés
  title: z
    .string({
      required_error: errorMessages.required,
      invalid_type_error: 'Le titre doit être une chaîne de caractères'
    })
    .min(3, { message: errorMessages.tooShort(3) })
    .max(100, { message: errorMessages.tooLong(100) })
    .regex(/^[a-zA-ZÀ-ÿ0-9 \-_'.,!?]+$/, {
      message: errorMessages.invalidCharacters
    })
    .transform(val => val.trim()), // Nettoyer les espaces

  // Description : optionnelle, max 500 caractères
  description: z
    .string()
    .max(500, { message: errorMessages.tooLong(500) })
    .optional()
    .transform(val => val?.trim()),

  // Priorité : optionnelle, valeurs enum, défaut 'medium'
  priority: z
    .enum([TodoPriority.LOW, TodoPriority.MEDIUM, TodoPriority.HIGH], {
      errorMap: () => ({ message: 'Priorité invalide. Valeurs : low, medium, high' })
    })
    .default(TodoPriority.MEDIUM)
    .optional(),

  // Date d'échéance : optionnelle, doit être une date valide
  dueDate: z
    .string()
    .datetime({ message: 'La date d\'échéance doit être au format ISO 8601' })
    .optional()
    .transform(val => (val ? new Date(val) : undefined)),

  // Tags : optionnel, tableau de strings, max 10 éléments
  tags: z
    .array(
      z.string().min(1, { message: 'Un tag ne peut pas être vide' }),
      {
        invalid_type_error: 'Les tags doivent être un tableau de chaînes'
      }
    )
    .max(10, { message: 'Maximum 10 tags autorisés' })
    .optional()
    .default([])
    .transform(tags => tags.map(tag => tag.trim()))
});

/**
 * Schéma Zod pour la mise à jour d'un todo
 *
 * Tous les champs sont optionnels pour permettre les mises à jour partielles.
 */
export const updateTodoSchema = z
  .object({
    // Titre : optionnel, mêmes contraintes que create
    title: z
      .string()
      .min(3, { message: errorMessages.tooShort(3) })
      .max(100, { message: errorMessages.tooLong(100) })
      .regex(/^[a-zA-ZÀ-ÿ0-9 \-_'.,!?]+$/, {
        message: errorMessages.invalidCharacters
      })
      .transform(val => val.trim())
      .optional(),

    // Description : optionnelle
    description: z
      .string()
      .max(500, { message: errorMessages.tooLong(500) })
      .transform(val => val.trim())
      .optional(),

    // Completed : optionnel, booléen
    completed: z.boolean({
      invalid_type_error: 'Le champ completed doit être un booléen'
    }).optional(),

    // Priorité : optionnelle
    priority: z
      .enum([TodoPriority.LOW, TodoPriority.MEDIUM, TodoPriority.HIGH], {
        errorMap: () => ({ message: 'Priorité invalide' })
      })
      .optional(),

    // Date d'échéance : optionnelle
    dueDate: z
      .string()
      .datetime({ message: 'Date d\'échéance invalide (format ISO 8601 requis)' })
      .optional()
      .transform(val => (val ? new Date(val) : undefined)),

    // Tags : optionnel
    tags: z
      .array(z.string().min(1))
      .max(10, { message: 'Maximum 10 tags autorisés' })
      .optional()
      .transform(tags => tags?.map(tag => tag.trim()))
  })
  // Vérifier qu'au moins un champ est fourni
  .refine(data => Object.keys(data).length > 0, {
    message: 'Au moins un champ doit être fourni pour la mise à jour'
  });

/**
 * Schéma Zod pour les paramètres de requête (query params)
 *
 * Valide les paramètres de filtrage, tri et pagination.
 */
export const queryParamsSchema = z.object({
  // Filtre par statut
  filter: z
    .enum([TodoFilter.ALL, TodoFilter.ACTIVE, TodoFilter.COMPLETED])
    .optional()
    .default(TodoFilter.ALL),

  // Champ de tri
  sortBy: z
    .enum([
      TodoSortField.CREATED_AT,
      TodoSortField.UPDATED_AT,
      TodoSortField.TITLE,
      TodoSortField.PRIORITY,
      TodoSortField.DUE_DATE
    ])
    .optional()
    .default(TodoSortField.CREATED_AT),

  // Ordre de tri
  sortOrder: z
    .enum([SortOrder.ASC, SortOrder.DESC])
    .optional()
    .default(SortOrder.DESC),

  // Numéro de page (1-indexed)
  page: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1, { message: 'La page doit être >= 1' })),

  // Nombre d'items par page
  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 50))
    .pipe(
      z
        .number()
        .int()
        .min(1, { message: 'La limite doit être >= 1' })
        .max(100, { message: 'La limite ne peut pas dépasser 100' })
    ),

  // Recherche full-text
  search: z.string().optional(),

  // Filtre par priorité
  priority: z
    .enum([TodoPriority.LOW, TodoPriority.MEDIUM, TodoPriority.HIGH])
    .optional(),

  // Filtre par tags (peut être une string CSV ou un array)
  tags: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform(val => {
      if (!val) return undefined;
      if (typeof val === 'string') {
        return val.split(',').map(tag => tag.trim());
      }
      return val;
    })
});

/**
 * Schéma pour la création en masse
 */
export const bulkCreateSchema = z.object({
  todos: z
    .array(createTodoSchema)
    .min(1, { message: 'Le tableau de todos ne peut pas être vide' })
    .max(100, { message: 'Maximum 100 todos par requête' })
});

/**
 * Schéma pour la suppression en masse
 */
export const bulkDeleteSchema = z.object({
  ids: z
    .array(z.string().uuid({ message: 'ID invalide (UUID requis)' }))
    .min(1, { message: 'Le tableau d\'IDs ne peut pas être vide' })
    .max(100, { message: 'Maximum 100 IDs par requête' })
});

/**
 * Schéma pour les paramètres d'URL (UUID)
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid({ message: 'ID invalide (UUID requis)' })
});

/**
 * Type pour les sources de validation
 * - body : Corps de la requête (POST, PATCH)
 * - query : Paramètres de requête (GET)
 * - params : Paramètres d'URL (GET /todos/:id)
 */
type ValidateSource = 'body' | 'query' | 'params';

/**
 * Middleware de validation générique
 *
 * Valide une partie de la requête (body, query ou params) contre un schéma Zod.
 * En cas d'erreur, lance une ValidationError avec les détails.
 *
 * @param {z.ZodSchema} schema - Schéma Zod à utiliser pour la validation
 * @param {ValidateSource} source - Partie de la requête à valider
 * @returns {Function} Middleware Express
 *
 * @example
 * router.post('/todos',
 *   validate(createTodoSchema, 'body'),
 *   todoController.create
 * );
 */
export function validate(schema: z.ZodSchema, source: ValidateSource = 'body') {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Extraire les données de la source spécifiée
      const dataToValidate = req[source];

      // Valider les données avec Zod
      // safeParse retourne { success, data, error } au lieu de throw
      const result = schema.safeParse(dataToValidate);

      if (!result.success) {
        // Formater les erreurs Zod en format lisible
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        // Lancer une ValidationError avec les détails
        throw new ValidationError('Validation échouée', { errors });
      }

      // Remplacer les données de la requête par les données validées et transformées
      // Cela applique les transformations Zod (trim, default, etc.)
      req[source] = result.data;

      // Passer au middleware suivant
      next();
    } catch (error) {
      // Passer l'erreur au gestionnaire d'erreurs
      next(error);
    }
  };
}

/**
 * Middleware de validation pour le body
 *
 * Shortcut pour validate(schema, 'body')
 *
 * @param {z.ZodSchema} schema - Schéma Zod
 * @returns {Function} Middleware Express
 */
export const validateBody = (schema: z.ZodSchema) => validate(schema, 'body');

/**
 * Middleware de validation pour les query params
 *
 * Shortcut pour validate(schema, 'query')
 *
 * @param {z.ZodSchema} schema - Schéma Zod
 * @returns {Function} Middleware Express
 */
export const validateQuery = (schema: z.ZodSchema) => validate(schema, 'query');

/**
 * Middleware de validation pour les params d'URL
 *
 * Shortcut pour validate(schema, 'params')
 *
 * @param {z.ZodSchema} schema - Schéma Zod
 * @returns {Function} Middleware Express
 */
export const validateParams = (schema: z.ZodSchema) => validate(schema, 'params');
