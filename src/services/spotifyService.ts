import { MusicTrack, EmotionType } from "@/types/gallery";

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  preview_url: string | null;
  duration_ms: number;
  external_urls: {
    spotify: string;
  };
  album: {
    images: { url: string }[];
  };
}

export interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
  };
}

class SpotifyService {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
    this.clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || '';
  }

  // Get Spotify access token using Client Credentials flow
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Spotify API credentials not configured. Please add VITE_SPOTIFY_CLIENT_ID and VITE_SPOTIFY_CLIENT_SECRET to your environment variables.');
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      throw new Error('Failed to get Spotify access token');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 minute early

    return this.accessToken;
  }

  // Convert tags to search query for Spotify
  private tagsToSearchQuery(tags: string[], emotion: EmotionType): string {
    // Create genre mapping based on emotion
    const genreMap: Record<EmotionType, string[]> = {
      happy: ['pop', 'dance', 'funk', 'disco'],
      energetic: ['rock', 'electronic', 'hip-hop', 'punk'],
      calm: ['ambient', 'classical', 'jazz', 'acoustic'],
      romantic: ['r&b', 'soul', 'indie', 'folk'],
      melancholy: ['indie', 'alternative', 'blues', 'folk'],
      mysterious: ['ambient', 'electronic', 'dark', 'experimental']
    };

    // Combine tags with genre for better search results
    const genres = genreMap[emotion] || genreMap.calm;
    const searchTerms = [...tags.slice(0, 3), ...genres.slice(0, 2)]; // Limit to avoid too long queries
    
    return searchTerms.join(' ');
  }

  // Search for tracks based on tags and emotion
  async searchTracks(tags: string[], emotion: EmotionType, limit: number = 10): Promise<MusicTrack[]> {
    try {
      const accessToken = await this.getAccessToken();
      const query = this.tagsToSearchQuery(tags, emotion);
      
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search Spotify tracks');
      }

      const data: SpotifySearchResponse = await response.json();
      
      return data.tracks.items.map(track => ({
        id: track.id,
        title: track.name,
        artist: track.artists.map(artist => artist.name).join(', '),
        src: track.preview_url || track.external_urls.spotify,
        duration: Math.floor(track.duration_ms / 1000),
        emotion: emotion,
        spotifyUrl: track.external_urls.spotify,
        albumArt: track.album.images[0]?.url || '',
        previewUrl: track.preview_url
      }));
    } catch (error) {
      console.error('Spotify search failed:', error);
      throw error;
    }
  }

  // Get recommendations based on specific genres and audio features
  async getRecommendations(tags: string[], emotion: EmotionType, limit: number = 10): Promise<MusicTrack[]> {
    try {
      const accessToken = await this.getAccessToken();
      
      // Audio features based on emotion
      const audioFeatures: Record<EmotionType, Record<string, number>> = {
        happy: { valence: 0.8, energy: 0.7, danceability: 0.6 },
        energetic: { valence: 0.6, energy: 0.9, danceability: 0.7 },
        calm: { valence: 0.4, energy: 0.2, acousticness: 0.7 },
        romantic: { valence: 0.6, energy: 0.4, acousticness: 0.5 },
        melancholy: { valence: 0.2, energy: 0.3, acousticness: 0.6 },
        mysterious: { valence: 0.3, energy: 0.4, instrumentalness: 0.6 }
      };

      const features = audioFeatures[emotion] || audioFeatures.calm;
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...Object.fromEntries(
          Object.entries(features).map(([key, value]) => [`target_${key}`, value.toString()])
        )
      });

      const response = await fetch(
        `https://api.spotify.com/v1/recommendations?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        // Fallback to search if recommendations fail
        return this.searchTracks(tags, emotion, limit);
      }

      const data = await response.json();
      
      return data.tracks.map((track: SpotifyTrack) => ({
        id: track.id,
        title: track.name,
        artist: track.artists.map(artist => artist.name).join(', '),
        src: track.preview_url || track.external_urls.spotify,
        duration: Math.floor(track.duration_ms / 1000),
        emotion: emotion,
        spotifyUrl: track.external_urls.spotify,
        albumArt: track.album.images[0]?.url || '',
        previewUrl: track.preview_url
      }));
    } catch (error) {
      console.error('Spotify recommendations failed:', error);
      // Fallback to search
      return this.searchTracks(tags, emotion, limit);
    }
  }
}

export const spotifyService = new SpotifyService();
