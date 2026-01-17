# Отладка системы Tag Implications

## Проблема: Импликации не применяются

### Шаг 1: Откройте консоль браузера (F12)

### Шаг 2: Проверьте статус системы

```javascript
debugImplications.status()
```

**Ожидаемый результат:**
```
Tag Implication System Status:
  tagDatabaseManager: true
  Database loaded: true
  tagImplicationResolver: true
  Resolver cache valid: true
  applyTagImplications: true
  hasTagImplications: true
  Statistics: { totalTags: 150, ... }
  Tags with implications: 5 / 150
```

**Если что-то false:**
- `Database loaded: false` → База данных не загружена, подождите или перезагрузите страницу
- `tagImplicationResolver: false` → Скрипт не загружен, проверьте подключение
- `applyTagImplications: false` → Функция не инициализирована

### Шаг 3: Проверьте конкретный тег

```javascript
debugImplications.checkTag("Windows 8 (gt)")
```

**Ожидаемый результат:**
```
✅ Tag found: { canonical: "Windows 8 (gt)", implies: ["Windows (gt)"], ... }
Direct implications: ["Windows (gt)"]
All implied tags (transitive): ["Windows (gt)", "Microsoft (gt)", "Корп (gt)"]
  Windows 8 (gt) → Windows (gt): Windows 8 (gt) → Windows (gt)
  Windows 8 (gt) → Microsoft (gt): Windows 8 (gt) → Windows (gt) → Microsoft (gt)
  Windows 8 (gt) → Корп (gt): Windows 8 (gt) → Windows (gt) → Microsoft (gt) → Корп (gt)
```

**Если тег не найден:**
```
❌ Tag not found: Windows 8 (gt)
```
→ Тег не существует в базе данных, создайте его сначала

**Если нет импликаций:**
```
Direct implications: []
All implied tags (transitive): []
```
→ Импликации не настроены, добавьте их через UI

### Шаг 4: Проверьте список всех импликаций

```javascript
debugImplications.listAll()
```

**Ожидаемый результат:**
```
Found 4 tags with implications:
  Windows 8 (gt) → ["Windows (gt)"]
  Windows (gt) → ["Microsoft (gt)"]
  Microsoft (gt) → ["Корп (gt)"]
  Linux (gt) → ["OS (gt)"]
```

### Шаг 5: Тестируйте применение импликаций

```javascript
debugImplications.testApply(["Windows 8 (gt)"])
```

**Ожидаемый результат:**
```
Testing implications for tags: ["Windows 8 (gt)"]
[TagImplication] applyTagImplications called with: ["Windows 8 (gt)"]
[TagImplicationResolver] applyImplications called with: ["Windows 8 (gt)"]
[TagImplicationResolver] Processing tag: Windows 8 (gt)
[TagImplicationResolver] Implied tags for Windows 8 (gt): ["Windows (gt)", "Microsoft (gt)", "Корп (gt)"]
[TagImplicationResolver] Adding implied tag: Windows (gt)
[TagImplicationResolver] Adding implied tag: Microsoft (gt)
[TagImplicationResolver] Adding implied tag: Корп (gt)
[TagImplicationResolver] Final result: ["Windows 8 (gt)", "Windows (gt)", "Microsoft (gt)", "Корп (gt)"]
Result: ["Windows 8 (gt)", "Windows (gt)", "Microsoft (gt)", "Корп (gt)"]
Added tags: ["Windows (gt)", "Microsoft (gt)", "Корп (gt)"]
```

### Шаг 6: Визуализируйте граф импликаций

```javascript
debugImplications.showGraph("Windows 8 (gt)")
```

**Ожидаемый результат:**
```
Implication graph for: Windows 8 (gt)
Direct implications: ["Windows (gt)"]
Transitive implications: ["Microsoft (gt)", "Корп (gt)"]

Implication tree:
Windows 8 (gt)
  ├─ Windows (gt)
  │  ├─ Microsoft (gt)
  │  │  └─ Корп (gt)
```

## Частые проблемы и решения

### Проблема 1: База данных не загружена

**Симптомы:**
```javascript
debugImplications.status()
// Database loaded: false
```

**Решение:**
1. Подождите несколько секунд (база загружается асинхронно)
2. Проверьте консоль на ошибки загрузки
3. Перезагрузите страницу
4. Проверьте, что директория видео выбрана

### Проблема 2: Импликации не настроены

**Симптомы:**
```javascript
debugImplications.checkTag("Windows 8 (gt)")
// Direct implications: []
```

**Решение:**
1. Откройте страницу тегов (`youvi_tags.html`)
2. Найдите тег "Windows 8 (gt)"
3. Нажмите на иконку стрелки (→)
4. Добавьте импликацию "Windows (gt)"
5. Вернитесь на страницу видео и проверьте снова

### Проблема 3: Теги не добавляются автоматически

**Симптомы:**
- Импликации настроены
- `debugImplications.testApply()` работает
- Но при сохранении тегов видео импликации не применяются

**Решение:**
1. Проверьте консоль при сохранении тегов
2. Должны быть сообщения:
   ```
   [TagImplication] Checking implication system...
   [TagImplication] Applied implications: { original: [...], expanded: [...] }
   ```
3. Если сообщений нет → функция не вызывается, проверьте код
4. Если есть ошибки → смотрите текст ошибки

### Проблема 4: Циклические зависимости

**Симптомы:**
```javascript
debugImplications.addImplication("A", "B")
debugImplications.addImplication("B", "C")
debugImplications.addImplication("C", "A")
// ❌ Would create a cycle!
```

**Решение:**
Это нормальное поведение! Система защищает от циклов. Пересмотрите структуру импликаций.

### Проблема 5: Тег не найден

**Симптомы:**
```javascript
debugImplications.checkTag("Windows 8")
// ❌ Tag not found: Windows 8
```

**Решение:**
1. Проверьте точное написание тега (с суффиксом типа)
2. Правильно: `"Windows 8 (gt)"`
3. Неправильно: `"Windows 8"`, `"windows 8 (gt)"` (регистр важен для отображения)

## Добавление импликаций через консоль (для тестирования)

```javascript
// Добавить импликацию
await debugImplications.addImplication("Windows 8 (gt)", "Windows (gt)")
await debugImplications.addImplication("Windows (gt)", "Microsoft (gt)")
await debugImplications.addImplication("Microsoft (gt)", "Корп (gt)")

// Проверить результат
debugImplications.showGraph("Windows 8 (gt)")

// Протестировать
debugImplications.testApply(["Windows 8 (gt)"])
```

## Логирование

При сохранении тегов в консоли должны появиться следующие сообщения:

```
[TagImplication] Checking implication system... { hasApplyFunction: true, ... }
[TagImplication] applyTagImplications called with: ["Windows 8 (gt)"]
[TagImplicationResolver] applyImplications called with: ["Windows 8 (gt)"]
[TagImplicationResolver] Processing tag: Windows 8 (gt)
[TagImplicationResolver] Implied tags for Windows 8 (gt): ["Windows (gt)", "Microsoft (gt)", "Корп (gt)"]
[TagImplicationResolver] Adding implied tag: Windows (gt)
[TagImplicationResolver] Adding implied tag: Microsoft (gt)
[TagImplicationResolver] Adding implied tag: Корп (gt)
[TagImplicationResolver] Final result: ["Windows 8 (gt)", "Windows (gt)", "Microsoft (gt)", "Корп (gt)"]
[TagImplication] Applied implications: { original: [...], expanded: [...], added: 3 }
[TagImplication] ✅ Auto-applied 3 implied tags
```

Если этих сообщений нет → система не работает, проверьте инициализацию.

## Проверка метаданных

После сохранения тегов проверьте файл метаданных:

1. Откройте директорию видео
2. Перейдите в `.metadata`
3. Найдите файл `[имя_видео].meta.json`
4. Откройте в текстовом редакторе
5. Проверьте поле `tags`:

```json
{
  "views": 100,
  "likes": 0,
  "dislikes": 0,
  "tags": [
    "Windows 8 (gt)",
    "Windows (gt)",
    "Microsoft (gt)",
    "Корп (gt)"
  ],
  "created": 1699123456789,
  "description": ""
}
```

Если в `tags` только один тег → импликации не применились, проверьте консоль.

## Контакты для поддержки

Если проблема не решается:
1. Сделайте скриншот консоли с ошибками
2. Выполните `debugImplications.status()` и скопируйте результат
3. Опишите шаги для воспроизведения проблемы
