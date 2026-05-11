# HeadHunter (vakansya)

Монорепозиторий с backend на Spring Boot и frontend на React (Vite) для платформы поиска работы:
- админка (модерация резюме/вакансий, управление данными),
- кабинет соискателя (OTP/JWT, резюме, вакансии, отклики),
- чат соискатель <-> работодатель через WebSocket + STOMP.

## Структура проекта

- `src/main/java/resume/vakansya` — backend код (контроллеры, сервисы, сущности, security, чат)
- `src/main/resources/application.properties` — конфигурация backend
- `frontend` — frontend приложение (React + Vite + Tailwind)
- `docker-compose.yml` — запуск PostgreSQL + backend + frontend в контейнерах
- `Dockerfile` — контейнеризация backend
- `frontend/Dockerfile` — контейнеризация frontend (через Nginx)

## Требования

- Java 17
- Node.js 18+ и npm
- Docker + Docker Compose (опционально, если запускать через контейнеры)
- PostgreSQL (опционально, если не используете Docker)

## Быстрый запуск (рекомендуется через Docker)

Из корня проекта:

```bash
docker compose up --build
```

Поднимется:
- PostgreSQL: `localhost:5432` (db: `headhunter`, user: `postgres`, pass: `postgres`)
- Backend API: `http://localhost:8080`
- Frontend: `http://localhost:5173`

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

Важно: по умолчанию в `application.properties` backend смотрит на:
- `jdbc:postgresql://localhost:5433/headhunter`
- user: `postgres`
- password: `021207`

Если у вас PostgreSQL на другом порту/пароле, измените значения в:
- `src/main/resources/application.properties`

### 2) Backend

Из корня проекта:

```bash
./gradlew bootRun
```

Проверка сборки:

```bash
./gradlew compileJava
```

Backend будет доступен на `http://localhost:8080`.

### 3) Frontend

В отдельном терминале:

```bash
cd frontend
npm install
npm run dev
```

Frontend будет доступен на `http://localhost:5173`.

Сборка фронта:

```bash
npm run build
```

## Основные маршруты frontend

- `/` — админская часть
- `/app/login` — вход соискателя по OTP
- `/app/cabinet` — кабинет соискателя
- `/app/resume` — просмотр/редактирование резюме + статус модерации
- `/app/vacancies` — лента одобренных вакансий + фильтры + отклик
- `/app/messages` — список диалогов
- `/app/messages/:id` — окно чата (real-time STOMP)

## Основные backend API

### Auth (соискатель)

- `POST /auth/send-otp`
- `POST /auth/verify-otp`

### Candidate portal

- `GET /candidate/resume`
- `PUT /candidate/resume`
- `GET /candidate/vacancies`
- `POST /candidate/vacancies/{vacancyId}/apply`

### Conversations / Chat

- `GET /conversations/my`
- `GET /conversations/unread-total`
- `GET /conversations/{id}/messages`
- `POST /conversations/{id}/read`

### STOMP/WebSocket

- Endpoint: `/ws` (SockJS)
- Subscribe: `/topic/conversation.{id}`
- Send: `/app/chat.send`

## Конфигурация (важное)

Файл: `src/main/resources/application.properties`

- `spring.datasource.*` — подключение к БД
- `app.auth.jwt.*` — JWT секрет и время жизни токена
- `app.auth.otp.*` — параметры OTP (TTL, лимиты)
- `app.sms.provider` — `dev` | `twilio` | `smsc`

Для локальной разработки обычно используется:

- `app.sms.provider=dev`

## Полезно знать

- Hibernate работает в режиме `ddl-auto=update`, таблицы создаются/обновляются автоматически.
- Если меняли модель сущностей вручную, проверяйте структуру БД перед запуском.
- Для чата и кабинета соискателя нужен валидный JWT (получается после `verify-otp`).
