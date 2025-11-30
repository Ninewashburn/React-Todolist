# 🚀 Mission pour Claude Code - Todo List Full Stack

## 📋 Contexte du Projet

Tu dois créer une **application Todo List full stack production-ready** avec :
- Backend API REST complet (Node.js + TypeScript)
- Frontend React + TypeScript (déjà initialisé avec Vite)
- Base de données (choix : SQLite pour simplicité OU PostgreSQL pour production)
- Tests unitaires et E2E
- Documentation complète avec commentaires exhaustifs

## 🎯 Objectif Principal

Créer une application **professionnelle et impressionnante** démontrant :
- Architecture propre (Clean Architecture)
- Patterns de conception avancés
- Gestion d'erreurs robuste
- Validation complète (frontend + backend)
- Sécurité (CORS, validation, rate limiting)
- Performance (caching, optimizations)
- Tests complets
- Documentation exhaustive

## 📁 Structure Actuelle du Frontend
```
react-todo/
├── src/
│   ├── components/
│   │   ├── LoadingSpinner.tsx  ✅ FAIT
│   │   ├── TodoItem.tsx        ✅ FAIT
│   │   ├── TodoList.tsx        ⚠️ À COMPLÉTER
│   │   └── TodoForm.tsx        ⚠️ À COMPLÉTER
│   ├── hooks/
│   │   └── useTodos.ts         ✅ FAIT
│   ├── services/
│   │   └── api.ts              ✅ FAIT
│   ├── types/
│   │   └── index.ts            ✅ FAIT
│   ├── utils/
│   │   └── validation.ts       ✅ FAIT
│   ├── App.tsx                 ⚠️ À COMPLÉTER
│   ├── App.css                 ⚠️ À COMPLÉTER
│   └── main.tsx
```

## 🏗️ Architecture Backend à Créer

### Structure Souhaitée
```
todo-api/
├── src/
│   ├── controllers/
│   │   └── TodoController.ts
│   ├── services/
│   │   └── TodoService.ts
│   ├── repositories/
│   │   └── TodoRepository.ts
│   ├── models/
│   │   └── Todo.ts
│   ├── middlewares/
│   │   ├── errorHandler.ts
│   │   ├── validator.ts
│   │   └── rateLimiter.ts
│   ├── routes/
│   │   └── todoRoutes.ts
│   ├── database/
│   │   ├── connection.ts
│   │   └── migrations/
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   └── errors.ts
│   ├── config/
│   │   └── index.ts
│   └── server.ts
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## 🎯 Fonctionnalités Backend Requises

### 1. API REST Complète

**Endpoints CRUD :**
```typescript
// TOUS LES ENDPOINTS DOIVENT ÊTRE COMMENTÉS EXHAUSTIVEMENT

GET    /api/todos              // Liste tous les todos
GET    /api/todos/:id          // Récupère un todo spécifique
POST   /api/todos              // Crée un nouveau todo
PATCH  /api/todos/:id          // Met à jour un todo
DELETE /api/todos/:id          // Supprime un todo
GET    /api/todos/stats        // Statistiques (total, complétés, actifs)
POST   /api/todos/bulk         // Création en masse
DELETE /api/todos/bulk         // Suppression en masse
```

**Fonctionnalités avancées :**
```typescript
GET    /api/todos?filter=active|completed|all    // Filtrage
GET    /api/todos?sort=createdAt|title           // Tri
GET    /api/todos?page=1&limit=10                // Pagination
GET    /api/todos?search=texte                   // Recherche
```

### 2. Modèle de Données Enrichi
```typescript
interface Todo {
  id: string;                    // UUID v4
  title: string;                 // 3-100 caractères
  description?: string;          // Description optionnelle
  completed: boolean;            // Statut
  priority: 'low' | 'medium' | 'high';  // Priorité
  dueDate?: Date;               // Date d'échéance
  tags: string[];               // Tags/catégories
  createdAt: Date;              // Date création (auto)
  updatedAt: Date;              // Date modification (auto)
  completedAt?: Date;           // Date complétion
}
```

### 3. Validation Avancée

**Backend (Zod) :**
```typescript
// Utiliser Zod pour validation runtime
// Commentaires sur CHAQUE règle de validation

const createTodoSchema = z.object({
  title: z.string()
    .min(3, 'Titre trop court')
    .max(100, 'Titre trop long')
    .regex(/^[a-zA-ZÀ-ÿ0-9 \-_'.,!?]+$/, 'Caractères invalides'),
  description: z.string().max(500).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().datetime().optional(),
  tags: z.array(z.string()).max(10).optional()
});
```

### 4. Gestion d'Erreurs Professionnelle
```typescript
// Classe d'erreur personnalisée avec codes HTTP
class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
  }
}

// Middleware de gestion d'erreurs global
// COMMENTER CHAQUE TYPE D'ERREUR GÉRÉ
```

### 5. Logging Complet
```typescript
// Winston ou Pino pour logging
// Logger TOUTES les requêtes
// Logger les erreurs avec stack traces
// Logger les métriques de performance
```

### 6. Sécurité
```typescript
// CORS configuré proprement
// Helmet pour headers de sécurité
// Rate limiting (express-rate-limit)
// Validation stricte des inputs
// Sanitization des données
// Protection XSS
```

### 7. Base de Données

**Option 1 : SQLite (Simple)**
```typescript
// Utiliser better-sqlite3
// Migrations avec SQL brut
// Transactions pour opérations critiques
```

**Option 2 : PostgreSQL (Production)**
```typescript
// Utiliser pg ou Prisma ORM
// Migrations avec Prisma Migrate
// Connection pooling
```

### 8. Tests
```typescript
// Tests unitaires (Jest/Vitest)
// Tests d'intégration pour chaque endpoint
// Coverage minimum 80%
// Mocking de la base de données
// Tests de validation
// Tests de gestion d'erreurs
```

## 🎨 Fonctionnalités Frontend Avancées

### 1. Compléter les Composants Existants

**TodoList.tsx :**
```typescript
// Affichage avec virtualization si > 100 items
// Drag & drop pour réordonner
// Filtrage client-side rapide
// Tri multiple (date, priorité, titre)
// Sélection multiple pour actions bulk
// Animation d'apparition/disparition
```

**TodoForm.tsx :**
```typescript
// Formulaire avec tous les champs du modèle
// Validation temps réel
// Auto-save en brouillon (localStorage)
// Suggestions de tags
// Date picker pour dueDate
// Select pour priorité
// Gestion des erreurs visuelles
// États disabled/loading
```

### 2. Composants Supplémentaires

**TodoFilters.tsx :**
```typescript
// Filtres (all/active/completed)
// Filtre par priorité
// Filtre par tags
// Recherche full-text
// Tri dynamique
```

**TodoStats.tsx :**
```typescript
// Dashboard avec statistiques
// Graphiques (Chart.js ou Recharts)
// Pourcentage de complétion
// Tendances temporelles
// Todos en retard
```

**TodoDetail.tsx :**
```typescript
// Vue détaillée d'un todo
// Édition inline
// Historique des modifications
// Informations complètes
```

### 3. Features UX Avancées
```typescript
// Optimistic updates (React Query pattern)
// Undo/Redo pour modifications
// Notifications toast (sonner ou react-hot-toast)
// Skeleton loading states
// Error boundaries
// Offline support (Service Worker)
// PWA ready
// Dark mode toggle
// Keyboard shortcuts (Ctrl+N, Ctrl+S, etc.)
```

### 4. State Management Avancé
```typescript
// Utiliser Context API pour préférences utilisateur
// LocalStorage sync pour dark mode
// Cache intelligent des requêtes
// Invalidation automatique
```

### 5. Styles Professionnels
```css
/* Design system complet */
:root {
  --primary: #3498db;
  --success: #2ecc71;
  --danger: #e74c3c;
  --warning: #f39c12;
  /* ... */
}

/* Responsive breakpoints */
/* Animations fluides */
/* Accessibility (focus states, ARIA) */
/* Print styles */
```

## 📝 Commentaires - RÈGLES STRICTES

**CHAQUE FICHIER DOIT AVOIR :**
```typescript
/**
 * Nom du fichier - Description brève
 * 
 * Ce fichier contient [description détaillée du rôle]
 * 
 * Fonctionnalités principales :
 * - Feature 1
 * - Feature 2
 * 
 * Dépendances :
 * - Dépendance 1
 * - Dépendance 2
 * 
 * @author Claude Code
 * @version 1.0.0
 */

/**
 * Interface TodoItem
 * 
 * Définit la structure d'un todo dans l'application
 * 
 * @property {string} id - Identifiant unique (UUID v4)
 * @property {string} title - Titre du todo (3-100 chars)
 * @property {boolean} completed - Statut de complétion
 * @property {Date} createdAt - Date de création automatique
 */
interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

/**
 * Crée un nouveau todo
 * 
 * Cette fonction :
 * 1. Valide les données d'entrée
 * 2. Génère un ID unique
 * 3. Sauvegarde en base de données
 * 4. Retourne le todo créé
 * 
 * @param {CreateTodoDto} data - Données du todo à créer
 * @returns {Promise<Todo>} Le todo créé avec son ID
 * @throws {ValidationError} Si les données sont invalides
 * @throws {DatabaseError} Si la sauvegarde échoue
 * 
 * @example
 * const todo = await createTodo({ title: "Acheter du pain" });
 */
async function createTodo(data: CreateTodoDto): Promise<Todo> {
  // Validation des données d'entrée
  // Si invalide, lance ValidationError
  validateTodoData(data);

  // Génération d'un UUID v4 pour l'identifiant unique
  const id = generateUUID();

  // Construction de l'objet todo complet
  const todo: Todo = {
    id,
    ...data,
    completed: false,
    createdAt: new Date()
  };

  // Sauvegarde en base de données
  // Utilise une transaction pour garantir l'intégrité
  await database.save(todo);

  // Retourne le todo créé
  return todo;
}
```

**CHAQUE VARIABLE/CONSTANTE :**
```typescript
// Nombre maximum de todos affichés par page
// Utilisé pour la pagination côté serveur
const MAX_TODOS_PER_PAGE = 50;

// Expression régulière pour valider le titre
// Autorise : lettres (accents inclus), chiffres, espaces et ponctuation basique
const TITLE_REGEX = /^[a-zA-ZÀ-ÿ0-9 \-_'.,!?]+$/;
```

**CHAQUE BLOC DE CODE :**
```typescript
// Vérification si le todo existe dans la base
// Si introuvable, lance une erreur 404
if (!todo) {
  throw new ApiError(404, 'Todo not found', 'TODO_NOT_FOUND');
}

// Mise à jour du statut de complétion
// Si le todo passe à "completed", enregistre la date de complétion
if (updates.completed && !todo.completed) {
  updates.completedAt = new Date();
}
```

## 🧪 Tests à Implémenter

### Backend Tests
```typescript
describe('TodoController', () => {
  /**
   * Test de création d'un todo valide
   * Vérifie que :
   * - Le todo est créé avec les bonnes données
   * - Un ID unique est généré
   * - Le statut HTTP est 201
   * - La réponse contient le todo complet
   */
  it('should create a todo with valid data', async () => {
    // Arrange - Préparer les données de test
    const todoData = { title: 'Test todo' };

    // Act - Exécuter l'action
    const response = await request(app)
      .post('/api/todos')
      .send(todoData);

    // Assert - Vérifier le résultat
    expect(response.status).toBe(201);
    expect(response.body.title).toBe(todoData.title);
    expect(response.body.id).toBeDefined();
  });

  /**
   * Test de validation des données invalides
   * Vérifie que :
   * - Un titre trop court est rejeté
   * - Le statut HTTP est 400
   * - Le message d'erreur est clair
   */
  it('should reject todo with short title', async () => {
    // Arrange
    const invalidData = { title: 'ab' }; // Trop court (min 3)

    // Act
    const response = await request(app)
      .post('/api/todos')
      .send(invalidData);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Titre trop court');
  });
});
```

### Frontend Tests
```typescript
describe('TodoForm', () => {
  /**
   * Test de soumission du formulaire
   * Vérifie que :
   * - La fonction onAdd est appelée avec les bonnes données
   * - Le formulaire est réinitialisé après soumission
   * - Le champ de saisie est vidé
   */
  it('should call onAdd when form is submitted', () => {
    // Arrange
    const onAdd = vi.fn();
    render(<TodoForm onAdd={onAdd} />);

    // Act
    const input = screen.getByPlaceholderText('Nouvelle tâche...');
    fireEvent.change(input, { target: { value: 'Test todo' } });
    fireEvent.submit(screen.getByRole('form'));

    // Assert
    expect(onAdd).toHaveBeenCalledWith({ title: 'Test todo' });
    expect(input).toHaveValue('');
  });
});
```

## 🚀 Package.json Recommandé

### Backend
```json
{
  "name": "todo-api",
  "version": "1.0.0",
  "description": "API REST complète pour gestion de todos",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "zod": "^3.22.4",
    "better-sqlite3": "^9.2.2",
    "uuid": "^9.0.1",
    "winston": "^3.11.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/better-sqlite3": "^7.6.8",
    "@types/uuid": "^9.0.7",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0",
    "vitest": "^1.2.0",
    "supertest": "^6.3.3",
    "@types/supertest": "^6.0.2",
    "eslint": "^8.56.0",
    "prettier": "^3.2.4"
  }
}
```

## 📚 Documentation Supplémentaire

### README.md Backend

Créer un README.md dans le dossier backend avec :
- Installation et setup
- Variables d'environnement
- Architecture détaillée
- Exemples d'utilisation de l'API
- Schéma de base de données
- Guide de contribution
- Licence

### README.md Frontend

Compléter le README existant avec :
- Nouvelles features ajoutées
- Guide d'utilisation
- Composants créés
- Hooks personnalisés
- Configuration

## 🎯 Checklist de Complétion

Backend :
- [ ] Structure de dossiers créée
- [ ] Tous les endpoints CRUD implémentés
- [ ] Endpoints avancés (stats, bulk, search)
- [ ] Validation Zod complète
- [ ] Gestion d'erreurs robuste
- [ ] Logging avec Winston
- [ ] Tests unitaires (80%+ coverage)
- [ ] Tests d'intégration
- [ ] Documentation API (Swagger/OpenAPI optionnel)
- [ ] README complet

Frontend :
- [ ] TodoList.tsx complété avec features avancées
- [ ] TodoForm.tsx complété avec tous les champs
- [ ] TodoFilters.tsx créé
- [ ] TodoStats.tsx créé
- [ ] App.tsx finalisé avec routing
- [ ] Styles CSS complets et responsives
- [ ] Dark mode implémenté
- [ ] Optimistic updates
- [ ] Error boundaries
- [ ] Tests composants
- [ ] Accessibilité WCAG 2.1 AA

Intégration :
- [ ] Frontend connecté au backend
- [ ] Variables d'environnement configurées
- [ ] CORS configuré correctement
- [ ] Tests E2E (optionnel)
- [ ] Docker setup (optionnel)
- [ ] CI/CD pipeline (optionnel)

## 💡 Conseils pour Claude Code

1. **Commence par le backend** : C'est la fondation
2. **Teste chaque endpoint** au fur et à mesure
3. **Commente TOUT** : Chaque ligne importante
4. **Suis les patterns** : MVC, Repository, Service
5. **Gestion d'erreurs** : Pense à tous les cas limites
6. **Validation stricte** : Frontend ET backend
7. **Performance** : Pense indexation, caching
8. **Sécurité** : Validation, sanitization, rate limiting
9. **UX** : Loading states, error states, empty states
10. **Documentation** : README complets et à jour

## 🚀 Commande pour Démarrer

Une fois le backend créé :
```bash
# Terminal 1 - Backend
cd todo-api
npm install
npm run dev

# Terminal 2 - Frontend
cd react-todo
npm run dev
```

## 🎉 Résultat Attendu

Une application **production-ready** impressionnante avec :
- ✅ Architecture propre et scalable
- ✅ Code commenté exhaustivement
- ✅ Tests complets
- ✅ Gestion d'erreurs robuste
- ✅ UX moderne et fluide
- ✅ Performance optimale
- ✅ Sécurité renforcée
- ✅ Documentation complète

Bonne chance Claude Code ! 💪
```

---

# 🎯 Instructions pour Toi

**Comment utiliser ce README avec Claude Code :**

1. **Crée un fichier** `CLAUDE_CODE_INSTRUCTIONS.md` dans ton projet
2. **Copie tout le contenu** ci-dessus dedans
3. **Ouvre VS Code** avec l'extension Claude Code
4. **Lance Claude Code** et dis-lui :
```
Lis le fichier CLAUDE_CODE_INSTRUCTIONS.md et implémente tout ce qui est demandé. 
Commence par créer le backend complet, puis améliore le frontend. 
N'oublie pas de TOUT commenter en détail !