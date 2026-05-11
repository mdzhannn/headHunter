# Backend документация

## 1) Общее описание

Backend реализован на Spring Boot и отвечает за:

- аутентификацию соискателей (email OTP + JWT + логин по паролю),
- админские CRUD и модерацию (пользователи, резюме, вакансии, компании),
- кабинет соискателя (резюме, вакансии, отклики),
- кабинет работодателя (компания, вакансии),
- чат соискатель <-> работодатель через WebSocket/STOMP.

Технологии:

- Java 17
- Spring Boot 3.3.x
- Spring Web, Data JPA, Security, WebSocket, Mail
- PostgreSQL
- JWT (`jjwt`)
- Lombok, MapStruct

---

## 2) Структура backend

Основной код расположен в `src/main/java/resume/vakansya`.

Ключевые пакеты:

- `auth` — регистрация, login, JWT фильтр/сервис, OTP
- `config` — security, CORS, auth properties, сидирование ролей
- `controllers` — публичные и админские REST-контроллеры
- `candidate` — API соискателя
- `employer` — API работодателя
- `chat` — HTTP + STOMP для диалогов и сообщений
- `entities` — JPA-сущности
- `repositories` — Spring Data репозитории
- `services` и `services/seviceIpl` — бизнес-логика
- `mappers` — преобразование entity <-> dto

Конфигурация находится в `src/main/resources/application.properties`.

---

## 3) Запуск локально

### Требования

- Java 17
- PostgreSQL
- (опционально) Docker + Docker Compose

### Вариант A: запуск напрямую

1. Поднять PostgreSQL.
2. Проверить настройки подключения в `application.properties`:
   - `spring.datasource.url`
   - `spring.datasource.username`
   - `spring.datasource.password`
3. Из корня проекта выполнить:

```bash
./gradlew bootRun
```

Проверка компиляции:

```bash
./gradlew compileJava
```

Backend будет доступен на `http://localhost:8080`.

### Вариант B: через Docker Compose

```bash
docker compose up --build
```

Остановка:

```bash
docker compose down
```

Остановка с удалением volume БД:

```bash
docker compose down -v
```

---

## 4) Конфигурация и переменные

Ключевые параметры:

- `server.port` — порт backend (по умолчанию `8080`)
- `spring.datasource.*` — подключение к PostgreSQL
- `spring.jpa.hibernate.ddl-auto=update` — автообновление схемы

JWT и OTP:

- `app.auth.jwt-secret`
- `app.auth.jwt-expiration-ms`
- `app.auth.otp-ttl-minutes`
- `app.auth.otp-rate-window-minutes`
- `app.auth.otp-max-sends-per-window`
- `app.auth.otp-max-verify-attempts-per-challenge`

Почта (OTP):

- `spring.mail.host`
- `spring.mail.port`
- `spring.mail.username`
- `spring.mail.password`
- `app.mail.from`

Рекомендуется хранить чувствительные значения (mail/jwt/пароли БД) в переменных окружения, а не в открытом виде.

---

## 5) Новый auth-flow (регистрация + пароль)

Актуальный сценарий для соискателя:

1. Пользователь вводит ФИО и email.
2. Backend отправляет OTP-код на email.
3. Пользователь вводит OTP.
4. Backend подтверждает email.
5. Пользователь задает пароль.
6. Backend создает/обновляет аккаунт, сохраняет пароль в хэше и выдает JWT.
7. Дальше пользователь входит по `email + password`.

### Эндпоинты auth

Базовый путь: `/auth`.

- `POST /auth/register/send-email-otp`
  - тело: `fullName`, `email`
  - отправляет код подтверждения
- `POST /auth/register/verify-email-otp`
  - тело: `email`, `code`
  - подтверждает email
- `POST /auth/register/complete`
  - тело: `email`, `password`
  - завершает регистрацию, возвращает JWT
- `POST /auth/login`
  - тело: `email`, `password`
  - обычный вход по паролю, возвращает JWT

JWT ответ (`AuthResponseDto`):

- `accessToken`
- `tokenType` (`Bearer`)
- `expiresIn` (сек)

---

## 6) Security-модель

Главное:

- Stateless auth (без серверной сессии).
- JWT проверяется в фильтре до контроллеров.
- CORS настроен для локального frontend (`localhost` и `127.0.0.1`).
- Доступы:
  - `/admin/**` — роль `ADMIN`
  - `/candidate/**`, `/employer/**`, `/conversations/**` — нужен валидный JWT
  - публичные маршруты (включая `/auth/**`) доступны без токена

---

## 7) Основные REST API

### Админка

- `GET/POST/PUT/DELETE /api...` — пользователи
- `POST /api/{userId}/block` и `/unblock`
- `/admin/resume/*` — модерация резюме
- `/admin/vacancy/*` — модерация вакансий
- `/admin/companies/*` — модерация компаний
- `/admin/dashboard` — агрегированная статистика

### Соискатель

- `GET /candidate/resume`
- `PUT /candidate/resume`
- `GET /candidate/vacancies`
- `POST /candidate/vacancies/{vacancyId}/apply`
- `GET /candidate/applications/my`

### Работодатель

- `GET/PUT /employer/company`
- `GET /employer/vacancies`
- `POST /employer/vacancies`
- `PUT /employer/vacancies/{id}`
- `DELETE /employer/vacancies/{id}`

### Публичные вакансии

- `GET /vacancies/public`

---

## 8) Чат и WebSocket

HTTP-эндпоинты:

- `GET /conversations/my`
- `GET /conversations/unread-total`
- `GET /conversations/{id}/messages`
- `POST /conversations/{id}/read`

STOMP:

- endpoint: `/ws` (SockJS)
- отправка: `/app/chat.send`
- подписка: `/topic/conversation.{id}`

JWT также проверяется при STOMP-подключении.

---

## 9) Сущности, важные для auth

- `User`
  - `phone` используется как логин-идентификатор (в текущем flow это email)
  - `password` хранится в bcrypt-хэше
  - `role`, `isActive`, `createDate`
- `OtpChallenge`
  - идентификатор пользователя (`phone`/email)
  - хэш OTP-кода
  - TTL (`expiresAt`)
  - количество попыток (`attempts`)
  - ФИО (`fullName`)
  - отметка подтверждения (`verifiedAt`)

---

## 10) Частые причины проблем

- Неправильные SMTP-настройки -> не отправляется OTP.
- `jwt-secret` слишком короткий/невалидный -> ошибки при генерации или проверке токена.
- Неверный datasource (порт/логин/пароль БД) -> backend не стартует.
- Нет нужной роли в БД (`CANDIDATE`, `ADMIN`, `EMPLOYER`) -> ошибки регистрации/авторизации.
- CORS/URL mismatch между frontend и backend -> запросы не доходят.

---

## 11) Что проверить после изменений

Минимальный smoke-check:

1. `POST /auth/register/send-email-otp`
2. `POST /auth/register/verify-email-otp`
3. `POST /auth/register/complete`
4. `POST /auth/login`
5. запрос к защищенному `/candidate/*` с токеном
6. подключение к `/ws` и отправка/получение сообщения в чате

