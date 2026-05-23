# Универсальный шаблон (Express + EJS + PostgreSQL)

Сущности: **users**, **courses**, **applications** (заявки), **reviews** (отзывы с модерацией).

## Установка

1. Создайте БД PostgreSQL и настройте `.env` (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `SESSION_SECRET`).

2. Запуск:

```bash
npm install
npm run db:reset
npm run db:seed
npm start
```

Если БД пустая и старых таблиц нет, достаточно выполнить `sql/schema.sql` вместо `db:reset`.

Если триггер ругается на `EXECUTE FUNCTION` (PostgreSQL ниже 14), замените в `sql/schema.sql` на `EXECUTE PROCEDURE set_applications_updated_at();`.

## Тестовые аккаунты после seed

| Роль          | Логин       | Пароль     |
|---------------|-------------|------------|
| администратор | **Admin**   | **KorokNET** |
| пользователь  | student01   | User12345  |

Админ входит через обычную страницу `/auth/login` (роль `admin` в БД).

## Валидация (регистрация)

- **Логин** — латиница и цифры, ≥ 6 символов
- **Пароль** — ≥ 8 символов
- **ФИО** — кириллица и пробелы
- **Телефон** — `8(XXX)XXX-XX-XX`
- **Email** — формат email

## Статусы заявок

| Код           | Отображение          |
|---------------|----------------------|
| `new`         | Новая                |
| `in_progress` | Идёт обучение        |
| `completed`   | Обучение завершено   |

Отзыв доступен только при статусе **Обучение завершено**.
