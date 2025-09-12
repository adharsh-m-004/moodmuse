import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, ExternalLink, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import type { SpotifyTrack } from '@/lib/musicService';

interface MusicPlayerProps {
  tracks: SpotifyTrack[];
  emotion: string;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ tracks, emotion }) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const currentTrack = tracks[currentTrackIndex];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      handleNext();
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrackIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.preview_url) {
      toast.error('No preview available for this track');
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(error => {
        console.error('Playback failed:', error);
        toast.error('Failed to play track');
      });
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (currentTrackIndex < tracks.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handlePrevious = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (audio && duration) {
      const newTime = (value[0] / 100) * duration;
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
  };

  const handleTrackSelect = (index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const toggleFavorite = (trackId: string) => {
    const newFavorites = new Set(favorites);
    if (favorites.has(trackId)) {
      newFavorites.delete(trackId);
      toast.success('Removed from favorites');
    } else {
      newFavorites.add(trackId);
      toast.success('Added to favorites');
    }
    setFavorites(newFavorites);
  };

  const openInSpotify = (track: SpotifyTrack) => {
    window.open(track.external_urls.spotify, '_blank');
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEmotionGradient = (emotion: string) => {
    const gradients: Record<string, string> = {
      joy: 'from-yellow-400 to-orange-500',
      happiness: 'from-green-400 to-blue-500',
      sadness: 'from-blue-500 to-indigo-600',
      anger: 'from-red-500 to-pink-600',
      fear: 'from-purple-500 to-indigo-600',
      surprise: 'from-pink-400 to-purple-500',
      love: 'from-pink-500 to-red-500',
      excitement: 'from-orange-400 to-red-500',
      neutral: 'from-gray-400 to-gray-600'
    };
    return gradients[emotion.toLowerCase()] || gradients.neutral;
  };

  if (tracks.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No tracks found for this emotion</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Track Player */}
      <Card className={`bg-gradient-to-r ${getEmotionGradient(emotion)} text-white`}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            {/* Album Art */}
            <div className="flex-shrink-0">
              <img
                src={currentTrack?.album.images[0]?.url || '/placeholder.svg'}
                alt={currentTrack?.album.name}
                className="w-16 h-16 rounded-lg shadow-lg"
              />
            </div>

            {/* Track Info */}
            <div className="flex-grow min-w-0">
              <h3 className="font-semibold text-lg truncate">{currentTrack?.name}</h3>
              <p className="text-sm opacity-90 truncate">
                {currentTrack?.artists.map(artist => artist.name).join(', ')}
              </p>
              <p className="text-xs opacity-75 truncate">{currentTrack?.album.name}</p>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevious}
                disabled={currentTrackIndex === 0}
                className="text-white hover:bg-white/20"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlayPause}
                disabled={!currentTrack?.preview_url}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNext}
                disabled={currentTrackIndex === tracks.length - 1}
                className="text-white hover:bg-white/20"
              >
                <SkipForward className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFavorite(currentTrack.id)}
                className="text-white hover:bg-white/20"
              >
                <Heart 
                  className={`w-4 h-4 ${favorites.has(currentTrack.id) ? 'fill-current' : ''}`} 
                />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => openInSpotify(currentTrack)}
                className="text-white hover:bg-white/20"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 space-y-2">
            <Slider
              value={[duration ? (currentTime / duration) * 100 : 0]}
              onValueChange={handleSeek}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs opacity-75">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="mt-3 flex items-center space-x-2">
            <Volume2 className="w-4 h-4" />
            <Slider
              value={[volume * 100]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-24"
            />
          </div>
        </CardContent>
      </Card>

      {/* Track List */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-64">
            <div className="p-4 space-y-2">
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    index === currentTrackIndex 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleTrackSelect(index)}
                >
                  <img
                    src={track.album.images[2]?.url || track.album.images[0]?.url || '/placeholder.svg'}
                    alt={track.album.name}
                    className="w-10 h-10 rounded"
                  />
                  
                  <div className="flex-grow min-w-0">
                    <p className="font-medium text-sm truncate">{track.name}</p>
                    <p className="text-xs text-gray-600 truncate">
                      {track.artists.map(artist => artist.name).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!track.preview_url && (
                      <Badge variant="outline" className="text-xs">
                        No Preview
                      </Badge>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(track.id);
                      }}
                    >
                      <Heart 
                        className={`w-3 h-3 ${favorites.has(track.id) ? 'fill-current text-red-500' : 'text-gray-400'}`} 
                      />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openInSpotify(track);
                      }}
                    >
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Audio Element */}
      {currentTrack?.preview_url && (
        <audio
          ref={audioRef}
          src={currentTrack.preview_url}
          preload="metadata"
        />
      )}
    </div>
  );
};
