
import { useRef, useCallback, useEffect, useState } from 'react';
import { EnhancedEmotionDetector, EnhancedEmotionResult } from '@/utils/faceExpression/enhancedEmotionDetection';
import { EmotionState } from '@/utils/mediapipe/emotionDetection';

export const useEnhancedEmotionDetection = (
  videoRef: React.RefObject<HTMLVideoElement>,
  isActive: boolean = true
) => {
  const [emotionResult, setEmotionResult] = useState<EnhancedEmotionResult | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const detectorRef = useRef<EnhancedEmotionDetector | null>(null);
  const animationFrameRef = useRef<number>();
  const lastTimestampRef = useRef<number>(0);

  // Default emotion state
  const defaultEmotionState: EmotionState = {
    dominant: 'neutral',
    confidence: 0.5,
    scores: {
      neutral: 1.0,
      happy: 0.0,
      sad: 0.0,
      angry: 0.0,
      surprised: 0.0,
      fearful: 0.0,
      disgust: 0.0
    },
    icon: '😐',
    timestamp: Date.now()
  };

  const initializeDetector = useCallback(async () => {
    if (!detectorRef.current) {
      try {
        console.log('Initializing enhanced emotion detector...');
        detectorRef.current = new EnhancedEmotionDetector();
        await detectorRef.current.initialize();
        setIsInitialized(true);
        console.log('Enhanced emotion detector ready');
      } catch (error) {
        console.error('Failed to initialize enhanced emotion detector:', error);
        setIsInitialized(false);
      }
    }
  }, []);

  const detectEmotions = useCallback(async () => {
    if (!isActive || !videoRef.current || !detectorRef.current || !isInitialized) {
      return;
    }

    const video = videoRef.current;
    if (video.readyState !== 4) return; // Not ready

    try {
      const timestamp = performance.now();
      
      // Throttle detection to ~10 FPS for performance
      if (timestamp - lastTimestampRef.current < 100) {
        animationFrameRef.current = requestAnimationFrame(detectEmotions);
        return;
      }
      
      lastTimestampRef.current = timestamp;

      // Get current MediaPipe emotion (you might want to integrate this with existing MediaPipe detection)
      const currentMediapipeEmotion = defaultEmotionState;

      const result = await detectorRef.current.detectEmotions(
        video,
        timestamp,
        currentMediapipeEmotion
      );

      setEmotionResult(result);
    } catch (error) {
      console.error('Error in emotion detection:', error);
    }

    if (isActive) {
      animationFrameRef.current = requestAnimationFrame(detectEmotions);
    }
  }, [isActive, videoRef, isInitialized]);

  // Initialize detector when component mounts
  useEffect(() => {
    if (isActive) {
      initializeDetector();
    }
  }, [isActive, initializeDetector]);

  // Start/stop detection loop
  useEffect(() => {
    if (isActive && isInitialized) {
      detectEmotions();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, isInitialized, detectEmotions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (detectorRef.current) {
        detectorRef.current.dispose();
        detectorRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Return the combined emotion state for backward compatibility
  const emotionState = emotionResult?.combinedEmotion || defaultEmotionState;

  return {
    emotionState,
    emotionResult,
    isInitialized,
    tensorflowEmotion: emotionResult?.tensorflowEmotion || null,
    mediapipeEmotion: emotionResult?.mediapipeEmotion || defaultEmotionState
  };
};
