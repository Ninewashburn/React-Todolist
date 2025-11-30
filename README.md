# 📝 Todo Fullstack Application

Application Todo List full-stack professionnelle avec React + TypeScript (frontend) et Node.js + Express + SQLite (backend).

## 🏗️ Structure du Projet

```
todo-fullstack/
├── frontend/          # Application React + Vite + TypeScript
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/           # API REST Node.js + Express + SQLite
│   ├── src/
│   ├── data/
│   └── package.json
│
└── README.md          # Ce fichier
```

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+ et npm
- Git

### Installation

```bash
# Cloner le repository
git clone <url-du-repo>
cd todo-fullstack

# Installer les dépendances du frontend
cd frontend
npm install

# Installer les dépendances du backend
cd ../backend
npm install
```

### Lancement en Développement

**Option 1 : Lancer manuellement (2 terminaux)**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Option 2 : Depuis la racine avec npm-run-all (recommandé)**

```bash
# À la racine du projet
npm install          # Installe npm-run-all
npm run dev         # Lance frontend + backend ensemble
```

L'application sera accessible sur :
- **Frontend** : http://localhost:5174
- **Backend API** : http://localhost:3000

## 📦 Technologies Utilisées

### Frontend
- ⚛️ React 19
- 📘 TypeScript
- ⚡ Vite
- 🎨 CSS Modules
- 🔄 Custom Hooks (useTodos, useTodosWithFilters)

### Backend
- 🟢 Node.js + Express
- 📘 TypeScript
- 💾 SQLite (better-sqlite3)
- ✅ Zod (validation)
- 🔒 Helmet + CORS (sécurité)
- 📊 Winston (logging)
- 🏗️ Architecture Clean (Controllers, Services, Repositories)

## 📚 Documentation

- [Frontend README](./frontend/README.md) - Documentation détaillée du frontend
- [Backend Documentation](./backend/src/README.md) - Architecture et API du backend

## 🧪 Tests

```bash
# Frontend
cd frontend
npm test

# Backend
cd backend
npm test
```

## 🏗️ Build Production

```bash
# Frontend
cd frontend
npm run build
npm run preview

# Backend
cd backend
npm run build
npm start
```

## 📝 Fonctionnalités

- ✅ CRUD complet des todos
- 🔍 Filtrage (all, active, completed)
- 🔄 Tri (date, titre, priorité)
- 🔎 Recherche full-text
- 🏷️ Tags et priorités
- 📊 Statistiques en temps réel
- 💾 Persistance SQLite
- 🎨 Interface moderne et responsive
- ⚡ Optimistic updates
- 🔄 Gestion d'erreurs robuste

## 👥 Auteur

Généré avec ❤️ par Claude Code

## 📄 Licence

MIT
