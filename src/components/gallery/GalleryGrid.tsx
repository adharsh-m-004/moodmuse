import { useState } from "react";
import { GalleryImage } from "@/types/gallery";
import { ImageCard } from "./ImageCard";
import { Button } from "@/components/ui/button";
import { Plus, FolderPlus, Music } from "lucide-react";

interface GalleryGridProps {
  images: GalleryImage[];
  onImageClick: (image: GalleryImage) => void;
  onCreateAlbum: () => void;
  onDeleteImage?: (imageId: string) => void;
}

export const GalleryGrid = ({ images, onImageClick, onCreateAlbum, onDeleteImage }: GalleryGridProps) => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  return (
    <div className="min-h-screen bg-gallery-bg">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                MoodSync Gallery
              </h1>
              <p className="text-muted-foreground">
                {images.length} photos • AI-powered music matching
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onCreateAlbum} className="gap-2">
                <FolderPlus className="w-4 h-4" />
                Create Album
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="container mx-auto px-4 py-8">
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-primary/10 flex items-center justify-center mb-4">
              <Music className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Start Your Musical Journey</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Upload your first photos and let AI discover the perfect soundtrack for your memories
            </p>
            <Button className="bg-gradient-primary border-0 gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Photo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {images.map((image, index) => (
              <ImageCard
                key={image.id}
                image={image}
                onClick={() => onImageClick(image)}
                onSelect={() => toggleImageSelection(image.id)}
                onDelete={onDeleteImage}
                isSelected={selectedImages.includes(image.id)}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};