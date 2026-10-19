# Instagram Clone â€” Frontend Architecture & Technical Design

**Document:** `frontendArchitecture.md`  
**Project:** Instagram Clone  
**Layer:** Client Application (React + Vite SPA)  
**State:** Production-Ready  
**Backend:** Spring Boot REST API + STOMP over SockJS WebSocket  
**Identifier System:** Immutable UUID (RFC 4122 v4)  

---

## 1. Overview & Architectural Goals

The frontend client is an Instagram Clone built with React 18, Vite, and modern CSS. It is structured around modular, feature-oriented design principles ensuring:
- **Strict Separation of Concerns:** Clear boundary separation between Presentation, State, Service/API, and Domain Entities.
- **Backend Contract Fidelity:** All REST endpoints and WebSocket channels strictly map to the completed Spring Boot backend without temporary mocks.
- **Consistent UUID Handling:** Persistent entity identifiers (User, Post, Comment, Story, Reel, Conversation, Message, Notification) remain unaltered as native strings; numeric conversion functions (`parseInt`, `Number`) are strictly forbidden.
- **Real-Time Communication:** Bi-directional messaging and read receipts powered by STOMP over SockJS with automatic reconnect and cleanup.
- **Resilient Error & Loading UX:** Unified handling of HTTP status codes (400, 401, 403, 404, 409, 422, 500) and optimistic UI updates for high-frequency actions (likes, follows, bookmarks).

---

## 2. Directory & File Organization

```text
frontend/
â”œâ”€â”€ public/                     # Static assets and icons
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ api/
â”‚   â”‚   â””â”€â”€ client.js           # Central Axios HTTP client & request/response interceptors
â”‚   â”œâ”€â”€ assets/                 # SVGs, brand assets, icons
â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”œâ”€â”€ common/             # Reusable UI widgets (Avatar, Button, Input, Modal, Skeleton)
â”‚   â”‚   â”œâ”€â”€ feed/               # Feed & post presentation (PostCard, StoryBar, FeedGrid)
â”‚   â”‚   â”œâ”€â”€ layout/             # Application shell (Sidebar, BottomNav, Header)
â”‚   â”‚   â”œâ”€â”€ messages/           # Chat window, message bubble, conversation list
â”‚   â”‚   â”œâ”€â”€ modals/             # Action dialogs (CreatePost, CreateStory, FollowList, PostDetail)
â”‚   â”‚   â”œâ”€â”€ profile/            # Profile header, grid tabs, edit modal
â”‚   â”‚   â”œâ”€â”€ reels/              # Reel viewer, snap container, action bar
â”‚   â”‚   â””â”€â”€ story/              # Story viewer, activity drawer, progress bars
â”‚   â”œâ”€â”€ constants/              # Route paths, API endpoints, storage keys, timings
â”‚   â”œâ”€â”€ context/
â”‚   â”‚   â”œâ”€â”€ AuthContext.jsx     # Authentication state, session hydration & follow synchronization
â”‚   â”‚   â””â”€â”€ ToastContext.jsx    # Global notification toasts
â”‚   â”œâ”€â”€ hooks/                  # Custom React hooks (useAuth, useToast, useDebounce, useIntersection)
â”‚   â”œâ”€â”€ pages/
â”‚   â”‚   â”œâ”€â”€ auth/               # LoginPage, RegisterPage
â”‚   â”‚   â”œâ”€â”€ explore/            # ExplorePage (discovery grid)
â”‚   â”‚   â”œâ”€â”€ feed/               # FeedPage (home chronological / algorithmic feed)
â”‚   â”‚   â”œâ”€â”€ messages/           # MessagesPage (chat conversations)
â”‚   â”‚   â”œâ”€â”€ notifications/      # NotificationsPage
â”‚   â”‚   â”œâ”€â”€ profile/            # ProfilePage
â”‚   â”‚   â”œâ”€â”€ reels/              # ReelsPage
â”‚   â”‚   â””â”€â”€ settings/           # SettingsPage, EditProfilePage
â”‚   â”œâ”€â”€ routes/
â”‚   â”‚   â”œâ”€â”€ AppRoutes.jsx       # Route declarations
â”‚   â”‚   â””â”€â”€ ProtectedRoute.jsx  # Authentication gatekeeper with redirect preservation
â”‚   â”œâ”€â”€ services/               # REST API domain services
â”‚   â”‚   â”œâ”€â”€ api.js              # Standardized API wrapper
â”‚   â”‚   â”œâ”€â”€ auth.service.js     # Login, register, me, refresh
â”‚   â”‚   â”œâ”€â”€ chat.service.js     # Conversations, messages, STOMP client
â”‚   â”‚   â”œâ”€â”€ comment.service.js  # Post comments, replies, deletion
â”‚   â”‚   â”œâ”€â”€ feed.service.js     # Feed retrieval, explore posts
â”‚   â”‚   â”œâ”€â”€ follow.service.js   # Follow, unfollow, follower lists
â”‚   â”‚   â”œâ”€â”€ notification.service.js # Notification polling & read status
â”‚   â”‚   â”œâ”€â”€ post.service.js     # Post CRUD, likes, saves
â”‚   â”‚   â”œâ”€â”€ reel.service.js     # Reel feed, video interactions
â”‚   â”‚   â”œâ”€â”€ search.service.js   # Debounced search (users & posts)
â”‚   â”‚   â”œâ”€â”€ settings.service.js # Password, privacy, blocked accounts
â”‚   â”‚   â”œâ”€â”€ story.service.js    # Story feed, create, view, viewers list
â”‚   â”‚   â””â”€â”€ user.service.js     # User profile, avatar upload
â”‚   â”œâ”€â”€ styles/                 # Global CSS variables, design tokens, resets
â”‚   â”œâ”€â”€ test/                   # Vitest unit & integration test suites
â”‚   â”œâ”€â”€ utils/                  # Formatting, date calculation, validation helpers
â”‚   â”œâ”€â”€ App.jsx                 # Application entry container & providers
â”‚   â””â”€â”€ main.jsx                # DOM mounting
â”œâ”€â”€ package.json
â””â”€â”€ vite.config.js
```

---

## 3. Component Architecture & Design Patterns

1. **Atomic Presentation vs. Smart Containers:**
   - Presentation components (e.g. `Avatar`, `Button`, `Input`, `LoadingSpinner`) are stateless and receive styling tokens and props.
   - Container components (e.g. `FeedPage`, `MessagesPage`, `StoryViewerModal`) coordinate service calls, handle error boundaries, and manage local modal/sheet states.
2. **Optimistic Updates:**
   - Post likes, comment likes, and bookmarking instantly mutate local React state and render micro-animations (e.g. heart pulse). If the backend API responds with an error, the state rolls back gracefully.
3. **Infinite Scrolling & Virtualization:**
   - Feeds utilize `IntersectionObserver` triggers at 80% viewport scroll thresholds, requesting paginated chunks (`page`, `size`) without unnecessary re-renders.

---

## 4. API & Service Architecture

All backend communication flows through a centralized HTTP client pipeline:

```text
Component / UI Trigger
         â”‚
         â–¼
Custom Hook / Domain Service (e.g. storyService.getStoryViewers)
         â”‚
         â–¼
Axios Instance (api.js / client.js)
  â”œâ”€ Request Interceptor: Injects Authorization: Bearer <jwt>
  â”œâ”€ Base URL Configuration: /api/v1 (proxied by Vite to port 8080)
  â””â”€ Response Interceptor: Normalizes ApiResponse<T> envelope & handles 401 token refresh
         â”‚
         â–¼
Spring Boot REST Controllers (port 8080)
```

### Standard Response Envelope
The backend formats responses in an `ApiResponse<T>` envelope:
```json
{
  "success": true,
  "message": "Operation completed",
  "data": { ... },
  "errors": [],
  "timestamp": "2026-10-05T18:24:05.444"
}
```
The response interceptor in `api.js` unpacks `response.data`, providing clean payloads directly to the feature layer.

---

## 5. State Management

The application separates state into four clear tiers:
1. **Global Authentication & Relationship State (`AuthContext.jsx`):**
   - Active user profile (`user`).
   - Authentication status (`isAuthenticated`).
   - Centralized follow status tracker (`following_ids` set cached in `localStorage`). This ensures that toggling "Follow" on a user card immediately reflects across all screens, profile headers, and story viewers without redundant API calls.
2. **Global Notification / UI State (`ToastContext.jsx`):**
   - Toast notifications, alert badges, and unread counters.
3. **Server State & Query Caches:**
   - Managed locally inside page/feature containers with explicit refresh signals (e.g. `story:refresh`, `chat:message`).
4. **Local Form & Modal State:**
   - Maintained with standard React `useState` and `useRef` (e.g., active story timer progress, audio mute toggle, drawer open/close).

---

## 6. Authentication & Session Life Cycle

1. **Login & Registration:**
   - Calls `POST /api/v1/auth/login` or `POST /api/v1/auth/register`.
   - Stores `access_token` and `refresh_token` securely in `localStorage`.
2. **Session Hydration (`me`):**
   - On page reload, `AuthContext` calls `GET /api/v1/auth/me`. If valid, user state is restored, and `GET /api/v1/users/{userId}/following` hydrates the follow cache.
3. **Silent Token Refresh:**
   - When an API request encounters HTTP 401, the response interceptor automatically pauses pending requests and invokes `POST /api/v1/auth/refresh` with the refresh token.
   - Upon successful refresh, the new access token is stored and failed requests are retried. If refresh fails, tokens are evicted and the user is redirected to `/login`.
4. **Route Protection:**
   - `ProtectedRoute.jsx` intercepts unauthorized requests and preserves `location.pathname` for seamless post-login redirection.

---

## 7. Real-Time WebSocket & Chat System

1. **Transport & Protocol:**
   - STOMP protocol over SockJS connected to `/ws`.
   - Proxied through Vite to `http://localhost:8080/ws`.
2. **Message Flow:**
   - **Send:** Dispatched to `/app/chat.sendMessage`.
   - **Subscribe:** Listens on `/user/queue/messages` and `/topic/chat.{conversationId}`.
3. **Read Receipts:**
   - Single grey tick: Dispatched by client.
   - Single dark tick: Received and acknowledged by server.
   - Double blue tick: Marked as read by recipient via `/app/chat.markRead`.
4. **Lifecycle & Clean Up:**
   - Subscriptions are tracked in `useRef` maps; switching active conversations un-subscribes from previous topics to prevent memory leaks and duplicate notifications.

---

## 8. Stories & Reels Architecture

### Stories
- **Feed Ring:** `StoryBar` queries `GET /api/v1/stories/feed` which returns active stories grouped by user (`UserStoriesResponse`).
- **Viewer:** `StoryViewerModal` controls 5-second automatic progression bars, tap navigation, pause-on-hold, keyboard navigation, and single-view deduplication (`viewedStoriesRef`).
- **Activity & Viewers:** Story owners can open the "Story Activity" slide-up drawer calling `GET /api/v1/stories/{storyId}/viewers`, rendering viewer profiles and view timestamps.

### Reels
- **Video Feed:** `ReelsPage` features full-height snap-scrolling.
- **Resource Management:** An `IntersectionObserver` auto-plays only the visible video and pauses off-screen reels, drastically reducing network and CPU overhead.

---

## 9. Error Handling & Edge Cases

| Scenario | Handling Strategy |
| :--- | :--- |
| **400 Bad Request** | Inline form feedback; toast notification with field-level details. |
| **401 Unauthorized** | Automatic refresh token exchange; fallback redirect to login. |
| **403 Forbidden** | User-friendly alert banner ("You do not have permission to view this resource"). |
| **404 Not Found** | Graceful empty-state card with fallback navigation. |
| **409 Conflict** | Specific conflict feedback (e.g., "Username already taken"). |
| **500 Server Error** | Generic toast ("Unable to complete request. Please try again later."). Raw stack traces are never exposed. |
| **Network Disconnect** | WebSocket retry with exponential backoff; offline toast indicators. |

---

## 10. Media Handling & Cloudinary Integration

- **Centralized Service:** `src/services/media.service.js` manages all media upload operations, metadata retrieval, and deletion requests.
- **Predictable Categories:** Modal uploads pass explicit categories:
  - `posts`: Standard post photos & videos (`instagram-clone/posts/{userId}`)
  - `avatar`: Profile picture replacements (`instagram-clone/users/{userId}/avatar`)
  - `stories`: 24-hour ephemeral photos/videos (`instagram-clone/stories/{userId}`)
  - `reels`: Vertical short videos with auto-extracted duration & poster thumbnails (`instagram-clone/reels/{userId}`)
- **Client-Side Pre-validation:** Validates file type (`image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `video/webm`) and enforces size constraints (10MB image, 50MB video) with immediate UI feedback and previews before network submission.
- **Multipart Upload Pipeline:** Submits `multipart/form-data` to `POST /api/v1/media`. Spring Boot performs server-side validation, applies Redis rate limiting, uploads to Cloudinary with UUID-partitioned folders, and persists metadata in MySQL.
- **Delivery & Transformations:** Uses HTTPS secure URLs (`secureUrl`), Cloudinary smart face-cropping for avatars (`c_fill,g_face`), auto quality/format (`q_auto,f_auto`), and video poster thumbnails (`so_0,w_600,c_limit`).
- **Resilient Error UX:** Automatically handles `413 Payload Too Large`, `429 Rate Limit Exceeded` (with `Retry-After` toast notification), and rollbacks optimistic states if an upload fails.
- **Zero Client Secrets:** No Cloudinary API secret or credentials are ever bundled into the client application.

---

## 11. Testing & Verification Strategy

- **Unit & Integration Tests:** Vitest + React Testing Library under `src/test/`.
  - Auth rendering, validations, session restore, route guards.
  - Chat rendering, message delivery, read status.
  - Common components (Avatar fallbacks, Modal triggers, Skeletons).
  - Utility helpers (UUID formatting, relative timestamps).
- **Build Verification:** Vite production bundling (`npm run build`) ensuring zero ESLint or build compilation failures.
