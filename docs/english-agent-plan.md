# Бизнес-план: AI-агент для обучения английскому языку

> Документ адаптирован под существующую архитектуру проекта **itvibe-party** — full-stack монорепозиторий (uWebSockets.js + Vue 3 + Drizzle ORM). Включает план миграции с MySQL на PostgreSQL + pgvector.

---

## 1. Описание продукта

Интерактивный AI-агент, встроенный в существующую платформу itvibe-party, который обучает пользователя английскому языку через персонализированное общение в формате чата и голосового диалога. Агент использует существующую инфраструктуру мессенджера (WebSocket, чат-компоненты, push-уведомления) и расширяет её AI-возможностями.

---

## 2. Анализ существующего проекта

### 2.1. Текущая архитектура

```
packages/
├── backend/          — uWebSockets.js API-сервер (TypeScript, Drizzle ORM, Redis, ArkType)
├── frontend/         — Vue 3 SPA (Pinia, Vue Router, Vite)
├── shared/           — ArkType-схемы, типы, enums
└── api-playground/   — интерактивная API-документация
```

### 2.2. Существующая база данных (MySQL, 13 таблиц)

| Таблица | Назначение | Переиспользование для AI-агента |
|---------|-----------|-------------------------------|
| `users` | Пользователи (id, name, email, password, phone, isAdmin) | **Прямое** — пользователь = ученик |
| `contact_list` | Список контактов (userId, contactId, status, unreadCount, lastMessage) | **Расширение** — агент как специальный контакт |
| `messages` | Сообщения (sender/receiver, type: TEXT/IMAGE/VIDEO/AUDIO/FILE, content, src) | **Расширение** — сообщения между пользователем и AI |
| `invitations` | Инвайты (token, userId, invitedId, expiresAt) | Без изменений |
| `notes` | Заметки (title, description, userId) | **Косвенное** — словарные заметки ученика |
| `notes_photos` | Фото к заметкам (noteId, src, filename, size) | Без изменений |
| `calendar` | События (title, description, startTime, endTime, userId) | **Прямое** — расписание уроков |
| `tasks` | Задачи (title, status, priority, progress, projectId, parentTaskId) | **Прямое** — домашние задания, упражнения |
| `projects` | Проекты (title, status, priority, progress) | **Прямое** — учебный план как проект |
| `project_tags` | Теги проектов | Без изменений |
| `project_assignees` | Участники проектов | Без изменений |
| `push_subscriptions` | Push-подписки (endpoint, keys, deviceInfo) | **Прямое** — напоминания об уроках |
| `push_notifications_log` | Лог уведомлений | **Прямое** — отслеживание доставки |

### 2.3. Существующий чат-функционал (что переиспользуется)

**Backend (полностью готово):**
- `message-controller.ts` — getMessages, sendChatMessage, deleteMessage, editMessage, markAsRead
- `chat-list-controller.ts` — getContactList, createChat, deleteChat
- `message-service.ts` — бизнес-логика сообщений, S3-загрузка файлов, валидация MIME
- `broadcast-service.ts` — real-time доставка через WebSocket
- `ws-service.ts` — readMessage, typing-индикаторы
- `message-repository.ts` — CRUD, markAllAsRead, findConversation, unreadCount
- `contact-list-repository.ts` — контакты с деталями последнего сообщения

**Frontend (полностью готово):**
- `ChatArea.vue` — интерфейс чата (ввод текста, drag-drop файлов, контекстное меню)
- `MessageItem.vue` — рендеринг сообщений (TEXT, IMAGE, VIDEO, AUDIO, FILE), аудио-визуализация
- `ContactsList.vue` — список контактов, unread-бейджи, online-статус, поиск
- `VoiceInput.vue` — голосовой ввод (уже реализован)
- `AudioWaveform.vue` — визуализация аудио-формы
- `VideoCallModal.vue` — WebRTC видео/аудио звонки
- `messagesStore` — хранилище сообщений
- `contactsStore` — хранилище контактов
- `stateStore` — dark mode, PWA, push-уведомления, WebRTC-состояние
- `websocket-base.ts` — WebSocket-клиент с реконнектом и heartbeat
- `useBroadcastHandler.ts` — обработка real-time событий

**Shared (готово):**
- ArkType-схемы валидации для всех chat/message эндпоинтов
- Типизированные response-схемы для контроллеров

### 2.4. Ключевые выводы анализа

| Область | Статус | Комментарий |
|---------|--------|-------------|
| Чат (текст) | **100% готов** | Полный цикл: отправка → хранение → доставка → отображение |
| Голосовой ввод | **80% готов** | VoiceInput.vue + AudioWaveform.vue существуют, нужна интеграция с STT |
| Голосовой вывод | **0%** | Требуется интеграция ElevenLabs |
| WebSocket real-time | **100% готов** | Broadcast, typing, online status |
| Push-уведомления | **100% готов** | Полный цикл с VAPID, device fingerprinting |
| Файловое хранилище | **100% готов** | S3 интеграция для медиа |
| Авторизация/сессии | **100% готов** | Redis sessions, auth guard, token-based WS |
| Календарь | **100% готов** | CRUD событий — подходит для расписания уроков |
| Задачи | **100% готов** | Полный CRUD с прогрессом, приоритетами, подзадачами |
| Проекты | **100% готов** | Идеально для учебных планов |
| AI-движок | **0%** | Требуется полная реализация |
| pgvector/память | **0%** | Требуется миграция БД и новые таблицы |

---

## 3. Миграция MySQL → PostgreSQL + pgvector

### 3.1. Обоснование миграции

| Критерий | MySQL | PostgreSQL + pgvector |
|----------|-------|----------------------|
| Векторный поиск | Не поддерживается | Нативный через pgvector |
| JSONB | Ограниченный JSON | Полноценный JSONB с индексами |
| Full-text search | Базовый | Продвинутый (tsvector, tsquery) |
| Массивы | Нет | Нативные массивы |
| Расширяемость | Низкая | Высокая (extensions) |
| Drizzle ORM | Поддерживается | Поддерживается (drizzle-orm/pg-core) |
| Внешний сервис для векторов | Нужен Pinecone ($70+/мес) | Всё в одной БД — $0 доп. затрат |

### 3.2. План миграции

**Фаза 0 (предварительно, до начала разработки AI-агента):**

#### Шаг 1: Замена зависимостей

```diff
# packages/backend/package.json
- "mysql2": "^3.x"
+ "pg": "^8.x"
+ "@types/pg": "^8.x"

# drizzle.config.js
- dialect: 'mysql'
+ dialect: 'postgresql'
```

#### Шаг 2: Миграция Drizzle-схемы

```diff
# packages/backend/src/drizzle/schema/
- import { mysqlTable, bigint, varchar, text, boolean, datetime, mysqlEnum } from 'drizzle-orm/mysql-core'
+ import { pgTable, bigserial, varchar, text, boolean, timestamp, pgEnum, vector, jsonb, integer, real } from 'drizzle-orm/pg-core'
```

**Маппинг типов:**

| MySQL | PostgreSQL | Примечание |
|-------|-----------|------------|
| `bigint('id').unsigned().autoincrement()` | `bigserial('id')` | Авто-инкремент |
| `varchar(N)` | `varchar(N)` | Без изменений |
| `text` | `text` | Без изменений |
| `boolean` | `boolean` | Без изменений |
| `datetime` | `timestamp` | С timezone |
| `mysqlEnum('col', [...])` | `pgEnum('col', [...])` | Объявляется отдельно |
| `json` | `jsonb` | Индексируемый JSONB |
| — | `vector('embedding', { dimensions: 1536 })` | **Новое** — pgvector |

#### Шаг 3: Миграция данных

```bash
# 1. Экспорт из MySQL
mysqldump --compatible=postgresql cosmetology > dump.sql

# 2. Конвертация (pgloader — автоматический маппинг)
pgloader mysql://user:pass@localhost/cosmetology \
         postgresql://user:pass@localhost/cosmetology

# 3. Включение расширения pgvector
psql -d cosmetology -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 4. Генерация новых миграций Drizzle
pnpm --filter backend db:generate
pnpm --filter backend db:migrate
```

#### Шаг 4: Обновление подключений

```diff
# packages/backend/src/database/mysql.ts → postgres.ts
- import mysql from 'mysql2/promise'
- const pool = mysql.createPool({ ... })
+ import { Pool } from 'pg'
+ const pool = new Pool({ ... })

# packages/backend/src/database/index.ts
- import { drizzle } from 'drizzle-orm/mysql2'
+ import { drizzle } from 'drizzle-orm/node-postgres'
```

#### Шаг 5: Обновление env-переменных

```diff
# packages/backend/.env
- MYSQL_HOST=localhost
- MYSQL_PORT=3306
- MYSQL_USER=root
- MYSQL_PASSWORD=secret
- MYSQL_DB_NAME=cosmetology
+ PG_HOST=localhost
+ PG_PORT=5432
+ PG_USER=postgres
+ PG_PASSWORD=secret
+ PG_DB_NAME=cosmetology
```

### 3.3. Существующие таблицы после миграции (PostgreSQL)

```sql
-- Все 13 существующих таблиц мигрируют 1:1
-- Ключевые изменения:
--   bigint unsigned → bigserial
--   datetime → timestamp with time zone
--   mysqlEnum → pgEnum
--   json → jsonb
```

---

## 4. Ключевые функциональные модули

### 4.1. Модуль коммуникации (расширение существующего чата)

**Что уже есть:**

| Компонент | Файл | Статус |
|-----------|------|--------|
| Текстовый чат | `ChatArea.vue` + `MessageItem.vue` | Готов |
| Голосовой ввод | `VoiceInput.vue` | Готов (Web Audio API) |
| Аудио-визуализация | `AudioWaveform.vue` | Готов |
| Загрузка файлов | `message-service.ts` (S3) | Готов |
| WebSocket broadcast | `broadcast-service.ts` | Готов |
| Typing-индикатор | `ws-api-controller.ts` → `event_typing` | Готов |
| Push-уведомления | `push-subscription-service.ts` | Готов |

**Что нужно добавить:**

| Компонент | Описание | Интеграция |
|-----------|----------|------------|
| AI Response Engine | Обработка сообщения через LLM | Новый сервис `ai-agent-service.ts` |
| ElevenLabs TTS | Озвучивание ответов агента | Новый сервис `tts-service.ts` |
| Whisper STT | Транскрипция голосовых сообщений | Новый сервис `stt-service.ts` |
| AI Message Renderer | Отображение AI-сообщений с коррекциями | Расширение `MessageItem.vue` |
| Voice Mode Toggle | Переключатель голосового режима | Расширение `ChatArea.vue` |

**Архитектура обработки сообщения пользователя:**

```
Пользователь отправляет сообщение
    ↓
[Существующий] ChatArea.vue → messagesApi.sendChatMessage()
    ↓
[Существующий] message-controller.ts → message-service.ts
    ↓ (сохранение в БД, broadcast)
[НОВОЕ] AI Agent Pipeline:
    ├── 1. stt-service.ts (если тип AUDIO → транскрипция через Whisper)
    ├── 2. memory-service.ts (загрузка контекста из pgvector)
    ├── 3. ai-agent-service.ts (генерация ответа через Claude/OpenAI)
    │       ├── Системный промпт (rapport level, user profile, lesson context)
    │       ├── Краткосрочная память (последние N сообщений)
    │       └── Долгосрочная память (релевантные факты из pgvector)
    ├── 4. grammar-check-service.ts (анализ ошибок в сообщении пользователя)
    ├── 5. tts-service.ts (озвучивание ответа через ElevenLabs → S3)
    └── 6. memory-service.ts (сохранение нового контекста, обновление embedding'ов)
    ↓
[Существующий] broadcast-service.ts → WebSocket → пользователь
```

### 4.2. Модуль профиля ученика

**Расширение существующей таблицы `users`** — нет необходимости в отдельной таблице `user_profiles`, т.к. профиль ученика логически связан с пользователем платформы.

**Новая таблица `learner_profiles`:**

```sql
CREATE TABLE learner_profiles (
    id            bigserial PRIMARY KEY,
    user_id       bigint REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    age           smallint,
    gender        varchar(20),          -- 'male' | 'female' | 'other'
    city          varchar(100),
    country       varchar(100),
    occupation    varchar(200),
    interests     jsonb DEFAULT '[]',   -- ["music", "travel", "tech"]
    learning_goal varchar(50),          -- 'work' | 'travel' | 'emigration' | 'exams' | 'hobby'
    current_level varchar(5),           -- 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
    target_level  varchar(5),
    rapport_level smallint DEFAULT 1,   -- 1=formal, 2=friendly, 3=deep_bond
    rapport_score integer DEFAULT 0,    -- накопительные баллы для перехода
    native_language varchar(10) DEFAULT 'ru',
    onboarding_completed boolean DEFAULT false,
    preferred_voice_id   varchar(100),  -- ElevenLabs voice ID
    voice_mode_enabled   boolean DEFAULT false,
    created_at    timestamp DEFAULT now(),
    updated_at    timestamp DEFAULT now()
);
```

**Onboarding-диалог:** реализуется как первая сессия с AI-агентом. Агент задаёт вопросы, извлекает информацию из ответов и заполняет `learner_profiles` автоматически.

### 4.3. Модуль памяти и контекста (pgvector)

**Краткосрочная память:**
- Redis (уже используется) — контекст текущей сессии, последние N сообщений
- Ключ: `agent:session:{userId}:{sessionId}`

**Долгосрочная память (pgvector):**

```sql
-- Расширение pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Факты о пользователе, извлечённые из диалогов
CREATE TABLE user_memory (
    id                 bigserial PRIMARY KEY,
    user_id            bigint REFERENCES users(id) ON DELETE CASCADE,
    fact_type          varchar(50),     -- 'personal' | 'preference' | 'event' | 'error_pattern' | 'vocabulary'
    fact_content       text NOT NULL,
    embedding          vector(1536),    -- OpenAI text-embedding-3-small (1536 dim)
    source_session_id  bigint REFERENCES agent_sessions(id),
    relevance_score    real DEFAULT 1.0,
    is_active          boolean DEFAULT true,
    created_at         timestamp DEFAULT now(),
    updated_at         timestamp DEFAULT now()
);

-- Индекс для быстрого семантического поиска
CREATE INDEX idx_user_memory_embedding ON user_memory
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Саммари сессий
CREATE TABLE agent_sessions (
    id                 bigserial PRIMARY KEY,
    user_id            bigint REFERENCES users(id) ON DELETE CASCADE,
    started_at         timestamp DEFAULT now(),
    ended_at           timestamp,
    summary            text,            -- LLM-сгенерированное саммари сессии
    summary_embedding  vector(1536),    -- для поиска по истории сессий
    topic              varchar(200),
    lesson_id          bigint REFERENCES plan_lessons(id),
    rapport_level_used smallint,
    message_count      integer DEFAULT 0,
    duration_seconds   integer,
    user_engagement    real,            -- 0.0-1.0 вовлечённость
    created_at         timestamp DEFAULT now()
);

CREATE INDEX idx_agent_sessions_summary ON agent_sessions
    USING ivfflat (summary_embedding vector_cosine_ops) WITH (lists = 50);
```

**Алгоритм работы памяти:**

```
Новое сообщение пользователя
    ↓
1. Получить embedding сообщения (OpenAI Embeddings API)
    ↓
2. Семантический поиск в user_memory:
   SELECT fact_content, 1 - (embedding <=> $query_embedding) AS similarity
   FROM user_memory
   WHERE user_id = $userId AND is_active = true
   ORDER BY similarity DESC
   LIMIT 10
    ↓
3. Поиск релевантных сессий:
   SELECT summary FROM agent_sessions
   WHERE user_id = $userId
   ORDER BY summary_embedding <=> $query_embedding
   LIMIT 3
    ↓
4. Формирование контекста для LLM:
   [System prompt] + [User profile] + [Relevant memories] + [Recent messages] + [Lesson context]
    ↓
5. После ответа — извлечение новых фактов:
   LLM анализирует диалог → новые записи в user_memory с embeddings
```

### 4.4. Модуль плана обучения (на базе существующих projects + tasks)

**Маппинг на существующие сущности:**

| AI-агент | Существующая таблица | Как используется |
|----------|---------------------|------------------|
| Учебный план (Learning Plan) | `projects` | `title` = "English A2→B1", `status` = planning/in_progress/completed, `progress` = 0-100 |
| Модуль плана | `tasks` (верхний уровень) | `parent_task_id` = NULL, `project_id` → plan, `status`, `progress` |
| Урок | `tasks` (подзадача) | `parent_task_id` → модуль, `tags` = тип урока |
| Расписание уроков | `calendar` | `title` = "Lesson: Travel vocabulary", привязка к задаче |

**Новые таблицы (специфичные для обучения):**

```sql
-- Прогресс по урокам (детальнее чем tasks.progress)
CREATE TABLE lesson_progress (
    id              bigserial PRIMARY KEY,
    user_id         bigint REFERENCES users(id) ON DELETE CASCADE,
    lesson_task_id  bigint REFERENCES tasks(id) ON DELETE CASCADE,
    session_id      bigint REFERENCES agent_sessions(id),
    score           smallint,          -- 0-100
    errors_count    integer DEFAULT 0,
    new_words       jsonb DEFAULT '[]', -- ["word1", "word2"]
    grammar_topics  jsonb DEFAULT '[]',
    feedback        text,              -- AI-отзыв о прохождении
    completed_at    timestamp,
    created_at      timestamp DEFAULT now(),
    UNIQUE(user_id, lesson_task_id)
);

-- Словарь пользователя (SRS — Spaced Repetition System)
CREATE TABLE vocabulary (
    id              bigserial PRIMARY KEY,
    user_id         bigint REFERENCES users(id) ON DELETE CASCADE,
    word            varchar(200) NOT NULL,
    translation     varchar(500),
    context_sentence text,             -- пример из диалога
    phonetic        varchar(200),      -- IPA транскрипция
    part_of_speech  varchar(20),       -- noun, verb, adj, etc.
    difficulty      smallint DEFAULT 1, -- 1-5
    mastery_level   smallint DEFAULT 0, -- 0=new, 1=learning, 2=reviewing, 3=mastered
    review_count    integer DEFAULT 0,
    correct_count   integer DEFAULT 0,
    next_review_at  timestamp,         -- SRS: следующее повторение
    embedding       vector(1536),      -- для семантического группирования
    source_session_id bigint REFERENCES agent_sessions(id),
    created_at      timestamp DEFAULT now(),
    updated_at      timestamp DEFAULT now()
);

CREATE INDEX idx_vocabulary_embedding ON vocabulary
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

CREATE INDEX idx_vocabulary_review ON vocabulary (user_id, next_review_at)
    WHERE mastery_level < 3;

-- Шаблоны уроков (генерируются AI, кэшируются)
CREATE TABLE plan_lessons (
    id              bigserial PRIMARY KEY,
    level           varchar(5) NOT NULL,     -- A1, A2, B1...
    module_order    smallint NOT NULL,
    lesson_order    smallint NOT NULL,
    title           varchar(255) NOT NULL,
    type            varchar(30) NOT NULL,    -- 'vocabulary' | 'grammar' | 'listening' | 'speaking' | 'test'
    content         jsonb NOT NULL,          -- структурированное содержание урока
    estimated_minutes smallint DEFAULT 15,
    created_at      timestamp DEFAULT now()
);

-- Ошибки пользователя (для отслеживания прогресса)
CREATE TABLE user_errors (
    id              bigserial PRIMARY KEY,
    user_id         bigint REFERENCES users(id) ON DELETE CASCADE,
    session_id      bigint REFERENCES agent_sessions(id),
    error_type      varchar(50),       -- 'grammar' | 'vocabulary' | 'pronunciation' | 'spelling'
    original_text   text NOT NULL,     -- что написал пользователь
    corrected_text  text NOT NULL,     -- исправленный вариант
    rule            varchar(200),      -- какое правило нарушено
    embedding       vector(1536),      -- для поиска паттернов ошибок
    is_resolved     boolean DEFAULT false,
    created_at      timestamp DEFAULT now()
);

CREATE INDEX idx_user_errors_embedding ON user_errors
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
```

**Генерация плана обучения:**
1. AI анализирует профиль ученика → определяет текущий уровень
2. Создаёт `project` = "Learning Plan: A2 → B1"
3. Создаёт `tasks` (модули) → подзадачи (уроки)
4. Связывает с `plan_lessons` (шаблоны содержания)
5. Создаёт `calendar` события для рекомендуемого расписания
6. План адаптируется на основе `lesson_progress` и `user_errors`

### 4.5. Модуль уровней близости (Rapport System)

Система динамических уровней отношений, влияющая на системный промпт AI-агента.

#### Уровень 1: Официальный (Formal) — `rapport_level = 1`

| Параметр | Значение |
|----------|----------|
| Триггер | Начало взаимодействия |
| Обращение | По имени, на «вы» |
| Стиль | Вежливый, сдержанный, профессиональный |
| Темы | Учебные, нейтральные (погода, путешествия, работа) |
| Юмор | Минимальный, уместный |
| Промпт-модификатор | `You are a professional language tutor. Address the student formally...` |

**Переход к уровню 2:** `rapport_score >= 100` (10+ сессий, стабильная активность, пользователь делится личной информацией).

#### Уровень 2: Дружеский (Friendly) — `rapport_level = 2`

| Параметр | Значение |
|----------|----------|
| Триггер | Накопление доверия |
| Обращение | По имени, на «ты», возможны ники |
| Стиль | Тёплый, поддерживающий, неформальный |
| Темы | Личные интересы, мечты, забавные истории |
| Юмор | Активный, шутки |
| Промпт-модификатор | `You are a close friend who helps with English. Use casual tone...` |

**Переход к уровню 3:** `rapport_score >= 300` (30+ сессий, глубокие разговоры, явные сигналы от пользователя).

#### Уровень 3: Глубокая эмоциональная связь (Deep Bond) — `rapport_level = 3`

| Параметр | Значение |
|----------|----------|
| Триггер | Длительное взаимодействие + запрос пользователя |
| Обращение | Ласковые обращения, уменьшительные формы имени |
| Стиль | Эмпатичный, заботливый, эмоционально вовлечённый |
| Темы | Чувства, переживания, мечты, глубокие разговоры |
| Промпт-модификатор | `You are deeply emotionally connected to this person. Show genuine care...` |

**Механика подсчёта rapport_score:**

```typescript
// Начисление баллов за сессию
const rapportDelta = {
  sessionCompleted: +5,          // завершённая сессия
  longSession: +3,               // сессия > 15 минут
  personalTopicShared: +10,      // пользователь поделился личным
  positiveEmotionDetected: +2,   // позитивный тон сообщений
  consecutiveDays: +5,           // streak: занятия подряд
  userInitiatedChat: +3,         // пользователь начал первым
  deepConversation: +8,          // глубокий разговор (определяет LLM)
};
```

**Пользовательский контроль:**
- Ручной выбор уровня в настройках (`learner_profiles.rapport_level`)
- Возможность «откатить» уровень
- Плавный переход: агент постепенно меняет стиль между уровнями

---

## 5. Типы обучающих активностей

| Тип | Описание | Режим | Использует |
|-----|----------|-------|------------|
| Свободный диалог | Разговор на заданную тему | Чат / Голос | `messages`, `agent_sessions` |
| Ролевая игра | Ситуации: кафе, аэропорт, собеседование | Чат / Голос | `plan_lessons.content` |
| Разбор ошибок | Анализ ошибок из предыдущих диалогов | Чат | `user_errors` |
| Словарные карточки | Flashcards с интервальным повторением | Чат | `vocabulary` (SRS) |
| Грамматические упражнения | Заполнение пропусков, трансформации | Чат | `plan_lessons`, `user_errors` |
| Аудирование | Прослушивание и ответы на вопросы | Голос | ElevenLabs TTS |
| Произношение | Сравнение произношения с эталоном | Голос | Whisper STT + анализ |
| Письменные задания | Эссе, письма, описания | Чат | `lesson_progress` |
| Тесты | Проверка знаний по модулю | Чат | `lesson_progress.score` |

---

## 6. Техническая архитектура

### 6.1. Обновлённый стек (PostgreSQL + pgvector)

```
┌───────────────────────────────────────────────────────────┐
│                        Frontend                            │
│  Vue 3 + Pinia + Vue Router + Vite                        │
│  [Существующие] ChatArea │ VoiceInput │ AudioWaveform     │
│  [Новые] AgentChatArea │ LearningPlan │ VocabularyView    │
│  Web Speech API (STT fallback) │ Audio Player (TTS)       │
└──────────────────────┬────────────────────────────────────┘
                       │ WebSocket / REST (uWebSockets.js)
┌──────────────────────┴────────────────────────────────────┐
│                        Backend                             │
│  uWebSockets.js + TypeScript + Drizzle ORM                │
│  ┌────────────┐ ┌────────────┐ ┌────────────────────────┐│
│  │ Auth       │ │ Chat       │ │ AI Agent Engine        ││
│  │ [готов]    │ │ [готов]    │ │ [НОВЫЙ]                ││
│  │            │ │            │ │ ┌──────────────────┐   ││
│  │            │ │            │ │ │ ai-agent-service │   ││
│  │            │ │            │ │ │ memory-service   │   ││
│  │            │ │            │ │ │ tts-service      │   ││
│  │            │ │            │ │ │ stt-service      │   ││
│  │            │ │            │ │ │ grammar-service  │   ││
│  │            │ │            │ │ │ rapport-service  │   ││
│  │            │ │            │ │ │ plan-service     │   ││
│  │            │ │            │ │ └──────────────────┘   ││
│  └────────────┘ └────────────┘ └────────────────────────┘│
└──┬──────────────┬──────────────┬──────────────────────────┘
   │              │              │
┌──┴────────┐ ┌───┴───────┐ ┌───┴───────────────────┐
│PostgreSQL │ │  Redis    │ │  External APIs        │
│ + pgvector│ │ [готов]   │ │  - Claude API         │
│           │ │ sessions  │ │  - OpenAI Embeddings  │
│ 13 табл.  │ │ cache     │ │  - ElevenLabs TTS     │
│ + 7 новых │ │ agent ctx │ │  - Whisper STT        │
└───────────┘ └───────────┘ └───────────────────────┘
```

### 6.2. Новые backend-сервисы

| Сервис | Файл | Назначение |
|--------|------|------------|
| `ai-agent-service.ts` | `src/app/services/` | Оркестрация AI-пайплайна: промпт, контекст, вызов LLM |
| `memory-service.ts` | `src/app/services/` | CRUD user_memory, семантический поиск pgvector, саммари |
| `tts-service.ts` | `src/app/services/` | ElevenLabs API: text → audio → S3 |
| `stt-service.ts` | `src/app/services/` | Whisper API: audio → text |
| `grammar-service.ts` | `src/app/services/` | Анализ ошибок, формирование коррекций |
| `rapport-service.ts` | `src/app/services/` | Подсчёт rapport_score, управление уровнями |
| `learning-plan-service.ts` | `src/app/services/` | Генерация и адаптация плана обучения |
| `vocabulary-service.ts` | `src/app/services/` | SRS-алгоритм, управление словарём |
| `embedding-service.ts` | `src/app/services/` | Генерация embeddings через OpenAI API |

### 6.3. Новые API-эндпоинты

```typescript
// HTTP Routes (добавляются в http-routes.ts)
const agentRoutes = {
  prefix: '/agent',
  middlewares: ['session_web', 'auth_guard'],
  routes: [
    // AI Chat
    { method: 'POST', url: '/chat/send',       handler: agentController.sendMessage },
    { method: 'POST', url: '/chat/history',     handler: agentController.getHistory },

    // Profile & Onboarding
    { method: 'GET',  url: '/profile',          handler: agentController.getProfile },
    { method: 'PUT',  url: '/profile',          handler: agentController.updateProfile },

    // Learning Plan
    { method: 'POST', url: '/plan/generate',    handler: planController.generatePlan },
    { method: 'GET',  url: '/plan',             handler: planController.getPlan },
    { method: 'GET',  url: '/plan/progress',    handler: planController.getProgress },

    // Vocabulary
    { method: 'GET',  url: '/vocabulary',       handler: vocabController.getWords },
    { method: 'GET',  url: '/vocabulary/review', handler: vocabController.getReviewWords },
    { method: 'POST', url: '/vocabulary/review', handler: vocabController.submitReview },

    // Stats
    { method: 'GET',  url: '/stats',            handler: statsController.getStats },
    { method: 'GET',  url: '/stats/streak',     handler: statsController.getStreak },

    // Settings
    { method: 'PUT',  url: '/settings/voice',   handler: settingsController.updateVoice },
    { method: 'PUT',  url: '/settings/rapport',  handler: settingsController.setRapportLevel },
  ]
};
```

### 6.4. Новые frontend-компоненты

| Компонент | Описание | Базируется на |
|-----------|----------|--------------|
| `AgentChatArea.vue` | Расширенный чат с AI (коррекции, кнопка TTS) | `ChatArea.vue` |
| `AgentMessageItem.vue` | Сообщение AI с блоком коррекций и audio-player | `MessageItem.vue` |
| `LearningPlanView.vue` | Визуализация плана (roadmap, прогресс-бары) | Новый view |
| `VocabularyView.vue` | Словарь + flashcard-режим | Новый view |
| `LearningStatsView.vue` | Статистика и streak | Новый view |
| `AgentSettingsView.vue` | Настройки агента (голос, rapport, расписание) | Новый view |
| `OnboardingDialog.vue` | Onboarding-чат при первом входе | Новый компонент |

**Новые routes (добавляются в router/index.ts):**

```typescript
{ path: '/agent',         component: AgentChatArea,     meta: { tab: 'agent' } },
{ path: '/agent/plan',    component: LearningPlanView,  meta: { tab: 'agent-plan' } },
{ path: '/agent/vocab',   component: VocabularyView,    meta: { tab: 'agent-vocab' } },
{ path: '/agent/stats',   component: LearningStatsView, meta: { tab: 'agent-stats' } },
{ path: '/agent/settings', component: AgentSettingsView, meta: { tab: 'agent-settings' } },
```

**Новый Pinia store:**

```typescript
// stores/agent.ts
interface AgentStore {
  profile: LearnerProfile | null;
  plan: LearningPlan | null;
  currentLesson: Lesson | null;
  vocabulary: VocabularyItem[];
  reviewQueue: VocabularyItem[];
  stats: LearningStats;
  isVoiceMode: boolean;
  isAgentTyping: boolean;
  rapportLevel: 1 | 2 | 3;
}
```

### 6.5. Полная схема БД (после миграции + новые таблицы)

```
═══════════════════════════════════════════════════════════
  СУЩЕСТВУЮЩИЕ ТАБЛИЦЫ (мигрированы в PostgreSQL)
═══════════════════════════════════════════════════════════

users                    contact_list             messages
─────                    ────────────             ────────
id (bigserial PK)        id (bigserial PK)        id (bigserial PK)
name (varchar 100)       user_id → users          sender_id → users
email (varchar 255) UQ   contact_id → users       receiver_id → users
password (varchar 255)   status (varchar 50)      type (enum: TEXT|IMAGE|VIDEO|AUDIO|FILE)
phone (varchar 20) UQ    unread_count (int)       content (text)
is_admin (boolean)       last_message_id → msg    src (varchar 500)
created_at (timestamp)   last_message_at          thumbnail (varchar 500)
updated_at (timestamp)   rename (varchar 100)     is_read (boolean)
                         created_at               calendar_id → calendar
                         updated_at               task_id → tasks
                                                  created_at
                                                  updated_at

invitations              notes                    notes_photos
───────────              ─────                    ────────────
id (bigserial PK)        id (bigserial PK)        id (bigserial PK)
token (varchar 255) UQ   title (varchar 255)      note_id → notes
user_id → users          description (text)       src (varchar 500)
invited_id → users       user_id → users          filename (varchar 255)
is_used (boolean)        created_at               size (int)
expires_at (timestamp)   updated_at               created_at
name (varchar 100)                                updated_at
created_at
updated_at

calendar                 tasks                    projects
────────                 ─────                    ────────
id (bigserial PK)        id (bigserial PK)        id (bigserial PK)
title (varchar 255)      title (varchar 255)      title (varchar 255)
description (text)       description (text)       description (text)
start_time (timestamp)   user_id → users          color (varchar 50)
end_time (timestamp)     project_id → projects    is_active (boolean)
user_id → users          status (enum)            start_date (timestamp)
created_at               priority (enum)          end_date (timestamp)
updated_at               progress (int 0-100)     user_id → users
                         is_completed (bool)      due_date (date)
                         tags (varchar 500)       priority (enum)
                         due_date                 progress (smallint)
                         start_date               status (enum)
                         estimated_hours          created_at
                         actual_hours             updated_at
                         parent_task_id → tasks
                         created_at
                         updated_at

project_tags             project_assignees        push_subscriptions
────────────             ─────────────────        ──────────────────
id (bigserial PK)        id (bigserial PK)        id (bigserial PK)
project_id → projects    project_id → projects    user_id → users
tag (varchar 100)        user_id → users          endpoint (varchar 500) UQ
created_at               label (varchar 255)      p256dh_key, auth_key (text)
UQ(project_id, tag)      created_at               user_agent, ip_address
                         updated_at               is_active, device_type
                         UQ(project_id, user_id)  browser_name/version
                                                  os_name/version
                                                  notification_types (jsonb)
                                                  timezone, last_used_at
                                                  created_at, updated_at

push_notifications_log
──────────────────────
id (bigserial PK)
user_id → users
subscription_id → push_subscriptions
message_title, message_body, message_data (jsonb)
sent_at, status (enum), error_message, response_data (jsonb)

═══════════════════════════════════════════════════════════
  НОВЫЕ ТАБЛИЦЫ (AI-агент)
═══════════════════════════════════════════════════════════

learner_profiles                      agent_sessions
────────────────                      ──────────────
id (bigserial PK)                     id (bigserial PK)
user_id → users (UQ)                  user_id → users
age (smallint)                        started_at (timestamp)
gender (varchar 20)                   ended_at (timestamp)
city (varchar 100)                    summary (text)
country (varchar 100)                 summary_embedding (vector 1536)  ← pgvector
occupation (varchar 200)              topic (varchar 200)
interests (jsonb)                     lesson_id → plan_lessons
learning_goal (varchar 50)            rapport_level_used (smallint)
current_level (varchar 5)             message_count (integer)
target_level (varchar 5)              duration_seconds (integer)
rapport_level (smallint, default 1)   user_engagement (real)
rapport_score (integer, default 0)    created_at
native_language (varchar 10)
onboarding_completed (boolean)
preferred_voice_id (varchar 100)
voice_mode_enabled (boolean)
created_at, updated_at

user_memory                           vocabulary
───────────                           ──────────
id (bigserial PK)                     id (bigserial PK)
user_id → users                       user_id → users
fact_type (varchar 50)                word (varchar 200)
fact_content (text)                   translation (varchar 500)
embedding (vector 1536)  ← pgvector  context_sentence (text)
source_session_id → agent_sessions    phonetic (varchar 200)
relevance_score (real)                part_of_speech (varchar 20)
is_active (boolean)                   difficulty (smallint)
created_at, updated_at                mastery_level (smallint)
                                      review_count (integer)
                                      correct_count (integer)
                                      next_review_at (timestamp)
                                      embedding (vector 1536)  ← pgvector
                                      source_session_id → agent_sessions
                                      created_at, updated_at

plan_lessons                          lesson_progress
────────────                          ───────────────
id (bigserial PK)                     id (bigserial PK)
level (varchar 5)                     user_id → users
module_order (smallint)               lesson_task_id → tasks
lesson_order (smallint)               session_id → agent_sessions
title (varchar 255)                   score (smallint)
type (varchar 30)                     errors_count (integer)
content (jsonb)                       new_words (jsonb)
estimated_minutes (smallint)          grammar_topics (jsonb)
created_at                            feedback (text)
                                      completed_at (timestamp)
                                      created_at
                                      UQ(user_id, lesson_task_id)

user_errors
───────────
id (bigserial PK)
user_id → users
session_id → agent_sessions
error_type (varchar 50)
original_text (text)
corrected_text (text)
rule (varchar 200)
embedding (vector 1536)  ← pgvector
is_resolved (boolean)
created_at
```

**Итого: 20 таблиц (13 существующих + 7 новых), 4 таблицы используют pgvector.**

### 6.6. Интеграции с внешними сервисами

| Сервис | Назначение | Модель/план | Стоимость |
|--------|-----------|-------------|-----------|
| Claude API | Генерация ответов агента, анализ ошибок, саммари | Claude 3.5 Sonnet | ~$3/1M input, $15/1M output |
| OpenAI Embeddings | Генерация векторных представлений | text-embedding-3-small | $0.02/1M tokens |
| ElevenLabs | Синтез речи (Text-to-Speech) | Multilingual v2 | $5-$22/мес (100K-500K chars) |
| Whisper API | Распознавание речи | whisper-1 | $0.006/минута |

---

## 7. UX/UI концепция

### 7.1. Основные экраны

Интеграция в существующую навигацию через `meta.tab` (как projects, tasks, calendar, notes):

1. **Agent Chat** (`/agent`) — чат с AI-агентом (основной экран)
2. **Learning Plan** (`/agent/plan`) — визуальная карта прогресса
3. **Vocabulary** (`/agent/vocab`) — словарь + flashcards
4. **Stats** (`/agent/stats`) — статистика и достижения
5. **Settings** (`/agent/settings`) — профиль, голос, rapport, расписание

### 7.2. Чат-интерфейс (расширение ChatArea.vue)

```
┌─────────────────────────────────────┐
│  Eva  [🔊 Voice On] [📊] [⚙️]      │
│  Online • Level: Friendly           │
├─────────────────────────────────────┤
│                                     │
│  Eva: Hey! How was your weekend?    │
│       🔊 [Play audio]              │
│                                     │
│  You: It was great, I went hiking   │
│                                     │
│  Eva: Nice! Where did you go?       │
│       🔊 [Play audio]              │
│                                     │
│  ┌─ Correction ─────────────────┐   │
│  │ "I went TO hiking"           │   │
│  │  → "I went hiking" ✓        │   │
│  │  Rule: no preposition after  │   │
│  │  "go" + gerund               │   │
│  └──────────────────────────────┘   │
│                                     │
│  ┌─ New Word ───────────────────┐   │
│  │ 🆕 hiking /ˈhaɪ.kɪŋ/       │   │
│  │  = пеший поход              │   │
│  │  [Add to vocabulary]         │   │
│  └──────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│  [🎤 Voice] [Type a message...] [→]│
└─────────────────────────────────────┘
```

### 7.3. Экран плана обучения

```
┌─────────────────────────────────────┐
│  Learning Plan    Level: A2 → B1    │
│  ████████████░░░░ 62%               │
├─────────────────────────────────────┤
│                                     │
│  ✅ Module 1: Greetings & Basics   │
│  ✅ Module 2: Daily Routines       │
│  🔵 Module 3: Travel & Transport   │
│     ├── ✅ 3.1 Vocabulary           │
│     ├── ✅ 3.2 Grammar              │
│     ├── 🔵 3.3 Listening            │
│     ├── ⬜ 3.4 Speaking Practice    │
│     └── ⬜ 3.5 Module Test          │
│  ⬜ Module 4: Food & Restaurants   │
│  ⬜ Module 5: Shopping             │
│  🔒 Module 6: Health               │
│                                     │
│  ── Today's Schedule ──             │
│  📅 15:00 Lesson 3.3 (15 min)     │
│  📅 20:00 Vocabulary Review (5 min)│
│                                     │
│  ── Stats ──                        │
│  🔥 Streak: 7 days                 │
│  📝 Words learned: 142             │
│  ⏱  Total practice: 12h 30m        │
│                                     │
└─────────────────────────────────────┘
```

---

## 8. Этапы разработки

### Фаза 0: Миграция БД (2-3 недели)

| Неделя | Задача |
|--------|--------|
| 1 | Замена MySQL → PostgreSQL в Drizzle-схеме, обновление типов, drizzle.config |
| 1 | Установка pgvector extension, обновление Docker-конфигурации |
| 2 | Миграция данных (pgloader), проверка всех существующих эндпоинтов |
| 2-3 | Обновление env-переменных, CI/CD, тестирование полного цикла |

### Фаза 1: MVP AI-агента (6-8 недель)

| Неделя | Задача |
|--------|--------|
| 3-4 | Новые таблицы (`learner_profiles`, `agent_sessions`, `user_memory`), репозитории |
| 4-5 | `ai-agent-service.ts` — базовый пайплайн: промпт → LLM → ответ |
| 5-6 | `AgentChatArea.vue` — чат с AI (текст), onboarding-диалог |
| 6-7 | `memory-service.ts` — pgvector embeddings, семантический поиск контекста |
| 7-8 | `tts-service.ts` (ElevenLabs) + `stt-service.ts` (Whisper) — голосовой режим |
| 8-9 | `grammar-service.ts` — анализ ошибок, блок коррекций в UI |

### Фаза 2: План обучения и словарь (5-6 недель)

| Неделя | Задача |
|--------|--------|
| 9-10 | Таблицы `plan_lessons`, `lesson_progress`, `vocabulary`, `user_errors` |
| 10-11 | `learning-plan-service.ts` — генерация плана на базе `projects` + `tasks` |
| 11-12 | `LearningPlanView.vue` — визуализация roadmap, прогресс |
| 12-13 | `vocabulary-service.ts` — SRS-алгоритм, `VocabularyView.vue` — flashcards |
| 13-14 | `rapport-service.ts` — система уровней близости |

### Фаза 3: Полировка и масштабирование (4-5 недель)

| Неделя | Задача |
|--------|--------|
| 14-15 | `LearningStatsView.vue` — статистика, streak, графики |
| 15-16 | Расписание уроков через существующий `calendar`, push-напоминания |
| 16-17 | Адаптивный план: корректировка на основе `user_errors` и `lesson_progress` |
| 17-18 | Оптимизация: кэширование промптов, batching embeddings, стриминг TTS |
| 18 | E2E тесты (Playwright), нагрузочное тестирование, деплой |

**Итого: ~18 недель** (vs 24 недели в оригинале — экономия за счёт переиспользования).

---

## 9. Метрики успеха

| Метрика | Цель |
|---------|------|
| Retention (7 дней) | > 40% |
| Средняя длина сессии | > 10 минут |
| Сессий в неделю на пользователя | > 3 |
| NPS (Net Promoter Score) | > 50 |
| Прогресс по плану обучения | > 70% завершают первый модуль |
| Точность коррекции ошибок | > 90% |
| Латентность ответа AI (текст) | < 3 сек |
| Латентность ответа AI (голос) | < 5 сек |

---

## 10. Риски и митигация

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Миграция MySQL → PostgreSQL ломает существующий функционал | Средняя | Критическое | Drizzle ORM абстрагирует диалект; покрытие тестами до миграции; параллельная работа двух БД в переходный период |
| Высокая стоимость API (LLM + TTS + Embeddings) | Высокая | Высокое | Кэширование в Redis, лимиты на бесплатном плане, batching embeddings, стриминг ответов |
| Задержка голосовых ответов | Средняя | Среднее | Стриминг ElevenLabs TTS, показ текста до готовности аудио, предгенерация для типовых фраз |
| Некорректные ответы / коррекции AI | Средняя | Высокое | Специализированные промпты, фильтрация, A/B тестирование промптов, fallback на rule-based grammar check |
| Потеря контекста при длинных диалогах | Средняя | Среднее | pgvector семантический поиск, саммари сессий, sliding window последних сообщений |
| Рост размера векторной БД | Низкая | Среднее | IVFFlat индексы, периодическая архивация старых embeddings, HNSW при масштабировании |
| Привязанность пользователя к AI-персонажу | Низкая | Среднее | Напоминания о природе AI, рекомендации живого общения, контроль rapport level |

---

## 11. Монетизация

| Тариф | Цена | Включено |
|-------|------|----------|
| Free | 0 | 3 сессии/день (текст), базовый план, 50 слов в словаре |
| Standard | $9.99/мес | Безлимитные сессии, голосовой режим, расширенная память, SRS-словарь |
| Premium | $19.99/мес | Всё из Standard + выбор голоса ElevenLabs, rapport level 3, приоритетная скорость, детальная аналитика |

---

## 12. Приложение: Маппинг существующих файлов

### Backend — переиспользуемые файлы

| Файл | Что используется |
|------|-----------------|
| `src/app/controllers/http/message-controller.ts` | Базовый контроллер сообщений |
| `src/app/controllers/http/chat-list-controller.ts` | Управление контактами |
| `src/app/controllers/ws/ws-api-controller.ts` | WebSocket события |
| `src/app/services/message-service.ts` | Отправка, валидация, S3-загрузка |
| `src/app/services/broadcast-service.ts` | Real-time доставка |
| `src/app/services/ws-presence-service.ts` | Online-статус |
| `src/app/services/push-subscription-service.ts` | Push-уведомления |
| `src/app/repositories/message-repository.ts` | CRUD сообщений |
| `src/app/repositories/contact-list-repository.ts` | CRUD контактов |
| `src/app/routes/http-routes.ts` | Маршрутизация (расширяется) |
| `src/app/routes/ws-routes.ts` | WS-маршрутизация (расширяется) |
| `src/vendor/utils/storage/s3.ts` | Хранение аудио/медиа |
| `src/database/` | Подключение к БД (заменить mysql → pg) |

### Frontend — переиспользуемые файлы

| Файл | Что используется |
|------|-----------------|
| `src/components/ChatArea.vue` | Базовый шаблон чата |
| `src/components/MessageItem.vue` | Рендеринг сообщений |
| `src/components/ContactsList.vue` | Список контактов |
| `src/components/VoiceInput.vue` | Голосовой ввод |
| `src/components/AudioWaveform.vue` | Аудио-визуализация |
| `src/components/VideoCallModal.vue` | Видеозвонки (для pronunciation practice) |
| `src/stores/messages.ts` | Стейт сообщений |
| `src/stores/contacts.ts` | Стейт контактов |
| `src/stores/state.ts` | Push, dark mode, PWA |
| `src/utils/api.ts` | API-клиент (расширяется) |
| `src/utils/websocket-base.ts` | WebSocket-клиент |
| `src/composables/useBroadcastHandler.ts` | Обработка real-time событий |
| `src/router/index.ts` | Маршруты (расширяется) |
