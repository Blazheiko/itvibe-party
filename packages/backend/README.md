# @cosmetology/backend

High-performance HTTP/WebSocket server built with uWebSockets.js, Drizzle ORM, and ArkType validation.

## Quick Start

```bash
# Install dependencies (from monorepo root)
pnpm install

# Build shared package first (required)
pnpm build:shared

# Start development server
pnpm dev:backend

# Or run directly from this package
pnpm dev
```

## Environment Variables

Create a `.env` file in this directory:

```env
# Application
NODE_ENV=local
APP_PORT=3000
APP_HOST=0.0.0.0

# MySQL Database
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DB_NAME=cosmetology

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_PREFIX=uwebsocket:

# Telegram Notifications
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

## Project Structure

```
src/
├── index.ts                 # Entry point
├── app/
│   ├── controllers/         # HTTP and WebSocket request handlers
│   │   ├── http/            # HTTP controllers
│   │   └── ws/              # WebSocket controllers
│   ├── routes/              # Route definitions
│   │   ├── http-routes.ts   # HTTP route configuration
│   │   └── ws-routes.ts     # WebSocket route configuration
│   ├── repositories/        # Database access layer (Drizzle ORM)
│   ├── servises/            # Business logic services
│   ├── middlewares/         # Middleware registry
│   ├── validate/            # Validation error handlers
│   ├── models/              # Data models
│   ├── events/              # Event handling
│   ├── start/               # Startup listeners
│   └── state/               # Application state management
├── config/                  # Configuration files
│   ├── app.ts               # Application settings
│   ├── database.ts          # MySQL configuration
│   ├── redis.ts             # Redis configuration
│   ├── cors.ts              # CORS policy
│   └── cookies.ts           # Cookie defaults
├── database/                # Database connections
│   ├── db.ts                # Drizzle ORM instance
│   └── redis.ts             # Redis client
├── drizzle/                 # Database schema and migrations
│   ├── schema/              # Table definitions
│   └── migrations/          # SQL migrations
├── vendor/                  # Core framework utilities
│   ├── start/               # Server initialization
│   ├── utils/               # Helpers (context, validation, routing)
│   ├── types/               # TypeScript type definitions
│   ├── constants/           # Constants (MIME types, etc.)
│   └── handlers/            # Request/response handlers
└── openapi/                 # OpenAPI specification
```

## Path Aliases

The backend uses TypeScript path aliases for cleaner imports:

```typescript
import { db } from '#database/db';
import { logger } from '#logger';
import { appConfig } from '#config/app';
import { MainController } from '#app/controllers/http/main-controller';
```

| Alias | Path |
|-------|------|
| `#app/*` | `src/app/*` |
| `#config/*` | `src/config/*` |
| `#vendor/*` | `src/vendor/*` |
| `#database/*` | `src/database/*` |
| `#drizzle/*` | `src/drizzle/*` |
| `#logger` | `src/vendor/utils/logger` |

## Available Scripts

```bash
# Development
pnpm dev              # Start with hot reload (tsx watch)
pnpm start            # Start production server

# Building
pnpm build            # Compile TypeScript

# Database
pnpm db:generate      # Generate migrations from schema changes
pnpm db:migrate       # Apply pending migrations
pnpm db:studio        # Open Drizzle Studio (interactive DB UI)
pnpm db:seed          # Seed database with initial data

# Code Quality
pnpm lint             # ESLint check
pnpm lint:fix         # ESLint with auto-fix
pnpm format           # Prettier format
pnpm typecheck        # TypeScript type checking

# Testing
pnpm test             # Run tests (Vitest)
pnpm test:watch       # Watch mode
```

## Working with Routes

### Defining HTTP Routes

Routes are defined in `src/app/routes/http-routes.ts` using the `defineRoute()` helper:

```typescript
import { defineRoute, defineRouteGroup } from '#vendor/utils/define-route';
import { MainController } from '#app/controllers/http/main-controller';
import { CreateContactAsInputSchema } from '@cosmetology/shared/schemas';

export const httpRoutes = defineRouteGroup({
    prefix: 'main',
    routes: [
        // Simple GET route
        defineRoute({
            method: 'get',
            path: '/ping',
            handler: MainController.ping,
        }),

        // POST route with validation
        defineRoute({
            method: 'post',
            path: '/contact',
            validator: CreateContactAsInputSchema,
            handler: MainController.newMessageFromContactForm,
        }),

        // Route with rate limiting
        defineRoute({
            method: 'post',
            path: '/submit',
            handler: MainController.submit,
            rateLimit: {
                maxRequests: 5,
                windowMs: 60000, // 1 minute
            },
        }),
    ],
});
```

### Defining WebSocket Routes

WebSocket routes are defined in `src/app/routes/ws-routes.ts`:

```typescript
import { defineWsRoute } from '#vendor/utils/define-route';
import { WsApiController } from '#app/controllers/ws/ws-api-controller';

export const wsRoutes = [
    defineWsRoute({
        event: 'event_typing',
        handler: WsApiController.ping,
    }),
];
```

## Working with Controllers

### HTTP Controller

Controllers are plain objects with handler methods:

```typescript
// src/app/controllers/http/main-controller.ts
import type { HttpController } from '#vendor/types/http';
import { getTypedPayload } from '#vendor/utils/context';
import type { CreateContactAsInput } from '@cosmetology/shared/schemas';

export const MainController = {
    // Simple handler
    ping: (() => {
        return { status: true };
    }) satisfies HttpController,

    // Handler with typed payload from validator
    newMessageFromContactForm: ((context) => {
        const payload = getTypedPayload<CreateContactAsInput>(context);

        // Access request data
        const { ip, userAgent, cookies, headers } = context.httpData;

        // Use logger
        context.log.info({ payload }, 'New contact form submission');

        // Return response
        return { success: true, data: payload };
    }) satisfies HttpController<CreateContactAsInput>,
};
```

### WebSocket Controller

```typescript
// src/app/controllers/ws/ws-api-controller.ts
import type { WsController } from '#vendor/types/ws';

export const WsApiController = {
    ping: ((context) => {
        return { status: true };
    }) satisfies WsController,
};
```

## Working with Database

### Repository Pattern

Repositories provide a clean interface for database operations:

```typescript
// src/app/repositories/contact-as-repository.ts
import { db } from '#database/db';
import { contactAs } from '#drizzle/schema/contact-as';
import { eq } from 'drizzle-orm';

export const ContactAsRepository = {
    create: async (data: NewContactAs) => {
        const [result] = await db.insert(contactAs).values(data);
        return result.insertId;
    },

    findById: async (id: number) => {
        return db.query.contactAs.findFirst({
            where: eq(contactAs.id, id),
        });
    },

    findAll: async (filters?: ContactFilters) => {
        return db.query.contactAs.findMany({
            where: filters?.name ? eq(contactAs.name, filters.name) : undefined,
            limit: filters?.limit ?? 100,
            offset: filters?.offset ?? 0,
        });
    },

    update: async (id: number, data: Partial<ContactAs>) => {
        await db.update(contactAs)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(contactAs.id, id));
    },

    deleteById: async (id: number) => {
        await db.delete(contactAs).where(eq(contactAs.id, id));
    },
};
```

### Schema Definition

Define database schemas in `src/drizzle/schema/`:

```typescript
// src/drizzle/schema/contact-as.ts
import { mysqlTable, bigint, varchar, text, datetime } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const contactAs = mysqlTable('contact_as', {
    id: bigint('id', { mode: 'number', unsigned: true })
        .autoincrement()
        .primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    message: text('message').notNull(),
    createdAt: datetime('created_at')
        .notNull()
        .default(sql`now()`),
    updatedAt: datetime('updated_at')
        .notNull()
        .default(sql`now()`)
        .$onUpdate(() => new Date()),
});
```

### Database Migrations

```bash
# After modifying schema files
pnpm db:generate    # Creates migration SQL in drizzle/migrations/

# Apply migrations
pnpm db:migrate     # Runs pending migrations

# Interactive database UI
pnpm db:studio      # Opens Drizzle Studio at http://localhost:4983
```

## Validation with ArkType

Schemas are defined in `@cosmetology/shared` and used for request validation:

```typescript
// In @cosmetology/shared/src/schemas/contact.ts
import { type } from 'arktype';

export const CreateContactAsInputSchema = type({
    name: 'string>0',
    phone: 'string>0',
    message: 'string>0',
});

export type CreateContactAsInput = typeof CreateContactAsInputSchema.infer;
```

Validation happens automatically when a route has a `validator`:

```typescript
defineRoute({
    method: 'post',
    path: '/contact',
    validator: CreateContactAsInputSchema, // Validates request body
    handler: MainController.newMessageFromContactForm,
});
```

Validation errors return HTTP 422 with error details.

## Middleware

### Registering Middleware

Middleware is registered in `src/app/middlewares/kernel.ts`:

```typescript
import type { MiddlewareRegistry } from '#vendor/types/middleware';
import { sessionApiMiddleware } from './session-api';

export const middlewareRegistry: MiddlewareRegistry = {
    session_api: sessionApiMiddleware,
};
```

### Creating Middleware

```typescript
// src/app/middlewares/auth.ts
import type { Middleware } from '#vendor/types/middleware';

export const authMiddleware: Middleware = async (context, next) => {
    const token = context.httpData.headers['authorization'];

    if (!token) {
        throw new Error('Unauthorized');
    }

    // Attach user to context
    context.user = await validateToken(token);

    // Continue to next middleware or handler
    return next();
};
```

### Using Middleware in Routes

```typescript
defineRouteGroup({
    prefix: 'admin',
    middlewares: ['auth'], // Applied to all routes in group
    routes: [
        defineRoute({
            method: 'get',
            path: '/dashboard',
            handler: AdminController.dashboard,
        }),
    ],
});
```

## Logging

The backend uses Pino for structured logging:

```typescript
import { logger } from '#logger';

// In controllers, use context.log
context.log.info({ userId: 123 }, 'User logged in');
context.log.error({ err }, 'Failed to process request');
context.log.debug({ data }, 'Processing data');

// Standalone logging
logger.info('Server started');
```

## Services

Business logic is encapsulated in services:

```typescript
// src/app/servises/telegram/send-message.ts
import { appConfig } from '#config/app';

export const sendTelegramMessage = async (message: string): Promise<boolean> => {
    const { telegramBotToken, telegramChatId } = appConfig;

    if (!telegramBotToken || !telegramChatId) {
        return false;
    }

    const response = await fetch(
        `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: telegramChatId,
                text: message,
                parse_mode: 'HTML',
            }),
        }
    );

    return response.ok;
};
```

## WebSocket Features

### Connection Handling

WebSocket connections are managed automatically:

- **URL**: `/api/websocket/:token`
- **Idle timeout**: 120 seconds
- **Max payload**: 1MB

### Broadcasting

```typescript
import { broadcastToAll, broadcastToUser } from '#vendor/utils/ws-storage';

// Send to all connected clients
broadcastToAll({ type: 'notification', data: 'Hello everyone!' });

// Send to specific user by token
broadcastToUser(token, { type: 'private', data: 'Hello you!' });
```

## Error Handling

The server handles errors automatically:

| Error Type | HTTP Status | Description |
|------------|-------------|-------------|
| `ValidationError` | 422 | Request body validation failed |
| `ParameterValidationError` | 400 | URL parameter validation failed |
| Other errors | 500 | Internal server error |

In production, error details are masked for security.

## Static File Serving

The backend serves static files from the `public/` directory. Frontend build output is automatically copied there during `pnpm build`.

To disable static serving, set `serveStatic: false` in `src/config/app.ts`.

## Tech Stack

- **Server**: uWebSockets.js v20.56.0
- **Database**: Drizzle ORM with MySQL
- **Cache**: Redis (ioredis)
- **Validation**: ArkType
- **Logging**: Pino
- **Pattern Matching**: ts-pattern
- **Testing**: Vitest
