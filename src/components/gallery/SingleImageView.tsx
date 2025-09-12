import { useState, useEffect } from "react";
import { GalleryImage, EmotionType, MusicTrack } from "@/types/gallery";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MusicPlayer } from "./MusicPlayer";
import { aiService } from "@/services/aiService";
import { geminiService } from "@/services/geminiService";
import { X, Sparkles, Music, Tag, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SingleImageViewProps {
  image: GalleryImage;
  onClose: () => void;
  onUpdateImage: (updatedImage: GalleryImage) => void;
}

export const SingleImageView = ({ image, onClose, onUpdateImage }: SingleImageViewProps) => {
  const [isTagging, setIsTagging] = useState(false);
  const [recommendedTracks, setRecommendedTracks] = useState<MusicTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(image.musicTrack || null);
  const [detectedEmotion, setDetectedEmotion] = useState<EmotionType | null>(image.emotion || null);
  const [geminiTags, setGeminiTags] = useState<string[]>(image.geminiTags || []);
  const [newTag, setNewTag] = useState<string>("");

  const analyzeImage = async () => {
    setIsTagging(true);
    try {
      // Only use Gemini API for tagging
      const geminiAnalysis = await geminiService.analyzeImageTags(image.src);
      
      // Set Gemini tags
      setGeminiTags(geminiAnalysis.tags);
      
      // Get music recommendations based on tags
      const { emotion, tracks } = await aiService.getRecommendationsFromTags(geminiAnalysis.tags);
      setDetectedEmotion(emotion);
      setRecommendedTracks(tracks);
      
      // Auto-select first recommended track
      if (tracks.length > 0 && !selectedTrack) {
        setSelectedTrack(tracks[0]);
      }
      
      toast.success(`Analysis complete! Generated ${geminiAnalysis.tags.length} AI tags and found ${tracks.length} music recommendations.`);
    } catch (error) {
      console.error('Failed to analyze image:', error);
      toast.error('Failed to analyze image. Please check your API key and try again.');
    } finally {
      setIsTagging(false);
    }
  };

  const addTag = async () => {
    if (newTag.trim() && !geminiTags.includes(newTag.trim())) {
      const updatedTags = [...geminiTags, newTag.trim()];
      setGeminiTags(updatedTags);
      setNewTag("");
      
      // Update music recommendations based on new tags
      try {
        const { emotion, tracks } = await aiService.getRecommendationsFromTags(updatedTags);
        setDetectedEmotion(emotion);
        setRecommendedTracks(tracks);
      } catch (error) {
        console.error('Failed to get music recommendations:', error);
      }
    }
  };

  const removeTag = async (tagToRemove: string) => {
    const updatedTags = geminiTags.filter(tag => tag !== tagToRemove);
    setGeminiTags(updatedTags);
    
    // Update music recommendations based on remaining tags
    if (updatedTags.length > 0) {
      try {
        const { emotion, tracks } = await aiService.getRecommendationsFromTags(updatedTags);
        setDetectedEmotion(emotion);
        setRecommendedTracks(tracks);
      } catch (error) {
        console.error('Failed to get music recommendations:', error);
      }
    } else {
      setRecommendedTracks([]);
      setDetectedEmotion(null);
    }
  };

  const handleSave = () => {
    const updatedImage: GalleryImage = {
      ...image,
      emotion: detectedEmotion || undefined,
      musicTrack: selectedTrack || undefined,
      geminiTags: geminiTags.length > 0 ? geminiTags : undefined,
    };
    onUpdateImage(updatedImage);
    toast.success('Image tags and music selection saved!');
  };


  const emotionColors = {
    happy: "bg-emotion-happy",
    calm: "bg-emotion-calm", 
    energetic: "bg-emotion-energetic",
    melancholy: "bg-emotion-melancholy",
    romantic: "bg-emotion-romantic",
    mysterious: "bg-emotion-mysterious",
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="h-full flex flex-col md:flex-row">
        {/* Image Side */}

        <div className="flex-1 relative flex items-center justify-center p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-black/20 backdrop-blur-sm hover:bg-black/40 text-white"
          >
            <X className="w-5 h-5" />
          </Button>

          <div className="max-w-full max-h-full relative">
            <img
              src={image.src}
              alt={image.alt}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-glass animate-scale-in"
            />
            {/* Analyze Button Overlay */}
            {!isTagging && (
              <Button
                onClick={analyzeImage}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gradient-primary text-white shadow-lg"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Tags
              </Button>
            )}
            
            {/* Loading overlay */}
            {isTagging && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <div className="text-center text-white">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 animate-spin" />
                  <p className="text-sm">Generating AI tags...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Panel */}
        <div className="w-full md:w-96 bg-background/95 backdrop-blur-xl overflow-y-auto animate-slide-up">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">AI Tags & Music</h2>
              <Button
                onClick={handleSave}
                className="bg-gradient-primary border-0"
                size="sm"
              >
                Save Changes
              </Button>
            </div>

            {/* AI Tags */}
            <Card className="p-4 bg-gradient-glass border-glassBorder">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary" />
                  <span className="font-medium">AI Tags</span>
                </div>
                
                {/* Add New Tag */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={addTag} size="sm" disabled={!newTag.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Display Tags */}
                {geminiTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {geminiTags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-sm font-medium transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer group"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                
                {geminiTags.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No tags yet. Click "Generate Tags" on the image or add your own.
                  </p>
                )}
              </div>
            </Card>


            {/* Music Recommendations */}
            {recommendedTracks.length > 0 && (
              <Card className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-primary" />
                  <span className="font-medium">Recommended Tracks</span>
                </div>
                
                <div className="space-y-2">
                  {recommendedTracks.map((track) => (
                    <div
                      key={track.id}
                      className={cn(
                        "p-3 rounded-lg cursor-pointer transition-all border",
                        "hover:bg-accent hover:text-accent-foreground",
                        selectedTrack?.id === track.id && "bg-primary text-primary-foreground border-primary"
                      )}
                      onClick={() => setSelectedTrack(track)}
                    >
                      <div className="flex items-center gap-3">
                        {track.albumArt && (
                          <img 
                            src={track.albumArt} 
                            alt={track.title}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{track.title}</div>
                          <div className="text-xs opacity-75 truncate">{track.artist}</div>
                          <div className="text-xs opacity-50">
                            {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                          </div>
                        </div>
                        {track.spotifyUrl && (
                          <a 
                            href={track.spotifyUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-green-500 hover:text-green-600"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Music Player */}
            {selectedTrack && (
              <MusicPlayer
                track={selectedTrack}
                onTrackChange={setSelectedTrack}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};