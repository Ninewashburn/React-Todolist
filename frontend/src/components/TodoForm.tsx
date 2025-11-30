/**
 * src/components/TodoForm.tsx - Formulaire de création/édition de todos
 *
 * Composant formulaire complet pour créer ou éditer un todo.
 * Gère tous les champs : titre, description, priorité, tags, date d'échéance.
 *
 * @author Claude Code
 * @version 1.0.0
 */

import { useState, type FormEvent, type ChangeEvent } from 'react';
import type { CreateTodoDto, TodoPriority, Todo, UpdateTodoDto } from '../types';
import { validateTodoTitle } from '../utils/validation';

/**
 * Props du composant TodoForm
 */
interface TodoFormProps {
  /**
   * Fonction appelée lors de la soumission du formulaire
   * Peut être utilisée pour créer ou éditer un todo
   */
  onSubmit: (data: CreateTodoDto | UpdateTodoDto) => Promise<void>;

  /**
   * Todo à éditer (optionnel)
   * Si fourni, le formulaire sera en mode édition
   */
  todo?: Todo;

  /**
   * Fonction appelée lors de l'annulation
   */
  onCancel?: () => void;

  /**
   * Texte du bouton de soumission
   * Par défaut: "Créer" ou "Modifier"
   */
  submitButtonText?: string;
}

/**
 * Composant TodoForm
 *
 * Formulaire complet pour créer ou éditer un todo.
 *
 * @param {TodoFormProps} props - Props du composant
 * @returns {JSX.Element} Formulaire de todo
 *
 * @example
 * <TodoForm onSubmit={handleCreate} />
 * <TodoForm todo={existingTodo} onSubmit={handleUpdate} onCancel={handleCancel} />
 */
export default function TodoForm({ onSubmit, todo, onCancel, submitButtonText }: TodoFormProps) {
  // Mode édition ou création
  const isEditMode = !!todo;

  // État du formulaire
  const [title, setTitle] = useState(todo?.title || '');
  const [description, setDescription] = useState(todo?.description || '');
  const [priority, setPriority] = useState<TodoPriority>(todo?.priority || 'medium');
  const [dueDate, setDueDate] = useState(
    todo?.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : ''
  );
  const [tags, setTags] = useState<string[]>(todo?.tags || []);
  const [tagInput, setTagInput] = useState('');

  // État de validation et soumission
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Valide le formulaire
   * @returns {boolean} true si valide, false sinon
   */
  const validate = (): boolean => {
    const titleValidation = validateTodoTitle(title);

    if (!titleValidation.valid) {
      setErrors(titleValidation.error ? [titleValidation.error] : ['Titre invalide']);
      return false;
    }

    // Valider la description
    if (description && description.length > 500) {
      setErrors(['La description ne peut pas dépasser 500 caractères']);
      return false;
    }

    // Valider les tags
    if (tags.length > 10) {
      setErrors(['Maximum 10 tags autorisés']);
      return false;
    }

    setErrors([]);
    return true;
  };

  /**
   * Gère la soumission du formulaire
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Valider le formulaire
    if (!validate()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors([]);

      // Construire les données
      const data: CreateTodoDto = {
        title: title.trim(),
        ...(description && { description: description.trim() }),
        priority,
        ...(dueDate && { dueDate: new Date(dueDate).toISOString() }),
        ...(tags.length > 0 && { tags })
      };

      // Appeler la fonction de soumission
      await onSubmit(data);

      // Réinitialiser le formulaire si création (pas édition)
      if (!isEditMode) {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setDueDate('');
        setTags([]);
        setTagInput('');
      }
    } catch (error) {
      // L'erreur sera gérée par le composant parent
      console.error('Erreur lors de la soumission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Ajoute un tag
   */
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();

    // Vérifier que le tag n'est pas vide
    if (!trimmedTag) return;

    // Vérifier que le tag n'existe pas déjà
    if (tags.includes(trimmedTag)) {
      setErrors(['Ce tag existe déjà']);
      return;
    }

    // Vérifier la limite de 10 tags
    if (tags.length >= 10) {
      setErrors(['Maximum 10 tags autorisés']);
      return;
    }

    // Ajouter le tag
    setTags([...tags, trimmedTag]);
    setTagInput('');
    setErrors([]);
  };

  /**
   * Supprime un tag
   */
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  /**
   * Gère l'ajout de tag via la touche Entrée
   */
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="todo-form" aria-label="Formulaire de todo">
      {/* Titre */}
      <div className="form-group">
        <label htmlFor="title" className="form-label">
          Titre <span className="required">*</span>
        </label>
        <input
          type="text"
          id="title"
          className="form-input"
          value={title}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
          placeholder="Titre de la tâche (3-100 caractères)"
          required
          minLength={3}
          maxLength={100}
          disabled={isSubmitting}
          aria-required="true"
          aria-invalid={errors.length > 0}
        />
      </div>

      {/* Description */}
      <div className="form-group">
        <label htmlFor="description" className="form-label">
          Description
        </label>
        <textarea
          id="description"
          className="form-textarea"
          value={description}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
          placeholder="Description détaillée (optionnel, max 500 caractères)"
          maxLength={500}
          rows={3}
          disabled={isSubmitting}
        />
        <span className="form-hint">
          {description.length}/500 caractères
        </span>
      </div>

      {/* Priorité */}
      <div className="form-group">
        <label htmlFor="priority" className="form-label">
          Priorité
        </label>
        <select
          id="priority"
          className="form-select"
          value={priority}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setPriority(e.target.value as TodoPriority)}
          disabled={isSubmitting}
        >
          <option value="low">Basse</option>
          <option value="medium">Moyenne</option>
          <option value="high">Haute</option>
        </select>
      </div>

      {/* Date d'échéance */}
      <div className="form-group">
        <label htmlFor="dueDate" className="form-label">
          Date d'échéance
        </label>
        <input
          type="date"
          id="dueDate"
          className="form-input"
          value={dueDate}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setDueDate(e.target.value)}
          disabled={isSubmitting}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      {/* Tags */}
      <div className="form-group">
        <label htmlFor="tagInput" className="form-label">
          Tags {tags.length > 0 && <span className="tag-count">({tags.length}/10)</span>}
        </label>
        <div className="tag-input-wrapper">
          <input
            type="text"
            id="tagInput"
            className="form-input"
            value={tagInput}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            placeholder="Ajouter un tag"
            disabled={isSubmitting || tags.length >= 10}
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="btn-add-tag"
            disabled={isSubmitting || !tagInput.trim() || tags.length >= 10}
            aria-label="Ajouter un tag"
          >
            +
          </button>
        </div>

        {/* Liste des tags */}
        {tags.length > 0 && (
          <div className="tags-list" role="list" aria-label="Tags sélectionnés">
            {tags.map((tag) => (
              <span key={tag} className="tag" role="listitem">
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="tag-remove"
                  disabled={isSubmitting}
                  aria-label={`Supprimer le tag ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Erreurs */}
      {errors.length > 0 && (
        <div className="form-errors" role="alert" aria-live="polite">
          {errors.map((error, index) => (
            <p key={index} className="error-message">
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Boutons d'action */}
      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting || !title.trim()}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? 'Envoi...' : submitButtonText || (isEditMode ? 'Modifier' : 'Créer')}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
