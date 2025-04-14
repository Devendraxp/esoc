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
3. **Grok Integration**: Enhances responses with real-world data from Grok's knowledge base

#### How It Works

- The system automatically processes posts and comments in the background
- Users ask natural language questions about news events
- The system finds relevant information from community posts
- Grok enhances the response with additional real-world context
- Users can see both the community-sourced information and the Grok-enhanced response

#### Setup Requirements

To use the News Tracker feature, you need to:

1. Get a Grok API key from xAI
2. Add the API key to your `.env.local` file:
   ```
   GROK_API_KEY=your_grok_key_here
   ```

The News Tracker processes content hourly to keep information current. Users can filter queries by location for more relevant results.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
