/*
  Environment variables template for ESOC App
  
  Create a .env.local file in the project root directory with these variables
*/

// Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_***
CLERK_SECRET_KEY=sk_***

// MongoDB
MONGODB_URI=mongodb://localhost:27017/esoc-app

// Cloudinary (for media uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

// HuggingFace (for News Tracker feature)
HUGGINGFACE_API_KEY=hf_***

// Gemini (for enhanced AI responses)
GEMINI_API_KEY=your_gemini_api_key

// NewsAPI (for real-time news integration)
NEWS_API_KEY=your_newsapi_key