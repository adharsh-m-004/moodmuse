import { EmotionType, AIAnalysis, MusicTrack } from "@/types/gallery";
import { spotifyService } from "./spotifyService";

// Music recommendation service based on tags
class AIService {
  // Map tags to emotions for music recommendations
  mapTagsToEmotion(tags: string[]): EmotionType {
    const tagEmotionMap: Record<string, EmotionType> = {
      // Happy/Energetic tags
      'bright': 'happy',
      'colorful': 'happy',
      'vibrant': 'energetic',
      'sunny': 'happy',
      'cheerful': 'happy',
      'lively': 'energetic',
      'dynamic': 'energetic',
      'active': 'energetic',
      'festive': 'happy',
      'celebration': 'happy',
      
      // Calm/Peaceful tags
      'peaceful': 'calm',
      'serene': 'calm',
      'tranquil': 'calm',
      'quiet': 'calm',
      'soft': 'calm',
      'gentle': 'calm',
      'relaxing': 'calm',
      'nature': 'calm',
      'water': 'calm',
      'sky': 'calm',
      'clouds': 'calm',
      
      // Romantic tags
      'romantic': 'romantic',
      'intimate': 'romantic',
      'warm': 'romantic',
      'cozy': 'romantic',
      'sunset': 'romantic',
      'flowers': 'romantic',
      'couple': 'romantic',
      'love': 'romantic',
      
      // Melancholy tags
      'dark': 'melancholy',
      'moody': 'melancholy',
      'rain': 'melancholy',
      'grey': 'melancholy',
      'sad': 'melancholy',
      'lonely': 'melancholy',
      'empty': 'melancholy',
      
      // Mysterious tags
      'mysterious': 'mysterious',
      'shadow': 'mysterious',
      'night': 'mysterious',
      'fog': 'mysterious',
      'silhouette': 'mysterious',
      'abstract': 'mysterious'
    };

    // Count emotion scores based on tags
    const emotionScores: Record<EmotionType, number> = {
      happy: 0,
      calm: 0,
      energetic: 0,
      romantic: 0,
      melancholy: 0,
      mysterious: 0
    };

    tags.forEach(tag => {
      const emotion = tagEmotionMap[tag.toLowerCase()];
      if (emotion) {
        emotionScores[emotion]++;
      }
    });

    // Return the emotion with highest score, default to calm
    const maxEmotion = Object.entries(emotionScores).reduce((a, b) => 
      a[1] > b[1] ? a : b
    )[0] as EmotionType;

    return emotionScores[maxEmotion] > 0 ? maxEmotion : 'calm';
  }

  // Get music recommendations based on tags using Spotify API
  async getRecommendationsFromTags(tags: string[]): Promise<{ emotion: EmotionType; tracks: MusicTrack[] }> {
    const emotion = this.mapTagsToEmotion(tags);
    
    try {
      // Try to get Spotify recommendations first
      const spotifyTracks = await spotifyService.getRecommendations(tags, emotion, 8);
      if (spotifyTracks.length > 0) {
        return { emotion, tracks: spotifyTracks };
      }
    } catch (error) {
      console.warn('Spotify API failed, falling back to static tracks:', error);
    }
    
    // Fallback to static tracks if Spotify fails
    const tracks = this.getRecommendedTracks(emotion);
    return { emotion, tracks };
  }

  // Get recommended music tracks based on emotion
  getRecommendedTracks(emotion: EmotionType): MusicTrack[] {
    const trackDatabase: Record<EmotionType, MusicTrack[]> = {
      calm: [
        {
          id: 'calm-1',
          title: 'Ocean Waves',
          artist: 'Nature Sounds',
          src: '', // Would be actual audio file
          duration: 180,
          emotion: 'calm'
        },
        {
          id: 'calm-2',
          title: 'Peaceful Morning',
          artist: 'Ambient Dreams',
          src: '',
          duration: 240,
          emotion: 'calm'
        }
      ],
      energetic: [
        {
          id: 'energetic-1',
          title: 'Electric Night',
          artist: 'Synth Wave',
          src: '',
          duration: 200,
          emotion: 'energetic'
        },
        {
          id: 'energetic-2',
          title: 'Dance Floor',
          artist: 'Beat Makers',
          src: '',
          duration: 190,
          emotion: 'energetic'
        }
      ],
      romantic: [
        {
          id: 'romantic-1',
          title: 'By Your Side',
          artist: 'Love Songs',
          src: '',
          duration: 220,
          emotion: 'romantic'
        },
        {
          id: 'romantic-2',
          title: 'Candlelight Serenade',
          artist: 'Jazz Romance',
          src: '',
          duration: 280,
          emotion: 'romantic'
        }
      ],
      happy: [
        {
          id: 'happy-1',
          title: 'Sunshine Day',
          artist: 'Feel Good',
          src: '',
          duration: 165,
          emotion: 'happy'
        },
        {
          id: 'happy-2',
          title: 'Good Vibes Only',
          artist: 'Positive Energy',
          src: '',
          duration: 175,
          emotion: 'happy'
        }
      ],
      melancholy: [
        {
          id: 'melancholy-1',
          title: 'Rainy Days',
          artist: 'Moody Blues',
          src: '',
          duration: 210,
          emotion: 'melancholy'
        }
      ],
      mysterious: [
        {
          id: 'mysterious-1',
          title: 'Night Whispers',
          artist: 'Dark Ambient',
          src: '',
          duration: 300,
          emotion: 'mysterious'
        }
      ]
    };

    return trackDatabase[emotion] || trackDatabase.calm;
  }

  // Analyze album for overall mood
  analyzeAlbum(emotions: EmotionType[]): EmotionType {
    const emotionCounts = emotions.reduce((acc, emotion) => {
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {} as Record<EmotionType, number>);

    return Object.entries(emotionCounts).reduce((a, b) => 
      emotionCounts[a[0] as EmotionType] > emotionCounts[b[0] as EmotionType] ? a : b
    )[0] as EmotionType;
  }
}

export const aiService = new AIService();