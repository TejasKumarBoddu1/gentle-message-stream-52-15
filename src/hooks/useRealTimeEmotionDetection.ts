
import { useRef, useCallback, useEffect, useState } from 'react';
import { TensorFlowEmotionDetector, EmotionPrediction } from '@/utils/emotionDetection/tensorflowEmotionDetector';
import { EmotionState } from '@/utils/mediapipe/emotionDetection';

export const useRealTimeEmotionDetection = (
  videoRef: React.RefObject<HTMLVideoElement>,
  isActive: boolean = true
) => {
  const [emotionState, setEmotionState] = useState<EmotionState>({
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
    icon: '😐'
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const detectorRef = useRef<TensorFlowEmotionDetector | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number>();
  const lastProcessTimeRef = useRef<number>(0);

  // Initialize detector
  const initializeDetector = useCallback(async () => {
    if (!detectorRef.current) {
      try {
        console.log('🎭 Initializing real-time emotion detection...');
        detectorRef.current = new TensorFlowEmotionDetector();
        await detectorRef.current.initialize();
        
        // Create canvas for image processing
        canvasRef.current = document.createElement('canvas');
        canvasRef.current.width = 224;
        canvasRef.current.height = 224;
        
        setIsInitialized(true);
        console.log('✅ Real-time emotion detection ready');
      } catch (error) {
        console.error('❌ Failed to initialize emotion detection:', error);
        setIsInitialized(false);
      }
    }
  }, []);

  // Process video frame for emotion detection
  const processFrame = useCallback(async () => {
    if (!isActive || !videoRef.current || !detectorRef.current || !canvasRef.current || !isInitialized) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Check if video is ready
    if (video.readyState !== 4 || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    const now = performance.now();
    
    // Throttle processing to ~2 FPS for performance
    if (now - lastProcessTimeRef.current < 500) {
      if (isActive) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
      }
      return;
    }
    
    lastProcessTimeRef.current = now;

    try {
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Detect emotion
      const prediction: EmotionPrediction = await detectorRef.current.detectEmotion(canvas);
      const detailedScores = await detectorRef.current.getDetailedEmotionScores(canvas);
      
      // Update emotion state
      const newEmotionState: EmotionState = {
        dominant: prediction.emotion,
        confidence: prediction.confidence,
        scores: {
          neutral: detailedScores.neutral,
          happy: detailedScores.happy,
          sad: detailedScores.sad,
          angry: detailedScores.angry,
          surprised: detailedScores.surprised,
          fearful: detailedScores.fearful,
          disgust: detailedScores.disgusted
        },
        icon: getEmotionIcon(prediction.emotion)
      };
      
      setEmotionState(newEmotionState);
      
      console.log('🎭 Emotion detected:', prediction.emotion, 'Confidence:', (prediction.confidence * 100).toFixed(1) + '%');
      
    } catch (error) {
      console.error('❌ Error processing emotion frame:', error);
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
      console.log('🎬 Starting emotion detection loop');
      processFrame();
    } else if (animationFrameRef.current) {
      console.log('⏹️ Stopping emotion detection loop');
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
    isInitialized,
    isProcessing: isActive && isInitialized
  };
};
