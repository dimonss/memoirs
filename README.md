# Memoirs (Мемуары)

An interactive web application for reading memoirs featuring reader authentication, bookmark management, and cross-device reading progress synchronization.

---

## 🚀 Features

- 📖 **Intuitive Reader**:
  - Page-by-page chapter reader with smooth navigation (buttons, page dot indicators, arrow key navigation).
  - Table of Contents with reading progress indicators per chapter.
  - Collapsible Sidebar for quick jumping between chapters and saved bookmarks.
- 🔖 **Bookmark System**:
  - Add and remove bookmarks instantly while reading.
  - View and manage bookmarks from the sidebar or via the main page modal dialog.
  - Cloud synchronization for authenticated readers.
- 🔐 **Reader Authentication**:
  - Sign in with Google (Google One Tap / Google Identity Services).
  - Sign in with Telegram Login Widget.
  - Session persistence and progress syncing across devices.
- 🎨 **Responsive UI**:
  - Warm dark book-inspired visual design.
  - Optimized for desktop, tablets, and mobile devices.

---

## 🛠 Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite](https://vite.dev/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: Component-scoped CSS files + global design tokens in `index.css`

---

## 📁 Project Structure

```text
src/
├── assets/                  # Static assets and images
├── components/              # React components (each in its own folder with CSS)
│   ├── BookmarksModal/      # Bookmarks management modal dialog
│   │   ├── BookmarksModal.css
│   │   └── BookmarksModal.tsx
│   ├── Reader/              # Reading screen and page viewer
│   │   ├── Reader.css
│   │   └── Reader.tsx
│   ├── Sidebar/             # Drawer sidebar navigation
│   │   ├── Sidebar.css
│   │   └── Sidebar.tsx
│   ├── TableOfContents/     # Main page (table of contents & stats)
│   │   ├── TableOfContents.css
│   │   └── TableOfContents.tsx
│   └── auth/                # Authentication modals
│       ├── LoginModal/      # Login dialog (Google / Telegram)
│       │   ├── LoginModal.css
│       │   └── LoginModal.tsx
│       └── LogoutModal/     # Logout confirmation dialog
│           ├── LogoutModal.css
│           └── LogoutModal.tsx
├── context/                 # React Context providers
│   ├── AuthContext.tsx      # Authentication state and login/logout handlers
│   └── BookContext.tsx      # Reading position, progress, and bookmarks
├── data/                    # Book content and chapter data
│   └── chapters.ts
├── services/                # API services
│   └── AuthService.ts
├── App.tsx                  # Root router and app layout
├── index.css                # Global tokens, typography, and button styles
└── main.tsx                 # React entry point
```

---

## ⚙️ Setup & Development

### 1. Clone repository and install dependencies

```bash
git clone <repository-url>
cd memoirs
npm install
```

### 2. Configure environment variables

Create `.env` using the template:

```bash
cp .env.example .env
```

Variables:
- `VITE_API_BASE` — backend sync API base URL (default: `http://localhost:3333`).
- `VITE_GOOGLE_CLIENT_ID` — Google Cloud Console Client ID (for Google Auth).
- `VITE_TELEGRAM_BOT_NAME` — Telegram bot username (for Telegram login widget).

### 3. Run development server

```bash
npm run dev
```

App will be available at `http://localhost:5173/dev/`.

> **SSH Reverse Tunnel** (for remote server development):
> ```bash
> ssh -R 8090:localhost:5173 root@chalysh.pro -N
> ```

---

## 🏗 Build & Quality Checks

- **Typecheck and build for production**:
  ```bash
  npm run build
  ```
  Build artifacts are placed in `dist/` configured with base path `/memoirs/`.

- **Preview production build**:
  ```bash
  npm run preview
  ```

- **Run linter**:
  ```bash
  npm run lint
  ```

---
---

# Мемуары (Memoirs) — Русский

Интерактивное веб-приложение для чтения мемуаров с поддержкой авторизации, сохранения закладок и синхронизации прогресса чтения между устройствами.

---

## 🚀 Основные возможности

- 📖 **Удобная читалка**:
  - Постраничное чтение глав с плавной навигацией (кнопки, индикаторы страниц, горячие клавиши стрелок).
  - Оглавление с индикатором прогресса по каждой главе.
  - Боковое меню (Sidebar) для быстрого перехода по главам и сохранённым закладкам.
- 🔖 **Система закладок**:
  - Быстрое добавление и удаление закладок прямо во время чтения.
  - Просмотр и управление закладками как в боковом меню, так и через модальное окно на главной странице.
  - Удалённая синхронизация закладок при авторизации.
- 🔐 **Авторизация читателя**:
  - Вход через Google One Tap / Google Identity Services.
  - Вход через Telegram Login Widget.
  - Сохранение сессии и синхронизация прогресса чтения.
- 🎨 **Адаптивный интерфейс**:
  - Тёмная палитра в книжном оформлении.
  - Поддержка мобильных устройств и десктопа.

---

## 🛠 Стек технологий

- **Фреймворк**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Сборщик**: [Vite](https://vite.dev/)
- **Маршрутизация**: [React Router v7](https://reactrouter.com/)
- **Иконки**: [Lucide React](https://lucide.dev/)
- **Стилизация**: Модульные CSS-файлы компонентов + глобальные дизайн-токены в `index.css`

---

## 📁 Структура проекта

```text
src/
├── assets/                  # Статические изображения и ресурсы
├── components/              # React-компоненты (каждый в своей папке с CSS)
│   ├── BookmarksModal/      # Модальное окно просмотра и управления закладками
│   │   ├── BookmarksModal.css
│   │   └── BookmarksModal.tsx
│   ├── Reader/              # Основной экран чтения страницы
│   │   ├── Reader.css
│   │   └── Reader.tsx
│   ├── Sidebar/             # Выдвижное боковое меню
│   │   ├── Sidebar.css
│   │   └── Sidebar.tsx
│   ├── TableOfContents/     # Главная страница (оглавление и статистика)
│   │   ├── TableOfContents.css
│   │   └── TableOfContents.tsx
│   └── auth/                # Модальные окна авторизации
│       ├── LoginModal/      # Вход (Google / Telegram)
│       │   ├── LoginModal.css
│       │   └── LoginModal.tsx
│       └── LogoutModal/     # Подтверждение выхода
│           ├── LogoutModal.css
│           └── LogoutModal.tsx
├── context/                 # React Context провайдеры
│   ├── AuthContext.tsx      # Состояние авторизации и методы входа/выхода
│   └── BookContext.tsx      # Позиция чтения, прогресс и закладки
├── data/                    # Тексты книги и структура глав
│   └── chapters.ts
├── services/                # API-сервисы
│   └── AuthService.ts
├── App.tsx                  # Корневой роутинг и компоновка приложения
├── index.css                # Глобальные токены, переменные, типографика и стили кнопок
└── main.tsx                 # Точка входа React
```

---

## ⚙️ Установка и запуск

### 1. Клонирование и установка зависимостей

```bash
git clone <url-репозитория>
cd memoirs
npm install
```

### 2. Настройка переменных окружения

Создайте файл `.env` на основе шаблона:

```bash
cp .env.example .env
```

Параметры:
- `VITE_API_BASE` — базовый URL бэкенда для синхронизации (по умолчанию `http://localhost:3333`).
- `VITE_GOOGLE_CLIENT_ID` — Client ID из Google Cloud Console (для Google Auth).
- `VITE_TELEGRAM_BOT_NAME` — имя Telegram-бота (для виджета авторизации Telegram).

### 3. Запуск в режиме разработки

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5173/dev/`.

> **SSH Reverse Tunnel** (при удалённой разработке):
> ```bash
> ssh -R 8090:localhost:5173 root@chalysh.pro -N
> ```

---

## 🏗 Сборка и проверка

- **Проверка типов и сборка для production**:
  ```bash
  npm run build
  ```
  Результат сборки помещается в директорию `dist/` с базовым путем `/memoirs/`.

- **Предпросмотр сборки**:
  ```bash
  npm run preview
  ```

- **Линтинг**:
  ```bash
  npm run lint
  ```
