import { useState } from "react";
import { GalleryImage } from "@/types/gallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Music, Heart, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageCardProps {
  image: GalleryImage;
  onClick: () => void;
  onSelect: () => void;
  onDelete?: (imageId: string) => void;
  isSelected: boolean;
  index: number;
}

export const ImageCard = ({ image, onClick, onSelect, onDelete, isSelected, index }: ImageCardProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const emotionColors = {
    happy: "bg-emotion-happy text-white",
    calm: "bg-emotion-calm text-white", 
    energetic: "bg-emotion-energetic text-white",
    melancholy: "bg-emotion-melancholy text-white",
    romantic: "bg-emotion-romantic text-white",
    mysterious: "bg-emotion-mysterious text-white",
  };

  return (
    <div 
      className={cn(
        "group relative aspect-square rounded-2xl overflow-hidden bg-muted",
        "transform transition-all duration-300 hover:scale-105 hover:shadow-medium",
        "animate-fade-in cursor-pointer",
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={onClick}
    >
      {/* Image */}
      {!hasError ? (
        <img
          src={image.src}
          alt={image.alt}
          className={cn(
            "w-full h-full object-cover transition-all duration-500",
            "group-hover:scale-110",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true);
            setIsLoaded(true);
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <div className="text-muted-foreground text-center">
            <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">Image unavailable</p>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-muted animate-pulse-soft" />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Content overlay */}
      <div className="absolute inset-0 p-3 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Top badges */}
        <div className="flex justify-between items-start">
          <div className="flex gap-2">
            {image.emotion && (
              <Badge 
                className={cn(
                  "text-xs font-medium shadow-glass backdrop-blur-sm",
                  emotionColors[image.emotion]
                )}
              >
                {image.emotion}
              </Badge>
            )}
            {image.musicTrack && (
              <div className="p-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                <Music className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          {onDelete && (
            <Button
              size="sm"
              variant="destructive"
              className="h-8 w-8 p-0 bg-red-500/80 hover:bg-red-600 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(image.id);
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Bottom info */}
        <div className="text-white">
          {image.musicTrack && (
            <div className="text-xs opacity-90">
              ♪ {image.musicTrack.title}
            </div>
          )}
          {image.customEmotion && (
            <div className="text-xs opacity-75 mt-1">
              Custom: {image.customEmotion}
            </div>
          )}
        </div>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
          ✓
        </div>
      )}
    </div>
  );
};