# Tag Implications System

## Описание

Система Tag Implications автоматически добавляет связанные теги на основе заданных правил импликации. Например, если видео помечено тегом `windows_7`, система автоматически добавит теги `windows`, `os`, `microsoft` (если настроены соответствующие импликации).

## Основные возможности

### 1. Транзитивное замыкание (Transitive Closure)

Система автоматически вычисляет полное транзитивное замыкание через рекурсивный обход графа импликаций:

```
windows_7 → windows → os, microsoft
```

Результат: `windows_7` получит все три тега: `windows`, `os`, `microsoft`

### 2. Защита от циклов

Система предотвращает создание циклических зависимостей:

```
A → B → C → A  ❌ (цикл не будет создан)
```

### 3. Автоматическое применение к видео

При добавлении или изменении правила импликации система автоматически пересчитывает теги для всех затронутых видео.

## Архитектура

### Компоненты

1. **tag-implication-resolver.js** - Ядро системы
   - Вычисление транзитивного замыкания
   - Обнаружение циклов
   - Кэширование результатов
   - Применение импликаций к тегам

2. **tag-implication-manager.js** - UI для управления
   - Модальное окно редактирования
   - Добавление/удаление импликаций
   - Отображение прямых и транзитивных импликаций
   - Валидация и предотвращение циклов

3. **tag-implication-manager.css** - Стили UI

### Структура данных

Импликации хранятся в поле `implies` каждого тега в базе данных:

```json
{
  "canonical": "windows_7 (os)",
  "type": "os",
  "aliases": ["Виндовс 7", "Win7"],
  "implies": ["windows (os)"],
  "usageCount": 42,
  "createdAt": 1699123456789,
  "color": "#6b9bd1"
}
```

## Использование

### UI редактор

1. Откройте страницу тегов (`youvi_tags.html`)
2. Найдите нужный тег
3. Нажмите на иконку стрелки (→) рядом с тегом
4. В открывшемся окне:
   - **Direct Implications** - прямые импликации (редактируемые)
   - **All Implied Tags (Transitive)** - все импликации с учетом транзитивности (вычисляемые)
5. Добавьте новую импликацию:
   - Введите имя тега в поле ввода
   - Используйте автодополнение для выбора существующего тега
   - Нажмите "Add"
6. Система автоматически:
   - Проверит на циклы
   - Вычислит транзитивное замыкание
   - Применит импликации ко всем видео с этим тегом

### Программный API

#### Применение импликаций к массиву тегов

```javascript
// Автоматическое применение импликаций
const originalTags = ['windows_7', 'tutorial'];
const expandedTags = window.applyTagImplications(originalTags);
// Результат: ['windows_7', 'tutorial', 'windows', 'os', 'microsoft']
```

#### Проверка доступности системы

```javascript
if (window.hasTagImplications()) {
  // Система готова к использованию
}
```

#### Разрешение импликаций для одного тега

```javascript
const resolver = window.tagImplicationResolver;
const implied = resolver.resolveImplications('windows_7');
// Результат: Set(['windows', 'os', 'microsoft'])
```

#### Проверка на циклы

```javascript
const resolver = window.tagImplicationResolver;
const wouldCycle = resolver.wouldCreateCycle('windows', 'windows_7');
// Результат: true (создаст цикл)
```

#### Получение цепочки импликаций

```javascript
const resolver = window.tagImplicationResolver;
const chain = resolver.getImplicationChain('windows_7', 'microsoft');
// Результат: ['windows_7', 'windows', 'microsoft']
```

## Алгоритмы

### Вычисление транзитивного замыкания

Используется DFS (Depth-First Search) с мемоизацией:

```javascript
function computeTransitiveClosure(tag, visited, currentPath) {
  // 1. Проверка на цикл
  if (currentPath.has(tag)) return new Set();
  
  // 2. Проверка кэша
  if (visited.has(tag)) return cache.get(tag);
  
  // 3. Рекурсивный обход
  const result = new Set();
  for (const directImplication of tag.implies) {
    result.add(directImplication);
    const transitive = computeTransitiveClosure(directImplication, visited, currentPath);
    for (const t of transitive) result.add(t);
  }
  
  return result;
}
```

**Сложность:** O(V + E), где V - количество тегов, E - количество импликаций

### Обнаружение циклов

Проверка перед добавлением импликации:

```javascript
function wouldCreateCycle(fromTag, toTag) {
  // Если toTag уже подразумевает fromTag, то fromTag → toTag создаст цикл
  const toImplications = resolveImplications(toTag);
  return toImplications.has(fromTag);
}
```

**Сложность:** O(1) благодаря предвычисленному кэшу

## Производительность

### Кэширование

- **Implication Cache** - полное транзитивное замыкание для каждого тега
- **Direct Implications Cache** - только прямые импликации
- Кэш инвалидируется при изменении любой импликации

### Оптимизации

1. **Ленивое вычисление** - кэш строится только при первом обращении
2. **Батчинг** - применение импликаций к видео происходит пакетами
3. **Мемоизация** - результаты DFS кэшируются

### Статистика

```javascript
const stats = window.tagImplicationResolver.getStats();
console.log(stats);
// {
//   totalTags: 150,
//   totalDirectImplications: 45,
//   totalTransitiveImplications: 120,
//   maxDepth: 8,
//   avgDirectPerTag: "0.30",
//   avgTransitivePerTag: "0.80",
//   cacheValid: true
// }
```

## Интеграция с другими системами

### Tag Alias System

Импликации работают с каноническими именами тегов, поэтому совместимы с системой алиасов:

```javascript
// Алиас разрешается в канонический тег
const tag = tagDB.getTag('Win7'); // → 'windows_7 (os)'

// Затем применяются импликации
const implied = resolver.resolveImplications('windows_7 (os)');
```

### Tag Database Manager

Импликации автоматически синхронизируются с базой данных тегов:

```javascript
// При изменении импликаций
tagDB.addEventListener((event) => {
  if (event.event === 'tagImplicationUpdated') {
    resolver.invalidateCache(); // Пересчитать кэш
  }
});
```

### Video Manager

При сохранении видео автоматически применяются импликации:

```javascript
// В вашем коде работы с видео
video.tags = window.applyTagImplications(video.tags);
await videoManager.saveVideo(video);
```

## События

Система генерирует следующие события:

### tagImplicationResolverReady

Срабатывает когда resolver инициализирован:

```javascript
document.addEventListener('tagImplicationResolverReady', () => {
  console.log('Tag implication resolver ready');
});
```

### tagImplicationUpdated

Срабатывает при изменении импликаций тега:

```javascript
document.addEventListener('tagImplicationUpdated', (e) => {
  const { tagName, implications } = e.detail;
  console.log(`Implications updated for ${tagName}:`, implications);
});
```

## Примеры использования

### Пример 1: Иерархия операционных систем

```
windows_11 → windows → os, microsoft
windows_10 → windows → os, microsoft
windows_7 → windows → os, microsoft
linux → os
macos → os, apple
```

### Пример 2: Иерархия жанров

```
action_rpg → rpg, action → game
jrpg → rpg → game
mmorpg → rpg, multiplayer → game
```

### Пример 3: Иерархия аниме

```
naruto_shippuden → naruto → anime, shounen
one_piece → anime, shounen
attack_on_titan → anime, shounen, action
```

## Отладка

### Проверка импликаций тега

```javascript
const tag = 'windows_7';
const direct = window.tagImplicationResolver.getDirectImplications(tag);
const all = window.tagImplicationResolver.resolveImplications(tag);
console.log('Direct:', direct);
console.log('All (transitive):', Array.from(all));
```

### Проверка цепочки

```javascript
const chain = window.tagImplicationResolver.getImplicationChain('windows_7', 'microsoft');
console.log('Chain:', chain.join(' → '));
```

### Статистика кэша

```javascript
const stats = window.tagImplicationResolver.getStats();
console.log('Cache stats:', stats);
```

## Ограничения

1. **Максимальная глубина** - нет жесткого ограничения, но рекомендуется не более 10 уровней
2. **Циклы** - полностью предотвращены системой
3. **Производительность** - оптимально для баз до 10,000 тегов

## Будущие улучшения

- [ ] Массовое редактирование импликаций
- [ ] Визуализация графа импликаций
- [ ] Экспорт/импорт правил импликаций
- [ ] Предложения импликаций на основе анализа тегов
- [ ] История изменений импликаций
- [ ] Условные импликации (если A и B, то C)

## Связанные файлы

- `youvi/tags/tag-implication-resolver.js` - Ядро системы
- `youvi/tags/tag-implication-manager.js` - UI менеджер
- `youvi/tags/tag-implication-manager.css` - Стили
- `youvi/tags/tag-database-schema.js` - Схема данных (поле `implies`)
- `youvi/tags/tag-database-manager.js` - Управление базой данных
- `youvi_tags.html` - Страница тегов с интеграцией
