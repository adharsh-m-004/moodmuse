# MoodSync Gallery - AI-Powered Photo & Music Experience

Discover the perfect soundtrack for your memories with MoodSync Gallery. AI analyzes your photos to detect emotions and automatically plays matching music tracks.

## Features

🧠 **AI Emotion Detection** - Powered by Hugging Face's state-of-the-art emotion recognition models
🎵 **Smart Music Matching** - Spotify integration finds songs that match your photo's mood
📸 **Photo Gallery** - Secure photo storage with Supabase
🎨 **Beautiful UI** - Modern interface built with shadcn/ui and Tailwind CSS
🔐 **User Authentication** - Secure login system with Supabase Auth

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **UI Components**: shadcn/ui, Tailwind CSS
- **Backend**: Supabase (Database, Auth, Storage)
- **AI Services**: Hugging Face Inference API
- **Music API**: Spotify Web API
- **Deployment**: Vercel

## Setup Instructions

### 1. Clone and Install

```bash
git clone <YOUR_GIT_URL>
cd mood-muse-gallery
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Emotion Detection - Hugging Face
VITE_HUGGINGFACE_API_TOKEN=hf_your_huggingface_token

# Music API - Spotify
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

### 3. API Keys Setup

#### Hugging Face API (FREE)
1. Sign up at [huggingface.co](https://huggingface.co)
2. Go to Settings → Access Tokens
3. Create a new token with "Read" permissions
4. Copy the token to `VITE_HUGGINGFACE_API_TOKEN`

#### Spotify Web API (FREE)
1. Go to [developer.spotify.com](https://developer.spotify.com)
2. Create a new app
3. Copy Client ID to `VITE_SPOTIFY_CLIENT_ID`
4. Copy Client Secret to `VITE_SPOTIFY_CLIENT_SECRET`

#### Supabase (FREE tier available)
1. Create a project at [supabase.com](https://supabase.com)
2. Go to Settings → API
3. Copy Project URL to `VITE_SUPABASE_URL`
4. Copy anon public key to `VITE_SUPABASE_ANON_KEY`

### 4. Run Development Server

```bash
npm run dev
```

## How It Works

1. **Upload Image** - Users upload photos to the secure gallery
2. **AI Analysis** - Hugging Face API analyzes the image for emotional content
3. **Music Matching** - Spotify API finds songs matching the detected emotion
4. **Play & Enjoy** - Listen to AI-curated music that matches your photo's mood

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add all environment variables in Vercel dashboard
3. Deploy automatically on push

### Manual Deployment
```bash
npm run build
# Deploy the dist/ folder to your hosting provider
```

## Cost Breakdown

- **Hugging Face**: FREE (30,000 requests/month)
- **Spotify API**: FREE (unlimited)
- **Supabase**: FREE tier (500MB database, 1GB bandwidth)
- **Vercel**: FREE tier (100GB bandwidth)

**Total monthly cost: $0** for most use cases!

## Troubleshooting

### Authentication Issues
- Check Supabase environment variables are correct
- Ensure Supabase project is active
- Clear browser cache and try again

### AI Analysis Fails
- Verify Hugging Face API token is valid
- Check image file size (max 10MB)
- Ensure image format is supported (JPG, PNG, GIF)

### Music Not Loading
- Confirm Spotify API credentials are correct
- Check browser console for CORS errors
- Verify Spotify app is not in development mode restrictions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.
