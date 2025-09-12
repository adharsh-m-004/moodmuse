import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Image as ImageIcon, Loader2, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface ImageTaggerProps {
  className?: string;
}

export const ImageTagger: React.FC<ImageTaggerProps> = ({ className }) => {
  const [imageData, setImageData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Get API key from environment variables
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent";

  // Handles the file upload and converts the image to a Base64 string
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result?.toString().split(',')[1];
        if (base64String) {
          setImageData(base64String);
          setTags([]);
          setError(null);
        }
      };
      reader.onerror = () => {
        setError("Failed to read the file.");
        toast.error("Failed to read the file.");
      };
      reader.readAsDataURL(file);
    } else {
      setImageData(null);
      setTags([]);
      setError("Please select a valid image file.");
      toast.error("Please select a valid image file.");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result?.toString().split(',')[1];
        if (base64String) {
          setImageData(base64String);
          setTags([]);
          setError(null);
        }
      };
      reader.onerror = () => {
        setError("Failed to read the file.");
        toast.error("Failed to read the file.");
      };
      reader.readAsDataURL(file);
    } else {
      setImageData(null);
      setTags([]);
      setError("Please select a valid image file.");
      toast.error("Please select a valid image file.");
    }
  };

  // Handles the API call to tag the image
  const tagImage = async () => {
    if (!imageData || loading) return;

    if (!apiKey) {
      setError("API key not configured. Please add VITE_GEMINI_API_KEY to your environment variables.");
      toast.error("API key not configured");
      return;
    }

    setLoading(true);
    setTags([]);
    setError(null);

    const payload = {
      contents: [{
        parts: [
          { text: "Act as an expert image analyst. Provide a comma-separated list of 5-10 tags that describe the most prominent elements, colors, and themes in this image. Do not include any text other than the comma-separated list of tags." },
          { inlineData: { mimeType: "image/jpeg", data: imageData } }
        ]
      }]
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const result = await response.json();
      const newTags = result.candidates?.[0]?.content?.parts?.[0]?.text?.split(',').map((tag: string) => tag.trim()) || [];
      setTags(newTags);
      toast.success(`Generated ${newTags.length} tags for your image!`);
    } catch (err) {
      console.error(err);
      const errorMessage = "Failed to tag the image. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Gemini Image Tagger
        </CardTitle>
        <CardDescription>
          Upload an image and let Google's Gemini AI generate descriptive tags for it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image Drop/Upload Area */}
        <div
          className="w-full h-64 border-2 border-dashed rounded-lg border-gray-300 dark:border-gray-600 flex items-center justify-center relative transition-all duration-300 hover:border-purple-400 cursor-pointer bg-gray-50 dark:bg-gray-800"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => document.getElementById('image-tagger-file-input')?.click()}
        >
          {imageData ? (
            <img
              src={`data:image/jpeg;base64,${imageData}`}
              alt="Preview"
              className="object-contain max-h-full rounded-lg"
            />
          ) : (
            <div className="text-center p-4">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <span className="text-gray-500 text-sm">
                Click or drag an image here to upload
              </span>
            </div>
          )}
          <input
            id="image-tagger-file-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Action Button */}
        <Button
          onClick={tagImage}
          disabled={!imageData || loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Tagging...
            </>
          ) : (
            <>
              <Tag className="w-4 h-4 mr-2" />
              Tag Image
            </>
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Results Display */}
        {tags.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Generated Tags ({tags.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-sm font-medium transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageTagger;
