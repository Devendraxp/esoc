# EKO

[![GitHub stars](https://img.shields.io/github/stars/Devendraxp/esoc?style=social)](https://github.com/Devendraxp/esoc/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/Devendraxp/esoc)](https://github.com/Devendraxp/esoc/issues)
[![Commit activity](https://img.shields.io/github/commit-activity/m/Devendraxp/esoc)](https://github.com/Devendraxp/esoc/pulse)

> AI-powered news and community intelligence platform that transforms community conversations into actionable insights.

## 📚 Table of Contents

1. [Overview](#-overview)
2. [Hosted URL](#-hosted-url)
3. [Tech Stack](#-tech-stack)
4. [Project Structure](#-project-structure)
5. [Prerequisites](#-prerequisites)
6. [Local Setup](#-local-setup)
7. [Running the App](#-running-the-app)
8. [API Reference](#-api-reference)
9. [Deployment](#-deployment)
10. [Troubleshooting](#-troubleshooting)
11. [Contributing](#-contributing)
12. [Support & Contact](#-support--contact)

## 🔎 Overview

EKO aggregates, analyzes, and contextualizes community-driven news and discussions using AI. Key features include:

- AI-powered news aggregation and analysis.
- Semantic search across conversations and documents.
- Intelligent content moderation.
- Community analytics and trending topics.
- Multi-model AI integration (OpenAI, Gemini, Hugging Face).
- Real-time posting and nested comment threads.
- Media hosting with Cloudinary CDN.

## 🌐 Hosted URL

| Surface | URL |
|---------|-----|
| Production | https://eko.devendrajat.com |

## 🛠 Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 15 + React 19 |
| Database | MongoDB 6.15 |
| AI Services | OpenAI, Hugging Face, Gemini |
| Authentication | Clerk |
| Media Storage | Cloudinary |
| Deployment | Vercel Edge Network |
| Build Tool | Turbopack |
| Styling | Tailwind CSS 4 |

## 🗂 Project Structure

```
eko/
├─ app/                     # Next.js application routes
│  ├─ api/                  # API endpoints
│  ├─ (auth)/               # Authentication pages
│  ├─ (dashboard)/          # Dashboard interface
│  └─ layout.tsx            # Root layout component
├─ src/
│  ├─ components/           # React components
│  ├─ lib/                  # Utilities and helpers
│  ├─ models/               # Database schemas
│  ├─ services/             # External service integrations
│  └─ types/                # TypeScript definitions
├─ public/                  # Static assets
└─ config/                  # Configuration files
```

## 🧰 Prerequisites

- Node.js **18+**
- MongoDB **6.0+**
- npm, yarn, or pnpm

## 💻 Local Setup

```bash
# Clone repository
git clone https://github.com/Devendraxp/esoc.git
cd esoc

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
```

### Environment Variables

Create `.env.local` with the following:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eko

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxx
CLERK_SECRET_KEY=sk_live_xxxxxxxx

# AI Services
OPENAI_API_KEY=sk-proj-xxxxxxxx
GEMINI_API_KEY=xxxxxxxx
HUGGINGFACE_API_KEY=hf_xxxxxxxx

# Media (Cloudinary)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=xxxxxxxx
CLOUDINARY_API_SECRET=xxxxxxxx

# Application
NEXT_PUBLIC_APP_URL=https://eko.devendrajat.com
NODE_ENV=production
```

## ▶️ Running the App

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
npm run lint:fix
```

## 🔌 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | User login |
| `POST` | `/api/auth/register` | User registration |
| `GET` | `/api/auth/session` | Validate session |

### Content Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/posts` | List posts (paginated) |
| `POST` | `/api/posts` | Create new post |
| `PUT` | `/api/posts/:id` | Update post |
| `DELETE` | `/api/posts/:id` | Delete post |

### AI Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/analyze` | Analyze content |
| `POST` | `/api/ai/search` | Semantic search |
| `GET` | `/api/ai/trends` | Get trending topics |

### Rate Limits

| User Type | Limit |
|-----------|-------|
| Authenticated | 100 requests/min |
| Unauthenticated | 20 requests/min |
| API keys | 1000 requests/min |

## 🚀 Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add MONGODB_URI production
vercel env add OPENAI_API_KEY production
```

Ensure all environment variables are configured in Vercel project settings.

## 🔧 Troubleshooting

### Database Connection Issues

```bash
# Test MongoDB connection
npm run test:db

# Verify connection string
echo $MONGODB_URI | grep mongodb
```

### Build Failures

```bash
# Clear cache and rebuild
rm -rf .next
rm -rf node_modules/.cache
npm ci
npm run build
```

### Authentication Errors

1. Verify Clerk dashboard configuration.
2. Check environment variables.
3. Validate redirect URIs in Clerk settings.
4. Clear browser cache and cookies.

## 🤝 Contributing

We welcome pull requests! Please open an issue first to discuss proposed changes.

## 📬 Support & Contact

- Create an [issue](https://github.com/Devendraxp/esoc/issues/new) for bugs or feature requests.
- For security concerns, reach out privately via repo contact info.

---

**Built with Next.js, MongoDB, and AI services.**
