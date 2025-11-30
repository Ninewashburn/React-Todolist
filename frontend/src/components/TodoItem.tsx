// src/components/TodoItem.tsx
import type { Todo } from '../types';

// Props pour le composant TodoItem
interface TodoItemProps {
  todo: Todo; // Le todo à afficher
  onToggle: (id: string) => void; // Fonction pour basculer l'état complété
  onDelete: (id: string) => void; // Fonction pour supprimer le todo
}

// Composant pour afficher un todo individuel
export default function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <div className="todo-item">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        aria-label={`Marquer "${todo.title}" comme ${todo.completed ? 'non terminé' : 'terminé'}`}
      />
      <span className={todo.completed ? 'todo-title completed' : 'todo-title'}>
        {todo.title}
      </span>
      <button
        onClick={() => onDelete(todo.id)}
        className="delete-button"
        aria-label={`Supprimer "${todo.title}"`}
      >
        🗑️
      </button>
    </div>
  );
}