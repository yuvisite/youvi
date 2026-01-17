# Design Document: QMS Peer Info Sidebar

## Overview

The QMS Peer Info Sidebar is a collapsible panel that displays detailed information about the current conversation peer. It integrates seamlessly with the existing QMS chat interface, providing quick access to peer profile information without leaving the chat context. The sidebar slides in from the right side of the chat window and can be toggled on/off with smooth animations.

## Architecture

### Component Structure

```
.main (flex container)
├── .sidebar.chats-sidebar (left - chat list)
├── .chat (center - chat window)
│   ├── .chat-header
│   │   └── #peerInfoToggle (new toggle button)
│   ├── .chat-body
│   └── .chat-input
└── .peer-info-sidebar (new - right sidebar)
    ├── .peer-info-header
    │   ├── .peer-avatar
    │   └── .peer-name
    ├── .peer-info-body
    │   ├── .peer-channel-link
    │   └── .peer-birthday
    └── .peer-info-footer
```

### Layout Strategy

The sidebar will be positioned within the `.main` container alongside the chat window. When expanded:
- Chat window width: `flex: 1` (takes remaining space)
- Peer info sidebar width: `280px` (fixed)
- Total layout: `chats-sidebar (300px) + chat (flex) + peer-info-sidebar (280px)`

When collapsed:
- Peer info sidebar width: `0px` with `overflow: hidden`
- Chat window expands to fill available space

### State Management

The sidebar state will be managed within the existing QMS class:
- `peerInfoSidebarOpen`: boolean flag for sidebar state
- `currentPeerData`: object containing peer information
- State persisted to `localStorage` with key `qms_peer_sidebar_state`

## Components and Interfaces

### 1. Peer Info Sidebar Component

**HTML Structure:**
```html
<aside class="peer-info-sidebar" id="peerInfoSidebar">
  <div class="peer-info-header">
    <div class="peer-avatar" id="peerInfoAvatar">
      <!-- Avatar image or initials -->
    </div>
    <div class="peer-name" id="peerInfoName">
      <!-- Peer channel name -->
    </div>
  </div>
  <div class="peer-info-body">
    <a href="#" class="peer-channel-link" id="peerChannelLink" target="_blank">
      <svg><!-- Channel icon --></svg>
      <span>Перейти на канал</span>
    </a>
    <div class="peer-birthday-section">
      <div class="section-title">День рождения</div>
      <div class="peer-birthday" id="peerBirthday">
        <!-- Birthday information -->
      </div>
    </div>
  </div>
</aside>
```

**CSS Classes:**
- `.peer-info-sidebar`: Main container with transition animations
- `.peer-info-sidebar.collapsed`: Collapsed state (width: 0)
- `.peer-info-header`: Top section with avatar and name
- `.peer-avatar`: Avatar container (80x80px, rounded)
- `.peer-name`: Channel name display
- `.peer-info-body`: Scrollable content area
- `.peer-channel-link`: Clickable link to channel page
- `.peer-birthday-section`: Birthday information container

### 2. Toggle Button Component

**HTML Structure:**
```html
<button id="peerInfoToggle" class="peer-info-toggle" title="Информация о собеседнике">
  <svg viewBox="0 0 24 24">
    <!-- Info icon -->
  </svg>
</button>
```

**Placement:** Inside `.chat-header`, after `#deleteChatBtn`

### 3. QMS Class Extensions

**New Methods:**
```javascript
// Toggle sidebar visibility
togglePeerInfoSidebar()

// Load peer information
async loadPeerInfo(peerNick)

// Load peer avatar
async loadPeerAvatar(peerNick)

// Load peer birthday
async loadPeerBirthday(peerNick)

// Update sidebar content
updatePeerInfoSidebar(peerData)

// Format birthday display
formatBirthday(birthdayData)

// Calculate age from birthday
calculateAge(year, month, day)
```

## Data Models

### Peer Data Object

```javascript
{
  nick: string,              // Peer channel name
  slug: string,              // Slugified channel name
  avatar: string | null,     // Avatar URL or null
  channelUrl: string,        // Link to channel page
  birthday: {
    month: number | null,    // 1-12
    day: number | null,      // 1-31
    year: number | null,     // Full year or null
    formatted: string        // Display string
  } | null
}
```

### Birthday Data (from birth.json)

```javascript
{
  month: number,    // 1-12
  day: number,      // 1-31
  year: number      // Optional, full year
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Sidebar toggle state consistency

*For any* sidebar toggle action, the visual state (expanded/collapsed) should match the stored state in localStorage and the `peerInfoSidebarOpen` flag.

**Validates: Requirements 2.1, 2.4**

### Property 2: Peer data loading completeness

*For any* active conversation with a valid peer, loading peer information should either succeed with complete data or fail gracefully with default values, never leaving the sidebar in a partially loaded state.

**Validates: Requirements 1.2, 5.3, 5.4**

### Property 3: Avatar fallback consistency

*For any* peer without an avatar, the system should display initials derived from the peer's channel name, and the initials should be consistent across all displays of that peer.

**Validates: Requirements 1.5**

### Property 4: Birthday format validity

*For any* birthday data loaded from birth.json, if the data contains month and day values, the formatted output should be a valid date string in Russian locale format.

**Validates: Requirements 3.1, 3.2**

### Property 5: Theme consistency

*For any* theme change event, all peer info sidebar elements should update their styles to match the active theme without requiring a page reload.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 6: Responsive layout adaptation

*For any* viewport width change, the sidebar should automatically adjust its display mode (inline vs overlay) based on the breakpoint, and the chat window should resize accordingly.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 7: Cache invalidation correctness

*For any* peer change in an active conversation, the sidebar should clear cached data for the previous peer and load fresh data for the new peer.

**Validates: Requirements 5.1, 5.2**

### Property 8: Animation completion

*For any* sidebar toggle action, the animation should complete fully before allowing another toggle action, preventing visual glitches from rapid clicking.

**Validates: Requirements 2.5**

## Error Handling

### Avatar Loading Failures

**Strategy:** Graceful degradation with fallback
- If avatar file doesn't exist: Display initials
- If avatar URL is invalid: Display initials
- If network error: Display initials with retry option
- Never block sidebar rendering

### Birthday Data Loading Failures

**Strategy:** Display placeholder text
- If birth.json doesn't exist: Show "День рождения не указан"
- If birth.json is malformed: Show "День рождения не указан"
- If file read fails: Log error, show placeholder
- Never throw exceptions that break the sidebar

### Channel Data Loading Failures

**Strategy:** Use available data
- If channel directory doesn't exist: Use peer nick as display name
- If channel.json is missing: Create minimal channel data
- If avatar is missing: Use initials fallback
- Always allow sidebar to render with partial data

### State Persistence Failures

**Strategy:** Use in-memory state
- If localStorage is unavailable: Keep state in memory only
- If localStorage.setItem fails: Log warning, continue
- If localStorage.getItem fails: Use default state (collapsed)
- Never block functionality due to storage issues

## Testing Strategy

### Unit Tests

1. **Sidebar Toggle Tests**
   - Test toggle button click handler
   - Test state persistence to localStorage
   - Test state restoration on page load
   - Test multiple rapid toggle clicks (debouncing)

2. **Data Loading Tests**
   - Test loadPeerInfo with valid peer
   - Test loadPeerInfo with invalid peer
   - Test loadPeerAvatar with existing avatar
   - Test loadPeerAvatar with missing avatar
   - Test loadPeerBirthday with complete data
   - Test loadPeerBirthday with partial data
   - Test loadPeerBirthday with missing file

3. **Formatting Tests**
   - Test formatBirthday with month and day
   - Test formatBirthday with month, day, and year
   - Test formatBirthday with invalid data
   - Test calculateAge with valid year
   - Test calculateAge with future year
   - Test calculateAge with missing year

4. **Theme Tests**
   - Test dark theme application to sidebar
   - Test light theme application to sidebar
   - Test theme switching while sidebar is open
   - Test theme persistence across page loads

### Property-Based Tests

Using a JavaScript property-based testing library (fast-check), we will implement the following property tests:

1. **Property Test: Sidebar State Consistency**
   - Generate random sequences of toggle actions
   - Verify state matches visual display after each action
   - Verify localStorage matches in-memory state

2. **Property Test: Avatar Fallback**
   - Generate random channel names (including edge cases)
   - Verify initials are always 1-2 uppercase characters
   - Verify same channel name produces same initials

3. **Property Test: Birthday Formatting**
   - Generate random valid birthday data
   - Verify formatted output is valid Russian date string
   - Verify age calculation is mathematically correct

4. **Property Test: Responsive Breakpoints**
   - Generate random viewport widths
   - Verify sidebar mode (inline/overlay) matches breakpoint rules
   - Verify chat window width adjusts correctly

5. **Property Test: Cache Behavior**
   - Generate random peer change sequences
   - Verify cache is cleared on peer change
   - Verify cache is used when peer doesn't change

### Integration Tests

1. **Full Conversation Flow**
   - Open QMS page
   - Select a conversation
   - Verify sidebar toggle appears
   - Toggle sidebar open
   - Verify peer data loads
   - Change conversation
   - Verify sidebar updates with new peer data

2. **Theme Integration**
   - Open QMS with light theme
   - Open sidebar
   - Switch to dark theme
   - Verify sidebar updates
   - Reload page
   - Verify theme persists

3. **Responsive Behavior**
   - Open QMS on desktop
   - Open sidebar
   - Resize to mobile width
   - Verify sidebar becomes overlay
   - Resize back to desktop
   - Verify sidebar returns to inline mode

## Implementation Notes

### CSS Transitions

Use CSS transitions for smooth animations:
```css
.peer-info-sidebar {
  transition: width 0.3s ease-in-out, opacity 0.3s ease-in-out;
}
```

### Performance Considerations

1. **Lazy Loading:** Only load peer data when sidebar is opened
2. **Caching:** Reuse avatar URLs from existing QMS avatar cache
3. **Debouncing:** Debounce toggle button clicks (300ms)
4. **RAF:** Use requestAnimationFrame for smooth animations

### Accessibility

1. **ARIA Labels:** Add aria-label to toggle button
2. **Keyboard Navigation:** Support Tab key navigation
3. **Screen Readers:** Add aria-expanded attribute to toggle button
4. **Focus Management:** Maintain focus when toggling sidebar

### Browser Compatibility

- Target: Modern browsers with File System Access API support
- Fallback: Graceful degradation for missing features
- CSS: Use flexbox (widely supported)
- JavaScript: ES6+ features (already used in QMS)
