# EKO

Community intelligence platform for crisis coordination. Turns local posts and discussions into searchable, AI-summarized situation reports with built-in misinformation detection, aid request tracking, and role-based moderation.

Live at https://eko.devendrajat.com

## Stack

- Next.js 15, React 19, Tailwind CSS 4
- MongoDB with Mongoose
- Clerk for auth and user sync
- Cloudinary for media (images, video, audio)
- Google Gemini for summaries and embeddings
- Hugging Face BART-large-MNLI for misinformation detection
- News API for external article aggregation
- Open-Meteo for location autocomplete

## Run

```bash
git clone https://github.com/Devendraxp/esoc.git
cd esoc
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

Server starts on http://localhost:3000.

## Environment Variables

```
MONGODB_URI=mongodb+srv://...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
GEMINI_API_KEY=AIza...
HUGGINGFACE_API_KEY=hf_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
NEWS_API_KEY=...
```

## Features

**Posts and comments** — Create location-tagged posts with media attachments. Like, dislike, and comment. Content is automatically scored for misinformation using zero-shot classification and flagged if confidence exceeds 75%.

**News tracker** — Semantic search across all posts and comments using Gemini embeddings and cosine similarity. Results are combined with external news articles and summarized by Gemini into a situation report. A background scheduler indexes new content automatically.

**Aid requests** — Users submit aid requests for a region. Requests move through a status pipeline: pending, approved, denied, received, prepared, shipped, delivered, completed. Admins and special users manage the workflow.

**Reports and moderation** — Any user can report a post or comment. Special users see reports in their region, admins see everything. Reports are marked as agreed, disagreed, or read.

**User roles** — Three roles: normal, special, admin. Normal users create content and request aid. Special users moderate their region. Admins have full access including user promotion, content processing triggers, and flagged post review. Users can request role upgrades.

## User Roles

| Role | Access |
|------|--------|
| Normal | Create posts, comment, like/dislike, report, request aid, query news |
| Special | Above + view regional reports, manage regional content |
| Admin | Above + manage all users, trigger content indexing, view flagged posts |

## API

### Posts

```
GET    /api/posts                    paginated post feed
POST   /api/posts                    create post (multipart form data)
GET    /api/posts/[id]               single post
POST   /api/posts/[id]/delete        delete post
POST   /api/posts/[id]/like          like post
POST   /api/posts/[id]/dislike       dislike post
GET    /api/posts/[id]/comments      comments on a post
POST   /api/posts/[id]/comments      add comment
GET    /api/posts/comments            list comments
GET    /api/posts/comments/[id]      single comment
POST   /api/posts/comments/[id]/delete   delete comment
```

### News Tracker

```
POST   /api/news-tracker/search          semantic search (query + location)
POST   /api/news-tracker/query           store query, get AI summary
GET    /api/news-tracker/history         user query history
POST   /api/news-tracker/process-content  trigger content indexing (admin)
```

### Aid Requests

```
GET    /api/aid-requests              user's aid requests
POST   /api/aid-requests              create aid request
GET    /api/aid-requests/all          all requests (admin)
POST   /api/aid-requests/[id]/approve approve request
POST   /api/aid-requests/[id]/deny    deny request
POST   /api/aid-requests/[id]/update  update request status
```

### Reports

```
GET    /api/reports                   reports (role-filtered)
POST   /api/reports                   submit report
GET    /api/reports/all               all reports (admin/special)
POST   /api/reports/handle            handle report
```

### Users

```
GET    /api/users                     list users (admin)
POST   /api/users                     sync user from Clerk
GET    /api/users/[id]                user profile
POST   /api/users/[id]/promote        promote user role
POST   /api/users/[id]/demote         demote user role
POST   /api/users/upgrade-request     request role upgrade
POST   /api/users/upgrade-requests    view upgrade requests (admin)
```

### Other

```
GET    /api/auth/me                   current user info
GET    /api/location-suggestions      location autocomplete
POST   /api/webhooks/clerk            Clerk webhook (user events)
GET    /api/admin/flagged             flagged posts (admin)
```

## Project Structure

```
src/
  app/
    api/          route handlers for all endpoints
    dashboard/    admin and special user dashboards
    posts/        post detail pages
    profile/      user profile and upgrade request
    news-tracker/ news search interface
    create-post/  post creation page
    apply-aid/    aid request form
  components/     UI components (cards, sidebar, modals, comments)
  models/         Mongoose schemas (User, Post, Comment, AidRequest, Report, NewsMemory, NewsQuery)
  lib/            embedding utilities
  utils/          Clerk helpers, Cloudinary upload, Gemini client, Hugging Face client, news scheduler
```

## Notes

- Misinformation scoring uses Hugging Face's zero-shot classification with labels: factual, misinformation, unverified. Posts scoring above 75% on a non-factual label are auto-flagged.
- The news scheduler runs in the background via middleware initialization. It indexes posts and comments into vector embeddings for semantic search.
- Clerk webhooks keep the local User model in sync with Clerk's user directory. Events handled: user.created, user.updated, user.deleted.
- Media uploads go through Cloudinary. Supported types: image, video, audio.
