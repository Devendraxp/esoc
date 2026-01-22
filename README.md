# EKO - AI-Powered News & Community Intelligence Platform

<div align="center">

![EKO](https://img.shields.io/badge/EKO-AI_Powered_Platform-2563EB?style=for-the-badge&logo=vercel)
![Status](https://img.shields.io/badge/Status-Production_Ready-00C853?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-FF6B6B?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-4CAF50?style=for-the-badge)

**Transforming Community Conversations into Actionable Intelligence**

[Live Application](#live-application) • [Documentation](#documentation) • [Architecture](#architecture) • [API Reference](#api-reference) • [Deployment](#deployment)

</div>

---

## Overview

EKO is an enterprise-grade AI-powered platform that aggregates, analyzes, and contextualizes community-driven news and discussions. Leveraging advanced natural language processing and machine learning models, EKO transforms unstructured community conversations into structured, searchable intelligence for informed decision-making.

### Core Capabilities

- **AI-Powered News Aggregation**: Real-time collection and analysis of community discussions
- **Semantic Search Engine**: Context-aware search across conversations and documents
- **Intelligent Content Moderation**: Automated content validation and quality control
- **Community Analytics**: Insights into engagement patterns and trending topics
- **Multi-Model AI Integration**: Leverages multiple AI providers for optimal results

---

## Architecture

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend Framework | Next.js 15 + React 19 | Server-side rendering and component architecture |
| Database | MongoDB 6.15 | Document storage and retrieval |
| AI/ML Services | OpenAI, Hugging Face, Gemini | Natural language processing and analysis |
| Authentication | Clerk Enterprise | Secure user management and authentication |
| Media Storage | Cloudinary | Optimized media hosting and delivery |
| Deployment Platform | Vercel Edge Network | Global content delivery |
| Build System | Turbopack | Fast development and build processes |
| Styling | Tailwind CSS 4 | Utility-first CSS framework |

---

## Live Application

### Production Environment

- **Primary URL**: https://eko.devendrajat.com
- **Status**: ✅ Production • Active • Monitoring Enabled

| Metric | Specification |
|--------|---------------|
| Availability | 99.9% SLA |
| Average Response Time | < 200ms |
| CDN Coverage | 30+ global edge locations |
| Auto-scaling | Enabled |
| Security | Enterprise-grade SSL/TLS |

---

## Features

### 1. AI-Powered Intelligence

- Real-time news tracking and analysis
- Semantic similarity matching and content discovery
- Location-based content filtering
- Automated content indexing and moderation
- Multi-language support via AI translation

### 2. Community Collaboration

- Real-time posting and engagement systems
- Nested comment threads with moderation tools
- Content voting and sharing mechanisms
- User reputation and contribution tracking
- Mobile-optimized collaborative interfaces

### 3. Media Management

- Automated image optimization and compression
- Video hosting with adaptive streaming
- CDN-powered global content delivery
- Format conversion and optimization
- Secure media upload and storage

### 4. Security & Compliance

- Enterprise-grade authentication via Clerk
- JWT-based session management
- Rate limiting and API protection
- Environment-based secret management
- GDPR-compliant data handling

### 5. Performance Optimization

- Turbopack-based development tooling
- Automatic code splitting and lazy loading
- Intelligent caching strategies
- Database query optimization
- Edge computing for reduced latency

---

## Documentation

### Quick Start Guide

#### Prerequisites

- Node.js 18.x or later
- MongoDB 6.0 or later
- Package manager (npm, yarn, or pnpm)

#### Installation

```bash
# Clone repository
git clone https://github.com/Devendraxp/esoc.git
cd esoc

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
```

#### Environment Configuration

Create `.env.local` with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eko

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxx
CLERK_SECRET_KEY=sk_live_xxxxxxxx

# AI Services
OPENAI_API_KEY=sk-proj-xxxxxxxx
GEMINI_API_KEY=xxxxxxxx
HUGGINGFACE_API_KEY=hf_xxxxxxxx

# Media Management
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=xxxxxxxx
CLOUDINARY_API_SECRET=xxxxxxxx

# Application
NEXT_PUBLIC_APP_URL=https://eko.devendrajat.com
NODE_ENV=production
```

#### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Code quality checks
npm run lint
npm run lint:fix
```

---

## Project Structure

```
eko/
├── app/                    # Next.js application routes
│   ├── api/               # API endpoints
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard interface
│   └── layout.tsx         # Root layout component
├── src/                   # Source code
│   ├── components/        # React components
│   ├── lib/              # Utilities and helpers
│   ├── models/           # Database schemas
│   ├── services/         # External service integrations
│   └── types/            # TypeScript definitions
├── public/               # Static assets
└── config/              # Configuration files
```

---

## API Reference

### Core Endpoints

#### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | User authentication |
| `POST` | `/api/auth/register` | User registration |
| `GET` | `/api/auth/session` | Session validation |

#### Content Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/posts` | Retrieve posts with pagination |
| `POST` | `/api/posts` | Create new post |
| `PUT` | `/api/posts/:id` | Update existing post |
| `DELETE` | `/api/posts/:id` | Remove post |

#### AI Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/analyze` | Content analysis |
| `POST` | `/api/ai/search` | Semantic search |
| `GET` | `/api/ai/trends` | Trending topics analysis |

### Rate Limits

| User Type | Limit |
|-----------|-------|
| Authenticated users | 100 requests/minute |
| Unauthenticated users | 20 requests/minute |
| API keys | 1000 requests/minute |

---

## Deployment

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

### Environment Variables

Ensure all required environment variables are configured in the Vercel project settings.

### Monitoring

- Application performance via Vercel Analytics
- Error tracking with integrated logging
- Uptime monitoring configured
- Security scanning enabled

---

## Troubleshooting

### Common Issues

#### Database Connection

```bash
# Test MongoDB connection
npm run test:db

# Verify connection string format
echo $MONGODB_URI | grep mongodb
```

#### Build Failures

```bash
# Clear build cache
rm -rf .next
rm -rf node_modules/.cache

# Reinstall dependencies
npm ci

# Rebuild
npm run build
```

#### Authentication Errors

1. Verify Clerk dashboard configuration
2. Check environment variable accuracy
3. Validate redirect URIs in Clerk settings
4. Clear browser cache and cookies

---

## Support

### Documentation

- [Technical Documentation](#documentation)
- [API Reference](#api-reference)
- [Integration Guide](#quick-start-guide)


---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

### Infrastructure Partners

- [Vercel](https://vercel.com) - Deployment and hosting platform
- [MongoDB](https://mongodb.com) - Database services
- [Clerk](https://clerk.com) - Authentication infrastructure
- [Cloudinary](https://cloudinary.com) - Media management services
- [OpenAI](https://openai.com) - AI model providers

### Development Tools

- Next.js framework and ecosystem
- Tailwind CSS for styling
- TypeScript for type safety
- Various open-source libraries and tools

---

<div align="center">

[Visit Production Site](https://eko.devendrajat.com) • [View Source Code](https://github.com/Devendraxp/esoc) • [Report Issue](https://github.com/Devendraxp/esoc/issues)

**© 2025 EKO Platform. All rights reserved.**

</div>
