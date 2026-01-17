# Настройка алиасов - Пошаговая инструкция

## Проблема
Алиасы не работают на странице видео. При вводе "Windows" система не находит тег "Windows (gt)".

## Как работают алиасы

### Структура
- **Канонический тег**: `Windows (gt)` - полное имя с типом
- **Алиас**: `Windows` - короткое имя БЕЗ типа
- **Нормализация**: `windows` - lowercase для поиска

### Индекс алиасов
```javascript
aliasIndex = {
  "windows (gt)": "windows (gt)",  // Канонический → сам себя
  "windows": "windows (gt)",        // Алиас → канонический
  "винда": "windows (gt)",          // Алиас → канонический
  "win": "windows (gt)"             // Алиас → канонический
}
```

## Правильная настройка алиасов

### Шаг 1: Откройте страницу тегов

Перейдите на `youvi_tags.html`

### Шаг 2: Найдите нужный тег

Найдите тег с типом, например: `Windows (gt)`

### Шаг 3: Откройте редактор алиасов

Нажмите на иконку **карандаша** (✏️) справа от тега

### Шаг 4: Добавьте алиасы БЕЗ типа

В поле "Enter alias name..." введите:
- `Windows` (без типа!)
- `Винда`
- `Win`

**❌ НЕ добавляйте:**
- `Windows (gt)` - это создаст дубликат
- `windows` - регистр не важен, будет нормализовано

**✅ Добавляйте:**
- `Windows` - короткое имя
- `Винда` - русский вариант
- `Win` - сокращение

### Шаг 5: Проверьте результат

```javascript
// В консоли (F12)
debugAliases.checkTag("Windows (gt)")
```

**Ожидаемый результат:**
```
✅ Tag found: { canonical: "Windows (gt)", aliases: ["Windows", "Винда", "Win"], ... }
Aliases: ["Windows", "Винда", "Win"]
```

## Тестирование алиасов

### Метод 1: Через консоль

```javascript
// Проверить разрешение алиаса
debugAliases.testResolve("Windows")
// Должно вернуть: "Windows (gt)"

debugAliases.testResolve("Винда")
// Должно вернуть: "Windows (gt)"

debugAliases.testResolve("Win")
// Должно вернуть: "Windows (gt)"
```

### Метод 2: Через тестовую страницу

1. Откройте `youvi/tags/test-alias-resolution.html`
2. Введите "Windows" в поле ввода
3. Нажмите "Test Resolve"
4. Проверьте лог

**Ожидаемый результат:**
```
Testing: "Windows"
  Normalized: "windows"
  ❌ No direct match
  Alias index points to: "windows (gt)"
  ✅ Resolved via alias: Windows (gt)
  ✅ getTag() result: Windows (gt)
  Aliases: ["Windows","Винда","Win"]
```

### Метод 3: На странице видео

1. Откройте видео
2. Нажмите "Edit Tags"
3. Введите: `Windows, Винда, Win`
4. Нажмите "Save"

**Ожидаемый результат:**
Все три варианта должны разрешиться в `Windows (gt)`

## Проверка индекса алиасов

```javascript
// Проверить весь индекс
debugAliases.checkIndex()

// Поиск конкретного алиаса
debugAliases.searchAlias("windows")
```

**Ожидаемый результат:**
```
Found 1 matches for "windows":
  windows → windows (gt)
```

## Частые ошибки

### Ошибка 1: Алиас с типом

❌ **Неправильно:**
```
Canonical: Windows (gt)
Alias: Windows (gt)
```

Это создаст дубликат тега!

✅ **Правильно:**
```
Canonical: Windows (gt)
Alias: Windows
```

### Ошибка 2: Регистр

Не важно! Система нормализует:
- `Windows` → `windows`
- `WINDOWS` → `windows`
- `WiNdOwS` → `windows`

Все варианты работают одинаково.

### Ошибка 3: Пробелы

Пробелы нормализуются:
- `Windows  8` → `windows 8`
- `Windows   8` → `windows 8`

Но лучше вводить без лишних пробелов.

## Массовое добавление алиасов

```javascript
// Добавить несколько алиасов сразу
await debugAliases.addAlias("Windows (gt)", "Windows")
await debugAliases.addAlias("Windows (gt)", "Винда")
await debugAliases.addAlias("Windows (gt)", "Win")

// Проверить
debugAliases.checkTag("Windows (gt)")
```

## Примеры правильных алиасов

### Операционные системы

```
Windows (gt) ← Windows, Винда, Win
Linux (gt) ← Linux, Линукс
MacOS (gt) ← MacOS, Mac, Мак
```

### Компании

```
Microsoft (gt) ← Microsoft, MS, Майкрософт
Apple (gt) ← Apple, Эппл
Google (gt) ← Google, Гугл
```

### Жанры

```
Комедия (ge) ← Комедия, Comedy
Драма (ge) ← Драма, Drama
Боевик (ge) ← Боевик, Action
```

### Персонажи

```
Naruto (ch) ← Naruto, Наруто, ナルト
Sasuke (ch) ← Sasuke, Саске, サスケ
```

## Отладка проблем

### Проблема: Алиас не работает

```javascript
// 1. Проверить, что тег существует
debugAliases.checkTag("Windows (gt)")

// 2. Проверить индекс
debugAliases.searchAlias("windows")

// 3. Проверить разрешение
debugAliases.testResolve("Windows")
```

### Проблема: Алиас создает новый тег

Это происходит, если алиас содержит тип:

```javascript
// Проверить
debugAliases.checkTag("Windows (gt)")
// Если aliases содержит "Windows (gt)", удалите его
```

### Проблема: База данных не загружена

```javascript
// Проверить статус
console.log('Loaded:', window.tagDatabaseManager?.isLoaded)

// Если false, подождите или перезагрузите страницу
```

## Автоматическое создание алиасов

Можно создать скрипт для массового добавления:

```javascript
const aliasMap = {
  "Windows (gt)": ["Windows", "Винда", "Win"],
  "Linux (gt)": ["Linux", "Линукс"],
  "MacOS (gt)": ["MacOS", "Mac", "Мак"]
}

for (const [tag, aliases] of Object.entries(aliasMap)) {
  for (const alias of aliases) {
    await debugAliases.addAlias(tag, alias)
    console.log(`✅ Added: ${tag} ← ${alias}`)
  }
}
```

## Проверка работы на странице видео

1. Откройте видео
2. Откройте консоль (F12)
3. Проверьте разрешение:

```javascript
// Тест разрешения при вводе
const input = ["Windows", "Винда", "Win"]
const resolved = input.map(tag => {
  const tagData = window.tagDatabaseManager.getTag(tag)
  return tagData ? tagData.canonical : tag
})
console.log('Resolved:', resolved)
// Должно быть: ["Windows (gt)", "Windows (gt)", "Windows (gt)"]
```

## Резюме

1. ✅ Алиасы добавляются БЕЗ типа
2. ✅ Канонический тег имеет тип
3. ✅ Регистр не важен
4. ✅ Система автоматически нормализует
5. ✅ Один тег может иметь много алиасов
6. ✅ Алиасы работают везде (поиск, ввод, автокомплит)
