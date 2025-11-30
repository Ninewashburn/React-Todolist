# 📝 Todo List - Frontend

Application React + TypeScript pour la gestion de tâches avec fonctionnalités avancées.

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+ et npm
- Backend API en cours d'exécution sur http://localhost:3000

### Installation

```bash
# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Build pour la production
npm run build

# Prévisualiser le build de production
npm run preview
```

L'application sera accessible sur http://localhost:5173

## 🏗️ Architecture

### Structure des dossiers

```
src/
├── components/          # Composants React réutilisables
│   ├── TodoForm.tsx    # Formulaire de création/édition
│   ├── TodoList.tsx    # Liste paginée avec sélection multiple
│   ├── TodoItem.tsx    # Carte de todo individuelle
│   ├── TodoFilters.tsx # Panneau de filtres et tri
│   └── TodoStats.tsx   # Dashboard de statistiques
├── hooks/              # Custom React hooks
│   ├── useTodos.ts     # Hook de base pour les todos
│   └── useTodosWithFilters.ts  # Hook avancé avec filtres/stats
├── services/           # Couche de services
│   └── api.ts         # Client API REST
├── types/             # Définitions TypeScript
│   └── index.ts       # Types, interfaces, unions
├── App.tsx            # Composant racine
├── App.css            # Design system CSS
└── main.tsx           # Point d'entrée

```

### Composants principaux

#### TodoForm
Formulaire complet de création/édition de todos.

**Props:**
```typescript
interface TodoFormProps {
  onSubmit: (dto: CreateTodoDto) => Promise<void>;
  todo?: Todo;                    // Pour l'édition
  onCancel?: () => void;          // Annulation de l'édition
  submitButtonText?: string;      // Texte du bouton
}
```

**Fonctionnalités:**
- Validation en temps réel
- Gestion des tags avec ajout/suppression
- Sélection de priorité (basse, moyenne, haute)
- Date d'échéance optionnelle
- États de chargement et d'erreur
- Mode création/édition

**Exemple d'utilisation:**
```typescript
<TodoForm
  onSubmit={addTodo}
  submitButtonText="Créer la tâche"
/>
```

#### TodoList
Liste paginée de todos avec sélection multiple.

**Props:**
```typescript
interface TodoListProps {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  meta: PaginationMeta | null;
  onToggle: (id: string, completed: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onBulkDelete?: (ids: string[]) => Promise<void>;
  onPageChange?: (page: number) => void;
}
```

**Fonctionnalités:**
- Sélection individuelle et globale
- Suppression en masse
- Pagination avec métadonnées
- États vides et d'erreur
- Indicateur de chargement
- Accessibilité ARIA

**Exemple d'utilisation:**
```typescript
<TodoList
  todos={todos}
  loading={loading}
  error={error}
  meta={meta}
  onToggle={handleToggle}
  onDelete={handleDelete}
  onBulkDelete={handleBulkDelete}
  onPageChange={setPage}
/>
```

#### TodoItem
Carte individuelle d'un todo.

**Props:**
```typescript
interface TodoItemProps {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
}
```

**Fonctionnalités:**
- Affichage complet des informations
- Toggle de complétion avec checkbox
- Badges de priorité colorés
- Tags affichés
- Date d'échéance avec indicateur de retard
- Actions (supprimer)

#### TodoFilters
Panneau de contrôle pour filtrer et trier.

**Props:**
```typescript
interface TodoFiltersProps {
  filter: TodoFilter;
  sortBy: TodoSortField;
  sortOrder: SortOrder;
  search: string;
  priority: TodoPriority | null;
  onFilterChange: (filter: TodoFilter) => void;
  onSortByChange: (sortBy: TodoSortField) => void;
  onSortOrderChange: (order: SortOrder) => void;
  onSearchChange: (search: string) => void;
  onPriorityChange: (priority: TodoPriority | null) => void;
  onClearFilters: () => void;
}
```

**Fonctionnalités:**
- Recherche plein texte
- Filtre par statut (tous, actifs, complétés)
- Filtre par priorité
- Tri par multiple champs (date, titre, priorité, échéance)
- Ordre croissant/décroissant
- Réinitialisation des filtres

#### TodoStats
Dashboard de statistiques.

**Props:**
```typescript
interface TodoStatsProps {
  stats: TodoStats | null;
  loading: boolean;
}
```

**Fonctionnalités:**
- Total, actifs, complétés, en retard
- Taux de complétion avec barre de progression
- Répartition par priorité
- Chargement avec spinner

### Hooks personnalisés

#### useTodos
Hook de base pour la gestion des todos avec pagination.

**Retour:**
```typescript
{
  todos: Todo[];
  loading: boolean;
  error: string | null;
  meta: PaginationMeta | null;
  addTodo: (dto: CreateTodoDto) => Promise<void>;
  updateTodo: (id: string, dto: UpdateTodoDto) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  refreshTodos: () => Promise<void>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
}
```

**Exemple:**
```typescript
const { todos, loading, addTodo, setPage } = useTodos({
  page: 1,
  limit: 10
});
```

#### useTodosWithFilters
Hook avancé avec filtres, tri, recherche et statistiques.

**Retour:**
```typescript
{
  // État de base
  todos: Todo[];
  loading: boolean;
  error: string | null;
  meta: PaginationMeta | null;

  // Statistiques
  stats: TodoStats | null;
  statsLoading: boolean;

  // Paramètres de filtrage
  filter: TodoFilter;
  sortBy: TodoSortField;
  sortOrder: SortOrder;
  search: string;
  priority: TodoPriority | null;
  tags: string[];

  // Actions
  addTodo: (dto: CreateTodoDto) => Promise<void>;
  updateTodo: (id: string, dto: UpdateTodoDto) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  deleteCompleted: () => Promise<void>;

  // Setters de filtres
  setFilter: (filter: TodoFilter) => void;
  setSortBy: (sortBy: TodoSortField) => void;
  setSortOrder: (order: SortOrder) => void;
  setSearch: (search: string) => void;
  setPriority: (priority: TodoPriority | null) => void;
  setTags: (tags: string[]) => void;
  clearFilters: () => void;

  // Pagination
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
}
```

**Exemple:**
```typescript
const {
  todos,
  stats,
  filter,
  search,
  setFilter,
  setSearch,
  addTodo
} = useTodosWithFilters();
```

### Service API

Le service API ([src/services/api.ts](src/services/api.ts)) fournit une couche d'abstraction pour toutes les requêtes HTTP.

**Méthodes disponibles:**

```typescript
// CRUD de base
todosApi.getAll(params?: TodoQueryParams): Promise<PaginatedResponse<Todo>>
todosApi.getById(id: string): Promise<Todo>
todosApi.create(dto: CreateTodoDto): Promise<Todo>
todosApi.update(id: string, dto: UpdateTodoDto): Promise<Todo>
todosApi.delete(id: string): Promise<void>

// Statistiques
todosApi.getStats(): Promise<TodoStats>

// Opérations en masse
todosApi.bulkCreate(dtos: CreateTodoDto[]): Promise<Todo[]>
todosApi.bulkDelete(ids: string[]): Promise<void>
todosApi.deleteCompleted(): Promise<void>

// Utilitaires
checkApiHealth(): Promise<boolean>
```

**Configuration:**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
```

## 🎨 Design System

### Variables CSS

Le fichier [App.css](src/App.css) définit un système de design complet avec variables CSS:

```css
:root {
  /* Couleurs */
  --color-primary: #3498db;
  --color-success: #2ecc71;
  --color-warning: #f39c12;
  --color-danger: #e74c3c;
  --color-info: #9b59b6;

  /* Espacement */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Typographie */
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.5rem;

  /* Bordures */
  --border-radius: 8px;
  --border-color: #e1e8ed;

  /* Ombres */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
}
```

### Layout responsive

**Desktop (>992px):**
```
┌────────────────────────────────────────┐
│           Header                        │
├──────────┬─────────────┬────────────────┤
│  Stats   │   Main      │   Filters      │
│ (300px)  │  Content    │   (300px)      │
│          │             │                │
└──────────┴─────────────┴────────────────┘
│           Footer                        │
└────────────────────────────────────────┘
```

**Tablet (768px-992px):**
```
┌────────────────────────────────────────┐
│           Header                        │
├────────────────────────────────────────┤
│           Stats                         │
├────────────────────────────────────────┤
│           Main Content                  │
├────────────────────────────────────────┤
│           Filters                       │
└────────────────────────────────────────┘
│           Footer                        │
└────────────────────────────────────────┘
```

**Mobile (<768px):**
- Layout en colonne unique
- Sidebars pliables
- Formulaires en pleine largeur
- Stats en grille 2x2

## 🔧 Configuration

### Variables d'environnement

Créer un fichier `.env` à la racine:

```env
# URL de l'API backend
VITE_API_BASE_URL=http://localhost:3000/api
```

### TypeScript

Configuration dans `tsconfig.app.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "erasableSyntaxOnly": true,  // Pas d'enums TypeScript
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  }
}
```

**Note importante:** `erasableSyntaxOnly: true` interdit l'usage d'enums TypeScript. Utiliser des unions de types à la place:

```typescript
// ❌ Incorrect
export enum TodoPriority { LOW = 'low', MEDIUM = 'medium', HIGH = 'high' }

// ✅ Correct
export type TodoPriority = 'low' | 'medium' | 'high';
export const TodoPriorityValues = {
  LOW: 'low' as const,
  MEDIUM: 'medium' as const,
  HIGH: 'high' as const
};
```

## 📱 Fonctionnalités

### Gestion des todos
- ✅ Créer un todo avec titre, description, priorité, tags, échéance
- ✅ Modifier un todo existant
- ✅ Marquer comme complété/non complété
- ✅ Supprimer un todo
- ✅ Suppression en masse avec sélection multiple
- ✅ Supprimer tous les todos complétés

### Filtrage et recherche
- ✅ Recherche plein texte (titre + description)
- ✅ Filtrer par statut (tous/actifs/complétés)
- ✅ Filtrer par priorité
- ✅ Trier par date de création, modification, titre, priorité, échéance
- ✅ Ordre croissant/décroissant
- ✅ Réinitialisation des filtres

### Pagination
- ✅ Navigation page par page
- ✅ Métadonnées (page courante, total pages, total items)
- ✅ Indicateurs de page précédente/suivante
- ✅ Contrôle du nombre d'items par page

### Statistiques
- ✅ Nombre total de todos
- ✅ Nombre de todos actifs
- ✅ Nombre de todos complétés
- ✅ Nombre de todos en retard
- ✅ Taux de complétion avec barre de progression
- ✅ Répartition par priorité

### Interface utilisateur
- ✅ Design moderne et responsive
- ✅ Transitions et animations fluides
- ✅ États de chargement avec spinners
- ✅ Gestion des erreurs avec messages clairs
- ✅ États vides informatifs
- ✅ Accessibilité ARIA
- ✅ Sidebars pliables
- ✅ Badges de priorité colorés
- ✅ Tags avec gestion dynamique

## 🧪 Tests

```bash
# Lancer les tests unitaires
npm run test

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

## 🔍 Dépannage

### Le backend n'est pas accessible

**Problème:** `Error: Failed to fetch`

**Solution:**
1. Vérifier que le backend est démarré sur http://localhost:3000
2. Vérifier la variable `VITE_API_BASE_URL` dans `.env`
3. Vérifier la configuration CORS du backend

### Les todos ne s'affichent pas

**Problème:** Liste vide alors que des todos existent

**Solution:**
1. Ouvrir les DevTools > Network > vérifier la réponse API
2. Vérifier que `response.data` contient bien un tableau
3. Vérifier les filtres actifs (peuvent masquer des todos)

### Erreurs TypeScript avec les enums

**Problème:** `error TS1056: Accessors are only available when targeting ECMAScript 5 and higher`

**Solution:** Utiliser des unions de types au lieu d'enums (voir section Configuration > TypeScript)

### Build échoue

**Problème:** Erreurs pendant `npm run build`

**Solution:**
1. Supprimer `node_modules` et `package-lock.json`
2. Réinstaller: `npm install`
3. Vérifier qu'il n'y a pas d'erreurs TypeScript: `npm run type-check`

## 📚 Ressources

- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev)
- [Backend API Documentation](../todo-api/README.md)

## 👤 Auteur

**Claude Code**

Version: 1.0.0

---

**Made with ❤️ by Claude Code**
