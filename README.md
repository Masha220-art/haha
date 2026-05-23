# Универсальный шаблон (Express + EJS + PostgreSQL)

Сущности: **users**, **courses**, **applications** (заявки), **reviews** (отзывы с модерацией).

## Установка

1. Создайте БД PostgreSQL и настройте `.env` (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `SESSION_SECRET`).

2. Пересоздайте схему и seed:

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

## Перенос на другой ПК без интернета

### Способ А — самый простой (рекомендуется)

На **этом** компе (с интернетом):

1. Останови сервер (`Ctrl+C` в терминале).
2. Убедись, что зависимости установлены: `npm install`.
3. Заархивируй **всю папку** `haha` **вместе с** `node_modules` (флешка / облако / общая папка).

На **другом** компе (без интернета):

1. Распакуй архив.
2. Создай `.env` (PostgreSQL).
3. `npm run db:reset` → `npm run db:seed` → `npm start`.

`npm install` на втором ПК **не нужен** — всё уже в `node_modules`.

---

### Способ Б — через `npm install` офлайн (кэш)

На **этом** компе (с интернетом):

1. Останови сервер.
2. Удали `node_modules` (папка должна удалиться полностью).
3. Подготовь кэш:

```powershell
cd c:\Users\atarax\Desktop\haha
npm run offline:prepare
```

4. Скопируй на флешку **без** `node_modules`, **но с**:
   - `src/`, `views/`, `public/`, `sql/`
   - `package.json`, `package-lock.json`
   - папка **`npm-offline-cache/`**

На **другом** компе:

1. Установи **Node.js** (18+) и **PostgreSQL** — их npm не ставит.
2. Распакуй проект, создай `.env`.
3. Установи пакеты из кэша:

```powershell
npm run offline:install
npm run db:reset
npm run db:seed
npm start
```

---

**Важно:** оба ПК должны быть одной системы (Windows + Windows). На втором ПК Bootstrap с CDN не загрузится без интернета — для экзамена позже скачай Bootstrap в `public/`.
