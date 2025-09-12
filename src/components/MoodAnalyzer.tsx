import React, { useState, useCallback } from 'react';
import { Upload, Music, Brain, Loader2, AlertCircle, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { moodMusicService, type MoodMusicResult, type MoodMusicError } from '@/lib/moodMusicService';
import { MusicPlayer } from './MusicPlayer';

interface MoodAnalyzerProps {
  onAnalysisComplete?: (result: MoodMusicResult) => void;
}

export const MoodAnalyzer: React.FC<MoodAnalyzerProps> = ({ onAnalysisComplete }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<'idle' | 'emotion' | 'music' | 'complete'>('idle');
  const [result, setResult] = useState<MoodMusicResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setResult(null);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Cleanup previous preview URL
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    // Validate configuration
    const config = moodMusicService.validateConfiguration();
    if (!config.isValid) {
      setError(`Missing API keys: ${config.missingVars.join(', ')}`);
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisStep('emotion');

    try {
      // Step 1: Emotion Detection
      toast.info('Analyzing vibe from your image...');
      
      // Simulate progress for better UX
      setTimeout(() => setAnalysisStep('music'), 2000);

      const analysisResult = await moodMusicService.analyzeImageAndFindMusic(selectedFile, 12);
      
      setAnalysisStep('complete');
      setResult(analysisResult);
      
      toast.success(`Found ${analysisResult.music.tracks.length} songs matching your ${analysisResult.vibe.dominantEmotion} vibe!`);
      
      onAnalysisComplete?.(analysisResult);
    } catch (err) {
      const error = err as MoodMusicError;
      console.error('Analysis failed:', error);
      
      let errorMessage = 'Analysis failed. Please try again.';
      if (error.step === 'vibe') {
        errorMessage = 'Failed to analyze vibe. Check your Hugging Face API key.';
      } else if (error.step === 'music') {
        errorMessage = 'Failed to find music. Check your Spotify API credentials.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('idle');
    }
  };

  const handleShare = async () => {
    if (!result) return;

    const summary = moodMusicService.createShareableSummary(result);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My MoodSync Analysis',
          text: summary
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(summary);
      toast.success('Analysis copied to clipboard!');
    }
  };

  const getProgressValue = () => {
    switch (analysisStep) {
      case 'emotion': return 30;
      case 'music': return 70;
      case 'complete': return 100;
      default: return 0;
    }
  };

  const getStepMessage = () => {
    switch (analysisStep) {
      case 'emotion': return 'Detecting vibe in your image...';
      case 'music': return 'Finding matching music...';
      case 'complete': return 'Analysis complete!';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            AI Mood Analysis
          </CardTitle>
          <CardDescription>
            Upload an image and let AI detect your mood to find matching music
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Input */}
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-h-48 max-w-full object-contain rounded"
                  />
                ) : (
                  <>
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </>
                )}
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isAnalyzing}
              />
            </label>
          </div>

          {/* Selected File Info */}
          {selectedFile && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Music className="w-4 h-4 mr-2" />
                    Analyze Vibe
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Progress Bar */}
          {isAnalyzing && (
            <div className="space-y-2">
              <Progress value={getProgressValue()} className="w-full" />
              <p className="text-sm text-center text-gray-600">{getStepMessage()}</p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">
                  {moodMusicService.getEmotionDisplayInfo(result.emotion.dominantEmotion).emoji}
                </span>
                Analysis Results
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Emotion Analysis */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Detected Emotion</h3>
              <div className="flex items-center gap-3">
                <Badge 
                  variant="secondary" 
                  className="text-lg px-4 py-2"
                  style={{ 
                    backgroundColor: moodMusicService.getEmotionDisplayInfo(result.emotion.dominantEmotion).color + '20',
                    color: moodMusicService.getEmotionDisplayInfo(result.emotion.dominantEmotion).color
                  }}
                >
                  {result.emotion.dominantEmotion}
                </Badge>
                <span className="text-sm text-gray-600">
                  {Math.round(result.emotion.confidence * 100)}% confidence
                </span>
              </div>
              
              {/* All Emotions */}
              <div className="flex flex-wrap gap-2">
                {result.emotion.emotions.slice(1, 4).map((emotion, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {emotion.label} ({Math.round(emotion.score * 100)}%)
                  </Badge>
                ))}
              </div>
            </div>

            {/* Music Results */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Matching Music</h3>
                <Badge variant="outline">
                  {result.music.tracks.length} tracks found
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{result.music.reasoning}</p>
              
              <MusicPlayer 
                tracks={result.music.tracks}
                emotion={result.emotion.dominantEmotion}
              />
            </div>

            {/* Processing Info */}
            <div className="text-xs text-gray-500 text-center">
              Analysis completed in {moodMusicService.formatProcessingTime(result.processingTime)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
