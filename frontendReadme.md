# Instagram Clone — Frontend Project Requirements & Implementation Specification

**Document:** `frontendReadme.md`  
**Project:** Instagram Clone  
**Layer:** Frontend  
**Status:** ACTIVE  
**Current Phase:** Frontend Implementation  
**Backend Status:** Backend implementation completed / integration-ready  
**Frontend Technology:** React + Vite  
**Architecture:** Modular Feature-Based Frontend  
**API Style:** REST  
**Real-Time:** WebSocket  
**Identifier Standard:** UUID  

---

# 1. DOCUMENT PURPOSE

This document is the primary implementation specification for the frontend of the Instagram Clone.

The frontend must provide a production-quality social media application that communicates with the completed Spring Boot backend.

The frontend MUST:

- consume the real backend APIs;
- follow the API contracts defined by the backend;
- use UUID identifiers;
- provide responsive desktop/tablet/mobile experiences;
- provide reusable and maintainable React components;
- handle authentication and protected resources;
- support real-time functionality where provided by the backend;
- provide proper loading, error, empty and success states;
- avoid unnecessary mock implementations;
- avoid duplicating backend business logic;
- remain modular and scalable.

This document is the primary source of frontend implementation requirements.

---

# 2. IMPORTANT IMPLEMENTATION RULE

The backend is the source of truth for:

- API contracts;
- request formats;
- response formats;
- validation;
- authorization;
- business rules;
- UUID identifiers;
- pagination;
- WebSocket events;
- error contracts.

The frontend MUST NOT invent API contracts when the backend already provides them.

Before implementing a feature:

1. Inspect the backend implementation.
2. Inspect the relevant backend documentation.
3. Inspect the API/OpenAPI/Swagger contract when available.
4. Understand request and response DTOs.
5. Understand authentication requirements.
6. Implement the frontend against the actual contract.

Do not create fake APIs merely to make the UI appear functional.

---

# 3. TECHNOLOGY REQUIREMENTS

The frontend should use:

- React
- Vite
- JavaScript/JSX unless the existing project has an approved alternative
- React Router
- Axios or the existing approved HTTP client
- WebSocket/STOMP/Socket.IO client according to the actual backend implementation
- CSS/CSS modules or the existing project styling approach
- Testing framework already configured in the project

Do not introduce a large dependency merely because it is convenient.

Every new dependency must have a clear purpose.

---

# 4. FRONTEND ARCHITECTURE

Use a modular feature-based architecture.

Recommended structure:

```text
frontend/
├── public/
├── src/
│   ├── api/
│   ├── assets/
│   ├── components/
│   ├── config/
│   ├── features/
│   │   ├── auth/
│   │   ├── user/
│   │   ├── profile/
│   │   ├── post/
│   │   ├── feed/
│   │   ├── comment/
│   │   ├── story/
│   │   ├── reel/
│   │   ├── search/
│   │   ├── notification/
│   │   ├── chat/
│   │   ├── settings/
│   │   └── moderation/
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   ├── routes/
│   ├── services/
│   ├── store/
│   ├── utils/
│   ├── constants/
│   ├── App.jsx
│   └── main.jsx
├── .env
├── .env.example
├── index.html
├── package.json
└── vite.config.js
```

The exact structure may be adapted to the existing codebase, but responsibilities must remain clearly separated.

---

# 5. CORE FRONTEND MODULES

The frontend must support the following major modules.

## 5.1 Authentication

Implement:

- Registration
- Login
- Logout
- Authentication state
- Current-user loading
- Protected routes
- Unauthorized handling
- Session restoration
- Authentication errors
- Password-related flows supported by the backend

The frontend must follow the actual backend authentication mechanism.

---

# 5.2 User & Profile

Implement:

- User profile
- Profile information
- Profile picture
- Bio
- User posts
- Followers
- Following
- Follow/unfollow
- Relationship status
- Edit profile
- Profile statistics
- Private/public profile behavior if supported

User IDs must use UUID.

---

# 5.3 Social Graph

Implement:

- Follow user
- Unfollow user
- Followers list
- Following list
- Relationship status
- Follow request behavior if supported
- Pagination
- Loading states
- Empty states

Do not duplicate relationship/business rules that belong to the backend.

---

# 5.4 Posts

Implement:

- Create post
- Upload media
- Post caption
- View post
- Edit post where supported
- Delete post
- Like/unlike
- Save/unsave
- Comment
- Share behavior where supported
- Post details
- Author information
- Timestamp
- Media preview

Posts must consume real backend APIs.

---

# 5.5 Feed

Implement:

- Home feed
- Paginated feed
- Infinite scrolling where appropriate
- Refresh behavior
- Post rendering
- Loading skeletons
- Empty feed state
- Error state
- Retry functionality

Avoid loading the entire feed unnecessarily.

---

# 5.6 Comments

Implement:

- View comments
- Add comment
- Delete comment where permitted
- Like comment if supported
- Pagination where required
- Comment loading state
- Empty state
- Error handling

---

# 5.7 Stories

Implement story functionality according to the backend capabilities.

Potential functionality:

- Create story
- View stories
- Story viewer
- Story navigation
- Story expiration behavior
- Story media
- Story progress indicator
- Seen/view state
- Delete story where supported

Do not implement unsupported backend behavior as if it were production functionality.

---

# 5.8 Reels / Short Video

Implement according to the backend contract:

- Reel listing
- Reel playback
- Reel creation
- Reel media
- Like
- Comment
- Share
- Save
- Creator profile
- Vertical video experience

Use lazy loading and optimized media rendering.

---

# 5.9 Search & Explore

Implement:

- User search
- Content search where supported
- Search suggestions where supported
- Explore page
- Search results
- Loading state
- Empty state
- Error state
- Debounced search requests

Search requests must not be fired for every keystroke without appropriate debouncing.

---

# 5.10 Notifications

Implement:

- Notification list
- Read/unread state
- Mark as read
- Notification navigation
- Pagination
- Real-time notifications where supported
- Empty state
- Loading state

---

# 5.11 Messaging / Chat

Implement according to backend WebSocket/API support:

- Conversations
- Message list
- Send message
- Receive message
- Message timestamps
- Unread count
- Online/offline state where supported
- Typing indicator where supported
- Reconnection
- Connection error handling
- Conversation selection
- Pagination/history loading

Chat must not depend on fake local messages in production mode.

---

# 5.12 Settings

Implement supported settings such as:

- Account settings
- Profile settings
- Privacy
- Password/security
- Notification preferences
- Session/logout behavior
- Other backend-supported settings

---

# 5.13 Moderation / Administration

Implement frontend functionality for moderation/admin capabilities exposed by the backend.

Potential functionality:

- User moderation
- Content moderation
- Reports
- Blocking
- Administrative dashboards
- Content removal
- Account actions

Only expose administrative functionality to authorized users.

Frontend visibility does NOT replace backend authorization.

---

# 6. ROUTING

Use centralized route management.

Routes should be organized logically.

Example:

```text
/
 /login
 /register
 /explore
 /search
 /profile/:username
 /post/:postId
 /reels
 /stories
 /messages
 /notifications
 /settings
```

Actual routes must be aligned with the implemented backend/application requirements.

Protected routes must require authentication.

Unauthorized users must be redirected appropriately.

Invalid routes must display a proper 404 page.

---

# 7. API INTEGRATION

All backend communication should be centralized.

Recommended:

```text
src/api/
src/services/
```

Do not scatter raw Axios/fetch calls throughout UI components.

Example conceptual structure:

```text
api/
├── client.js
├── authApi.js
├── userApi.js
├── postApi.js
├── feedApi.js
├── commentApi.js
├── notificationApi.js
└── chatApi.js
```

The exact implementation may differ.

API calls must support:

- Authentication headers
- UUID parameters
- Request validation
- Response parsing
- Error handling
- Pagination
- Uploads
- Retry where appropriate

---

# 8. UUID REQUIREMENT

The backend uses UUID for persistent entity identifiers.

Frontend MUST treat IDs as UUID values.

Examples:

```text
userId
postId
commentId
messageId
conversationId
notificationId
mediaId
```

Do not assume:

```text
1
2
3
4
```

Do not convert UUIDs into numeric values.

Do not use array indexes as entity identifiers.

React list keys should use stable backend identifiers.

Example:

```jsx
key={post.id}
```

rather than:

```jsx
key={index}
```

when a stable entity ID is available.

---

# 9. AUTHENTICATION

Authentication must be implemented according to the backend contract.

The frontend must:

1. Authenticate the user.
2. Store session information using the approved strategy.
3. Attach required authentication information to API requests.
4. Restore authentication state when appropriate.
5. Protect private routes.
6. Handle expired/invalid authentication.
7. Clear authentication state during logout.

Never place:

- database credentials;
- backend secrets;
- private API keys;
- JWT signing secrets;
- encryption secrets

inside frontend environment variables that are exposed to the browser.

---

# 10. STATE MANAGEMENT

Separate state into logical categories.

## Server State

Examples:

- posts;
- profiles;
- comments;
- notifications;
- messages;
- search results.

## Client State

Examples:

- modal visibility;
- sidebar state;
- theme;
- selected tab;
- UI preferences.

## Authentication State

Examples:

- current user;
- authentication status;
- session information.

Do not put every piece of application data into one global state object.

Use local component state where global state is unnecessary.

---

# 11. COMPONENT SYSTEM

Create reusable components.

Examples:

```text
Button
Input
Avatar
Modal
Dropdown
Loader
Skeleton
Toast
ErrorMessage
EmptyState
PostCard
CommentItem
UserCard
FollowButton
LikeButton
SaveButton
StoryRing
StoryViewer
Navbar
Sidebar
BottomNavigation
SearchBar
NotificationItem
MessageBubble
```

Reusable components must be generic enough to be reused but not so abstract that they become difficult to understand.

---

# 12. DESIGN REQUIREMENTS

The application should provide a professional social-media experience inspired by modern Instagram-style interaction patterns without copying proprietary assets or branding.

UI must be:

- clean;
- modern;
- consistent;
- responsive;
- accessible;
- visually balanced;
- fast;
- intuitive.

Maintain consistency in:

- typography;
- spacing;
- colors;
- borders;
- radius;
- shadows;
- buttons;
- forms;
- icons;
- cards;
- modals.

---

# 13. RESPONSIVE DESIGN

The application MUST work across:

```text
Desktop
Laptop
Tablet
Mobile
```

Important screens:

- Login
- Register
- Home feed
- Profile
- Explore
- Search
- Post details
- Stories
- Reels
- Notifications
- Messages
- Settings

Mobile navigation should be designed specifically for small screens rather than simply shrinking the desktop UI.

---

# 14. MEDIA HANDLING

Media upload, preview, and delivery integration is centralized through `src/services/media.service.js`.

### 14.1 Frontend Upload Flow
1. **Selection & Validation:** The client validates MIME types (`image/jpeg`, `image/png`, `image/webp`, `video/mp4`) and limits (image ≤ 10MB, video ≤ 50MB) before initiating upload.
2. **Local Preview:** Generates instant object URL (`URL.createObjectURL(file)`) for immediate user preview; cleans up via `URL.revokeObjectURL(url)` upon component unmount.
3. **Backend Upload:** Calls `mediaService.uploadMedia(file, folder, onUploadProgress)` issuing `POST /api/v1/media`.
4. **Cloudinary Delivery:** Backend streams to Cloudinary and persists metadata, returning a secure HTTPS Cloudinary URL and unique media ID.
5. **Domain Association:** Post, Story, Reel, and Avatar flows attach the returned secure URL and asset ID.
6. **Error Handling:** Gracefully handles `413 Payload Too Large` and `429 Too Many Requests` (rate limits) with descriptive user notifications.

### 14.2 Service Methods (`media.service.js`)
- `mediaService.uploadMedia(file, folder, onUploadProgress)`: Uploads image or video file.
- `mediaService.getMedia(mediaId)`: Fetches stored metadata.
- `mediaService.deleteMedia(mediaId)`: Deletes media asset and triggers cloud deletion.

---

# 15. LOADING STATES

Every asynchronous feature must have a meaningful loading state.

Use:

- skeleton loaders;
- spinners;
- disabled buttons;
- upload progress;
- page loading indicators.

Avoid blank screens while data is loading.

---

# 16. ERROR STATES

Every important asynchronous operation must handle errors.

Examples:

```text
Network unavailable
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
429 Rate Limited
500 Server Error
Upload Failure
WebSocket Failure
Timeout
```

Users should receive understandable messages.

Do not expose raw stack traces or internal backend errors to users.

---

# 17. EMPTY STATES

Every collection should have a meaningful empty state.

Examples:

```text
No posts yet.
No followers yet.
No following users.
No notifications.
No messages.
No search results.
No saved posts.
```

Where appropriate, provide a useful action.

---

# 18. FORM VALIDATION

Frontend validation should improve user experience.

Validate:

- required fields;
- length;
- format;
- file type;
- file size;
- password requirements;
- username rules;
- caption limits;
- comment limits.

Backend validation remains authoritative.

Never assume frontend validation is sufficient for security.

---

# 19. REAL-TIME FEATURES

Use the actual backend real-time mechanism.

The frontend must handle:

- connection;
- authentication;
- subscription;
- message/event processing;
- reconnection;
- disconnect;
- errors;
- cleanup.

Avoid creating multiple unnecessary WebSocket connections.

Clean up connections/subscriptions when components unmount or conversations change.

---

# 20. SEARCH PERFORMANCE

Search should use debouncing.

Conceptually:

```text
User types
    ↓
Wait briefly
    ↓
Send request
    ↓
Display results
```

Do not send a backend request for every individual keystroke.

Cancel or ignore obsolete requests where necessary.

---

# 21. FEED PERFORMANCE

The feed must be designed for scalability.

Use:

- pagination;
- lazy loading;
- infinite scrolling where appropriate;
- optimized images;
- efficient component rendering;
- memoization where justified;
- caching where appropriate.

Do not load thousands of posts into the DOM simultaneously.

---

# 22. ACCESSIBILITY

Frontend components should support:

- semantic HTML;
- keyboard navigation;
- visible focus;
- accessible labels;
- proper form labels;
- alt text;
- accessible dialogs;
- accessible buttons;
- appropriate ARIA only where necessary.

Images should have meaningful alternative text when appropriate.

Icon-only controls should have accessible labels.

---

# 23. SECURITY

Frontend security requirements include:

- never expose secrets;
- never trust frontend authorization;
- validate user input;
- validate uploaded files;
- avoid unsafe HTML rendering;
- avoid unnecessary local storage of sensitive information;
- use HTTPS in production;
- handle authentication failures correctly.

The backend remains responsible for:

- authorization;
- permission enforcement;
- validation;
- secure data access.

---

# 24. ENVIRONMENT CONFIGURATION

Use environment variables for environment-specific frontend configuration.

Example:

```env
VITE_API_BASE_URL=
VITE_WS_URL=
```

Provide:

```text
.env.example
```

Never commit sensitive secrets.

Remember that Vite frontend environment variables are generally exposed to the browser.

---

# 25. TESTING

Frontend implementation must include appropriate tests.

Test:

- authentication;
- protected routes;
- API integration;
- major components;
- forms;
- validation;
- feed;
- posts;
- profile;
- follow/unfollow;
- notifications;
- chat;
- error states;
- loading states.

Existing tests must continue passing.

New functionality should include appropriate regression coverage.

---

# 26. CODE QUALITY

Frontend code must be:

- readable;
- modular;
- maintainable;
- reusable;
- consistently named;
- free from unnecessary duplication.

Avoid:

- giant components;
- giant files;
- duplicated API logic;
- duplicated UI logic;
- unused imports;
- dead code;
- hardcoded API URLs;
- hardcoded credentials;
- unnecessary dependencies.

---

# 27. ANTIGRAVITY IMPLEMENTATION RULES

When implementing the frontend:

### MUST

- Read `frontendReadme.md`.
- Read `frontendStandard.md`.
- Read root `readme.md`.
- Read root `standard.md`.
- Inspect the completed backend.
- Inspect backend documentation.
- Inspect the existing frontend before modifying it.
- Reuse working code where appropriate.
- Follow actual backend API contracts.
- Preserve working functionality.
- Run tests after significant changes.
- Run the production build before declaring completion.
- Fix discovered regressions.

### MUST NOT

- Rewrite the entire project unnecessarily.
- Delete working features.
- Replace the backend.
- Create fake APIs as a permanent solution.
- Invent unsupported backend features.
- introduce Docker.
- introduce microservices unnecessarily.
- replace the existing architecture without justification.
- hardcode credentials.
- use sequential numeric IDs for entities.
- bypass backend authorization.
- declare a feature complete without testing it.

---

# 28. BACKEND INTEGRATION RULE

The frontend should not modify backend code merely to make frontend implementation easier.

If a genuine backend integration issue is discovered:

1. Identify the issue.
2. Verify the backend contract.
3. Determine whether the issue is frontend or backend.
4. Prefer fixing the frontend if the backend is already correct.
5. Modify backend only when a real backend defect exists.
6. Document any backend change.

---

# 29. IMPLEMENTATION PHASES

Frontend development should proceed in controlled phases.

## PHASE 1 — Frontend Foundation

Implement:

- project structure;
- routing;
- API client;
- environment configuration;
- global styles;
- design system;
- reusable components;
- error handling foundation.

---

## PHASE 2 — Authentication

Implement:

- login;
- registration;
- authentication state;
- protected routes;
- logout;
- session handling;
- authentication error handling.

---

## PHASE 3 — Application Shell

Implement:

- navbar;
- sidebar;
- mobile navigation;
- main layout;
- route layout;
- responsive shell.

---

## PHASE 4 — User/Profile

Implement:

- profile;
- edit profile;
- avatar;
- user information;
- followers;
- following;
- follow/unfollow.

---

## PHASE 5 — Posts

Implement:

- create post;
- media upload;
- post display;
- post details;
- edit/delete where supported;
- likes;
- saves;
- comments.

---

## PHASE 6 — Feed

Implement:

- home feed;
- pagination;
- infinite scroll where appropriate;
- loading states;
- empty states;
- error handling.

---

## PHASE 7 — Stories & Reels

Implement backend-supported:

- stories;
- story viewer;
- story creation;
- reels;
- reel viewing;
- interactions.

---

## PHASE 8 — Explore & Search

Implement:

- search;
- user discovery;
- content discovery;
- explore page;
- optimized search requests.

---

## PHASE 9 — Notifications

Implement:

- notification list;
- read/unread state;
- real-time notifications where supported;
- navigation.

---

## PHASE 10 — Messaging

Implement:

- conversations;
- messages;
- WebSocket integration;
- unread state;
- typing/online status where supported;
- reconnection.

---

## PHASE 11 — Settings & Privacy

Implement all backend-supported settings and privacy controls.

---

## PHASE 12 — Moderation

Implement authorized moderation/admin functionality.

---

## PHASE 13 — UX & Responsive Refinement

Review:

- desktop;
- tablet;
- mobile;
- accessibility;
- loading;
- error;
- empty states;
- animations;
- transitions;
- visual consistency.

---

## PHASE 14 — Performance

Review:

- bundle size;
- rendering;
- API requests;
- media;
- lazy loading;
- caching;
- pagination.

---

## PHASE 15 — Testing

Run:

- unit tests;
- component tests;
- integration tests;
- API integration tests;
- authentication tests;
- responsive verification.

---

## PHASE 16 — Production Verification

Run:

```bash
npm run build
```

Verify:

- no compilation errors;
- no runtime errors;
- no broken routes;
- no missing assets;
- no broken API calls;
- no authentication issues;
- no console-critical errors.

---

# 30. DEFINITION OF DONE

A frontend feature is NOT complete simply because its screen exists.

A feature is complete only when:

```text
UI                       ✅
Routing                  ✅
API Integration          ✅
Authentication           ✅
UUID Handling            ✅
Validation               ✅
Loading State             ✅
Error State               ✅
Empty State               ✅
Responsive UI             ✅
Accessibility             ✅
Performance               ✅
Tests                     ✅
Production Build          ✅
```

---

# 31. FINAL FRONTEND COMPLETION CHECKLIST

Before declaring the frontend complete:

## Architecture

- [ ] Modular architecture
- [ ] Clear feature boundaries
- [ ] Reusable components
- [ ] Centralized API layer
- [ ] Centralized routing
- [ ] Proper state management

## Authentication

- [ ] Login
- [ ] Registration
- [ ] Logout
- [ ] Protected routes
- [ ] Session handling
- [ ] Unauthorized handling

## Social Features

- [ ] Profiles
- [ ] Follow/unfollow
- [ ] Followers
- [ ] Following
- [ ] Posts
- [ ] Likes
- [ ] Comments
- [ ] Saves
- [ ] Feed
- [ ] Search
- [ ] Explore

## Advanced Features

- [ ] Stories
- [ ] Reels
- [ ] Notifications
- [ ] Messaging
- [ ] WebSocket
- [ ] Settings
- [ ] Privacy
- [ ] Moderation

## Quality

- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Responsive design
- [ ] Accessibility
- [ ] Performance optimization
- [ ] Security review
- [ ] Test coverage
- [ ] Production build

---

# 32. FINAL IMPLEMENTATION PRINCIPLE

The goal is not merely to create an Instagram-looking interface.

The goal is to create a complete, maintainable, scalable frontend application that correctly communicates with the completed backend.

Therefore:

```text
Backend Contract
       ↓
API Layer
       ↓
Feature Services
       ↓
State
       ↓
Reusable Components
       ↓
Pages
       ↓
Responsive UI
       ↓
Testing
       ↓
Production
```

Every implementation decision should preserve this separation.

The frontend must remain:

**Modular + Maintainable + Responsive + Secure + Testable + API-driven + Production-ready.**

---

# 33. DOCUMENT STATUS

```text
Document: frontendReadme.md
Purpose: Frontend Requirements & Implementation Specification
Scope: Complete Frontend
Current Phase: Frontend
Backend: Completed / Integration Target
Identifier Strategy: UUID
Architecture: React Feature-Based Architecture
Status: ACTIVE
```

**END OF FRONTEND REQUIREMENTS**