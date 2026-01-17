# Тестирование Broadcast системы для импликаций

## Проблема
Изменения импликаций на странице `youvi_tags.html` не отражаются на странице `youvi_video.html` в реальном времени.

## Решение
Используется система `BroadcastChannel` для межвкладочной коммуникации.

## Как протестировать

### Метод 1: Тестовая страница

1. Откройте файл `youvi/tags/test-broadcast-implications.html` в браузере
2. Откройте эту же страницу во второй вкладке
3. В первой вкладке нажмите "Send Implication Added"
4. Во второй вкладке должно появиться сообщение о получении события

**Ожидаемый результат:**
```
[12:34:56] 📡 RECEIVED: tag_implication_added - {"tagName":"Windows 8 (gt)","implications":["Windows (gt)"]}
```

### Метод 2: Реальное использование

1. **Откройте две вкладки:**
   - Вкладка 1: `youvi_tags.html` (страница тегов)
   - Вкладка 2: `youvi_video.html?name=video.mp4` (страница видео с тегом "Windows 8 (gt)")

2. **В консоли вкладки 2 (видео) выполните:**
   ```javascript
   debugImplications.status()
   ```
   Убедитесь, что система готова.

3. **Во вкладке 1 (теги):**
   - Найдите тег "Windows 8 (gt)"
   - Нажмите на иконку стрелки (→)
   - Добавьте импликацию "Windows (gt)"

4. **Во вкладке 2 (видео) проверьте консоль:**
   Должны появиться сообщения:
   ```
   [TagImplication] 📡 Received broadcast event: { type: 'tag_implication_added', ... }
   [TagImplication] 📡 Implication added in another tab: Windows 8 (gt) ["Windows (gt)"]
   [TagImplication] Implication updated for: Windows 8 (gt) ["Windows (gt)"]
   ```

5. **Проверьте теги видео:**
   - Если видео имеет тег "Windows 8 (gt)", то автоматически должен добавиться "Windows (gt)"
   - Обновите отображение тегов на странице

### Метод 3: Проверка через консоль

**Вкладка 1 (отправитель):**
```javascript
// Отправить событие добавления импликации
window.tagBroadcastSync.broadcast('tag_implication_added', {
  tagName: 'Windows 8 (gt)',
  implications: ['Windows (gt)']
});
```

**Вкладка 2 (получатель):**
```javascript
// Слушать события
window.tagBroadcastSync.addEventListener((event) => {
  console.log('Received:', event);
});
```

## Отладка

### Проверка инициализации

```javascript
// Проверить статус broadcast системы
console.log('Initialized:', window.tagBroadcastSync?.isInitialized);
console.log('Has channel:', !!window.tagBroadcastSync?.channel);
console.log('Listeners:', window.tagBroadcastSync?.listeners.size);
```

**Ожидаемый результат:**
```
Initialized: true
Has channel: true
Listeners: 1 (или больше)
```

### Проверка отправки

```javascript
// Включить debug режим
window.tagBroadcastSync.debug = true;

// Отправить тестовое сообщение
window.tagBroadcastSync.broadcast('test', { message: 'Hello' });
```

**Ожидаемый вывод в консоли:**
```
[TagBroadcast] Sent via BroadcastChannel: test
```

### Проверка получения

Откройте консоль во второй вкладке и выполните:

```javascript
// Включить debug режим
window.tagBroadcastSync.debug = true;

// Добавить слушатель
window.tagBroadcastSync.addEventListener((event) => {
  console.log('📡 Event received:', event);
});
```

Затем отправьте событие из первой вкладки.

## Частые проблемы

### Проблема 1: BroadcastChannel не поддерживается

**Симптомы:**
```javascript
console.log('BroadcastChannel' in window); // false
```

**Решение:**
Система автоматически переключится на localStorage fallback. Проверьте:
```javascript
console.log(window.tagBroadcastSync.channel); // null
console.log(window.tagBroadcastSync.isInitialized); // true
```

### Проблема 2: События не получаются

**Симптомы:**
- Отправка работает
- Получение не работает

**Решение:**
1. Проверьте, что слушатель зарегистрирован:
   ```javascript
   console.log(window.tagBroadcastSync.listeners.size); // должно быть > 0
   ```

2. Проверьте, что вкладки открыты в одном домене (не file://)

3. Перезагрузите обе вкладки

### Проблема 3: Слишком много событий

**Симптомы:**
- События дублируются
- Консоль переполнена сообщениями

**Решение:**
Система имеет встроенный throttling. Проверьте настройки:
```javascript
console.log(window.tagBroadcastSync.throttleDelay); // 50ms
console.log(window.tagBroadcastSync.batchSize); // 10
```

### Проблема 4: События приходят, но теги не обновляются

**Симптомы:**
```
[TagImplication] 📡 Received broadcast event: ...
```
Но теги видео не изменяются.

**Решение:**
1. Проверьте, что Tag Database загружена:
   ```javascript
   debugImplications.status()
   ```

2. Проверьте, что видео имеет нужный тег:
   ```javascript
   console.log(window.currentVideo?.tags);
   ```

3. Проверьте обработчик события:
   ```javascript
   // Должен быть зарегистрирован
   document.addEventListener('tagImplicationUpdated', (e) => {
     console.log('Handler called:', e.detail);
   });
   ```

## Логи для успешной работы

### При добавлении импликации (youvi_tags.html):

```
[TagImplicationManager] ✅ Added implication: Windows (gt) to Windows 8 (gt)
[TagImplicationManager] 📡 Broadcasted implication update to other tabs
[TagBroadcast] Sent via BroadcastChannel: tag_implication_added
```

### При получении события (youvi_video.html):

```
[TagImplication] 📡 Received broadcast event: { type: 'tag_implication_added', data: {...} }
[TagImplication] 📡 Implication added in another tab: Windows 8 (gt) ["Windows (gt)"]
[TagImplication] Implication updated for: Windows 8 (gt) ["Windows (gt)"]
[TagImplication] Current video has this tag, applying implications...
[TagImplication] ✅ Auto-added 1 implied tags to current video
[TagImplication] ✅ Video metadata updated with new implications
```

## Проверка файла метаданных

После автоматического обновления проверьте файл `.metadata/[video].meta.json`:

**До:**
```json
{
  "tags": ["Windows 8 (gt)"]
}
```

**После:**
```json
{
  "tags": ["Windows 8 (gt)", "Windows (gt)"]
}
```

## Дополнительные команды

### Очистить все слушатели
```javascript
window.tagBroadcastSync.listeners.clear();
```

### Переинициализировать систему
```javascript
window.tagBroadcastSync.init();
```

### Проверить последнее сообщение
```javascript
// В localStorage fallback режиме
console.log(localStorage.getItem('youvi_tag_sync_message'));
```

## Поддержка браузеров

- ✅ Chrome/Edge: BroadcastChannel
- ✅ Firefox: BroadcastChannel
- ✅ Safari: localStorage fallback
- ✅ Opera: BroadcastChannel

## Производительность

- Throttling: 50ms между сообщениями
- Batch size: до 10 событий в пакете
- Автоматическая очистка старых сообщений

## Безопасность

- События работают только в пределах одного origin
- Нет доступа к событиям из других доменов
- Автоматическая фильтрация событий от своей вкладки
