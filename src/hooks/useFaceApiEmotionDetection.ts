
import { useRef, useCallback, useEffect, useState } from 'react';
import { FaceApiEmotionDetector, FaceApiDetectionResult } from '@/utils/faceApi/emotionDetection';
import { EmotionState } from '@/utils/mediapipe/emotionDetection';

export const useFaceApiEmotionDetection = (
  videoRef: React.RefObject<HTMLVideoElement>,
  isActive: boolean = true
) => {
  const [emotionState, setEmotionState] = useState<EmotionState>({
    dominant: 'neutral',
    confidence: 0,
    scores: {
      neutral: 1,
      happy: 0,
      sad: 0,
      angry: 0,
      surprised: 0,
      fearful: 0,
      disgust: 0
    },
    icon: '😐'
  });

  const [additionalData, setAdditionalData] = useState<{
    age?: number;
    gender?: string;
    faceDetected: boolean;
  }>({
    faceDetected: false
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const detectorRef = useRef<FaceApiEmotionDetector | null>(null);
  const animationFrameRef = useRef<number>();
  const lastProcessTimeRef = useRef<number>(0);

  // Initialize detector
  const initializeDetector = useCallback(async () => {
    if (!detectorRef.current) {
      try {
        console.log('🎭 Initializing face-api.js emotion detection...');
        detectorRef.current = new FaceApiEmotionDetector();
        await detectorRef.current.initialize();
        setIsInitialized(true);
        console.log('✅ face-api.js emotion detection ready');
      } catch (error) {
        console.error('❌ Failed to initialize face-api.js emotion detection:', error);
        setIsInitialized(false);
      }
    }
  }, []);

  // Process video frame for emotion detection
  const processFrame = useCallback(async () => {
    if (!isActive || !videoRef.current || !detectorRef.current || !isInitialized) {
      return;
    }

    const video = videoRef.current;
    
    // Check if video is ready
    if (video.readyState !== 4 || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    const now = performance.now();
    
    // Throttle processing to ~3 FPS for performance (face-api.js is more intensive)
    if (now - lastProcessTimeRef.current < 333) {
      if (isActive) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
      }
      return;
    }
    
    lastProcessTimeRef.current = now;

    try {
      const result: FaceApiDetectionResult | null = await detectorRef.current.detectEmotions(video);
      
      if (result) {
        // Convert face-api results to our EmotionState format
        const newEmotionState: EmotionState = {
          dominant: result.dominant,
          confidence: result.confidence,
          scores: {
            neutral: result.emotions.neutral,
            happy: result.emotions.happy,
            sad: result.emotions.sad,
            angry: result.emotions.angry,
            surprised: result.emotions.surprised,
            fearful: result.emotions.fearful,
            disgust: result.emotions.disgusted
          },
          icon: getEmotionIcon(result.dominant),
          timestamp: Date.now()
        };
        
        setEmotionState(newEmotionState);
        setAdditionalData({
          age: result.age,
          gender: result.gender,
          faceDetected: result.faceDetected
        });
        
        console.log('🎭 face-api.js processed:', result.dominant, 'confidence:', (result.confidence * 100).toFixed(1) + '%');
      }
      
    } catch (error) {
      console.error('❌ Error processing face-api.js frame:', error);
    }

    // Continue processing
    if (isActive) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }
  }, [isActive, videoRef, isInitialized]);

  // Get emotion icon
  const getEmotionIcon = (emotion: string): string => {
    const iconMap: Record<string, string> = {
      'happy': '😊',
      'sad': '😢',
      'angry': '😡',
      'surprised': '😲',
      'fearful': '😨',
      'disgusted': '🤢',
      'neutral': '😐'
    };
    return iconMap[emotion] || '😐';
  };

  // Initialize detector when component mounts or becomes active
  useEffect(() => {
    if (isActive) {
      initializeDetector();
    }
  }, [isActive, initializeDetector]);

  // Start/stop processing loop
  useEffect(() => {
    if (isActive && isInitialized) {
      console.log('🎬 Starting face-api.js emotion detection loop');
      processFrame();
    } else if (animationFrameRef.current) {
      console.log('⏹️ Stopping face-api.js emotion detection loop');
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, isInitialized, processFrame]);

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

  return {
    ...emotionState,
    additionalData,
    isInitialized,
    isProcessing: isActive && isInitialized
  };
};
