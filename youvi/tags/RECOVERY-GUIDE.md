# Восстановление потерянных метаданных

## Проблема
Видео потеряло теги после обновления системы импликаций.

## Причина
Старые теги без типа (например, "windows 8") не были найдены в базе данных и могли быть потеряны при применении импликаций.

## Быстрое восстановление

### Шаг 1: Проверьте текущее состояние

```javascript
// Откройте консоль (F12) на странице видео
recoverMetadata.checkVideo("testing brtgt.mkv")
```

**Если теги пустые:**
```json
{
  "views": 100,
  "likes": 0,
  "dislikes": 0,
  "tags": [],  // ← Пусто!
  "created": 1699123456789,
  "description": ""
}
```

### Шаг 2: Восстановите теги вручную

```javascript
// Восстановите с правильными тегами (с типами!)
recoverMetadata.restoreMetadata("testing brtgt.mkv", [
  "Windows 8 (gt)",
  "Windows (gt)",
  "Microsoft (gt)",
  "ТНК (gt)",
  "Технологии (ct)",
  "ОС (gt)",
  "2013 (yr)",
  "Киев (gt)"
])
```

### Шаг 3: Проверьте результат

```javascript
recoverMetadata.checkVideo("testing brtgt.mkv")
```

Теги должны появиться!

## Массовое восстановление

### Найти все видео с пустыми тегами

```javascript
const empty = await recoverMetadata.findEmpty()
```

**Результат:**
```
Found 3 videos with empty tags:
  testing brtgt.mkv
  video2.mp4
  video3.mp4
```

### Восстановить каждое видео

```javascript
// Для каждого видео
recoverMetadata.restoreMetadata("video2.mp4", ["Tag1 (gt)", "Tag2 (ct)"])
recoverMetadata.restoreMetadata("video3.mp4", ["Tag3 (gt)"])
```

## Создание резервной копии

### Перед изменениями

```javascript
// Создать резервную копию
const backup = await recoverMetadata.backup("testing brtgt.mkv")
// Скопируйте вывод в текстовый файл
```

### Восстановление из резервной копии

```javascript
const backupJson = `{
  "views": 100,
  "likes": 0,
  "dislikes": 0,
  "tags": ["Windows 8 (gt)", "Киев (gt)"],
  "created": 1699123456789,
  "description": ""
}`

recoverMetadata.restoreFromBackup("testing brtgt.mkv", backupJson)
```

## Предотвращение потери данных

### Правило 1: Всегда используйте теги с типами

❌ **Неправильно:**
```
windows 8
microsoft
```

✅ **Правильно:**
```
Windows 8 (gt)
Microsoft (gt)
```

### Правило 2: Проверяйте теги после сохранения

```javascript
// После сохранения тегов
debugImplications.status()
recoverMetadata.checkVideo(window.currentVideoName)
```

### Правило 3: Создавайте резервные копии

```javascript
// Перед массовыми изменениями
const allMetadata = await recoverMetadata.listAll()
console.log('Backup:', JSON.stringify(allMetadata, null, 2))
// Сохраните в файл
```

## Исправление системы

Мы добавили защиту от потери данных:

1. ✅ **Проверка результата** - если импликации вернули меньше тегов, сохраняем оригинал
2. ✅ **Логирование** - все операции логируются в консоль
3. ✅ **Обработка ошибок** - при ошибке сохраняются оригинальные теги

## Проверка целостности

### Проверить все метаданные

```javascript
const all = await recoverMetadata.listAll()
console.log(`Total videos: ${all.length}`)

// Статистика
const withTags = all.filter(f => f.metadata.tags && f.metadata.tags.length > 0)
const withoutTags = all.filter(f => !f.metadata.tags || f.metadata.tags.length === 0)

console.log(`With tags: ${withTags.length}`)
console.log(`Without tags: ${withoutTags.length}`)
```

### Проверить конкретное видео

```javascript
// Детальная проверка
const metadata = await recoverMetadata.checkVideo("testing brtgt.mkv")
console.log('Tags:', metadata.tags)
console.log('Views:', metadata.views)
console.log('Created:', new Date(metadata.created))
```

## Автоматическое восстановление

Если у вас есть список видео с их тегами, можно восстановить автоматически:

```javascript
const videosToRestore = [
  { name: "testing brtgt.mkv", tags: ["Windows 8 (gt)", "Киев (gt)"] },
  { name: "video2.mp4", tags: ["Linux (gt)", "Ubuntu (gt)"] },
  { name: "video3.mp4", tags: ["MacOS (gt)", "Apple (gt)"] }
]

for (const video of videosToRestore) {
  await recoverMetadata.restoreMetadata(video.name, video.tags)
  console.log(`✅ Restored: ${video.name}`)
}
```

## Логи для диагностики

При потере данных проверьте консоль на наличие:

```
[TagImplication] ⚠️ Implication result invalid, keeping original tags
[TagAlias] ⚠️ Tags not found in database: ["windows 8"]
[TagImplicationResolver] Database not loaded, returning original tags
```

Эти сообщения указывают на проблемы.

## Контакты для поддержки

Если данные не восстанавливаются:
1. Сделайте скриншот консоли с ошибками
2. Выполните `recoverMetadata.listAll()` и сохраните результат
3. Опишите, какие действия привели к потере данных
