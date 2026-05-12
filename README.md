# job.kz (headHunter)

Монорепозиторий с backend на Spring Boot и frontend на React (Vite) для платформы поиска работы:
- админка (модерация резюме/вакансий/компаний, управление пользователями, audit log),
- кабинет соискателя (регистрация по email OTP + пароль, резюме, вакансии, отклики),
- кабинет работодателя (компания, вакансии, просмотр откликов),
- чат соискатель ↔ работодатель через WebSocket + STOMP.

## Структура проекта

- `src/main/java/resume/vakansya` — backend (контроллеры, сервисы, сущности, security, чат)
- `src/main/resources/application.properties` — конфигурация backend
- `frontend` — frontend (React + Vite + Tailwind CSS)
- `docker-compose.yml` — запуск PostgreSQL + backend + frontend в контейнерах
- `Dockerfile` — сборка backend
- `frontend/Dockerfile` — сборка frontend (Nginx)
- `frontend/nginx.conf` — Nginx: SPA-роутинг + прокси всех API-путей на backend

## Требования

- Java 17
- Node.js 20+ и npm
- Docker + Docker Compose (для запуска через контейнеры)
- PostgreSQL (для локального запуска без Docker)

## Быстрый запуск через Docker

Из корня проекта:

```bash
docker compose up --build
```

Поднимется:
- PostgreSQL: `localhost:5432` (db: `headhunter`, user: `postgres`, pass: `postgres`)
- Backend API: `http://localhost:8080`
- Frontend: `http://localhost:5173`

> **Важно:** для работы отправки OTP-кодов по email нужно задать переменные окружения:
> `MAIL_USERNAME`, `MAIL_PASSWORD` (например, через файл `.env` рядом с `docker-compose.yml`).

Остановить:

```bash
docker compose down
```

Остановить и удалить volume БД:

```bash
docker compose down -v
```

## Локальный запуск без Docker

### 1) База данных

Поднимите PostgreSQL и создайте БД `headhunter`.

По умолчанию в `application.properties` backend смотрит на:
- `jdbc:postgresql://localhost:5433/headhunter`
- user: `postgres`, password: `021207`

Если PostgreSQL на другом порту/пароле — измените `src/main/resources/application.properties`.

### 2) Backend

```bash
./gradlew bootRun
```

Backend будет доступен на `http://localhost:8080`.

### 3) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend будет доступен на `http://localhost:5173`.

## Основные маршруты frontend

| Путь | Описание |
|------|----------|
| `/app/login` | Вход по email + пароль |
| `/app/signup` | Регистрация (ФИО → OTP → пароль) |
| `/app/vacancies` | Публичная лента вакансий |
| `/app/profile` | Кабинет соискателя (резюме + отклики) |
| `/app/messages` | Список диалогов |
| `/app/messages/:id` | Окно чата (real-time STOMP) |
| `/employer` | Кабинет работодателя |
| `/admin/dashboard` | Админ-панель |

## Основные backend API

### Auth

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/auth/register/send-email-otp` | Отправка OTP на email |
| POST | `/auth/register/verify-email-otp` | Подтверждение OTP |
| POST | `/auth/register/complete` | Завершение регистрации (email + password) |
| POST | `/auth/login` | Вход по email + password |
| POST | `/auth/refresh` | Обновление access-токена |

### Соискатель

| Метод | Путь | Описание |
|-------|------|----------|
| GET/PUT | `/candidate/resume` | Резюме |
| GET | `/candidate/vacancies` | Список вакансий |
| POST | `/candidate/vacancies/{id}/apply` | Отклик |
| GET | `/candidate/applications/my` | Мои отклики |

### Работодатель

| Метод | Путь | Описание |
|-------|------|----------|
| GET/PUT | `/employer/company` | Профиль компании |
| GET/POST | `/employer/vacancies` | Вакансии |
| GET | `/employer/applications` | Отклики на вакансии |

### Чат

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/conversations/my` | Список диалогов |
| GET | `/conversations/{id}` | Детали диалога + сообщения |
| POST | `/conversations/{id}/read` | Пометить прочитанным |

### Админка

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/admin/dashboard` | Статистика |
| GET | `/admin/audit` | Audit log |
| GET | `/admin/companies` | Компании |
| GET | `/admin/resume/*` | Модерация резюме |
| GET | `/admin/vacancy/*` | Модерация вакансий |

### STOMP/WebSocket

- Endpoint: `/ws` (SockJS)
- Subscribe: `/topic/conversation.{id}`
- Send: `/app/chat.send`

## Конфигурация (важное)

Файл: `src/main/resources/application.properties`

| Параметр | Описание |
|----------|----------|
| `spring.datasource.*` | Подключение к PostgreSQL |
| `app.auth.jwt-secret` | JWT-секрет (≥ 64 символа) |
| `app.auth.jwt-expiration-ms` | Время жизни токена (мс) |
| `spring.mail.*` | SMTP для OTP-писем |
| `spring.jackson.serialization.write-dates-as-timestamps=false` | Даты в ISO формате |

## Полезно знать

- Hibernate работает в режиме `ddl-auto=update` — таблицы создаются/обновляются автоматически.
- Первое сообщение в чате может отправить только работодатель.
- Audit log фиксирует все POST/PUT/DELETE действия администраторов.
