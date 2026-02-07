FROM ubuntu:24.04 AS builder
WORKDIR /app

# Устанавливаем Node.js 22 и необходимые инструменты
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Включаем corepack для использования pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Копируем файлы для установки зависимостей
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/shared/package.json ./packages/shared/
COPY packages/frontend/package.json ./packages/frontend/

# Устанавливаем зависимости
RUN pnpm install --frozen-lockfile

# Копируем весь проект
COPY . .

# Сборка проекта
RUN pnpm build


# --- Этап 2: продакшн ---
FROM ubuntu:24.04 AS production
WORKDIR /app

# Устанавливаем Node.js 22 и необходимые инструменты
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Включаем corepack для использования pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Копируем файлы для установки зависимостей
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/shared/package.json ./packages/shared/
COPY packages/frontend/package.json ./packages/frontend/

# Нужны dev-зависимости, чтобы выполнять миграции drizzle
# Устанавливаем все зависимости включая devDependencies для drizzle-kit
RUN pnpm install --frozen-lockfile --prod=false

ENV NODE_ENV=production

# Копируем собранный код
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Копируем папки public и public-test (нужны для static-server)
COPY --from=builder /app/packages/backend/public ./packages/backend/public
COPY --from=builder /app/packages/backend/public-test ./packages/backend/public-test

# Копируем конфигурационные файлы для drizzle-kit
COPY --from=builder /app/packages/backend/drizzle.config.js ./packages/backend/drizzle.config.js
# Копируем миграции drizzle
COPY --from=builder /app/packages/backend/src/drizzle/migrations ./packages/backend/src/drizzle/migrations

# Открываем порт 3000
EXPOSE 3000

# Запускаем миграции и приложение
# Используем команду start из backend/package.json
WORKDIR /app/packages/backend
CMD ["sh", "-c", "pnpm db:migrate && pnpm start"]
