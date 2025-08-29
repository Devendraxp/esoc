This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## ESOC App Features

### News Tracker

The News Tracker is an AI-powered feature that allows users to ask questions about news and events mentioned in user posts and comments. The system combines:

1. **Local Knowledge Base**: Processes and indexes content from community posts and comments, extracting factual information
2. **Hugging Face Models**: Uses transformer models for content processing and semantic search
3. **Gemini Integration**: Enhances responses with real-world data from Grok's knowledge base

#### How It Works

- The system automatically processes posts and comments in the background
- Users ask natural language questions about news events
- The system finds relevant information from community posts
- Gemini enhances the response with additional real-world context
- Users can see both the community-sourced information and the Grok-enhanced response

#### Setup Requirements

To use the News Tracker feature, you need to:

1. Get a Gemini API key from xAI
2. Add the API key to your `.env.local` file:
   ```
   GEMINI_API_KEY=your_gemini_key_here
   ```

The News Tracker processes content hourly to keep information current. Users can filter queries by location for more relevant results.

