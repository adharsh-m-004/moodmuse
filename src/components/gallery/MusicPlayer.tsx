import { useState, useEffect, useRef } from "react";
import { MusicTrack } from "@/types/gallery";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface MusicPlayerProps {
  track: MusicTrack;
  onTrackChange?: (track: MusicTrack | null) => void;
}

export const MusicPlayer = ({ track, onTrackChange }: MusicPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(track.duration);
  const [volume, setVolume] = useState([75]);
  const [isLiked, setIsLiked] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set audio source
    if (track.previewUrl) {
      audio.src = track.previewUrl;
      setAudioError(false);
    } else {
      setAudioError(true);
      return;
    }

    // Audio event listeners
    const handleLoadedMetadata = () => {
      setDuration(audio.duration || track.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setAudioError(true);
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [track]);

  // Handle volume changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume[0] / 100;
    }
  }, [volume]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || audioError || !track.previewUrl) {
      setAudioError(true);
      return;
    }

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Audio playback failed:', error);
      setAudioError(true);
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (audio && !audioError) {
      audio.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const progress = (currentTime / duration) * 100;

  const emotionColors = {
    happy: "from-emotion-happy/20 to-emotion-happy/10",
    calm: "from-emotion-calm/20 to-emotion-calm/10", 
    energetic: "from-emotion-energetic/20 to-emotion-energetic/10",
    melancholy: "from-emotion-melancholy/20 to-emotion-melancholy/10",
    romantic: "from-emotion-romantic/20 to-emotion-romantic/10",
    mysterious: "from-emotion-mysterious/20 to-emotion-mysterious/10",
  };

  return (
    <Card className={cn(
      "p-4 bg-gradient-to-br",
      emotionColors[track.emotion] || "from-muted/20 to-muted/10",
      "backdrop-blur-sm border-glassBorder"
    )}>
      <div className="space-y-4">
        {/* Track Info */}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{track.title}</h3>
            <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsLiked(!isLiked)}
            className="shrink-0"
          >
            <Heart className={cn(
              "w-4 h-4",
              isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"
            )} />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            max={duration}
            step={1}
            onValueChange={handleSeek}
            className="w-full"
            disabled={audioError || !track.previewUrl}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(Math.floor(currentTime))}</span>
            <span>{formatTime(Math.floor(duration))}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0">
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={handlePlayPause}
            size="icon"
            className="w-12 h-12 rounded-full bg-gradient-primary border-0 hover:scale-105 transition-transform"
            disabled={audioError || !track.previewUrl}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>
          
          <Button variant="ghost" size="icon" className="shrink-0">
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-muted-foreground shrink-0" />
          <Slider
            value={volume}
            max={100}
            step={1}
            onValueChange={setVolume}
            className="flex-1"
          />
        </div>

        {/* Audio Element */}
        <audio ref={audioRef} preload="metadata" />

        {/* Status Indicator */}
        {audioError || !track.previewUrl ? (
          <div className="flex items-center justify-center gap-1 text-xs text-orange-600">
            <span>Preview not available</span>
            {track.spotifyUrl && (
              <a 
                href={track.spotifyUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-500 hover:text-green-600 underline ml-2"
              >
                Open in Spotify
              </a>
            )}
          </div>
        ) : isPlaying ? (
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <div className="flex gap-0.5">
              <div className="w-1 h-3 bg-primary rounded-full animate-pulse" />
              <div className="w-1 h-2 bg-primary/70 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
              <div className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-1 h-2 bg-primary/70 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
            </div>
            <span className="ml-2">Now Playing (~30s preview)</span>
          </div>
        ) : track.previewUrl ? (
          <div className="flex items-center justify-center text-xs text-green-600">
            <span>Preview available (~30s)</span>
          </div>
        ) : null}
      </div>
    </Card>
  );
};