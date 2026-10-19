# Instagram Clone — Frontend Engineering Standards

**Document:** `frontendStandard.md`  
**Project:** Instagram Clone  
**Layer:** Frontend  
**Technology:** React + Vite  
**Architecture:** Modular Feature-Based Architecture  
**Backend:** Spring Boot REST API  
**Real-Time:** WebSocket  
**Identifier:** UUID  
**Status:** MANDATORY

---

# 1. PURPOSE

This document defines the mandatory engineering standards for the Instagram Clone frontend.

It governs:

- Architecture
- React development
- Component design
- Folder structure
- Naming
- API integration
- Authentication
- UUID handling
- State management
- Routing
- UI/UX
- Responsive design
- Accessibility
- Security
- Performance
- Media handling
- WebSocket integration
- Error handling
- Testing
- Environment configuration
- Code review
- Production readiness

`frontendReadme.md` defines **what must be built**.

`frontendStandard.md` defines **how it must be built**.

---

# 2. SOURCE OF TRUTH HIERARCHY

When implementing the frontend, follow this priority:

```text
1. Actual Backend API Contract
2. Backend Implementation
3. Project Documentation
4. frontendReadme.md
5. frontendStandard.md
6. Existing Working Frontend Code
7. General Engineering Judgment
```

When two documents appear to conflict, do not silently choose one.

Inspect the actual backend/API implementation and determine the correct contract.

Do not invent behavior unsupported by the project.

---

# 3. CORE PRINCIPLES

The frontend must follow:

```text
KISS
DRY
SOLID
Separation of Concerns
Single Responsibility
Composition over unnecessary inheritance
Reusable Components
API-driven Architecture
Security by Design
Responsive by Default
Accessibility by Default
Performance by Default
```

The frontend should be simple enough to understand and strong enough to scale.

Avoid unnecessary abstraction.

---

# 4. ARCHITECTURE STANDARD

Use a feature-oriented architecture.

Recommended:

```text
src/
├── api/
├── assets/
├── components/
├── config/
├── constants/
├── features/
├── hooks/
├── layouts/
├── pages/
├── routes/
├── services/
├── store/
├── utils/
├── App.jsx
└── main.jsx
```

## Responsibilities

### `api/`

Responsible for backend communication.

Examples:

```text
authApi
userApi
postApi
feedApi
commentApi
notificationApi
chatApi
```

---

### `components/`

Reusable UI components.

Examples:

```text
Button
Input
Modal
Avatar
Loader
Skeleton
Toast
Dropdown
```

---

### `features/`

Feature-specific implementation.

Example:

```text
features/
├── auth/
├── profile/
├── post/
├── feed/
├── story/
├── reel/
├── search/
├── notification/
└── chat/
```

Feature-specific UI, hooks and logic should remain close to that feature where practical.

---

### `pages/`

Route-level pages.

Examples:

```text
HomePage
LoginPage
ProfilePage
ExplorePage
MessagesPage
SettingsPage
```

Pages should compose components rather than contain the entire application logic.

---

### `services/`

Application-level services and infrastructure logic.

---

### `hooks/`

Reusable React hooks.

Examples:

```text
useAuth
useDebounce
useInfiniteScroll
useWebSocket
```

---

### `store/`

Global/client state only.

Do not place every server response into global state.

---

### `utils/`

Small reusable pure utilities.

Avoid turning `utils/` into a dumping ground.

---

# 5. COMPONENT STANDARDS

Components must have a clear responsibility.

Avoid giant components such as:

```text
Instagram.jsx
Home.jsx
Dashboard.jsx
```

containing hundreds or thousands of lines.

Instead:

```text
HomePage
 ├── Navbar
 ├── StoryList
 ├── Feed
 │    └── PostCard
 │         ├── PostHeader
 │         ├── PostMedia
 │         ├── PostActions
 │         └── CommentPreview
 └── Sidebar
```

---

# 6. COMPONENT SIZE

There is no absolute line-count rule.

However, if a component:

- handles multiple unrelated responsibilities;
- contains complex API logic;
- contains multiple large UI sections;
- contains complex state;
- becomes difficult to understand;

split it into smaller components/hooks/services.

Do not split components merely to satisfy an arbitrary line count.

---

# 7. COMPONENT REUSABILITY

Create reusable components when the same UI behavior appears in multiple places.

Examples:

```text
Button
Avatar
Modal
Input
PostCard
UserCard
FollowButton
LikeButton
LoadingState
ErrorState
EmptyState
```

Do not create excessive abstraction for one-off UI.

---

# 8. PROPS STANDARD

Props should be:

- explicit;
- meaningful;
- predictable;
- minimal.

Avoid passing huge objects when only a few fields are required.

Prefer:

```jsx
<UserCard
  userId={user.id}
  username={user.username}
  avatar={user.avatar}
/>
```

when appropriate instead of passing unrelated application state.

---

# 9. STATE MANAGEMENT STANDARD

Separate state into three categories.

## Local UI State

Use component state for:

- modal open/close;
- selected tab;
- input values;
- temporary UI state.

---

## Server State

Use an appropriate server-state approach for:

- posts;
- profiles;
- comments;
- notifications;
- search results;
- messages.

Avoid unnecessarily duplicating server data in multiple global stores.

---

## Global Client State

Use global state only when multiple unrelated components genuinely need the same client-side state.

Examples:

- authentication;
- theme;
- global UI state;
- application preferences.

---

# 10. API LAYER STANDARD

Components should not directly contain repeated raw HTTP requests.

Avoid:

```jsx
axios.get(...)
axios.post(...)
axios.delete(...)
```

throughout dozens of components.

Prefer:

```text
Component
    ↓
Feature Hook / Service
    ↓
API Module
    ↓
HTTP Client
    ↓
Backend
```

---

# 11. HTTP CLIENT STANDARD

Use one centralized HTTP client.

Configure:

- base URL;
- authentication;
- common headers;
- timeout;
- response handling;
- common error handling.

Do not hardcode:

```text
http://localhost:8080
```

throughout the project.

Use environment configuration.

---

# 12. API RESPONSE STANDARD

Do not assume response structure.

Always follow the actual backend contract.

If the backend returns:

```json
{
  "data": {},
  "message": "...",
  "success": true
}
```

then use that contract consistently.

If the backend returns a different structure, follow the actual backend structure.

Do not create frontend-only response assumptions.

---

# 13. UUID STANDARD

All persistent entity identifiers must be treated as UUIDs.

Examples:

```text
userId
postId
commentId
messageId
conversationId
storyId
reelId
notificationId
mediaId
```

Do not:

- convert UUIDs to numbers;
- parse UUIDs with `Number()`;
- assume sequential IDs;
- create fake numeric IDs.

Incorrect:

```javascript
const id = Number(user.id);
```

Correct:

```javascript
const id = user.id;
```

---

# 14. REACT LIST KEY STANDARD

Use stable backend identifiers.

Preferred:

```jsx
{posts.map(post => (
  <PostCard key={post.id} post={post} />
))}
```

Avoid:

```jsx
{posts.map((post, index) => (
  <PostCard key={index} post={post} />
))}
```

when a stable entity identifier is available.

---

# 15. ROUTING STANDARD

Routes must be centralized.

Use React Router or the project's approved routing system.

Separate:

```text
Public Routes
Protected Routes
Admin Routes
```

Protected routes must verify authentication state.

Admin routes must also verify the appropriate authorization state.

Frontend route protection is a UX mechanism.

Backend authorization remains mandatory.

---

# 16. AUTHENTICATION STANDARD

Authentication logic must not be duplicated across components.

Use a centralized authentication mechanism.

It should provide:

```text
Current User
Authentication Status
Login
Logout
Session Restoration
Authentication Error Handling
```

Components should consume authentication state rather than reimplementing authentication logic.

---

# 17. TOKEN STANDARD

Follow the backend's actual authentication contract.

Do not expose:

- JWT signing secrets;
- database credentials;
- backend private keys;
- encryption keys.

Never hardcode tokens.

Never commit real credentials.

---

# 18. AUTHORIZATION STANDARD

The frontend may hide UI elements based on user permissions.

However:

> Hiding a button is NOT authorization.

Every protected operation must still be enforced by the backend.

Never assume:

```text
User sees Delete button
=
User is authorized to delete
```

---

# 19. FORM STANDARD

Forms must:

- validate user input;
- show clear errors;
- disable submission when appropriate;
- show submission state;
- prevent accidental duplicate submissions;
- handle backend validation errors.

Avoid uncontrolled, inconsistent form behavior.

---

# 20. VALIDATION STANDARD

Frontend validation is for user experience.

Backend validation remains authoritative.

Validate appropriate:

```text
Required fields
Email
Username
Password
Length
Media type
Media size
Caption
Comment
Message
```

Do not duplicate complex backend business rules unnecessarily.

---

# 21. ERROR HANDLING STANDARD

Never expose raw backend errors directly to users.

Bad:

```text
org.hibernate...
SQLIntegrityConstraintViolationException...
```

Good:

```text
Unable to create post.
Please try again.
```

Log useful technical information appropriately while showing user-friendly messages.

---

# 22. HTTP ERROR STANDARD

Handle common statuses:

```text
400 → Invalid request
401 → Authentication required
403 → Permission denied
404 → Resource not found
409 → Conflict
422 → Validation error
429 → Too many requests
500 → Server error
```

Actual handling should follow the backend contract.

---

# 23. LOADING STANDARD

Every important asynchronous operation must provide feedback.

Examples:

```text
Loading...
Uploading...
Saving...
Sending...
Fetching...
```

For page-level content prefer skeletons where appropriate.

Avoid unnecessary full-screen spinners.

---

# 24. EMPTY STATE STANDARD

Collections should have meaningful empty states.

Examples:

```text
No posts yet.
No followers yet.
No notifications.
No messages.
No results found.
```

Where appropriate provide an action.

---

# 25. SUCCESS FEEDBACK

Important actions should provide feedback.

Examples:

```text
Post created
Profile updated
Comment added
Message sent
Settings saved
```

Use a consistent toast/notification mechanism.

Avoid excessive notifications.

---

# 26. MEDIA STANDARD

Before uploading media:

- validate type (whitelisted image and video formats);
- validate size limits (image ≤ 10MB, video ≤ 50MB);
- show preview where appropriate with instant object URLs;
- revoke object URLs on cleanup to avoid browser memory leaks;
- delegate upload operations strictly to `media.service.js`;
- handle upload failure and rate limits (429 HTTP responses);
- show progress indicators where available.

Do not trust frontend file validation as security. Backend must validate uploaded content.

---

# 26.1 CLOUDINARY DELIVERY & RENDERING STANDARD

- **No Secrets on Client:** Never import or expose Cloudinary API secrets in frontend code or environment files.
- **Secure URLs:** Always render media using the backend-provided HTTPS `secureUrl`.
- **Lazy Loading:** All feed images and non-critical assets must use `loading="lazy"`.
- **Responsive Layout:** Specify `aspect-ratio` or fixed dimensions to prevent layout shifts during image rendering.
- **Video Playback:** Ensure browser-compatible playback with posters/thumbnails where available, and avoid auto-downloading non-visible videos.

---

# 27. IMAGE STANDARD

Images should:

- use meaningful alt text where appropriate;
- use lazy loading when appropriate;
- avoid unnecessary original-resolution loading;
- preserve aspect ratio;
- avoid layout shifts where possible.

Example:

```jsx
<img
  src={imageUrl}
  alt={description}
  loading="lazy"
/>
```

---

# 28. VIDEO STANDARD

Videos should:

- avoid unnecessary autoplay;
- respect browser policies;
- provide controls where appropriate;
- use lazy loading;
- avoid loading many videos simultaneously;
- clean up unnecessary resources.

Reels should use an optimized viewing experience.

---

# 29. RESPONSIVE DESIGN STANDARD

Use responsive layouts rather than separate duplicated applications.

Support:

```text
Mobile
Tablet
Laptop
Desktop
```

Avoid:

```text
Desktop-only implementation
```

or:

```text
Mobile-only implementation
```

---

# 30. MOBILE-FIRST UI

When practical, design layouts from the smallest supported viewport upward.

Mobile navigation should be intentionally designed.

Do not simply compress desktop navigation.

---

# 31. DESIGN SYSTEM STANDARD

Maintain consistent:

- colors;
- typography;
- spacing;
- borders;
- radius;
- shadows;
- buttons;
- inputs;
- icons;
- cards;
- modals.

Do not randomly introduce different visual styles throughout the application.

---

# 32. COLOR STANDARD

Colors should be defined centrally.

Avoid scattering arbitrary color values across dozens of components.

Prefer:

```text
Primary
Secondary
Background
Surface
Text
Muted Text
Border
Success
Warning
Error
```

If the project supports dark mode, both themes must use the same design-token structure.

---

# 33. TYPOGRAPHY STANDARD

Define a consistent typography system.

Include:

```text
Heading
Subheading
Body
Caption
Label
Button
```

Avoid using arbitrary font sizes for every component.

---

# 34. ICON STANDARD

Use one consistent icon system.

Do not mix multiple unrelated icon libraries without a reason.

Icon-only buttons must have accessible labels.

---

# 35. ANIMATION STANDARD

Animations should improve UX.

Use animation for:

- transitions;
- modal appearance;
- loading;
- interaction feedback;
- navigation.

Avoid excessive animations that:

- slow interaction;
- distract users;
- reduce accessibility;
- hurt performance.

Respect reduced-motion preferences where appropriate.

---

# 36. ACCESSIBILITY STANDARD

Use:

- semantic HTML;
- keyboard navigation;
- visible focus;
- labels;
- alt text;
- accessible dialogs;
- accessible buttons;
- appropriate ARIA.

Do not use ARIA as a replacement for semantic HTML when semantic HTML is sufficient.

---

# 37. SEARCH STANDARD

Search requests must be debounced.

Example flow:

```text
User types
   ↓
Debounce
   ↓
API request
   ↓
Results
```

Handle:

- empty query;
- loading;
- errors;
- no results;
- stale results.

---

# 38. PAGINATION STANDARD

Large collections must not be loaded indefinitely.

Use:

- page-based pagination;
- cursor pagination;
- infinite scrolling;

according to backend support.

Never assume the frontend can request unlimited records.

---

# 39. FEED STANDARD

Feed rendering must be optimized.

Use:

- pagination;
- lazy loading;
- stable keys;
- optimized media;
- minimal unnecessary re-renders.

Do not request the same feed repeatedly without reason.

---

# 40. WEBSOCKET STANDARD

Use one appropriate real-time connection strategy.

Handle:

```text
Connect
Authenticate
Subscribe
Receive
Send
Reconnect
Disconnect
Error
Cleanup
```

Avoid multiple duplicate connections.

Clean up subscriptions when components unmount.

---

# 41. WEBSOCKET SECURITY

Never assume that a frontend subscription is authorized.

Backend must verify:

- user identity;
- conversation membership;
- resource ownership;
- permissions.

The frontend must correctly respond to authorization failures.

---

# 42. CHAT STANDARD

Chat UI should separate:

```text
Conversation List
Active Conversation
Message History
Message Composer
Connection State
```

Handle:

- sending;
- receiving;
- retries;
- duplicate messages;
- reconnect;
- unread count;
- timestamps.

Follow actual backend event contracts.

---

# 43. PERFORMANCE STANDARD

Optimize based on actual need.

Use:

- lazy loading;
- code splitting;
- memoization when justified;
- caching;
- pagination;
- debouncing;
- optimized media;
- efficient rendering.

Do not add memoization everywhere without measuring or having a clear reason.

---

# 44. CODE SPLITTING

Large features may be lazy-loaded.

Examples:

```text
Messages
Settings
Admin
Moderation
Reels
```

Do not delay loading critical application functionality unnecessarily.

---

# 45. DEPENDENCY STANDARD

Before adding a dependency:

1. Check whether the project already has equivalent functionality.
2. Check whether native React/browser functionality is sufficient.
3. Check bundle impact.
4. Check maintenance quality.
5. Add only when justified.

Do not install libraries simply because they are popular.

---

# 46. ENVIRONMENT STANDARD

Use:

```text
.env
.env.example
```

Example:

```env
VITE_API_BASE_URL=
VITE_WS_URL=
```

Never commit secrets.

Remember:

> Frontend environment variables are not secret.

Anything shipped to the browser can potentially be inspected by users.

---

# 47. LOGGING STANDARD

Do not leave uncontrolled debugging statements in production code.

Avoid:

```javascript
console.log(...)
```

for permanent debugging.

Remove temporary debugging before completion.

Never log:

- passwords;
- tokens;
- sensitive personal information;
- secrets.

---

# 48. FILE AND FOLDER NAMING

Use consistent naming.

Recommended:

```text
PascalCase
```

for React components:

```text
PostCard.jsx
ProfilePage.jsx
MessageBubble.jsx
```

Use:

```text
camelCase
```

for functions/variables:

```text
fetchPosts
currentUser
handleSubmit
```

Use meaningful names.

Avoid:

```text
abc.jsx
test2.jsx
temp.jsx
newFile.jsx
```

---

# 49. FUNCTION STANDARD

Functions should have one clear responsibility.

Avoid functions that simultaneously:

- call multiple unrelated APIs;
- transform complex data;
- update multiple global states;
- render UI;
- perform navigation.

Split responsibilities when necessary.

---

# 50. CUSTOM HOOK STANDARD

Create a custom hook when logic is reusable or complex.

Examples:

```text
useAuth()
useDebounce()
useInfiniteScroll()
useMediaQuery()
useWebSocket()
```

Hooks should not contain unrelated responsibilities.

---

# 51. UTILITY STANDARD

Utilities should preferably be:

- pure;
- predictable;
- reusable;
- easy to test.

Example:

```text
formatDate()
formatCount()
validateEmail()
truncateText()
```

Avoid putting API calls into generic utility functions.

---

# 52. API DATA TRANSFORMATION

If backend data requires transformation for presentation, perform it in an appropriate service/adapter/hook layer.

Do not repeat transformations throughout UI components.

---

# 53. DATE AND TIME

Do not manually manipulate timestamps inconsistently.

Use a consistent date/time strategy.

Display dates in a user-friendly format.

Respect timezone information returned by the backend.

---

# 54. ACCESS CONTROL UI

For roles/permissions:

```text
Authentication
      ↓
Current User
      ↓
Permissions
      ↓
UI Visibility
```

But always remember:

```text
Frontend permission check
≠
Backend authorization
```

---

# 55. NO BUSINESS LOGIC DUPLICATION

The frontend may perform presentation logic.

It should not independently reimplement backend business rules.

Bad:

```text
Frontend calculates whether a user is legally allowed
to perform a business operation.
```

Correct:

```text
Frontend requests operation
        ↓
Backend validates business rule
        ↓
Frontend displays result
```

---

# 56. DATA CONSISTENCY

When an action changes server state:

```text
Like
Follow
Save
Comment
Delete
Update Profile
```

the UI must correctly synchronize with the backend state.

Do not simply change UI state permanently without considering API success/failure.

---

# 57. OPTIMISTIC UI

Optimistic updates may be used for interactions such as:

- Like;
- Follow;
- Save;

when appropriate.

But failed requests must rollback the optimistic state.

Do not use optimistic updates for operations where incorrect temporary state could create serious consequences.

---

# 58. DUPLICATE REQUEST PREVENTION

Prevent accidental duplicate operations.

Examples:

- double-clicking submit;
- repeated follow;
- repeated post creation;
- repeated message send.

Disable or guard actions when appropriate.

---

# 59. SECURITY AGAINST XSS

Do not render arbitrary HTML.

Avoid:

```jsx
dangerouslySetInnerHTML
```

unless there is a clear requirement and the content is properly sanitized.

User-generated content must be treated as untrusted.

---

# 60. USER-GENERATED CONTENT

Treat all user content as untrusted:

```text
Username
Bio
Caption
Comment
Message
Post content
Search input
```

Never assume user-provided content is safe.

---

# 61. FRONTEND/BACKEND RESPONSIBILITY

### Frontend

Responsible for:

```text
Presentation
Interaction
Client validation
State
Routing
API communication
UX
Accessibility
```

### Backend

Responsible for:

```text
Authentication
Authorization
Business rules
Database
Data validation
Security enforcement
Persistence
Events
```

Never move backend security logic into frontend code.

---

# 62. TESTING STANDARD

Tests should cover behavior, not implementation details unnecessarily.

Test:

- user interactions;
- API behavior;
- route protection;
- validation;
- loading;
- error states;
- important feature flows.

Avoid tests that break simply because internal component structure changes.

---

# 63. TEST PYRAMID

Prefer:

```text
        E2E
       /   \
 Integration
   /       \
 Unit / Component
```

Use the appropriate level for each behavior.

Do not make every test an expensive end-to-end test.

---

# 64. PRODUCTION BUILD STANDARD

Before completion:

```bash
npm run build
```

must succeed.

Also verify:

- no broken imports;
- no missing environment variables;
- no critical console errors;
- no broken routes;
- no broken API URLs;
- no production-only runtime failures.

---

# 65. GIT STANDARD

Do not commit:

```text
.env
node_modules/
dist/
credentials
tokens
private keys
temporary files
debug artifacts
```

Use `.gitignore`.

Commit meaningful changes.

Avoid huge commits containing unrelated modifications.

---

# 66. DOCUMENTATION STANDARD

When a major frontend architectural decision changes:

1. Update relevant documentation.
2. Keep documentation consistent with implementation.
3. Do not leave obsolete instructions.

The documentation must describe the actual system.

---

# 67. ANTIGRAVITY AGENT RULES

Antigravity must follow these rules when modifying the frontend.

## Before coding

It MUST:

1. Read `frontendReadme.md`.
2. Read `frontendStandard.md`.
3. Read root `readme.md`.
4. Read root `standard.md`.
5. Inspect existing frontend code.
6. Inspect backend APIs.
7. Identify existing functionality.
8. Identify missing functionality.
9. Avoid rewriting working code.

---

## During coding

It MUST:

- work incrementally;
- preserve working functionality;
- reuse existing components where appropriate;
- follow project conventions;
- use real APIs;
- use UUID;
- maintain responsive behavior;
- handle errors;
- test significant changes.

---

## After coding

It MUST:

- run tests;
- run production build;
- inspect runtime errors;
- fix regressions;
- verify API integration;
- verify protected routes;
- verify responsive layouts;
- report actual results.

---

# 68. FORBIDDEN PRACTICES

The frontend MUST NOT:

- hardcode backend URLs throughout components;
- hardcode credentials;
- expose secrets;
- use sequential IDs for entities;
- trust frontend authorization;
- permanently depend on fake APIs;
- duplicate business logic unnecessarily;
- create giant components;
- create unnecessary global state;
- create unnecessary dependencies;
- ignore backend validation errors;
- ignore loading/error states;
- ignore mobile layouts;
- leave debugging logs;
- delete working functionality without justification;
- rewrite the entire frontend unnecessarily.

---

# 69. DEFINITION OF CODE COMPLETE

Code is complete only when:

```text
Architecture       ✅
Functionality      ✅
API Integration    ✅
Authentication     ✅
UUID Handling      ✅
Validation         ✅
Loading States     ✅
Error Handling     ✅
Empty States       ✅
Responsive UI      ✅
Accessibility      ✅
Performance        ✅
Security           ✅
Testing            ✅
Build              ✅
Documentation      ✅
```

---

# 70. FINAL ENGINEERING PRINCIPLE

The frontend should follow:

```text
Simple
        ↓
Modular
        ↓
Reusable
        ↓
Testable
        ↓
Secure
        ↓
Responsive
        ↓
Performant
        ↓
Production Ready
```

Do not optimize for the number of files.

Do not optimize for the number of libraries.

Do not optimize for the amount of code.

Optimize for:

**Correctness + Maintainability + User Experience + Security + Performance.**

---

# 71. FINAL STANDARD

The Instagram Clone frontend must be developed as a serious production-quality React application.

Every feature must integrate with the actual backend.

Every persistent entity must use UUID.

Every protected operation must respect backend authorization.

Every asynchronous operation must have appropriate loading and error handling.

Every major screen must work responsively.

Every significant feature must be testable.

The application must build successfully before being considered complete.

**END OF FRONTEND ENGINEERING STANDARDS**