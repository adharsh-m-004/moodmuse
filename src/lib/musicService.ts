export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
  duration_ms: number;
}

export interface AudioFeatures {
  danceability: number;
  energy: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
  tempo: number;
}

export interface MusicRecommendation {
  tracks: SpotifyTrack[];
  emotion: string;
  reasoning: string;
}

class MusicService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    this.clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
    
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Missing Spotify API credentials. Please set VITE_SPOTIFY_CLIENT_ID and VITE_SPOTIFY_CLIENT_SECRET');
    }
  }

  /**
   * Get Spotify access token using Client Credentials flow
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error(`Spotify auth failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 min early
      
      return this.accessToken;
    } catch (error) {
      console.error('Failed to get Spotify access token:', error);
      throw new Error('Failed to authenticate with Spotify');
    }
  }

  /**
   * Search for music based on emotion
   */
  async findMusicByEmotion(emotion: string, limit: number = 10): Promise<MusicRecommendation> {
    try {
      const token = await this.getAccessToken();
      const searchParams = this.getEmotionSearchParams(emotion);
      
      const searchQuery = encodeURIComponent(searchParams.query);
      const url = `https://api.spotify.com/v1/search?q=${searchQuery}&type=track&limit=${limit}&market=US`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Spotify search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const tracks = data.tracks.items;

      // Filter tracks based on audio features if needed
      const filteredTracks = await this.filterTracksByEmotion(tracks, emotion, token);

      return {
        tracks: filteredTracks,
        emotion,
        reasoning: searchParams.reasoning
      };
    } catch (error) {
      console.error('Music search failed:', error);
      throw new Error(`Failed to find music for emotion "${emotion}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get search parameters based on vibe
   */
  private getEmotionSearchParams(vibe: string): { query: string; reasoning: string } {
    const vibeMap: Record<string, { query: string; reasoning: string }> = {
      // Scene vibes
      party: {
        query: 'genre:electronic,dance,pop energy:high mood:party',
        reasoning: 'High-energy dance music perfect for parties'
      },
      calm: {
        query: 'genre:ambient,classical,instrumental,lofi mood:calm energy:low',
        reasoning: 'Peaceful and relaxing music for calm moments'
      },
      happy: {
        query: 'genre:pop,indie,folk mood:happy energy:medium',
        reasoning: 'Feel-good music with positive vibes'
      },
      romantic: {
        query: 'genre:r&b,soul,jazz mood:romantic energy:medium',
        reasoning: 'Romantic and soulful music for intimate moments'
      },
      energetic: {
        query: 'genre:electronic,rock,pop energy:high tempo:>120',
        reasoning: 'High-tempo music to boost energy and motivation'
      },
      cozy: {
        query: 'genre:folk,acoustic,indie mood:chill energy:low acousticness:>0.5',
        reasoning: 'Warm acoustic music perfect for cozy environments'
      },
      melancholy: {
        query: 'genre:indie,alternative,acoustic mood:sad energy:low',
        reasoning: 'Introspective and emotional music for reflective moments'
      },
      neutral: {
        query: 'genre:indie,alternative,chill energy:medium',
        reasoning: 'Balanced and versatile music for any mood'
      }
    };

    return vibeMap[vibe.toLowerCase()] || vibeMap.neutral;
  }

  /**
   * Filter tracks based on audio features that match the emotion
   */
  private async filterTracksByEmotion(tracks: SpotifyTrack[], emotion: string, token: string): Promise<SpotifyTrack[]> {
    if (tracks.length === 0) return tracks;

    try {
      // Get audio features for all tracks
      const trackIds = tracks.map(track => track.id).join(',');
      const response = await fetch(`https://api.spotify.com/v1/audio-features?ids=${trackIds}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.warn('Failed to get audio features, returning unfiltered tracks');
        return tracks;
      }

      const data = await response.json();
      const audioFeatures: AudioFeatures[] = data.audio_features;

      // Define emotion criteria
      const emotionCriteria = this.getEmotionCriteria(emotion);

      // Score and sort tracks based on how well they match the emotion
      const scoredTracks = tracks.map((track, index) => {
        const features = audioFeatures[index];
        if (!features) return { track, score: 0 };

        const score = this.calculateEmotionScore(features, emotionCriteria);
        return { track, score };
      });

      // Sort by score and return top matches
      return scoredTracks
        .sort((a, b) => b.score - a.score)
        .map(item => item.track);
    } catch (error) {
      console.warn('Audio features filtering failed, returning unfiltered tracks:', error);
      return tracks;
    }
  }

  /**
   * Get audio feature criteria for each vibe
   */
  private getEmotionCriteria(vibe: string): Partial<AudioFeatures> {
    const criteriaMap: Record<string, Partial<AudioFeatures>> = {
      // Scene vibes
      party: { valence: 0.8, energy: 0.9, danceability: 0.8 },
      calm: { valence: 0.5, energy: 0.2, acousticness: 0.7 },
      happy: { valence: 0.7, energy: 0.6, danceability: 0.6 },
      romantic: { valence: 0.7, energy: 0.5, acousticness: 0.4 },
      energetic: { valence: 0.6, energy: 0.9, danceability: 0.7 },
      cozy: { valence: 0.6, energy: 0.3, acousticness: 0.8 },
      melancholy: { valence: 0.3, energy: 0.3, acousticness: 0.5 },
      neutral: { valence: 0.5, energy: 0.5, danceability: 0.5 }
    };

    return criteriaMap[vibe.toLowerCase()] || criteriaMap.neutral;
  }

  /**
   * Calculate how well audio features match emotion criteria
   */
  private calculateEmotionScore(features: AudioFeatures, criteria: Partial<AudioFeatures>): number {
    let score = 0;
    let criteriaCount = 0;

    Object.entries(criteria).forEach(([key, targetValue]) => {
      if (targetValue !== undefined && features[key as keyof AudioFeatures] !== undefined) {
        const featureValue = features[key as keyof AudioFeatures] as number;
        const difference = Math.abs(featureValue - targetValue);
        score += 1 - difference; // Higher score for closer match
        criteriaCount++;
      }
    });

    return criteriaCount > 0 ? score / criteriaCount : 0;
  }

  /**
   * Create a playlist name based on vibe
   */
  getPlaylistName(vibe: string): string {
    const playlistNames: Record<string, string> = {
      // Scene vibes
      party: 'Party Time 🎉',
      calm: 'Peaceful Moments 🧘',
      happy: 'Happy Vibes ☀️',
      romantic: 'Romantic Mood 💖',
      energetic: 'Energy Boost ⚡',
      cozy: 'Cozy Corner 🏡',
      melancholy: 'Reflective Moments 🌧️',
      neutral: 'Balanced Beats ⚖️'
    };

    return playlistNames[vibe.toLowerCase()] || `${vibe} Playlist`;
  }
}

export const musicService = new MusicService();
