# Requirements Document

## Introduction

This feature adds a collapsible right sidebar to the QMS (Quick Messaging System) chat interface that displays detailed information about the current conversation peer. The sidebar will show the peer's avatar, channel name, a link to their channel page, and their birthday information (loaded from the channel's birth.json file, similar to the youvi_ch_view.html implementation).

## Glossary

- **QMS**: Quick Messaging System - the chat/messaging interface in the Youvi platform
- **Peer**: The other participant in a conversation (the person you're chatting with)
- **Peer Info Sidebar**: A collapsible panel on the right side of the chat window showing peer details
- **Chat Window**: The main conversation area containing the chat header, message body, and input area
- **Channel**: A Youvi user profile/channel with associated metadata
- **Birth.json**: A JSON file stored in each channel's directory containing birthday information

## Requirements

### Requirement 1

**User Story:** As a QMS user, I want to see detailed information about my conversation peer in a sidebar, so that I can quickly access their profile and learn more about them.

#### Acceptance Criteria

1. WHEN a conversation is active THEN the system SHALL display a toggle button to show/hide the peer info sidebar
2. WHEN the peer info sidebar is visible THEN the system SHALL display the peer's avatar, channel name, and birthday information
3. WHEN the user clicks the channel name link THEN the system SHALL navigate to the peer's channel page in a new tab
4. WHEN no conversation is active THEN the system SHALL hide the peer info sidebar toggle button
5. WHEN the peer has no avatar THEN the system SHALL display a default avatar with the peer's initials

### Requirement 2

**User Story:** As a QMS user, I want to collapse and expand the peer info sidebar, so that I can maximize chat space when needed.

#### Acceptance Criteria

1. WHEN the user clicks the toggle button THEN the system SHALL smoothly animate the sidebar open or closed
2. WHEN the sidebar is collapsed THEN the system SHALL expand the chat window to use the available space
3. WHEN the sidebar is expanded THEN the system SHALL reduce the chat window width to accommodate the sidebar
4. WHEN the page is reloaded THEN the system SHALL remember the sidebar's collapsed/expanded state
5. WHILE the sidebar is animating THEN the system SHALL prevent multiple toggle actions

### Requirement 3

**User Story:** As a QMS user, I want to see the peer's birthday information in the sidebar, so that I can remember important dates.

#### Acceptance Criteria

1. WHEN the peer's channel has birthday data THEN the system SHALL load and display it from the birth.json file
2. WHEN the birthday includes month and day THEN the system SHALL display them in a readable format
3. WHEN the birthday includes a year THEN the system SHALL calculate and display the peer's age
4. WHEN no birthday data exists THEN the system SHALL display "День рождения не указан"
5. WHEN birthday data fails to load THEN the system SHALL handle the error gracefully without breaking the sidebar

### Requirement 4

**User Story:** As a QMS user, I want the peer info sidebar to work with the dark theme, so that my visual experience is consistent.

#### Acceptance Criteria

1. WHEN dark theme is active THEN the system SHALL apply dark theme styles to the peer info sidebar
2. WHEN switching between themes THEN the system SHALL update the sidebar colors immediately
3. WHEN the sidebar is in dark theme THEN the system SHALL ensure text remains readable
4. WHEN the sidebar contains links THEN the system SHALL apply appropriate hover states for the active theme
5. WHILE in dark theme THEN the system SHALL maintain visual consistency with other QMS elements

### Requirement 5

**User Story:** As a QMS user, I want the peer info sidebar to load data efficiently, so that the chat interface remains responsive.

#### Acceptance Criteria

1. WHEN loading peer information THEN the system SHALL use cached avatar data when available
2. WHEN the peer changes THEN the system SHALL update the sidebar content without reloading the entire page
3. WHEN avatar loading fails THEN the system SHALL display a fallback avatar without blocking other sidebar content
4. WHEN birthday data is unavailable THEN the system SHALL continue displaying other peer information
5. WHILE loading peer data THEN the system SHALL not block user interaction with the chat interface

### Requirement 6

**User Story:** As a QMS user, I want the peer info sidebar to be responsive, so that it works well on different screen sizes.

#### Acceptance Criteria

1. WHEN the viewport width is below 1024px THEN the system SHALL automatically collapse the sidebar
2. WHEN the sidebar is collapsed on mobile THEN the system SHALL provide a floating toggle button
3. WHEN the sidebar is expanded on mobile THEN the system SHALL overlay the chat window
4. WHEN the user resizes the window THEN the system SHALL adjust the sidebar layout appropriately
5. WHILE on mobile devices THEN the system SHALL ensure touch targets are appropriately sized
