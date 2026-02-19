# План подготовки функционала загрузки изображений в чат

## 1. Цель
- Добавить отправку изображений в чат с UX-потоком:
1. Выбор файла через кнопку-скрепку или Drag-and-Drop по всей области чата.
2. Локальный предпросмотр изображения в чате до отправки.
3. После нажатия `Отправить` файл загружается в S3.
4. В чат сохраняется сообщение типа `IMAGE` с `src` в БД `messages`. в базе сохраняется относительный (относительно префикса)путь к файлу в S3.

## 2. Текущее состояние (по коду)
- БД уже поддерживает `messages.type` и `messages.src` (enum `TEXT|IMAGE|VIDEO|AUDIO` + `src`).
- Shared-схема `SendMessageInput` уже содержит опциональные `type` и `src`:
  `packages/shared/src/schemas/message/send-message.ts`.
- На backend отправка чата пока текстовая (`type: 'TEXT'`) и без загрузки файла:
  `packages/backend/src/app/services/message-service.ts`.
- На frontend `messagesApi.sendMessage` отправляет только `content`:
  `packages/frontend/src/utils/api.ts`.
- В UI чата нет upload-кнопки, dropzone и рендера image-сообщений:
  `packages/frontend/src/components/ChatArea.vue`,
  `packages/frontend/src/components/MessageItem.vue`,
  `packages/frontend/src/stores/messages.ts`.

## 3. Целевой UX-поток
1. Пользователь нажимает скрепку или перетаскивает файл в область чата (весь `ChatArea` = dropzone).
2. Появляется pending-preview (миниатюра + статус `Готово к отправке` + кнопка удаления).
3. Кнопка `Отправить` становится активной, даже если текст пустой.
4. При отправке:
- файл уходит на backend (multipart/form-data),
- backend загружает в S3,
- backend создаёт message с `type='IMAGE'`, `src='<s3-key>'`, `content` (опц. подпись),
- frontend заменяет pending-preview на реальное сообщение.
5. Если ошибка загрузки: показываем статус ошибки и даём retry/удалить.

## 4. План работ

### Этап A. Контракты и API
1. Определить единый контракт отправки медиа:
-  расширить `POST /api/chat/send-chat-messages` поддержкой `multipart/form-data`.

2. Для image-сообщения зафиксировать поля:
- `type='IMAGE'`
- `src` обязателен
- `content` опционален (подпись; минимум 0 для IMAGE).
3. Обновить валидацию shared-схем и backend-валидаторов.

### Этап B. Backend (S3 + message)
1. Добавить обработку файла в message controller/service:
- `packages/backend/src/app/controllers/http/message-controller.ts`
- `packages/backend/src/app/services/message-service.ts`
2. Переиспользовать подход загрузки в S3 из notes:
- `packages/backend/src/app/services/notes-service.ts`
- `packages/backend/src/vendor/utils/storage/s3.ts`
3. Реализовать формирование безопасного ключа S3:
- уникальное имя (`uuid` + extension),
- префикс из `S3_DYNAMIC_DATA_PREFIX` (например `chat-images/` внутри dynamic-prefix).
4. Сохранять запись в `messages` через repository:
- `type='IMAGE'`
- `src=<s3 key>`
- `content` (подпись или пустая строка по согласованному контракту).
5. Обеспечить broadcast `new_message` с `type` и `src`.

### Этап C. Frontend UI/UX
1. Добавить кнопку-скрепку и скрытый `<input type="file" accept="image/*">`:
- `packages/frontend/src/components/ChatArea.vue`
2. Реализовать Dropzone на всю область чата:
- dragenter/dragover/dragleave/drop на корневом контейнере `ChatArea`,
- визуальный оверлей состояния `Drop image to upload`.
3. Добавить локальный preview до отправки:
- временный объект в UI (local `blob:` URL, имя, размер, статус),
- возможность удалить preview до отправки.
4. Обновить отправку:
- если есть preview, отправлять multipart через API,
- после успеха очищать preview.
5. Обновить рендер сообщения:
- для `type='IMAGE'` показывать `<img>` + fallback/плейсхолдер,
- для `TEXT` оставить текущее поведение.
- файл: `packages/frontend/src/components/MessageItem.vue`
6. Обновить модель сообщения в store:
- добавить `type`, `src`, возможно `uploadStatus`.
- файл: `packages/frontend/src/stores/messages.ts`

### Этап D. Frontend API слой
1. Расширить `messagesApi.sendMessage`:
- поддержка `FormData` для image-case,
- JSON оставить для text-case.
- файл: `packages/frontend/src/utils/api.ts`
2. Привести `Chat.vue` форматтер сообщений к `type/src`:
- `packages/frontend/src/views/Chat.vue`
3. Для отображения S3 URL переиспользовать логику построения URL (как в notes):
- `packages/frontend/src/stores/state.ts` (`getNotesPhotoUrl`) или вынести общий helper.

### Этап E. Валидация и ограничения
1. Разрешённые форматы: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
2. Ограничение размера файла (например 10 MB; утвердить).
3. Защита от не-image upload и пустого файла.
4. Ограничить количество файлов на отправку (на первом этапе: 1 файл).

### Этап F. Тесты
1. Backend unit/integration:
- успешная загрузка image + создание message,
- ошибки валидации (`415`, `413`, `400`),
- отказ при невалидной сессии (`401`).
2. Frontend unit:
- preview lifecycle (select/drop/remove/send/success/error),
- корректный рендер `TEXT` vs `IMAGE`.
3. E2E (Playwright):
- upload через скрепку,
- upload через drag-and-drop,
- сообщение отображается после перезагрузки чата.

### Этап G. Наблюдаемость и релиз
1. Логирование upload-событий (без чувствительных данных).
2. Метрики: успешные/неуспешные загрузки, среднее время upload.
3. Feature flag (опционально) для поэтапного включения.
4. Обновить README по env-переменным S3 и ограничениям upload.

## 5. Критерии готовности (Definition of Done)
1. В `ChatArea` есть скрепка и drag-and-drop по всей области.
2. Перед отправкой пользователь видит preview выбранного изображения.
3. По `Отправить` файл сохраняется в S3, в БД создаётся `messages` запись с `type='IMAGE'` и `src`.
4. Изображение корректно отображается в чате у отправителя и получателя (через broadcast и после reload истории).
5. Негативные кейсы (тип/размер/ошибки сети) обрабатываются с понятным UI-сообщением.
6. Добавлены и проходят релевантные unit/integration/e2e тесты.

## 6. Дополнительно
1. Один файл в рамках одного сообщения
2. подпись (text) к изображению не обязательна
3. Финальные лимиты размера и форматов файла 10 мб.
4. Нужна генерация thumbnail, ее необходимо делать на фронтенде с помощью canvas. В базе предусмотреть дополнительное поле `thumbnail` для хранения ссылки на миниатюру.
5. Требуется удаление файла и миниатюры из S3 при удалении сообщения
