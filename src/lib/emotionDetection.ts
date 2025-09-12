export interface EmotionResult {
  label: string;
  score: number;
}

export interface VibeResult {
  scene: string;
  vibe: string;
  score: number;
}

export interface EmotionAnalysis {
  dominantEmotion: string;
  emotions: EmotionResult[];
  confidence: number;
  vibe?: string;
  scene?: string;
}

class EmotionDetectionService {
  private readonly apiToken: string;
  private readonly vibeModelUrl = 'https://api-inference.huggingface.co/models/csailvision/places365';

  constructor() {
    this.apiToken = import.meta.env.VITE_HUGGINGFACE_API_TOKEN;
    if (!this.apiToken) {
      throw new Error('Missing VITE_HUGGINGFACE_API_TOKEN environment variable');
    }
  }

  /**
   * Analyze scene vibe from image using Places365 model
   */
  async analyzeImageVibe(imageFile: File): Promise<EmotionAnalysis> {
    try {
      // Convert image to base64 for API
      const base64Image = await this.fileToBase64(imageFile);
      
      const response = await fetch(this.vibeModelUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: base64Image,
          options: {
            wait_for_model: true
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Hugging Face API error: ${response.status} ${response.statusText}`);
      }

      const results = await response.json();
      
      // Handle different response formats based on model
      let emotions: EmotionResult[] = [];
      let scene = '';
      let vibe = '';
      
      // Places365 model returns array of objects with label and score
      if (Array.isArray(results)) {
        emotions = results.map(item => ({
          label: item.label.toLowerCase(),
          score: item.score || item.confidence || 0
        }));
        
        // Extract scene and map to vibe
        scene = emotions[0].label;
        vibe = this.mapSceneToVibe(scene);
      } else if (results.label) {
        // Sometimes returns a single prediction object
        emotions = [{
          label: results.label.toLowerCase(),
          score: results.score || results.confidence || 0
        }];
        
        scene = results.label.toLowerCase();
        vibe = this.mapSceneToVibe(scene);
      }
      
      // Sort by confidence score
      const sortedEmotions = emotions.sort((a, b) => b.score - a.score);
      
      if (sortedEmotions.length === 0) {
        throw new Error('No scene detected in the image');
      }
      
      return {
        dominantEmotion: vibe, // Use vibe as the dominant emotion
        emotions: sortedEmotions,
        confidence: sortedEmotions[0].score,
        vibe: vibe,
        scene: scene
      };
    } catch (error) {
      console.error('Scene vibe detection failed:', error);
      throw new Error(`Failed to analyze scene vibe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Map scene categories to vibes
   */
  private mapSceneToVibe(scene: string): string {
    // Map common Places365 scenes to vibes
    const sceneToVibeMap: Record<string, string> = {
      // Party vibes
      'dance_studio': 'party',
      'discotheque': 'party',
      'night_club': 'party',
      'bar': 'party',
      'concert_hall': 'party',
      'music_studio': 'party',
      
      // Calm vibes
      'beach': 'calm',
      'zen_garden': 'calm',
      'forest_path': 'calm',
      'mountain': 'calm',
      'lake': 'calm',
      'ocean': 'calm',
      'sky': 'calm',
      'library': 'calm',
      
      // Happy vibes
      'amusement_park': 'happy',
      'playground': 'happy',
      'water_park': 'happy',
      'theme_park': 'happy',
      'fair': 'happy',
      'carnival': 'happy',
      
      // Romantic vibes
      'restaurant': 'romantic',
      'vineyard': 'romantic',
      'formal_garden': 'romantic',
      'gazebo': 'romantic',
      
      // Energetic vibes
      'gym': 'energetic',
      'stadium': 'energetic',
      'athletic_field': 'energetic',
      'basketball_court': 'energetic',
      'tennis_court': 'energetic',
      
      // Cozy vibes
      'coffee_shop': 'cozy',
      'cafe': 'cozy',
      'living_room': 'cozy',
      'bedroom': 'cozy',
      'fireplace': 'cozy',
      
      // Melancholy vibes
      'cemetery': 'melancholy',
      'ruins': 'melancholy',
      'abandoned_building': 'melancholy',
      'rain': 'melancholy'
    };
    
    // Default to a generic vibe if scene not in map
    return sceneToVibeMap[scene] || 'neutral';
  }

  /**
   * Convert File to base64 string
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Get vibe color for UI display
   */
  getEmotionColor(vibe: string): string {
    const colorMap: Record<string, string> = {
      // Vibe colors
      party: '#FF00FF', // Magenta
      calm: '#4169E1',  // Royal Blue
      happy: '#FFD700',  // Gold
      romantic: '#FF69B4', // Hot Pink
      energetic: '#FF4500', // Orange Red
      cozy: '#8B4513',  // Saddle Brown
      melancholy: '#708090', // Slate Gray
      neutral: '#808080'  // Gray
    };
    
    return colorMap[vibe.toLowerCase()] || '#808080';
  }

  /**
   * Get vibe emoji for UI display
   */
  getEmotionEmoji(vibe: string): string {
    const emojiMap: Record<string, string> = {
      // Vibe emojis
      party: '🎉',
      calm: '🧘',
      happy: '😊',
      romantic: '💖',
      energetic: '⚡',
      cozy: '🏡',
      melancholy: '🌧️',
      neutral: '😐'
    };
    
    return emojiMap[vibe.toLowerCase()] || '😐';
  }
}

// Export singleton instance
export const emotionDetectionService = new EmotionDetectionService();
