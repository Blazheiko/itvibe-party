# WebSocket Connection Composable

## Описание

`useWebSocketConnection` - это singleton composable для управления WebSocket соединением в приложении. Он использует встроенную модульную систему JavaScript для обеспечения единственного экземпляра соединения во всем приложении.

## Основные особенности

### Singleton через модульную систему JS

Composable использует естественное поведение модульной системы JavaScript/TypeScript:

- **Код модуля выполняется только один раз** при первом импорте
- Все переменные и функции на уровне модуля создаются один раз
- Последующие импорты получают доступ к уже созданным объектам
- Это более простой и естественный подход, чем ручная реализация singleton паттерна
- Не требует дополнительных проверок и условий

### Автоматическая обработка событий

Composable автоматически обрабатывает:

- **Broadcast события** - через интегрированный `useBroadcastHandler`
- **Service события** - системные события (ping/pong, connection_established, connection_closed)
- **API ответы** - асинхронные запросы через WebSocket
- **Ошибки** - включая реавторизацию при истечении токена

## Использование

### Базовое использование

```typescript
import { useWebSocketConnection } from '@/composables/useWebSocketConnection'

const { websocketOpen, websocketClose, isConnected } = useWebSocketConnection()

// Открыть соединение
websocketOpen('wss://example.com/ws')

// Проверить статус
console.log(isConnected.value) // true/false

// Закрыть соединение
websocketClose()
```

### С callbacks

```typescript
const { websocketOpen, sendMessage } = useWebSocketConnection({
    onReauthorize: async () => {
        console.log('Token expired, need to reauthorize')
        // Логика реавторизации
    },
    onConnectionClosed: () => {
        console.log('Connection closed')
        // Логика при закрытии соединения
    },
    onBroadcast: (message) => {
        console.log('Broadcast message received:', message)
        // Дополнительная обработка broadcast событий
    },
})
```

### Отправка сообщений

```typescript
const { sendMessage } = useWebSocketConnection()

// Отправить обычное сообщение
sendMessage({
    event: 'chat/send_message',
    timestamp: Date.now(),
    payload: {
        message: 'Hello!',
        chatId: 123,
    },
})
```

### API запросы через WebSocket

```typescript
const { websocketApi } = useWebSocketConnection()

try {
    const response = await websocketApi('main/get_user_info', {
        userId: 123,
    })
    console.log('User info:', response.payload)
} catch (error) {
    console.error('API error:', error)
}
```

## API

### Возвращаемые свойства

#### Состояние соединения

- `status` - текущий статус WebSocket ('CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED')
- `isConnected` - computed свойство, true когда соединение открыто
- `isConnecting` - computed свойство, true во время подключения
- `isDisconnected` - computed свойство, true когда соединение закрыто
- `isInitialized` - ref, true после успешной инициализации
- `ws` - сырой WebSocket объект (для продвинутого использования)

#### Методы

- `websocketOpen(url: string)` - открыть WebSocket соединение
- `websocketClose()` - закрыть WebSocket соединение
- `sendMessage(data: SendPayload)` - отправить сообщение через WebSocket
- `websocketApi(route: string, payload?: object)` - выполнить API запрос через WebSocket

### Callbacks интерфейс

```typescript
interface WebsocketCallbacks {
    onReauthorize?: () => Promise<void>
    onBroadcast?: (message: WebsocketMessage) => void
    onConnectionClosed?: () => void
}
```

### SendPayload интерфейс

```typescript
interface SendPayload {
    event: string
    timestamp: number
    payload: Record<string, unknown>
}
```

## Дополнительные функции

### resetWebSocketConnection()

Сбрасывает состояние WebSocket соединения. Полезно для тестирования или полного перезапуска соединения.

```typescript
import { resetWebSocketConnection } from '@/composables/useWebSocketConnection'

// Закрыть соединение и очистить состояние
resetWebSocketConnection()

// После сброса можно открыть новое соединение
const { websocketOpen } = useWebSocketConnection()
websocketOpen('wss://new-server.com/ws')
```

**Что делает `resetWebSocketConnection()`:**

- Закрывает текущее WebSocket соединение
- Очищает URL соединения
- Сбрасывает флаг инициализации
- Очищает все callbacks
- Отменяет все pending API запросы

## Интеграция с broadcast handler

Composable автоматически интегрирован с `useBroadcastHandler`, который обрабатывает следующие события:

- `user_online` - изменение онлайн статуса пользователя
- `new_message` - новое сообщение в чате
- `event_typing` - пользователь печатает
- `change_online` - изменение статуса контакта
- `accept_call` / `decline_call` - события звонков
- `webrtc_call_offer` / `webrtc_call_answer` / `webrtc_ice_candidate` / `webrtc_call_end` - WebRTC события

## Автоматическое переподключение

Composable настроен на автоматическое переподключение:

- Максимум 500 попыток
- Задержка между попытками: 5 секунд
- Heartbeat (ping/pong) каждые 10 секунд

## Примеры использования в компонентах

### В App.vue

```typescript
const { websocketClose, websocketOpen } = useWebSocketConnection({
    onReauthorize: async () => {
        websocketClose()
        userStore.clearUser()
        router.push('/')
    },
    onConnectionClosed: () => {
        console.log('Connection closed')
        destroyWebsocketBase()
    },
})

// При инициализации приложения
websocketOpen(wsUrl)
```

### В любом другом компоненте

```typescript
// Просто получаем тот же инстанс
const { isConnected, sendMessage } = useWebSocketConnection()

// Можно сразу использовать
if (isConnected.value) {
    sendMessage({
        event: 'chat/typing',
        timestamp: Date.now(),
        payload: { chatId: 123 },
    })
}
```

## Тестирование

Для тестирования используйте функцию `resetWebSocketConnection()`:

```typescript
import { describe, it, beforeEach } from 'vitest'
import {
    useWebSocketConnection,
    resetWebSocketConnection,
} from '@/composables/useWebSocketConnection'

describe('My Component', () => {
    beforeEach(() => {
        resetWebSocketConnection()
    })

    it('should work with WebSocket', () => {
        const { websocketOpen } = useWebSocketConnection()
        // Ваши тесты
    })
})
```

## Важные замечания

1. **Модульный Singleton**: Использует встроенные возможности JS модулей - код выполняется один раз при первом импорте
2. **Callbacks**: Callbacks обновляются при каждом вызове composable с новыми параметрами
3. **Реактивность**: Все состояния реактивны (Vue refs/computed) и обновляются автоматически
4. **Общее состояние**: Все компоненты работают с одним и тем же WebSocket соединением
5. **Очередь сообщений**: Если соединение не открыто, сообщения не отправляются (можно добавить очередь)
6. **Timeout**: API запросы имеют таймаут 10 секунд
7. **Hot Module Replacement**: При HMR в dev режиме состояние может сброситься

## Почему модульный подход лучше?

### Традиционный Singleton паттерн

```typescript
// ❌ Избыточный код
let instance: WebSocketInstance | null = null

export const useWebSocket = () => {
    if (!instance) {
        instance = createInstance()
    }
    return instance
}
```

**Проблемы:**

- Дополнительная переменная для хранения инстанса
- Проверка на каждом вызове
- Дополнительная функция-фабрика
- Больше кода для поддержки

### Модульный подход (текущая реализация)

```typescript
// ✅ Чистый и простой код
const wsUrl = ref('')
const status = ref('CLOSED')
// ... весь код на уровне модуля

export const useWebSocket = (callbacks) => {
    // Просто обновляем callbacks и возвращаем состояние
    currentCallbacks = callbacks
    return { wsUrl, status, ... }
}
```

**Преимущества:**

- ✨ **Меньше кода** - нет лишних проверок и условий
- 🚀 **Быстрее** - нет проверки `if (!instance)` на каждом вызове
- 📖 **Читаемее** - код линейный, без вложенности
- 🎯 **Естественнее** - используем встроенные возможности JS
- 🔧 **Проще поддерживать** - меньше абстракций
- 🧪 **Легче тестировать** - прямой доступ к состоянию

### Как это работает?

1. **Первый импорт модуля:**

    ```typescript
    // App.vue
    import { useWebSocketConnection } from '@/composables/useWebSocketConnection'
    // ⬆️ Весь код модуля выполняется: создаются refs, функции, WebSocket
    ```

2. **Последующие импорты:**

    ```typescript
    // ChatComponent.vue
    import { useWebSocketConnection } from '@/composables/useWebSocketConnection'
    // ⬆️ Модуль уже загружен, возвращается кешированная версия
    ```

3. **Все компоненты работают с одним состоянием:**

    ```typescript
    // В App.vue
    const { websocketOpen } = useWebSocketConnection()
    websocketOpen('wss://server.com')

    // В ChatComponent.vue
    const { isConnected } = useWebSocketConnection()
    console.log(isConnected.value) // true - то же самое соединение!
    ```

## Связанные файлы

- `src/composables/useBroadcastHandler.ts` - обработчик broadcast событий
- `src/utils/websocket-base.ts` - базовые типы и интерфейсы
- `src/utils/base-api.ts` - API утилиты
