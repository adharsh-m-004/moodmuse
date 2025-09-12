import { emotionDetectionService, type EmotionAnalysis } from './emotionDetection';
import { musicService, type MusicRecommendation, type SpotifyTrack } from './musicService';

export interface MoodMusicResult {
  vibe: EmotionAnalysis;
  music: MusicRecommendation;
  processingTime: number;
}

export interface MoodMusicError {
  step: 'vibe' | 'music' | 'general';
  message: string;
  originalError?: Error;
}

class MoodMusicService {
  /**
   * Complete workflow: Analyze image vibe and find matching music
   */
  async analyzeImageAndFindMusic(imageFile: File, musicLimit: number = 10): Promise<MoodMusicResult> {
    const startTime = Date.now();
    
    try {
      // Step 1: Analyze vibe from image
      console.log('🔍 Analyzing vibe from image...');
      const vibe = await emotionDetectionService.analyzeImageVibe(imageFile);
      
      console.log(`✅ Detected vibe: ${vibe.dominantEmotion} (${Math.round(vibe.confidence * 100)}% confidence)`);
      
      // Step 2: Find matching music
      console.log(`🎵 Finding music for vibe: ${vibe.dominantEmotion}...`);
      const music = await musicService.findMusicByEmotion(vibe.dominantEmotion, musicLimit);
      
      console.log(`✅ Found ${music.tracks.length} matching tracks`);
      
      const processingTime = Date.now() - startTime;
      
      return {
        vibe,
        music,
        processingTime
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('MoodMusic analysis failed:', error);
      
      throw this.createMoodMusicError(error, processingTime);
    }
  }



  /**
   * Get music for a specific vibe (skip vibe detection)
   */
  async getMusicForVibe(vibe: string, musicLimit: number = 10): Promise<MusicRecommendation> {
    try {
      console.log(`🎵 Finding music for vibe: ${vibe}...`);
      const music = await musicService.findMusicByEmotion(vibe, musicLimit);
      console.log(`✅ Found ${music.tracks.length} matching tracks`);
      return music;
    } catch (error) {
      console.error(`Failed to get music for vibe ${vibe}:`, error);
      throw new Error(`Failed to find music for vibe "${vibe}"`);
    }
  }

  /**
   * Create a formatted error with context
   */
  private createMoodMusicError(error: unknown, processingTime: number): MoodMusicError {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    let step: 'vibe' | 'music' | 'general' = 'general';
    
    if (errorMessage.includes('Hugging Face') || errorMessage.includes('vibe') || errorMessage.includes('scene')) {
      step = 'vibe';
    } else if (errorMessage.includes('Spotify') || errorMessage.includes('music')) {
      step = 'music';
    }
    
    return {
      step,
      message: `${errorMessage} (Processing time: ${processingTime}ms)`,
      originalError: error instanceof Error ? error : undefined
    };
  }

  /**
   * Validate that all required environment variables are set
   */
  validateConfiguration(): { isValid: boolean; missingVars: string[] } {
    const requiredVars = [
      'VITE_HUGGINGFACE_API_TOKEN',
      'VITE_SPOTIFY_CLIENT_ID',
      'VITE_SPOTIFY_CLIENT_SECRET'
    ];
    
    const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
    
    return {
      isValid: missingVars.length === 0,
      missingVars
    };
  }

  /**
   * Get supported vibe types
   */
  getSupportedVibes(): string[] {
    return [
      // Scene vibes
      'party',
      'calm', 
      'happy',
      'romantic',
      'energetic',
      'cozy',
      'melancholy',
      'neutral'
    ];
  }

  /**
   * Get vibe display info (color, emoji, description)
   */
  getVibeDisplayInfo(vibe: string) {
    return {
      color: emotionDetectionService.getEmotionColor(vibe),
      emoji: emotionDetectionService.getEmotionEmoji(vibe),
      playlistName: musicService.getPlaylistName(vibe)
    };
  }

  /**
   * Format processing time for display
   */
  formatProcessingTime(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(1)}s`;
    } else {
      return `${Math.round(milliseconds / 60000)}m ${Math.round((milliseconds % 60000) / 1000)}s`;
    }
  }

  /**
   * Create shareable result summary
   */
  createShareableSummary(result: MoodMusicResult): string {
    const { vibe, music, processingTime } = result;
    const displayInfo = this.getVibeDisplayInfo(vibe.dominantEmotion);
    
    return `${displayInfo.emoji} Detected ${vibe.dominantEmotion} vibe (${Math.round(vibe.confidence * 100)}% confidence)
🎵 Found ${music.tracks.length} matching songs in ${this.formatProcessingTime(processingTime)}
🎧 "${displayInfo.playlistName}" - ${music.reasoning}

Top tracks:
${music.tracks.slice(0, 3).map((track, i) => 
  `${i + 1}. ${track.name} by ${track.artists.map(a => a.name).join(', ')}`
).join('\n')}

#MoodSync #AI #Music`;
  }
}

export const moodMusicService = new MoodMusicService();
