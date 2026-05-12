# Frontend документация

## 1) Общее описание

Frontend реализован на React + TypeScript (Vite) и включает 3 основных части:

- публичная/кандидатская зона (`/app/*`),
- кабинет работодателя (`/employer`),
- админская панель (`/admin/*` через `AdminApp`).

Технологии:

- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- SockJS + STOMP (чат в реальном времени)

---

## 2) Запуск и сборка

Из папки `frontend`:

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Preview production-сборки:

```bash
npm run preview
```

По умолчанию dev-сервер запускается на `http://localhost:5173`.

---

## 3) Проксирование API

В `frontend/vite.config.ts` настроен proxy на backend (`http://localhost:8080`) для путей:

- `/api`
- `/resume`
- `/vacancy`
- `/vacancies`
- `/email` (backend endpoint, раздел Email удалён из admin-навигации)
- `/admin`
- `/auth`
- `/candidate`
- `/employer`
- `/conversations`
- `/ws` (включая websocket)

Это позволяет в коде вызывать API относительными URL без CORS-проблем в dev.

---

## 4) Основная структура

Ключевые директории:

- `src/api` — API для админской части
- `src/candidate` — кандидатская часть (auth, вакансии, профиль, чат)
- `src/employer` — UI работодателя
- `src/pages` — страницы админки
- `src/components` — общие UI-компоненты
- `src/types` — TS-типизация DTO

Главные точки входа:

- `src/main.tsx` — bootstrapping React
- `src/App.tsx` — верхнеуровневый роутинг:
  - `/app/*` -> `CandidateApp`
  - `/employer` -> `EmployerPortalPage`
  - `/*` -> `AdminApp`

---

## 5) Роутинг кандидата

`src/candidate/CandidateApp.tsx`:

- `/app` — лендинг кандидата
- `/app/login` — вход по email/паролю
- `/app/signup` — регистрация (ФИО -> OTP -> пароль)
- `/app/vacancies` — список вакансий
- `/app/register` — заполнение резюме после входа
- защищенная зона (`CandidateProtectedLayout`):
  - `/app/profile`
  - `/app/messages`
  - `/app/messages/:id`

Если токен отсутствует, защищенные маршруты отправляют на `/app/login`.

---

## 6) Новый auth-flow на frontend

### Регистрация (`CandidateSignupPage`)

Шаги:

1. Пользователь вводит ФИО и email.
2. Отправка OTP: `candidateAuth.registerSendEmailOtp(fullName, email)`.
3. Ввод и подтверждение OTP: `candidateAuth.registerVerifyEmailOtp(email, code)`.
4. Установка пароля и завершение: `candidateAuth.completeRegistration(email, password)`.
5. JWT сохраняется в localStorage, затем редирект.

### Вход (`CandidateLoginPage`)

Пользователь вводит:

- email
- пароль

Запрос:

- `candidateAuth.login(email, password)`

При успехе:

- токен сохраняется (`setStoredToken`)
- роль берется из payload JWT
- редирект:
  - `ADMIN` -> `/admin/dashboard`
  - `EMPLOYER` -> `/employer`
  - `CANDIDATE` -> `/app/register`

---

## 7) Работа с токеном

Файл `src/candidate/auth.ts`:

- `CANDIDATE_TOKEN_KEY` — ключ в localStorage
- `getStoredToken()`, `setStoredToken()`, `clearStoredToken()`
- `authHeaders()` — добавляет `Authorization: Bearer ...`
- `candidateReq()` — общий fetch-обертка для защищенных API
- `decodeJwtPayload()` — извлечение payload для role-based redirect

---

## 8) API-слой кандидата

Файл `src/candidate/candidateApi.ts`:

- профиль/резюме:
  - `getResume`
  - `saveResume`
- вакансии:
  - `getVacancies`
  - `getPublicVacancies`
  - `apply`
- отклики:
  - `getMyApplications`
- чат:
  - `getConversations`
  - `getUnreadTotal`
  - `getConversationDetail` — детали диалога + сообщения + meta (employerUserId, candidateUserId)
  - `getMessages`
  - `markConversationRead`

Все методы используют типизированные DTO и единый запросный слой.

---

## 9) Чат в реальном времени

Используются `sockjs-client` и `@stomp/stompjs`.

Высокоуровневый процесс:

1. Установить STOMP-соединение с `/ws`.
2. Передать JWT для авторизации.
3. Подписаться на канал конкретного диалога.
4. Отправлять сообщения в backend endpoint.
5. Синхронизировать счетчики непрочитанных и список диалогов.

---

## 10) UI и состояние

- Базовые UI-компоненты: `Btn`, `Input`, `PhoneInput`, `Card`, `Toast`, `Modal`, `Spinner`, `Badge`.
- `PhoneInput` — умное поле телефона: фиксированный префикс `+7`, только цифры после него.
- На страницах используется локальный state через `useState`/`useEffect`.
- Ошибки API показываются через toast-сообщения.
- В критичных местах есть `disabled` и лоадеры для защиты от повторных запросов.

---

## 11) Переменные окружения frontend

В коде используется:

- `VITE_API_BASE` (опционально)

Если не задан, запросы идут по относительным путям (proxy Vite в dev).

---

## 12) Рекомендации по дальнейшему развитию

- Добавить страницу "Забыли пароль?" и полный flow сброса пароля через email.
- Добавить строгую политику пароля на клиенте (сложность и подсказки).
- Вынести auth-state в централизованный store/context для уменьшения повторений.
- Добавить e2e smoke-тесты (Cypress/Playwright) на регистрацию, login и чат.
- Добавить обработку refresh token (если будет внедрен на backend).

