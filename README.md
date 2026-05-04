# Универсальный шаблон (Express + EJS + PostgreSQL)

Сущности: **users**, **items** (справочник), **entries** (записи пользователя), **ratings** (одна оценка на запись, модерация).

## Установка

1. Создайте пользователя и БД:

```sql
CREATE USER app_user WITH PASSWORD 'your_password';
CREATE DATABASE app_db OWNER app_user;
GRANT ALL PRIVILEGES ON DATABASE app_db TO app_user;
```

2. Выполните в БД `sql/schema.sql`.

Если триггер ругается на `EXECUTE FUNCTION` (PostgreSQL ниже 14), замените в `sql/schema.sql` на `EXECUTE PROCEDURE set_entries_updated_at();`.

3. Скопируйте `.env.example` → `.env`, заполните `DATABASE_URL` и `SESSION_SECRET`.

4. Запуск:

```bash
npm install
npm run db:seed
npm start
```

## Тест после seed

| Роль  | Email             | Пароль     |
|-------|-------------------|------------|
| admin | admin@example.com | Admin123!  |
| user  | user@example.com  | User12345  |

## Git

```bash
git add .
git commit -m "refactor: generic template naming"
```

Если у вас уже была старая схема (`courses` / `applications`), дропните таблицы или создайте новую БД и заново примените `schema.sql`.
