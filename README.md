# CRM (pet project)

Навчальний pet-проєкт: CRM-система для бʼюті-індустрії (продаж апаратів,
косметики та витратних матеріалів для салонів краси) на React (frontend) +
NestJS (backend) + PostgreSQL. Структура — monorepo на npm workspaces.

## Стек

- **Frontend**: React 19 + Vite + TypeScript
- **Backend**: NestJS + TypeORM
- **База даних**: PostgreSQL 16
- **Менеджмент пакетів**: npm workspaces (єдиний `package.json` в корені)

> Спочатку планувалось використовувати Prisma, але в поточному
> оточенні розробки заблоковано доступ до `binaries.prisma.sh`
> (звідки Prisma качає engine-бінарники), тож обрано TypeORM —
> він працює через чистий `pg`-драйвер без зовнішніх бінарників.
> Якщо розробка ведеться на іншій машині з доступом до інтернету,
> можна перейти на Prisma пізніше.

## Структура

```
crm/
├── backend/          # NestJS API
├── frontend/          # React + Vite SPA
├── docker-compose.yml # Postgres (для машин з Docker Hub доступом)
└── package.json       # workspaces root
```

## Запуск локально

### 1. База даних

Якщо у вас є доступ до Docker Hub:

```bash
docker compose up -d
```

Якщо ні (наприклад, як у цьому sandbox-середовищі) — використовуйте
локально встановлений PostgreSQL:

```bash
sudo service postgresql start
sudo -u postgres psql -c "CREATE ROLE crm LOGIN PASSWORD 'crm_dev_password';"
sudo -u postgres psql -c "CREATE DATABASE crm OWNER crm;"
```

Параметри підключення (однакові для обох варіантів) — див. `.env.example`.

### 2. Встановлення залежностей

```bash
npm install
```

### 3. Змінні середовища

```bash
cp backend/.env.example backend/.env
```

### 4. Запуск у dev-режимі

```bash
npm run dev:backend    # http://localhost:3000
npm run dev:frontend   # http://localhost:5173
```

Vite проксіює запити з `/api/*` на backend (`http://localhost:3000`).

### Перевірка

- `GET http://localhost:3000/` — базова інформація про сервіс
- `GET http://localhost:3000/health` — перевірка з'єднання з базою даних
- `http://localhost:5173` — фронтенд, показує статус backend/DB

## Автентифікація

Відкритої реєстрації немає — акаунти створюють `admin` та `sales_manager`
через `POST /users` (сторінка "Користувачі" в UI). Перший адмін
створюється seed-скриптом:

```bash
npm run seed:admin --workspace=backend
```

Email/пароль читаються з `backend/.env` (`SEED_ADMIN_*`, дефолт —
`admin@beautycrm.local` / `ChangeMe123!`). Обов'язково зміни пароль після
першого входу.

Ролі: `admin`, `sales_manager` — обидві можуть створювати нові акаунти
(поки без розмежування прав нижче цього рівня).

## Плани

Проєкт розвивається поступово: наступні сутності CRM — клієнти (салони
краси), каталог товарів (апарати/косметика/витратні матеріали), угоди —
додаються окремими кроками.
