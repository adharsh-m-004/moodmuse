export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  title?: string | null;
  description?: string | null;
  emotion?: EmotionType;
  customEmotion?: string;
  musicTrack?: MusicTrack;
  albumId?: string;
  dateAdded: Date;
  moodDetected?: string | null;
  moodConfidence?: number | null;
  aiAnalysis?: any;
  geminiTags?: string[];
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  src: string;
  duration: number;
  emotion: EmotionType;
  spotifyUrl?: string;
  albumArt?: string;
  previewUrl?: string | null;
}

export interface Album {
  id: string;
  name: string;
  images: GalleryImage[];
  coverImage?: string;
  recommendedTracks: MusicTrack[];
  overallEmotion?: EmotionType;
  dateCreated: Date;
}

export type EmotionType = 
  | 'happy' 
  | 'calm' 
  | 'energetic' 
  | 'melancholy' 
  | 'romantic' 
  | 'mysterious';

export interface AIAnalysis {
  emotion: EmotionType;
  confidence: number;
  colors: string[];
  vibes: string[];
}