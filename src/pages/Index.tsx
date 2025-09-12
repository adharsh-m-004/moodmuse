import { useState, useEffect } from "react";
import { GalleryImage } from "@/types/gallery";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { SingleImageView } from "@/components/gallery/SingleImageView";
import Header from "@/components/Header";
import PhotoUpload from "@/components/PhotoUpload";
import { photoService } from "@/services/photoService";
import { toast } from "sonner";
import { ImageIcon } from "lucide-react";

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    setLoading(true);
    const { data, error } = await photoService.getUserPhotos();
    
    if (error) {
      toast.error("Failed to load photos");
      console.error("Error loading photos:", error);
    } else if (data) {
      setImages(data);
    }
    
    setLoading(false);
  };

  const handleImageClick = (image: GalleryImage) => {
    setSelectedImage(image);
  };

  const handleCloseImageView = () => {
    setSelectedImage(null);
  };

  const handleUpdateImage = (updatedImage: GalleryImage) => {
    setImages(prev => prev.map(img => 
      img.id === updatedImage.id ? updatedImage : img
    ));
    setSelectedImage(updatedImage);
    toast.success("Photo updated with AI analysis!");
  };

  const handleCreateAlbum = () => {
    toast.info("Album creation coming soon!");
  };

  const handleUploadSuccess = (newPhoto: GalleryImage) => {
    setImages(prev => [newPhoto, ...prev]);
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) {
      return;
    }

    const { error } = await photoService.deletePhoto(imageId);
    
    if (error) {
      toast.error("Failed to delete photo");
      console.error("Error deleting photo:", error);
    } else {
      setImages(prev => prev.filter(img => img.id !== imageId));
      toast.success("Photo deleted successfully");
      
      // Close single image view if the deleted image was selected
      if (selectedImage?.id === imageId) {
        setSelectedImage(null);
      }
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="animate-spin rounded-full h-16 w-16 sm:h-32 sm:w-32 border-b-2 border-purple-500"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">MoodSync Gallery</h1>
          <p className="text-sm sm:text-base text-gray-600">
            AI-powered photo emotion detection with matching music
          </p>
        </div>

        <div className="w-full">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Photo Gallery ({images.length})</h2>
          </div>

          <div className="mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Your Photos</h2>
                <p className="text-sm text-gray-600">
                  {images.length === 0 ? "No photos yet" : `${images.length} photo${images.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <div className="w-full sm:w-auto">
                <PhotoUpload onUploadSuccess={handleUploadSuccess} />
              </div>
            </div>

            {images.length === 0 ? (
              <div className="text-center py-8 sm:py-12 px-4">
                <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No photos yet</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 max-w-sm mx-auto">Upload your first photo to get started with MoodSync!</p>
                <PhotoUpload onUploadSuccess={handleUploadSuccess} />
              </div>
            ) : (
              <GalleryGrid
                images={images}
                onImageClick={handleImageClick}
                onCreateAlbum={handleCreateAlbum}
                onDeleteImage={handleDeleteImage}
              />
            )}
          </div>
        </div>
      </div>
      
      {selectedImage && (
        <SingleImageView
          image={selectedImage}
          onClose={handleCloseImageView}
          onUpdateImage={handleUpdateImage}
        />
      )}
    </>
  );
};

export default Index;
