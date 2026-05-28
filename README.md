# Nocturne - Premium Full-Stack Social Media Web Application

Nocturne is a high-fidelity, secure, and modern mini social media web application designed from scratch. It features user authentication with secure `httpOnly` cookie sessions, a responsive mobile-first glassmorphic UI, a comprehensive followers/following feed, comments timelines, interactive likes, and creators search discovery.

---

## Technical Stack & Features

- **Frontend:** Vanilla HTML5, elegant modern styling (Glassmorphism, Indigo themes), and SPA routing with vanilla JavaScript.
- **Backend:** Node.js, Express.js web framework.
- **Security:** Helmet secure headers with custom CSP, CORS origin locking with credentials support, and JWT security via server-signed `httpOnly` cookies (Samesite=Strict) to mitigate XSS/CSRF vectors.
- **Database:** MongoDB with Mongoose schemas, featuring cascading deletions on post removals, idempotent follower guards, and standardized paginated list feeds.
- **Design Tokens:** Mapped strictly to the Nocturne design system generated via **Stitch MCP**.

---

## Prerequisites

Ensure you have the following installed on your machine:
1. **Node.js** (v16.x or higher recommended)
2. **MongoDB** (Local instance running on `mongodb://127.0.0.1:27017` or a remote MongoDB Atlas URI)

---

## Installation & Setup

1. **Clone & Navigate:** Ensure your files are structured in your working directory.
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Environment Configuration:**
   Copy the `.env.example` file to create a local `.env` file:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your details:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/social_media
   JWT_SECRET=your_jwt_secret_here
   CLIENT_URL=http://localhost:5000
   NODE_ENV=development
   ```

---

## How to Run

### Development Mode (with hot-reloading)
```bash
npm run dev
```
The server will boot up at `http://localhost:5000`. Open this URL in your web browser to enjoy the high-fidelity SPA.

### Production Mode
```bash
npm start
```

---

## API Route Reference Table

All API requests return JSON envelopes. Protected routes require a valid `token` cookie containing a signed JWT.

| HTTP Method | Endpoint | Protected? | Description |
| :--- | :--- | :---: | :--- |
| **POST** | `/api/auth/register` | No | Registers a new user, hashes password, signs JWT, and sets the secure session cookie. |
| **POST** | `/api/auth/login` | No | Authenticators email/password, signs JWT, sets the secure session cookie. |
| **POST** | `/api/auth/logout` | No | Clears the JWT `token` session cookie. |
| **GET** | `/api/auth/me` | Yes | Retrieves profile details of the currently signed-in user. |
| **GET** | `/api/users` | No | Retrieves all registered creators (Explore list), paginated (20 per page). |
| **GET** | `/api/users/:username` | No | Retrieves public profile bio details, follower counts, and all posts of the given creator. |
| **PATCH** | `/api/users/me` | Yes | Updates current user's profile bio (max 200 chars) and/or avatarUrl. |
| **POST** | `/api/users/:id/follow` | Yes | Idempotently follows a creator using database-level `$addToSet`. Prevents self-following. |
| **POST** | `/api/users/:id/unfollow` | Yes | Unfollows a creator using database-level `$pull`. |
| **POST** | `/api/posts` | Yes | Creates a new text post (max 280 chars) with an optional image URL. |
| **GET** | `/api/posts` | No | Retrieves all posts for discovery, paginated (20 per page, sorted newest first). |
| **GET** | `/api/posts/:id` | No | Retrieves single post detail along with its chronologically sorted comment thread. |
| **DELETE** | `/api/posts/:id` | Yes | Deletes a post. Cascade deletes all associated comments. Enforces author verification (403). |
| **POST** | `/api/posts/:id/like` | Yes | Idempotently toggles a like for a post. Returns the updated like counts. |
| **POST** | `/api/posts/:id/comments` | Yes | Adds a new comment (max 500 chars) to the specified post thread. |
| **GET** | `/api/posts/:id/comments` | No | Retrieves all comments for a post populated with author names and avatars. |
| **DELETE** | `/api/comments/:id` | Yes | Deletes a comment. Enforces author verification (403). |
| **GET** | `/api/feed` | Yes | Retrieves home feed of followed creator posts, paginated (20 per page, sorted newest first). |

---

## Verification & Sanity Checks

1. **Security:** Check security headers on `http://localhost:5000` via Chrome DevTools. `X-Frame-Options`, `Content-Security-Policy`, and cookie `HttpOnly` settings are active.
2. **Cascading Deletions:** Deleting a post automatically purges matching Comment entries from the database.
3. **Double Likes Prevention:** Likes toggle natively via array indices checks, avoiding multiple likes by the same user.
4. **Alphanumeric Rules:** Usernames are strictly validated at schema level, matching `/^[a-zA-Z0-9]+$/` regex checks.
