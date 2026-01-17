# Requirements Document

## Introduction

Система предпросмотра видео в QMS позволяет пользователям отправлять ссылки на видео из Youvi в чат, и эти ссылки автоматически отображаются с интерактивным предпросмотром и встроенным упрощенным плеером. Это улучшает пользовательский опыт, позволяя смотреть видео прямо из чата без перехода на страницу видео.

## Glossary

- **QMS**: Quick Messaging System - система обмена сообщениями
- **Youvi**: Видеохостинг платформа в рамках 8Site
- **Video Link**: Ссылка на видео в формате youvi_video.html?v=<video_id>
- **Video Preview**: Превью видео с миниатюрой, названием и метаданными
- **Embedded Player**: Упрощенный встроенный видеоплеер в чате
- **Message**: Сообщение в QMS чате
- **Video Metadata**: Метаданные видео (название, канал, длительность, превью)

## Requirements

### Requirement 1

**User Story:** As a user, I want to send Youvi video links in QMS chat, so that I can share videos with my conversation partner.

#### Acceptance Criteria

1. WHEN a user types a Youvi video URL in the message input THEN the system SHALL recognize it as a video link
2. WHEN a message contains a Youvi video URL THEN the system SHALL extract the video ID from the URL
3. WHEN a video link is detected THEN the system SHALL work regardless of the base path (localhost, D:/, C:/, etc.)
4. WHEN a user sends a message with a video link THEN the system SHALL save the link along with the message text
5. WHEN a video link is in the format youvi_video.html?v=VIDEO_ID THEN the system SHALL parse it correctly

### Requirement 2

**User Story:** As a user, I want to see video previews in chat messages, so that I can quickly understand what video is being shared.

#### Acceptance Criteria

1. WHEN a message contains a video link THEN the system SHALL display a video preview card
2. WHEN rendering a video preview THEN the system SHALL show the video thumbnail image
3. WHEN rendering a video preview THEN the system SHALL display the video title
4. WHEN rendering a video preview THEN the system SHALL show the channel name
5. WHEN rendering a video preview THEN the system SHALL display the video duration
6. WHEN video metadata is not available THEN the system SHALL show a placeholder preview with the video ID

### Requirement 3

**User Story:** As a user, I want to play videos directly in the chat, so that I don't need to leave the conversation to watch shared videos.

#### Acceptance Criteria

1. WHEN a user clicks on a video preview THEN the system SHALL expand an embedded player
2. WHEN the embedded player opens THEN the system SHALL load the video file
3. WHEN the embedded player is active THEN the system SHALL provide basic playback controls (play, pause, seek, volume)
4. WHEN a user clicks outside the player or on a close button THEN the system SHALL collapse the embedded player
5. WHEN the embedded player is open THEN the system SHALL maintain chat scrollability

### Requirement 4

**User Story:** As a user, I want the video preview to load metadata efficiently, so that the chat remains responsive.

#### Acceptance Criteria

1. WHEN a message with a video link is rendered THEN the system SHALL load video metadata asynchronously
2. WHEN loading video metadata THEN the system SHALL not block chat rendering
3. WHEN video metadata fails to load THEN the system SHALL display a fallback preview with basic information
4. WHEN multiple video links are in view THEN the system SHALL load metadata in parallel
5. WHEN video metadata is loaded THEN the system SHALL cache it to avoid redundant file system access

### Requirement 5

**User Story:** As a user, I want video previews to work with the existing QMS features, so that I have a consistent experience.

#### Acceptance Criteria

1. WHEN a message contains both text and a video link THEN the system SHALL display both the text and video preview
2. WHEN a message contains multiple video links THEN the system SHALL display previews for all links
3. WHEN a video preview is in a message THEN the system SHALL support message deletion
4. WHEN a video preview is in a message THEN the system SHALL support message editing
5. WHEN a video preview is in a message THEN the system SHALL work in both light and dark themes

### Requirement 6

**User Story:** As a user, I want to open the full video page from the preview, so that I can access all video features if needed.

#### Acceptance Criteria

1. WHEN a video preview is displayed THEN the system SHALL provide a link to open the full video page
2. WHEN a user clicks the "open full page" link THEN the system SHALL open the video page in a new tab
3. WHEN opening the full video page THEN the system SHALL preserve the video ID in the URL
4. WHEN opening the full video page THEN the system SHALL work regardless of the current base path
5. WHEN the full video page opens THEN the system SHALL maintain the current QMS chat state

### Requirement 7

**User Story:** As a developer, I want the video preview system to be modular, so that it's maintainable and extensible.

#### Acceptance Criteria

1. WHEN implementing video preview THEN the system SHALL create a separate module for video link detection
2. WHEN implementing video preview THEN the system SHALL create a separate module for video metadata loading
3. WHEN implementing video preview THEN the system SHALL create a separate module for embedded player rendering
4. WHEN implementing video preview THEN the system SHALL integrate with existing QMS message rendering
5. WHEN implementing video preview THEN the system SHALL follow the existing QMS code structure and patterns
