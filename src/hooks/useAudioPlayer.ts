import { useState, useRef, useEffect, useCallback } from 'react';

interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  error: boolean;
}

interface UseAudioPlayerProps {
  src?: string | null;
  onEnded?: () => void;
  onError?: () => void;
}

export const useAudioPlayer = ({ src, onEnded, onError }: UseAudioPlayerProps = {}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    error: false
  });

  // Initialize audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set audio source
    if (src) {
      audio.src = src;
      setState(prev => ({ ...prev, error: false }));
    } else {
      setState(prev => ({ ...prev, error: true, isPlaying: false }));
      return;
    }

    // Audio event listeners
    const handleLoadedMetadata = () => {
      setState(prev => ({ ...prev, duration: audio.duration }));
    };

    const handleTimeUpdate = () => {
      setState(prev => ({ ...prev, currentTime: audio.currentTime }));
    };

    const handleEnded = () => {
      setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
      onEnded?.();
    };

    const handleError = () => {
      setState(prev => ({ ...prev, error: true, isPlaying: false }));
      onError?.();
    };

    const handleCanPlay = () => {
      setState(prev => ({ ...prev, error: false }));
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [src, onEnded, onError]);

  // Update volume when it changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = state.volume;
    }
  }, [state.volume]);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || state.error || !src) {
      setState(prev => ({ ...prev, error: true }));
      return false;
    }

    try {
      await audio.play();
      setState(prev => ({ ...prev, isPlaying: true }));
      return true;
    } catch (error) {
      console.error('Audio playback failed:', error);
      setState(prev => ({ ...prev, error: true, isPlaying: false }));
      return false;
    }
  }, [src, state.error]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    }
  }, []);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio && !state.error && time >= 0 && time <= state.duration) {
      audio.currentTime = time;
      setState(prev => ({ ...prev, currentTime: time }));
    }
  }, [state.error, state.duration]);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setState(prev => ({ ...prev, volume: clampedVolume }));
  }, []);

  const toggle = useCallback(async () => {
    if (state.isPlaying) {
      pause();
      return false;
    } else {
      return await play();
    }
  }, [state.isPlaying, play, pause]);

  return {
    audioRef,
    ...state,
    play,
    pause,
    stop,
    seek,
    setVolume,
    toggle,
    canPlay: !state.error && !!src
  };
};

export default useAudioPlayer;
