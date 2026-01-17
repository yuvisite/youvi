# Requirements Document

## Introduction

Исправление race condition при загрузке метаданных видео на главной странице Youvi. При параллельной загрузке большого количества видео (300-400) метаданные могут быть случайно перезаписаны пустыми значениями из-за конкурентных операций чтения/записи.

## Glossary

- **Metadata_Manager**: Система управления метаданными видео, отвечающая за чтение, запись и кеширование метаданных
- **Video_Metadata**: JSON-файл с информацией о видео (views, likes, dislikes, tags, created, preview, duration)
- **Race_Condition**: Ситуация когда несколько параллельных операций конкурируют за один ресурс
- **Write_Lock**: Механизм блокировки записи для предотвращения конкурентных операций
- **Fallback_Metadata**: Метаданные по умолчанию, создаваемые когда файл метаданных не найден

## Requirements

### Requirement 1: Предотвращение перезаписи существующих тегов

**User Story:** As a user, I want my video tags to be preserved, so that I don't lose my tag organization when loading the main page.

#### Acceptance Criteria

1. WHEN the Metadata_Manager reads metadata and the file is temporarily unavailable, THE Metadata_Manager SHALL NOT create new empty metadata if the file exists
2. WHEN the Metadata_Manager creates Fallback_Metadata, THE Metadata_Manager SHALL first verify that no metadata file exists on disk
3. IF multiple concurrent requests attempt to create metadata for the same video, THEN THE Metadata_Manager SHALL ensure only one write operation succeeds
4. WHEN saving Video_Metadata, THE Metadata_Manager SHALL preserve existing tags if new tags array is empty

### Requirement 2: Защита от конкурентной записи

**User Story:** As a developer, I want metadata writes to be atomic, so that concurrent operations don't corrupt data.

#### Acceptance Criteria

1. WHEN a write operation is in progress for a video, THE Metadata_Manager SHALL queue subsequent write requests
2. WHEN the Metadata_Manager saves metadata, THE Metadata_Manager SHALL use a Write_Lock per video file
3. WHEN a Write_Lock is held, THE Metadata_Manager SHALL wait or skip duplicate write operations
4. THE Metadata_Manager SHALL release Write_Lock after write completion or error

### Requirement 3: Улучшенное кеширование метаданных

**User Story:** As a user, I want fast page loading, so that I can browse my video collection efficiently.

#### Acceptance Criteria

1. WHEN metadata is loaded from disk, THE Metadata_Manager SHALL cache it immediately before any async operations
2. WHEN metadata is requested and exists in cache, THE Metadata_Manager SHALL return cached version without disk access
3. WHEN cache entry exists, THE Metadata_Manager SHALL NOT attempt to create new metadata
4. WHEN metadata is successfully saved, THE Metadata_Manager SHALL update the cache with saved values

### Requirement 4: Логирование и диагностика

**User Story:** As a developer, I want to track metadata operations, so that I can diagnose issues when they occur.

#### Acceptance Criteria

1. WHEN the Metadata_Manager creates new Fallback_Metadata, THE Metadata_Manager SHALL log the video name and reason
2. WHEN a race condition is detected (duplicate write attempt), THE Metadata_Manager SHALL log a warning
3. WHEN metadata is overwritten with fewer tags, THE Metadata_Manager SHALL log a warning with before/after tag counts
4. THE Metadata_Manager SHALL provide a method to retrieve operation statistics

### Requirement 5: Восстановление метаданных

**User Story:** As a user, I want to recover lost metadata, so that I can restore my tags if something goes wrong.

#### Acceptance Criteria

1. WHEN saving metadata, THE Metadata_Manager SHALL create a backup of existing metadata if tags will be reduced
2. WHEN metadata backup exists, THE Metadata_Manager SHALL provide a method to restore from backup
3. THE Metadata_Manager SHALL retain backups for at least 24 hours
4. WHEN the user requests metadata recovery, THE Metadata_Manager SHALL list available backups
